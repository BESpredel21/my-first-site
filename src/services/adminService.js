import { supabase } from './supabaseClient'

/**
 * Сервисный слой для работы с администраторами (таблица profiles в Supabase)
 */

/**
 * Найти администратора по email
 */
export async function findAdminByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .eq('role', 'admin')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Не найдено
        return { data: null, error: null }
      }
      throw error
    }

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка поиска администратора:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Найти администратора по ID
 */
export async function findAdminById(id) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .eq('role', 'admin')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка получения профиля администратора:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Проверить ПИН-код администратора
 */
export async function verifyAdminPin(profileId, pin) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, pin, point_id')
      .eq('id', profileId)
      .eq('pin', pin)
      .eq('role', 'admin')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null, valid: false }
      }
      throw error
    }

    return { data, error: null, valid: true }
  } catch (err) {
    console.error('Ошибка проверки ПИН-кода администратора:', err)
    return { data: null, error: err.message, valid: false }
  }
}

/**
 * Сохранить ПИН-код для администратора
 */
export async function updateAdminPin(profileId, pin) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ pin })
      .eq('id', profileId)
      .eq('role', 'admin')
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка сохранения ПИН-кода администратора:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Создать нового администратора (регистрация)
 * Прямая вставка в таблицу profiles без использования supabase.auth
 */
export async function createAdminDirect({ full_name, email, pin, point_id }) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: crypto.randomUUID(),
        full_name,
        email,
        pin,
        point_id,
        role: 'admin'
      }])
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка создания администратора:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Добавить сотрудника (staff) в таблицу profiles
 */
export async function addStaffMember({ full_name, phone, pin, point_id }) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: crypto.randomUUID(),
        full_name,
        phone,
        pin,
        point_id,
        role: 'staff'
      }])
      .select()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка добавления сотрудника:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Получить сотрудников пункта
 */
export async function getStaffByPoint(pointId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('point_id', pointId)
      .eq('role', 'staff')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Ошибка получения сотрудников:', err)
    return { data: [], error: err.message }
  }
}

/**
 * Удалить сотрудника
 */
