import React from 'react'

export default function AdminMyPoints({ points, pointsLoading, actionError, actionSuccess, newPointId, onNewPointIdChange, onAddPoint, onRemovePoint }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Мои пункты ПВЗ</h3>

      <form onSubmit={onAddPoint} className="flex items-center gap-2 mb-4">
        <input
          type="text"
          value={newPointId}
          onChange={(e) => onNewPointIdChange(e.target.value)}
          placeholder="Название или ID пункта"
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400"
        />
        <button
          type="submit"
          disabled={pointsLoading || newPointId.length < 2}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pointsLoading ? '...' : 'Добавить'}
        </button>
      </form>

      {actionError && (
        <p className="text-xs text-red-500 mb-2">{actionError}</p>
      )}
      {actionSuccess && (
        <p className="text-xs text-green-600 mb-2">{actionSuccess}</p>
      )}

      {pointsLoading && !actionSuccess ? (
        <p className="text-xs text-slate-400">Загрузка...</p>
      ) : points.length === 0 ? (
        <p className="text-xs text-slate-400">Нет добавленных пунктов</p>
      ) : (
        <ul className="space-y-2">
          {points.map((pointId) => (
            <li key={pointId} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-slate-700 font-medium">ПВЗ №{pointId}</span>
              </div>
              <button
                onClick={() => onRemovePoint(pointId)}
                disabled={pointsLoading}
                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed p-1"
                title="Удалить"
              >
                <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}