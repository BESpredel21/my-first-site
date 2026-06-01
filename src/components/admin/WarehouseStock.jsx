import React, { useState, useEffect } from 'react'

export default function WarehouseStock({ stockLoading, warehouseStock, onUpdateStock }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg className="w-7 h-7 text-white" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 mb-1">Остатки на складе МЦ</h3>
          <p className="text-sm text-slate-500">Расходные материалы в наличии</p>
        </div>
      </div>

      {stockLoading ? (
        <p className="text-xs text-slate-400">Загрузка остатков...</p>
      ) : (
        <div className="space-y-3">
          <StockRow label="Пакеты" field="bag_count" unit="шт" value={warehouseStock?.bag_count} onUpdateStock={onUpdateStock} />
          <StockRow label="Скотч" field="tape_count" unit="шт" value={warehouseStock?.tape_count} onUpdateStock={onUpdateStock} />
          <StockRow label="Бумага" field="paper_count" unit="рулоны" value={warehouseStock?.paper_count} onUpdateStock={onUpdateStock} />
        </div>
      )}
    </div>
  )
}

function StockRow({ label, field, unit, value, onUpdateStock }) {
  const numericValue = value ?? 0
  const [inputValue, setInputValue] = useState(String(numericValue))

  // Синхронизируем локальное состояние при обновлении данных из Supabase
  useEffect(() => {
    setInputValue(String(numericValue))
  }, [numericValue])

  const handleChange = (e) => {
    const raw = e.target.value
    // Разрешаем пустую строку, чтобы пользователь мог стереть всё и ввести новое число
    if (raw === '') {
      setInputValue('')
      return
    }
    const parsed = parseInt(raw, 10)
    if (isNaN(parsed)) return
    // Защита от отрицательных чисел
    if (parsed < 0) return
    setInputValue(String(parsed))
    // Вычисляем дельту относительно текущего значения из пропсов и отправляем UPDATE
    const delta = parsed - numericValue
    if (delta !== 0) {
      onUpdateStock(field, delta)
    }
  }

  const handleBlur = () => {
    // Если поле пустое — ставим "0" и отправляем обнуление
    if (inputValue === '' || inputValue === '-') {
      setInputValue('0')
      const delta = 0 - numericValue
      if (delta !== 0) {
        onUpdateStock(field, delta)
      }
    }
  }

  return (
    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18v18H3V3z" />
          </svg>
        </div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className="border border-slate-200 rounded-xl p-2 w-24 text-center text-sm font-bold text-slate-900"
        />
        <span className="text-xs font-normal text-slate-400">{unit}</span>
      </div>
    </div>
  )
}