export async function removeStaffMember(staffId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', staffId)
      .eq('role', 'staff')

    if (error) throw error

    return { data: null, error: null }
  } catch (err) {
    console.error('Ошибка удаления сотрудника:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Получить все пункты ПВЗ менеджера
 */
export async function getManagerPoints(managerId) {
  try {
    const { data, error } = await supabase
      .from('manager_points')
      .select('point_id')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data: data?.map(d => d.point_id) || [], error: null }
  } catch (err) {
    console.error('Ошибка получения пунктов ПВЗ:', err)
    return { data: [], error: err.message }
  }
}

/**
 * Добавить пункт ПВЗ к менеджеру
 */
export async function addManagerPoint(managerId, pointId) {
  try {
    const { data, error } = await supabase
      .from('manager_points')
      .insert([{ manager_id: managerId, point_id: pointId }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Ошибка добавления пункта ПВЗ:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Удалить пункт ПВЗ у менеджера
 */
export async function removeManagerPoint(managerId, pointId) {
  try {
    const { error } = await supabase
      .from('manager_points')
      .delete()
      .eq('manager_id', managerId)
      .eq('point_id', pointId)

    if (error) throw error
    return { data: null, error: null }
  } catch (err) {
    console.error('Ошибка удаления пункта ПВЗ:', err)
    return { data: null, error: err.message }
  }
}

/**
  * Найти профиль (сотрудника) по short_id
  */
 export async function findProfileById(shortId) {
   try {
     const { data, error } = await supabase
       .from('profiles')
       .select('*')
       .eq('short_id', shortId)
       .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      throw error
    }

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка поиска профиля по short_id:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Добавить сотрудника к ПВЗ (запись в таблицу staff_points)
 */
export async function addStaffToPoint(staffId, pointId) {
  try {
    const { data, error } = await supabase
      .from('staff_points')
      .insert([{
        id: crypto.randomUUID(),
        staff_id: staffId,
        point_id: pointId
      }])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка привязки сотрудника к ПВЗ:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Получить сотрудников пункта через таблицу staff_points
 */
export async function getStaffByPointWithPoints(pointId) {
  try {
    const { data, error } = await supabase
      .from('staff_points')
      .select(`
        id,
        staff_id,
        point_id,
        created_at,
        profiles:staff_id (
          id,
          full_name,
          phone,
          pin,
          role
        )
      `)
      .eq('point_id', pointId)

    if (error) throw error

    // Преобразуем данные в плоскую структуру
    const result = (data || []).map(sp => ({
      id: sp.staff_id,
      staff_point_id: sp.id,
      full_name: sp.profiles?.full_name,
      phone: sp.profiles?.phone,
      pin: sp.profiles?.pin,
      role: sp.profiles?.role,
      point_id: sp.point_id,
      created_at: sp.created_at
    }))

    return { data: result, error: null }
  } catch (err) {
    console.error('Ошибка получения сотрудников через staff_points:', err)
    return { data: [], error: err.message }
  }
}

/**
 * Отвязать сотрудника от ПВЗ (удалить запись из staff_points)
 */
export async function removeStaffToPoint(staffPointId) {
  try {
    const { error } = await supabase
      .from('staff_points')
      .delete()
      .eq('id', staffPointId)

    if (error) throw error

    return { data: null, error: null }
  } catch (err) {
    console.error('Ошибка отвязки сотрудника от ПВЗ:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Создать нового администратора (регистрация) - старый метод
 * @deprecated Используйте createAdminDirect
 */
export async function createAdmin(adminData) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{ ...adminData, role: 'admin' }])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка создания администратора:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Получить настройки ПВЗ (рабочее время, ставка)
 */
export async function getPointSettings(pointId) {
  try {
    const { data, error } = await supabase
      .from('manager_points')
      .select('work_start_time, work_end_time, shift_rate')
      .eq('point_id', pointId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      throw error
    }

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка получения настроек ПВЗ:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Обновить настройки ПВЗ
 */
/**
 * Рассчитать зарплату сотрудников за указанный период
 * @param {string} pointId - ID пункта ПВЗ
 * @param {string} startDate - Начало периода (YYYY-MM-DD)
 * @param {string} endDate - Конец периода (YYYY-MM-DD)
 */
export async function calculateSalary(pointId, startDate, endDate) {
  try {
    if (!pointId) throw new Error('Не указан ПВЗ')

    // 1. Получаем настройки ПВЗ
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

    // Длина рабочего дня ПВЗ в минутах
    const pvzStartMin = parseInt(pvzStart.split(':')[0]) * 60 + parseInt(pvzStart.split(':')[1])
    const pvzEndMin = parseInt(pvzEnd.split(':')[0]) * 60 + parseInt(pvzEnd.split(':')[1])
    const pvzDayMinutes = pvzEndMin - pvzStartMin

    // 2. Получаем все одобренные смены за период
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

    // 3. Агрегируем по сотрудникам
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
          // Неполная смена — считаем пропорцию
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

    // 4. Преобразуем в массив и считаем итоги
    const result = Object.values(staffMap).map(s => ({
      ...s,
      subHours: Math.round((s.subMinutes / 60) * 100) / 100 // часы с двумя знаками
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

/**
 * Получить все периоды ЗП для ПВЗ
 */
export async function getSalaryPeriods(pointId) {
  try {
    const { data, error } = await supabase
      .from('salary_periods')
      .select('*')
      .eq('point_id', pointId)
      .order('start_date', { ascending: false })

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Ошибка получения периодов ЗП:', err)
    return { data: [], error: err.message }
  }
}

/**
 * Создать период ЗП
 */
export async function createSalaryPeriod({ point_id, period_name, start_date, end_date, payment_date }) {
  try {
    const { data, error } = await supabase
      .from('salary_periods')
      .insert([{
        point_id,
        period_name,
        start_date,
        end_date,
        payment_date
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Ошибка создания периода ЗП:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Автоматически сгенерировать периоды ЗП на год
 * @param {string} pointId
 * @param {object} config - { weekday: 2 (вторник), interval: 2 (каждые 2 недели), start_date: '2026-06-15' }
 */
export async function generateSalaryPeriods(pointId, config) {
  try {
    const periods = []
    const dayOfWeek = config.weekday || 2 // 1=Пн...7=Вс, по умолчанию вторник
    const intervalWeeks = config.interval || 2

    // Используем переданную дату начала отсчёта, или вычисляем от сегодня
    let startDate
    if (config.start_date) {
      startDate = new Date(config.start_date + 'T00:00:00')
    } else {
      const today = new Date()
      // Находим ближайший день недели от сегодня
      const currentDay = today.getDay() // 0=Вс, 1=Пн...
      let diff = dayOfWeek - (currentDay === 0 ? 7 : currentDay)
      if (diff <= 0) diff += 7
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() + diff)
    }

    // Период длиной intervalWeeks недель
    for (let i = 0; i < Math.ceil(52 / intervalWeeks); i++) {
      const periodStart = new Date(startDate)
      periodStart.setDate(periodStart.getDate() + (i * intervalWeeks * 7))

      const periodEnd = new Date(periodStart)
      periodEnd.setDate(periodEnd.getDate() + (intervalWeeks * 7) - 1)

      // Выплата в ближайший день недели ПОСЛЕ окончания периода
      const periodEndDay = periodEnd.getDay() // 0=Вс, 1=Пн...
      const periodEndDayNorm = periodEndDay === 0 ? 7 : periodEndDay // 1=Пн...7=Вс
      let payDiff = dayOfWeek - periodEndDayNorm
      if (payDiff <= 0) payDiff += 7 // всегда после окончания периода

      const paymentDate = new Date(periodEnd)
      paymentDate.setDate(paymentDate.getDate() + payDiff)

      // Форматируем даты в YYYY-MM-DD
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

    // Вставляем все периоды
    const { data, error } = await supabase
      .from('salary_periods')
      .insert(periods)
      .select()

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Ошибка генерации периодов:', err)
    return { data: [], error: err.message }
  }
}

/**
 * Получить текущий активный период для ПВЗ
 */
export async function getCurrentSalaryPeriod(pointId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('salary_periods')
      .select('*')
      .eq('point_id', pointId)
      .lte('start_date', today)
      .gte('end_date', today)
      .order('start_date', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Нет активного периода — возвращаем последний
        const { data: lastData, error: lastErr } = await supabase
          .from('salary_periods')
          .select('*')
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

/**
 * Удалить период ЗП
 */
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

/**
 * Массовое удаление периодов ЗП
 * @param {string[]} periodIds - массив ID периодов для удаления
 */
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

/**
 * Получить все корректировки (премии/удержания) за период
 */
export async function getPeriodAdjustments(periodId) {
  try {
    const { data, error } = await supabase
      .from('salary_adjustments')
      .select('*')
      .eq('period_id', periodId)

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Ошибка получения корректировок периода:', err)
    return { data: [], error: err.message }
  }
}

/**
 * Создать корректировку (премию или удержание)
 */
export async function createAdjustment({ period_id, staff_id, point_id, adjustment_type, barcode_number, amount, comment, is_partial, remaining_amount }) {
  try {
    // Для премий сумма положительная, для удержаний - отрицательная
    const sign = adjustment_type === 'bonus' ? 1 : -1

    const { data, error } = await supabase
      .from('salary_adjustments')
      .insert([{
        period_id,
        staff_id,
        point_id,
        adjustment_type,
        barcode_number,
        amount: Math.abs(amount) * sign,
        comment,
        is_partial: is_partial || false,
        remaining_amount: remaining_amount || 0
      }])
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Ошибка создания корректировки:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Обновить корректировку (премию или удержание)
 */
export async function updateAdjustment({ id, adjustment_type, barcode_number, amount, comment }) {
  try {
    const sign = adjustment_type === 'bonus' ? 1 : -1

    const { data, error } = await supabase
      .from('salary_adjustments')
      .update({
        adjustment_type,
        barcode_number,
        amount: Math.abs(amount) * sign,
        comment
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Ошибка обновления корректировки:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Удалить корректировку
 */
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

/**
 * Пакетное создание корректировок
 */
export async function createAdjustmentsBatch(adjustments) {
  try {
    if (!adjustments || adjustments.length === 0) return { data: [], error: null }

    const { data, error } = await supabase
      .from('salary_adjustments')
      .insert(adjustments)
      .select()

    if (error) throw error
    return { data: data || [], error: null }
  } catch (err) {
    console.error('Ошибка пакетного создания корректировок:', err)
    return { data: [], error: err.message }
  }
}

/**
 * Получить незакрытые удержания для автоматического переноса
 */
export async function getPendingDeductions(staffId, pointId) {
  try {
    const { data, error } = await supabase
      .from('salary_adjustments')
      .select(`
        *,
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

/**
 * Проверить дубликат ШК в пределах 3 месяцев
 * @param {string} barcode - ШК
 * @param {string} pointId - ПВЗ
 * @param {string} exceptAdjustmentId - ID корректировки для исключения (при обновлении)
 */
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
/**
 * Пометить удержание как погашенное (обнулить remaining_amount)
 */
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

export async function updatePointSettings(pointId, settings) {
  try {
    const { data, error } = await supabase
      .from('manager_points')
      .update({
        work_start_time: settings.work_start_time,
        work_end_time: settings.work_end_time,
        shift_rate: settings.shift_rate
      })
      .eq('point_id', pointId)
      .select('work_start_time, work_end_time, shift_rate')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка обновления настроек ПВЗ:', err)
    return { data: null, error: err.message }
  }
}