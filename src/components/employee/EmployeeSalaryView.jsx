import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { calculateSalary, getSalaryPeriods } from '../../services/salaryService'
import { supabase } from '../../services/supabaseClient'

const ADJUSTMENT_TYPES = {
  bonus: 'Премия',
  hanging_barcode: 'Зависшие ШК',
  replacement: 'Подмена',
  defect: 'Брак',
  other: 'Прочее'
}

const ADJUSTMENT_COLORS = {
  bonus: 'text-green-600 bg-green-50 border-green-200',
  hanging_barcode: 'text-red-600 bg-red-50 border-red-200',
  replacement: 'text-orange-600 bg-orange-50 border-orange-200',
  defect: 'text-purple-600 bg-purple-50 border-purple-200',
  other: 'text-slate-600 bg-slate-50 border-slate-200'
}

const formatPay = (amount) => {
  return Math.round(amount).toLocaleString('ru-RU')
}

export default function EmployeeSalaryView({ currentEmployee, pointId }) {
  const [periods, setPeriods] = useState([])
  const [selectedPeriodId, setSelectedPeriodId] = useState(null)
  const [salaryData, setSalaryData] = useState(null)
  const [adjustments, setAdjustments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Загружаем периоды
  useEffect(() => {
    if (!pointId) return
    const loadPeriods = async () => {
      const { data, error: err } = await getSalaryPeriods(pointId)
      if (err) {
        console.error('Ошибка загрузки периодов:', err)
        return
      }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const sorted = (data || [])
        .filter(p => new Date(p.end_date + 'T00:00:00') <= today || (new Date(p.start_date + 'T00:00:00') <= today && new Date(p.end_date + 'T00:00:00') >= today))
        .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))

      setPeriods(sorted)

      const currentPeriod = sorted.find(p => {
        const start = new Date(p.start_date + 'T00:00:00')
        const end = new Date(p.end_date + 'T00:00:00')
        return today >= start && today <= end
      })

      if (currentPeriod) {
        setSelectedPeriodId(currentPeriod.id)
      } else if (sorted.length > 0) {
        setSelectedPeriodId(sorted[0].id)
      }
    }
    loadPeriods()
  }, [pointId])

  // Загружаем данные о зарплате для выбранного периода
  const loadSalaryData = useCallback(async () => {
    if (!pointId || !selectedPeriodId) return

    const period = periods.find(p => p.id === selectedPeriodId)
    if (!period) return

    setLoading(true)
    setError('')
    setSalaryData(null)
    setAdjustments([])

    try {
      const salaryResult = await calculateSalary(pointId, period.start_date, period.end_date)
      if (salaryResult.error) {
        setError(salaryResult.error)
        setLoading(false)
        return
      }

      if (salaryResult.data) {
        const myData = salaryResult.data.employees.find(
          e => e.staff_id === currentEmployee.id
        )
        if (myData) {
          setSalaryData(myData)
        }
      }

      const { data: adjData, error: adjErr } = await supabase
        .from('salary_adjustments')
        .select('id, adjustment_type, barcode_number, amount, comment, created_at')
        .eq('staff_id', currentEmployee.id)
        .eq('point_id', pointId)
        .gte('created_at', period.start_date + 'T00:00:00')
        .lte('created_at', period.end_date + 'T23:59:59')
        .order('created_at', { ascending: false })

      if (!adjErr && adjData) {
        setAdjustments(adjData)
      }
    } catch (err) {
      console.error('Ошибка загрузки данных о зарплате:', err)
      setError(err.message || 'Ошибка при загрузке')
    } finally {
      setLoading(false)
    }
  }, [pointId, selectedPeriodId, currentEmployee?.id, periods])

  useEffect(() => {
    loadSalaryData()
  }, [loadSalaryData])

  const handlePrevPeriod = () => {
    if (!periods.length) return
    const currentIdx = periods.findIndex(p => p.id === selectedPeriodId)
    if (currentIdx < periods.length - 1) {
      setSelectedPeriodId(periods[currentIdx + 1].id)
    }
  }

  const handleNextPeriod = () => {
    if (!periods.length) return
    const currentIdx = periods.findIndex(p => p.id === selectedPeriodId)
    if (currentIdx > 0) {
      setSelectedPeriodId(periods[currentIdx - 1].id)
    }
  }

  const currentIdx = periods.findIndex(p => p.id === selectedPeriodId)
  const selectedPeriod = periods.find(p => p.id === selectedPeriodId)

  // Мемоизация вычислений итогов
  const { bonusSum, deductionSum, basePay, total } = useMemo(() => {
    const bSum = adjustments
      .filter(a => a.adjustment_type === 'bonus')
      .reduce((acc, a) => acc + Number(a.amount), 0)
    const dSum = adjustments
      .filter(a => a.adjustment_type !== 'bonus')
      .reduce((acc, a) => acc + Math.abs(Number(a.amount)), 0)
    const bPay = salaryData?.totalPay || 0
    return { bonusSum: bSum, deductionSum: dSum, basePay: bPay, total: bPay + bSum - dSum }
  }, [adjustments, salaryData])

  if (!pointId) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Мои начисления</h3>

      {periods.length > 0 && selectedPeriod && (
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevPeriod}
            disabled={currentIdx >= periods.length - 1}
            className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Пред.
          </button>
          <div className="text-center">
            <span className="text-sm font-semibold text-slate-700">
              {selectedPeriod.period_name || `${selectedPeriod.start_date} — ${selectedPeriod.end_date}`}
            </span>
            {selectedPeriod.payment_date && (
              <p className="text-xs text-slate-400 mt-0.5">
                Выплата: {new Date(selectedPeriod.payment_date + 'T00:00:00').toLocaleDateString('ru-RU', {
                  day: '2-digit', month: '2-digit', year: 'numeric'
                })}
              </p>
            )}
          </div>
          <button
            onClick={handleNextPeriod}
            disabled={currentIdx <= 0}
            className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            След. →
          </button>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-xl">
          <div className="w-8 h-8 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-2"></div>
          <p className="text-sm text-slate-500">Загрузка данных...</p>
        </div>
      )}

      {error && !loading && (
        <div className="mb-3 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
      )}

      {!loading && !error && !salaryData && adjustments.length === 0 && (
        <div className="text-center py-8 bg-slate-50 rounded-xl">
          <p className="text-sm text-slate-400 font-medium">Нет данных за выбранный период</p>
          <p className="text-xs text-slate-400 mt-1">Выберите другой период расчёта</p>
        </div>
      )}

      {(salaryData || adjustments.length > 0) && !loading && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Оплата за смены</h4>
            {salaryData ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Полных дней</span>
                  <span className="font-medium text-slate-900">{salaryData.fullDays}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Неполных часов</span>
                  <span className="font-medium text-slate-900">{salaryData.subHours.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                  <span className="font-medium text-slate-700">Итого за смены</span>
                  <span className="font-bold text-blue-600">{formatPay(basePay)} руб</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Нет отработанных смен</p>
            )}
          </div>

          {adjustments.filter(a => a.adjustment_type === 'bonus').length > 0 && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="text-sm font-semibold text-green-700 mb-3">Премии</h4>
              <div className="space-y-2">
                {adjustments.filter(a => a.adjustment_type === 'bonus').map((adj, idx) => (
                  <div key={adj.id || idx} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-green-600 font-medium">+{formatPay(Math.abs(Number(adj.amount)))} руб</span>
                      {adj.comment && (
                        <span className="text-xs text-green-500 ml-2">— {adj.comment}</span>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-green-200">
                  <span className="font-medium text-green-700">Всего премий</span>
                  <span className="font-bold text-green-600">+{formatPay(bonusSum)} руб</span>
                </div>
              </div>
            </div>
          )}

          {adjustments.filter(a => a.adjustment_type !== 'bonus').length > 0 && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <h4 className="text-sm font-semibold text-red-700 mb-3">Удержания</h4>
              <div className="space-y-2">
                {adjustments.filter(a => a.adjustment_type !== 'bonus').map((adj, idx) => (
                  <div
                    key={adj.id || idx}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border ${ADJUSTMENT_COLORS[adj.adjustment_type] || ADJUSTMENT_COLORS.other}`}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`px-1.5 py-0.5 rounded bg-white/50 text-[10px] font-medium whitespace-nowrap border ${ADJUSTMENT_COLORS[adj.adjustment_type] || ADJUSTMENT_COLORS.other}`}>
                        {ADJUSTMENT_TYPES[adj.adjustment_type]}
                      </span>
                      {adj.barcode_number && (
                        <span className="text-slate-500 text-xs whitespace-nowrap">ШК: {adj.barcode_number}</span>
                      )}
                      {adj.comment && (
                        <span className="text-slate-400 text-xs italic truncate">— {adj.comment}</span>
                      )}
                    </div>
                    <span className="font-semibold text-red-500 flex-shrink-0">
                      -{formatPay(Math.abs(Number(adj.amount)))}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-red-200">
                  <span className="font-medium text-red-700">Всего удержано</span>
                  <span className="font-bold text-red-600">-{formatPay(deductionSum)} руб</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white/90">Итого к выплате</span>
              <span className="text-2xl font-bold">{formatPay(total)} руб</span>
            </div>
            <div className="flex justify-between items-center mt-1 text-xs text-white/70">
              <span>Базовая: {formatPay(basePay)} руб</span>
              {bonusSum > 0 && <span>Премии: +{formatPay(bonusSum)} руб</span>}
              {deductionSum > 0 && <span>Удержания: -{formatPay(deductionSum)} руб</span>}
            </div>
          </div>
        </div>
      )}

      {periods.length === 0 && !loading && (
        <div className="text-center py-8 bg-slate-50 rounded-xl">
          <p className="text-sm text-slate-400 font-medium">Периоды расчёта ещё не созданы</p>
          <p className="text-xs text-slate-400 mt-1">Администратор должен настроить периоды выплат</p>
        </div>
      )}
    </div>
  )
}