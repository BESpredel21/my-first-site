import { supabase } from './supabaseClient'

/**
 * Сервис для расчёта зарплаты и работы с периодами/корректировками
 */

export async function calculateSalary(pointId, startDate, endDate) {
  try {
    if (!pointId) throw new Error('Не указан ПВЗ')

    const { data: settings, error: settingsErr } = await supabase
      .from('manager_points')
      .select('work_start_time, work_end_time, shift_rate')
      .eq('point_id', pointId)
      .single()

    if (settingsErr) throw settingsErr
    if (!settings) throw new Error('Настройки ПВЗ не найдены')

    const pvzStart = settings.work_start_time.slice(0, 5)
    const pvzEnd = settings.work_end_time.slice(0, 5)
    const shiftRate = Number(settings.shift_rate) || 0

    const pvzStartMin = parseInt(pvzStart.split(':')[0]) * 60 + parseInt(pvzStart.split(':')[1])
    const pvzEndMin = parseInt(pvzEnd.split(':')[0]) * 60 + parseInt(pvzEnd.split(':')[1])
    const pvzDayMinutes = pvzEndMin - pvzStartMin

    const { data: schedules, error: schedErr } = await supabase
      .from('work_schedules')
      .select(`
        id, staff_id, work_date, is_full_day, start_time, end_time,
        profiles:staff_id ( full_name )
      `)
      .eq('point_id', pointId)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .order('work_date', { ascending: true })

    if (schedErr) throw schedErr

    const staffMap = {}
    if (schedules) {
      schedules.forEach(row => {
        const staffId = row.staff_id
        if (!staffMap[staffId]) {
          staffMap[staffId] = {
            staff_id: staffId,
            full_name: row.profiles?.full_name || 'Сотрудник',
            fullDays: 0,
            subMinutes: 0,
            totalPay: 0
          }
        }

        if (row.is_full_day) {
          staffMap[staffId].fullDays++
          staffMap[staffId].totalPay += shiftRate
        } else {
          const s = row.start_time?.slice(0, 5)
          const e = row.end_time?.slice(0, 5)
          if (s && e) {
            const sMin = parseInt(s.split(':')[0]) * 60 + parseInt(s.split(':')[1])
            const eMin = parseInt(e.split(':')[0]) * 60 + parseInt(e.split(':')[1])
            const shiftMinutes = eMin - sMin
            if (shiftMinutes > 0) {
              staffMap[staffId].subMinutes += shiftMinutes
              const pay = (shiftMinutes / pvzDayMinutes) * shiftRate
              staffMap[staffId].totalPay += pay
            }
          }
        }
      })
    }

    const result = Object.values(staffMap).map(s => ({
      ...s,
      subHours: Math.round((s.subMinutes / 60) * 100) / 100
    }))

    const totals = {
      fullDays: result.reduce((acc, s) => acc + s.fullDays, 0),
      subHours: Math.round(result.reduce((acc, s) => acc + s.subHours, 0) * 100) / 100,
      totalPay: Math.round(result.reduce((acc, s) => acc + s.totalPay, 0))
    }

    return { data: { employees: result, totals }, error: null }
  } catch (err) {
    console.error('Ошибка расчёта зарплаты:', err)
    return { data: null, error: err.message }
  }
}

export async function getSalaryPeriods(pointId) {
  try {
    const { data, error } = await supabase
      .from('salary_periods')
      .select('id, point_id, period_name, start_date, end_date, payment_date, auto_generated, created_at')
      .eq('point_id', pointId)
      .order('start_date', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Ошибка получения периодов ЗП:', err)
    return { data: [], error: err.message }
  }
}

export async function getCurrentSalaryPeriod(pointId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('salary_periods')
      .select('id, point_id, period_name, start_date, end_date, payment_date, auto_generated')
      .eq('point_id', pointId)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('start_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        const { data: lastData, error: lastErr } = await supabase
          .from('salary_periods')
          .select('id, point_id, period_name, start_date, end_date, payment_date, auto_generated')
          .eq('point_id', pointId)
          .order('start_date', { ascending: false })
          .limit(1)
          .single()

        if (lastErr) {
          if (lastErr.code === 'PGRST116') return { data: null, error: null }
          throw lastErr
        }
        return { data: lastData, error: null }
      }
      throw error
    }

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка получения текущего периода:', err)
    return { data: null, error: err.message }
  }
}

export async function createSalaryPeriod({ point_id, period_name, start_date, end_date, payment_date }) {
  try {
    const { data, error } = await supabase
      .from('salary_periods')
      .insert([{ point_id, period_name, start_date, end_date, payment_date }])
      .select('id, point_id, period_name, start_date, end_date, payment_date, auto_generated')
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Ошибка создания периода ЗП:', err)
    return { data: null, error: err.message }
  }
}

