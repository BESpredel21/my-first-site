import React from 'react'

export default function PointSelector({ points, activePointId, onPointChange }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
      <label htmlFor="activePointSelect" className="block text-sm font-semibold text-slate-700 mb-2">
        Текущий рабочий ПВЗ
      </label>
      <select
        id="activePointSelect"
        value={activePointId}
        onChange={onPointChange}
        className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        {points.length === 0 ? (
          <option value="" disabled>Сначала добавьте пункт ПВЗ</option>
        ) : (
          points.map((pointId) => (
            <option key={pointId} value={pointId}>
              ПВЗ №{pointId}
            </option>
          ))
        )}
      </select>
    </div>
  )
}