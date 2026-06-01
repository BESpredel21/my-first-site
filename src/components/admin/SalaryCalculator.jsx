import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  calculateSalary,
  getPeriodAdjustments,
  createAdjustmentsBatch,
  updateAdjustment,
  deleteAdjustment,
  getPendingDeductions,
  markDeductionAsPaid
} from '../../services/salaryService'
import { getSalaryPeriods } from '../../services/salaryService'

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

let nextTempId = -1
function tempId() { return nextTempId-- }

export default function SalaryCalculator({ activePointId }) {
  const [periodDates, setPeriodDates] = useState({ startDate: '', endDate: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Корректировки из БД
  const [dbAdjustments, setDbAdjustments] = useState({})
  // Локальный буфер изменений
  const [pendingChanges, setPendingChanges] = useState({})
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState('')

  const [showAdjustForm, setShowAdjustForm] = useState(null)
  const [editAdjustment, setEditAdjustment] = useState(null)
  const [formData, setFormData] = useState({
    adjustment_type: 'hanging_barcode',
    barcode_number: '',
    amount: '',
    comment: ''
  })
  const [formError, setFormError] = useState('')
  const [formSaving, setFormSaving] = useState(false)
  const [pendingDeductions, setPendingDeductions] = useState([])

  // Фактически удержано — отдельно по каждому сотруднику { [staffId]: string }
  const [actualDeductions, setActualDeductions] = useState({})

  const formatPay = (amount) => {
    return Math.round(amount).toLocaleString('ru-RU')
  }

  // При смене ПВЗ сбрасываем всё
  useEffect(() => {
    setPeriodDates({ startDate: '', endDate: '' })
    setResult(null)
    setError('')
    setPendingChanges({})
    setDbAdjustments({})
    setActualDeductions({})
    setPendingDeductions([])
    setSaveSuccess('')
  }, [activePointId])

  // Сливаем данные из БД + локальные изменения
  const mergedAdjustments = useMemo(() => {
    const result = {}
    for (const [staffId, adjs] of Object.entries(dbAdjustments)) {
      result[staffId] = [...adjs]
    }
    for (const [staffId, changes] of Object.entries(pendingChanges)) {
      if (!result[staffId]) result[staffId] = []
      for (const change of changes) {
        if (change.isDeleting) {
          if (typeof change._tempId === 'number' && change._tempId > 0) {
            result[staffId] = result[staffId].filter(
              a => a.id !== change._tempId
            )
          } else {
            result[staffId] = result[staffId].filter(
              a => a._tempId !== change._tempId
            )
          }
        } else {
          const existingIdx = result[staffId].findIndex(
            a => a._tempId === change._tempId || a.id === change._tempId
          )
          if (existingIdx !== -1) {
            result[staffId][existingIdx] = { ...change, isEditing: false, isDeleting: false }
          } else {
            result[staffId].push({ ...change, isEditing: false, isDeleting: false })
          }
        }
      }
      if (result[staffId].length === 0) delete result[staffId]
    }
    return result
  }, [dbAdjustments, pendingChanges])

  // Загрузка расчёта
  const loadCalculation = useCallback(async () => {
    if (!activePointId || !periodDates.startDate || !periodDates.endDate) return

    setLoading(true)
    setError('')
    setResult(null)
    setPendingChanges({})
    setDbAdjustments({})
    setActualDeductions({})
    setPendingDeductions([])
    setSaveSuccess('')

    try {
      const salaryResult = await calculateSalary(
        activePointId,
        periodDates.startDate,
        periodDates.endDate
      )

      const { data: salaryData, error: salaryErr } = salaryResult

      if (salaryErr) {
        setError(salaryErr)
        setLoading(false)
        return
      }

      if (salaryData) {
        setResult(salaryData)
      }

      // После получения данных — загружаем незакрытые удержания
      if (salaryData?.employees?.length > 0) {
        loadPendingDeductions(salaryData.employees)
      }
    } catch (err) {
      console.error('Ошибка при загрузке расчёта:', err)
      setError(err.message || 'Ошибка при загрузке')
    } finally {
      setLoading(false)
    }
  }, [activePointId, periodDates])

  const loadPendingDeductions = async (employees) => {
    if (!employees || employees.length === 0 || !activePointId) return
    try {
      const results = await Promise.all(
        employees.map(emp => getPendingDeductions(emp.staff_id, activePointId))
      )
      const allPending = []
      results.forEach(({ data }, idx) => {
        if (data && data.length > 0) {
          const emp = employees[idx]
          allPending.push(...data.map(d => ({ ...d, staff_id: emp.staff_id, staff_name: emp.full_name })))
        }
      })
      setPendingDeductions(allPending)
    } catch (err) {
      console.error('Ошибка загрузки незакрытых удержаний:', err)
    }
  }

  // Подсчёт итогов с учётом корректировок
  const getEmployeeTotal = (emp) => {
    const empAdjustments = mergedAdjustments[emp.staff_id] || []
    const adjustmentsSum = empAdjustments.reduce((acc, adj) => acc + Number(adj.amount), 0)
    return emp.totalPay + adjustmentsSum
  }

  const getEmployeeActualDeduction = (staffId) => {
    return parseFloat(actualDeductions[staffId]) || 0
  }

  const getEmployeeRemaining = (staffId) => {
    const empAdjustments = mergedAdjustments[staffId] || []
    const deductionSum = empAdjustments
      .filter(a => a.adjustment_type !== 'bonus')
      .reduce((acc, a) => acc + Math.abs(Number(a.amount)), 0)
    const actual = getEmployeeActualDeduction(staffId)
    return deductionSum - actual
  }

  const getTotals = () => {
    if (!result) return { fullDays: 0, subHours: 0, basePay: 0, bonuses: 0, deductions: 0, actualTotal: 0, remainingTotal: 0, total: 0 }
    const totals = {
      fullDays: result.totals.fullDays,
      subHours: result.totals.subHours,
      basePay: result.totals.totalPay,
      bonuses: 0,
      deductions: 0,
      actualTotal: 0,
      remainingTotal: 0,
      total: 0
    }

    Object.entries(mergedAdjustments).forEach(([staffId, staffAdjustments]) => {
      staffAdjustments.forEach(adj => {
        if (adj.adjustment_type === 'bonus') {
          totals.bonuses += Number(adj.amount)
        } else {
          totals.deductions += Math.abs(Number(adj.amount))
        }
      })
      totals.actualTotal += getEmployeeActualDeduction(staffId)
    })

    totals.remainingTotal = totals.deductions - totals.actualTotal
    totals.total = totals.basePay + totals.bonuses - totals.deductions
    return totals
  }

  const totals = getTotals()

  // Форма создания премии/удержания
  const openAdjustForm = (staffId, type) => {
    setEditAdjustment(null)
    setShowAdjustForm({ staff_id: staffId, type })
    setFormData({
      adjustment_type: type === 'bonus' ? 'bonus' : 'hanging_barcode',
      barcode_number: '',
      amount: '',
      comment: ''
    })
    setFormError('')
  }

  const openEditForm = (adjustment) => {
    setShowAdjustForm({
      staff_id: adjustment.staff_id,
      type: adjustment.adjustment_type === 'bonus' ? 'bonus' : 'deduction'
    })
    setEditAdjustment(adjustment)
    setFormData({
      adjustment_type: adjustment.adjustment_type,
      barcode_number: adjustment.barcode_number || '',
      amount: Math.abs(Number(adjustment.amount)).toString(),
      comment: adjustment.comment || ''
    })
    setFormError('')
  }

  const handleCreateAdjustment = (e) => {
    e.preventDefault()
    if (!showAdjustForm || !activePointId) return

    setFormError('')
    const amount = parseFloat(formData.amount)
    if (!amount || amount <= 0) {
      setFormError('Укажите сумму больше 0')
      return
    }

    if (formData.adjustment_type !== 'bonus') {
      if (!formData.barcode_number) {
        if (formData.adjustment_type !== 'other') {
          setFormError('Укажите ШК')
          return
        }
      }
    }

    if (formData.adjustment_type === 'other' && !formData.comment.trim()) {
      setFormError('Для типа "Прочее" укажите комментарий')
      return
    }

    const sign = formData.adjustment_type === 'bonus' ? 1 : -1
    const signedAmount = Math.abs(amount) * sign

    if (editAdjustment) {
      addToPendingChanges(signedAmount, editAdjustment._tempId)
    } else {
      addToPendingChanges(signedAmount)
    }

    setShowAdjustForm(null)
    setEditAdjustment(null)
  }

  const addToPendingChanges = (signedAmount, existingTempId = null) => {
    const staffId = showAdjustForm.staff_id
    const newAdj = {
      _tempId: existingTempId || tempId(),
      staff_id: staffId,
      point_id: activePointId,
      adjustment_type: formData.adjustment_type,
      barcode_number: formData.barcode_number || null,
      amount: signedAmount,
      comment: formData.comment.trim() || null,
      isEditing: false,
      isDeleting: false
    }

    setPendingChanges(prev => {
      const staffChanges = prev[staffId] ? [...prev[staffId]] : []

      if (existingTempId) {
        const idx = staffChanges.findIndex(c => c._tempId === existingTempId)
        if (idx !== -1) {
          staffChanges[idx] = newAdj
        } else {
          staffChanges.push(newAdj)
        }
      } else {
        staffChanges.push(newAdj)
      }

      return { ...prev, [staffId]: staffChanges }
    })
  }

  const handleDeletePending = (staffId, tempId) => {
    setPendingChanges(prev => {
      const staffChanges = prev[staffId] ? [...prev[staffId]] : []
      const existingIdx = staffChanges.findIndex(c => c._tempId === tempId)
      if (existingIdx !== -1) {
        staffChanges[existingIdx].isDeleting = true
      } else {
        staffChanges.push({ _tempId: tempId, isDeleting: true })
      }
      return { ...prev, [staffId]: staffChanges }
    })
  }

  // Пакетное сохранение
  const handleBatchSave = async () => {
    setSaving(true)
    setError('')
    setSaveSuccess('')

    const inserts = []
    const updates = []
    const deletions = []

    for (const [staffId, changes] of Object.entries(pendingChanges)) {
      for (const change of changes) {
        if (change.isDeleting) {
          if (typeof change._tempId === 'number' && change._tempId > 0) {
            deletions.push(change._tempId)
          }
        } else if (change._tempId < 0) {
          inserts.push({
            point_id: activePointId,
            staff_id: change.staff_id,
            adjustment_type: change.adjustment_type,
            barcode_number: change.barcode_number,
            amount: change.amount,
            comment: change.comment
          })
        } else {
          updates.push({
            id: change._tempId,
            adjustment_type: change.adjustment_type,
            barcode_number: change.barcode_number,
            amount: Math.abs(change.amount),
            comment: change.comment
          })
        }
      }
    }

    try {
      if (inserts.length > 0) {
        const { error: insErr } = await createAdjustmentsBatch(inserts)
        if (insErr) throw new Error(insErr)
      }

      if (updates.length > 0) {
        for (const upd of updates) {
          const { error: updErr } = await updateAdjustment(upd)
          if (updErr) throw new Error(updErr)
        }
      }

      if (deletions.length > 0) {
        for (const id of deletions) {
          const { error: delErr } = await deleteAdjustment(id)
          if (delErr) throw new Error(delErr)
        }
      }

      setPendingChanges({})
      setSaveSuccess('Изменения успешно сохранены')
      setTimeout(() => setSaveSuccess(''), 3000)
    } catch (err) {
      console.error('Ошибка пакетного сохранения:', err)
      setError(err.message || 'Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelChanges = () => {
    setPendingChanges({})
    setError('')
  }

  const pendingCount = useMemo(() => {
    let count = 0
    for (const changes of Object.values(pendingChanges)) {
      for (const c of changes) {
        count++
      }
    }
    return count
  }, [pendingChanges])

  // Автоприменение незакрытых удержаний
  const applyPendingDeduction = async (deduction, amount) => {
    if (!activePointId) return

    const applyAmount = amount || deduction.remaining_amount
    const sign = deduction.adjustment_type === 'bonus' ? 1 : -1
    const signedAmount = Math.abs(applyAmount) * sign

    setPendingChanges(prev => {
      const staffChanges = prev[deduction.staff_id] ? [...prev[deduction.staff_id]] : []
      staffChanges.push({
        _tempId: tempId(),
        staff_id: deduction.staff_id,
        point_id: activePointId,
        adjustment_type: deduction.adjustment_type,
        barcode_number: deduction.barcode_number,
        amount: signedAmount,
        comment: `Перенесено из предыдущего периода (остаток ${deduction.remaining_amount} руб)`,
        isEditing: false,
        isDeleting: false
      })
      return { ...prev, [deduction.staff_id]: staffChanges }
    })

    await markDeductionAsPaid(deduction.id)
    setPendingDeductions(prev => prev.filter(d => d.id !== deduction.id))
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Расчёт зарплаты</h3>

      {/* Выбор периода — два поля даты и кнопка Рассчитать */}
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Дата начала</label>
          <input
            type="date"
            value={periodDates.startDate}
            onChange={(e) => setPeriodDates(prev => ({ ...prev, startDate: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Дата окончания</label>
          <input
            type="date"
            value={periodDates.endDate}
            onChange={(e) => setPeriodDates(prev => ({ ...prev, endDate: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <button
            onClick={loadCalculation}
            disabled={loading || !periodDates.startDate || !periodDates.endDate}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
            {loading ? 'Расчёт...' : 'Рассчитать'}
          </button>
        </div>
      </div>

      {/* Индикатор загрузки расчёта */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 bg-slate-50 rounded-xl mb-4">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-slate-500 font-medium">Загрузка расчёта зарплаты...</p>
          <p className="text-xs text-slate-400 mt-1">Собираем данные о сменах и корректировках</p>
        </div>
      )}

      {/* Ошибка расчёта */}
      {error && !loading && (
        <div className="mb-3 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
      )}

      {/* Успех сохранения */}
      {saveSuccess && (
        <div className="mb-3 px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg">{saveSuccess}</div>
      )}

      {/* Пустое состояние — не выбран период */}
      {!result && !loading && !error && (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <p className="text-sm text-slate-400 font-medium">Укажите даты и нажмите «Рассчитать»</p>
          <p className="text-xs text-slate-400 mt-1">Можно выбрать любой диапазон — день, неделю, месяц или год</p>
        </div>
      )}

      {/* Незакрытые удержания */}
      {pendingDeductions.length > 0 && result && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">
            ⚠️ Незакрытые удержания из предыдущих периодов
          </h4>
          <div className="space-y-2">
            {pendingDeductions.map((ded, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <div>
                  <span className="font-medium text-slate-700">{ded.staff_name}</span>
                  {' — '}
                  <span className="text-red-600 font-medium">{ded.remaining_amount.toLocaleString('ru-RU')} руб</span>
                  <span className="text-slate-500 ml-1">({ADJUSTMENT_TYPES[ded.adjustment_type]})</span>
                </div>
                <button
                  onClick={() => applyPendingDeduction(ded)}
                  className="px-3 py-1 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                >
                  Перенести
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Результаты */}
      {result && result.employees.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-2 font-medium text-slate-600">Сотрудник</th>
                <th className="text-right py-2 px-2 font-medium text-slate-600">Дней</th>
                <th className="text-right py-2 px-2 font-medium text-slate-600">Часов</th>
                <th className="text-right py-2 px-2 font-medium text-slate-600">Базовая</th>
                <th className="text-right py-2 px-2 font-medium text-slate-600">Премии</th>
                <th className="text-right py-2 px-2 font-medium text-slate-600">Удерж.</th>
                <th className="text-right py-2 px-2 font-medium text-slate-600">Факт. удерж.</th>
                <th className="text-right py-2 pl-2 font-medium text-slate-600">Итого</th>
                <th className="text-right py-2 pl-2 font-medium text-slate-600"></th>
              </tr>
            </thead>
            <tbody>
              {result.employees.map((emp) => {
                const empAdjustments = mergedAdjustments[emp.staff_id] || []
                const bonusSum = empAdjustments
                  .filter(a => a.adjustment_type === 'bonus')
                  .reduce((acc, a) => acc + Number(a.amount), 0)
                const deductionSum = empAdjustments
                  .filter(a => a.adjustment_type !== 'bonus')
                  .reduce((acc, a) => acc + Math.abs(Number(a.amount)), 0)
                const employeeTotal = getEmployeeTotal(emp)
                const empActualDeduction = getEmployeeActualDeduction(emp.staff_id)
                const empRemaining = getEmployeeRemaining(emp.staff_id)

                return (
                  <tr key={emp.staff_id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2 pr-2 text-slate-900 font-medium">{emp.full_name}</td>
                    <td className="py-2 px-2 text-right text-slate-700">{emp.fullDays}</td>
                    <td className="py-2 px-2 text-right text-slate-700">{emp.subHours.toFixed(2)}</td>
                    <td className="py-2 px-2 text-right text-slate-700">{formatPay(emp.totalPay)}</td>
                    <td className="py-2 px-2 text-right text-green-600 font-medium">
                      {bonusSum > 0 ? `+${formatPay(bonusSum)}` : '—'}
                    </td>
                    <td className="py-2 px-2 text-right text-red-500 font-medium">
                      {deductionSum > 0 ? `-${formatPay(deductionSum)}` : '—'}
                    </td>
                    <td className="py-2 px-2 text-right">
                      {deductionSum > 0 && (
                        <div className="flex items-center justify-end gap-1">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={actualDeductions[emp.staff_id] || ''}
                            onChange={(e) => setActualDeductions(prev => ({
                              ...prev,
                              [emp.staff_id]: e.target.value
                            }))}
                            placeholder={formatPay(deductionSum)}
                            className="w-24 px-2 py-1 text-xs text-right border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                          />
                          {empActualDeduction > 0 && (
                            <span className={`text-[10px] font-medium ${empRemaining > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              (ост. {formatPay(empRemaining)})
                            </span>
                          )}
                        </div>
                      )}
                      {deductionSum === 0 && <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2 pl-2 text-right text-slate-900 font-semibold whitespace-nowrap">
                      <span className={deductionSum > 0 && empRemaining > 0 ? 'text-amber-600' : ''}>
                        {formatPay(employeeTotal)}
                      </span>
                      {empRemaining > 0 && (
                        <span className="ml-1 text-[10px] text-amber-500 font-normal">(долг {formatPay(empRemaining)})</span>
                      )}
                    </td>
                    <td className="py-2 pl-2 text-right whitespace-nowrap">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => openAdjustForm(emp.staff_id, 'bonus')}
                          className="px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded border border-green-200 transition-colors"
                          title="Добавить премию"
                        >
                          + Премия
                        </button>
                        <button
                          onClick={() => openAdjustForm(emp.staff_id, 'deduction')}
                          className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded border border-red-200 transition-colors"
                          title="Добавить удержание"
                        >
                          - Удерж.
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold">
                <td className="py-3 pr-2 text-slate-900">Итого</td>
                <td className="py-3 px-2 text-right text-slate-900">{totals.fullDays}</td>
                <td className="py-3 px-2 text-right text-slate-900">{totals.subHours.toFixed(2)}</td>
                <td className="py-3 px-2 text-right text-slate-900">{formatPay(totals.basePay)}</td>
                <td className="py-3 px-2 text-right text-green-600">{totals.bonuses > 0 ? `+${formatPay(totals.bonuses)}` : '—'}</td>
                <td className="py-3 px-2 text-right text-red-500">{totals.deductions > 0 ? `-${formatPay(totals.deductions)}` : '—'}</td>
                <td className="py-3 px-2 text-right text-slate-900">
                  {totals.actualTotal > 0 ? formatPay(totals.actualTotal) : '—'}
                </td>
                <td className="py-3 pl-2 text-right text-slate-900">{formatPay(totals.total)}</td>
                <td className="py-3 pl-2"></td>
              </tr>
            </tfoot>
          </table>

          {/* Информация об остатках */}
          {totals.deductions > 0 && (
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Общая сумма удержаний</p>
                  <p className="text-lg font-bold text-red-500">-{formatPay(totals.deductions)} руб</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Фактически удержано всего</p>
                  <p className="text-lg font-bold text-slate-900">{formatPay(totals.actualTotal)} руб</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Остаток к переносу</p>
                  <p className={`text-lg font-bold ${totals.remainingTotal > 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {formatPay(totals.remainingTotal)} руб
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Для каждого сотрудника укажите сумму, которую реально удержали. Разница будет перенесена как долг на следующий период.
              </p>
            </div>
          )}

          {/* Список корректировок по сотрудникам */}
          {Object.keys(mergedAdjustments).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Детализация премий и удержаний</h4>
              <div className="space-y-1">
                {Object.entries(mergedAdjustments).map(([staffId, staffAdjustments]) => {
                  const emp = result.employees.find(e => e.staff_id === staffId)
                  return staffAdjustments.map((adj, idx) => (
                    <div
                      key={adj.id || adj._tempId}
                      className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs border ${ADJUSTMENT_COLORS[adj.adjustment_type] || ADJUSTMENT_COLORS.other}`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium whitespace-nowrap">{emp?.full_name || 'Сотрудник'}</span>
                        <span className="px-1.5 py-0.5 rounded bg-white/50 text-[10px] font-medium whitespace-nowrap">
                          {ADJUSTMENT_TYPES[adj.adjustment_type]}
                        </span>
                        {adj.barcode_number && (
                          <span className="text-slate-400 whitespace-nowrap">ШК: {adj.barcode_number}</span>
                        )}
                        {adj.comment && (
                          <span className="text-slate-400 italic truncate">— {adj.comment}</span>
                        )}
                        {adj._tempId < 0 && (
                          <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">
                            не сохранено
                          </span>
                        )}
                        {pendingChanges[staffId]?.some(c => c._tempId === adj._tempId && c.isDeleting) && (
                          <span className="px-1 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">
                            будет удалено
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`font-semibold ${adj.adjustment_type === 'bonus' ? 'text-green-600' : 'text-red-500'}`}>
                          {adj.adjustment_type === 'bonus' ? '+' : '-'}{formatPay(Math.abs(Number(adj.amount)))}
                        </span>
                        {!pendingChanges[staffId]?.some(c => c._tempId === adj._tempId && c.isDeleting) && (
                          <>
                            <button
                              onClick={() => openEditForm(adj)}
                              className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                              title="Редактировать"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePending(staffId, adj._tempId)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                              title="Удалить"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                })}
              </div>
            </div>
          )}

          {/* Панель пакетного сохранения */}
          {pendingCount > 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 font-medium mb-3">
                ⏳ Несохраненных изменений: {pendingCount}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleBatchSave}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  {saving ? 'Сохранение...' : '💾 Сохранить изменения'}
                </button>
                <button
                  onClick={handleCancelChanges}
                  disabled={saving}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 font-medium rounded-xl transition-colors"
                >
                  Отменить правки
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Пустой результат */}
      {result && result.employees.length === 0 && (
        <p className="text-sm text-slate-500 py-4 text-center">Нет смен за выбранный период</p>
      )}

      {/* Модальная форма создания/редактирования премии/удержания */}
      {showAdjustForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              {editAdjustment
                ? 'Редактировать корректировку'
                : showAdjustForm.type === 'bonus'
                  ? 'Добавить премию'
                  : 'Добавить удержание'
              }
            </h3>

            <form onSubmit={handleCreateAdjustment} className="space-y-3">
              {showAdjustForm.type !== 'bonus' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Тип удержания</label>
                  <select
                    value={formData.adjustment_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, adjustment_type: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="hanging_barcode">Зависшие ШК</option>
                    <option value="replacement">Подмена</option>
                    <option value="defect">Брак</option>
                    <option value="other">Прочее</option>
                  </select>
                </div>
              )}

              {showAdjustForm.type !== 'bonus' && (
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    ШК {formData.adjustment_type === 'other' ? '(необязательно)' : ''}
                  </label>
                  <input
                    type="text"
                    value={formData.barcode_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode_number: e.target.value }))}
                    placeholder="Номер штрихкода"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Сумма (руб)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Комментарий {formData.adjustment_type === 'other' ? '(обязательно)' : '(необязательно)'}
                </label>
                <textarea
                  value={formData.comment}
                  onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder={formData.adjustment_type === 'other' ? 'Опишите причину удержания' : 'Комментарий'}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {formError && (
                <div className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">{formError}</div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowAdjustForm(null); setEditAdjustment(null) }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formSaving ? 'Сохранение...' : editAdjustment ? 'Обновить' : 'Добавить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}