export async function generateSalaryPeriods(pointId, config) {
  try {
    const periods = []
    const dayOfWeek = config.weekday || 2
    const intervalWeeks = config.interval || 2

    let startDate
    if (config.start_date) {
      startDate = new Date(config.start_date + 'T00:00:00')
    } else {
      const today = new Date()
      const currentDay = today.getDay()
      let diff = dayOfWeek - (currentDay === 0 ? 7 : currentDay)
      if (diff <= 0) diff += 7
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() + diff)
    }

    for (let i = 0; i < Math.ceil(52 / intervalWeeks); i++) {
      const periodStart = new Date(startDate)
      periodStart.setDate(periodStart.getDate() + (i * intervalWeeks * 7))

      const periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + (intervalWeeks * 7) - 1)

      const periodEndDay = periodEnd.getDay()
      const periodEndDayNorm = periodEndDay === 0 ? 7 : periodEndDay
      let payDiff = dayOfWeek - periodEndDayNorm
      if (payDiff <= 0) payDiff += 7

      const paymentDate = new Date(periodEnd)
      paymentDate.setDate(paymentDate.getDate() + payDiff)

      const formatDate = (d) => {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }

      periods.push({
        point_id: pointId,
        period_name: `Выплата ${formatDate(periodStart)} — ${formatDate(periodEnd)}`,
        start_date: formatDate(periodStart),
        end_date: formatDate(periodEnd),
        payment_date: formatDate(paymentDate),
        auto_generated: true
      })
    }

    const { data, error } = await supabase
      .from('salary_periods')
      .insert(periods)
      .select('id, point_id, period_name, start_date, end_date, payment_date, auto_generated')

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Ошибка генерации периодов:', err)
    return { data: [], error: err.message }
  }
}

export async function deleteSalaryPeriod(periodId) {
  try {
    const { error } = await supabase
      .from('salary_periods')
      .delete()
      .eq('id', periodId)

    if (error) throw error
    return { data: null, error: null }
  } catch (err) {
    console.error('Ошибка удаления периода:', err)
    return { data: null, error: err.message }
  }
}

export async function deleteSalaryPeriods(periodIds) {
  try {
    if (!periodIds || periodIds.length === 0) return { data: null, error: null }
    const { error } = await supabase
      .from('salary_periods')
      .delete()
      .in('id', periodIds)

    if (error) throw error
    return { data: null, error: null }
  } catch (err) {
    console.error('Ошибка массового удаления периодов:', err)
    return { data: null, error: err.message }
  }
}

export async function getPeriodAdjustments(periodId) {
  try {
    const { data, error } = await supabase
      .from('salary_adjustments')
      .select('id, period_id, staff_id, point_id, adjustment_type, barcode_number, amount, comment, is_partial, remaining_amount, created_at')
      .eq('period_id', periodId)

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Ошибка получения корректировок периода:', err)
    return { data: [], error: err.message }
  }
}

export async function createAdjustment({ period_id, staff_id, point_id, adjustment_type, barcode_number, amount, comment, is_partial, remaining_amount }) {
  try {
    const sign = adjustment_type === 'bonus' ? 1 : -1

    const { data, error } = await supabase
      .from('salary_adjustments')
      .insert([{
        period_id, staff_id, point_id,
        adjustment_type, barcode_number,
        amount: Math.abs(amount) * sign,
        comment,
        is_partial: is_partial || false,
        remaining_amount: remaining_amount || 0
      }])
      .select('id, staff_id, adjustment_type, barcode_number, amount, comment, is_partial, remaining_amount')
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Ошибка создания корректировки:', err)
    return { data: null, error: err.message }
  }
}

export async function createAdjustmentsBatch(adjustments) {
  try {
    if (!adjustments || adjustments.length === 0) return { data: [], error: null }

    const { data, error } = await supabase
      .from('salary_adjustments')
      .insert(adjustments)
      .select('id, staff_id, adjustment_type, barcode_number, amount, comment')

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Ошибка пакетного создания корректировок:', err)
    return { data: [], error: err.message }
  }
}

export async function updateAdjustment({ id, adjustment_type, barcode_number, amount, comment }) {
  try {
    const sign = adjustment_type === 'bonus' ? 1 : -1

    const { data, error } = await supabase
      .from('salary_adjustments')
      .update({
        adjustment_type, barcode_number,
        amount: Math.abs(amount) * sign,
        comment
      })
      .eq('id', id)
      .select('id, staff_id, adjustment_type, barcode_number, amount, comment')
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Ошибка обновления корректировки:', err)
    return { data: null, error: err.message }
  }
}

export async function deleteAdjustment(id) {
  try {
    const { error } = await supabase
      .from('salary_adjustments')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { error: null }
  } catch (err) {
    console.error('Ошибка удаления корректировки:', err)
    return { error: err.message }
  }
}

export async function getPendingDeductions(staffId, pointId) {
  try {
    const { data, error } = await supabase
      .from('salary_adjustments')
      .select(`
        id, staff_id, point_id, adjustment_type, barcode_number, amount, comment,
        is_partial, remaining_amount, created_at,
        salary_periods!inner(point_id)
      `)
      .eq('salary_periods.point_id', pointId)
      .eq('staff_id', staffId)
      .eq('is_partial', true)
      .gt('remaining_amount', 0)
      .order('created_at', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Ошибка получения незакрытых удержаний:', err)
    return { data: [], error: err.message }
  }
}

export async function checkBarcodeDuplicate(barcode, pointId, exceptAdjustmentId = null) {
  try {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    let query = supabase
      .from('salary_adjustments')
      .select('id, created_at, adjustment_type')
      .eq('barcode_number', barcode)
      .gte('created_at', threeMonthsAgo.toISOString())

    if (exceptAdjustmentId) {
      query = query.neq('id', exceptAdjustmentId)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      isDuplicate: (data || []).length > 0,
      duplicate: data?.[0] || null,
      error: null
    }
  } catch (err) {
    console.error('Ошибка проверки дубля ШК:', err)
    return { isDuplicate: false, duplicate: null, error: err.message }
  }
}

export async function markDeductionAsPaid(deductionId) {
  try {
    const { error } = await supabase
      .from('salary_adjustments')
      .update({ remaining_amount: 0 })
      .eq('id', deductionId)

    if (error) throw error
    return { error: null }
  } catch (err) {
    console.error('Ошибка пометки удержания погашенным:', err)
    return { error: err.message }
  }
}