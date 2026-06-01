import React, { memo, useState } from 'react'

const AdminPanel = memo(function AdminPanel({
  admin,
  points,
  pointsLoading,
  activePointId,
  actionError,
  actionSuccess,
  newPointId,
  onNewPointIdChange,
  onPointChange,
  onAddPoint,
  onRemovePoint,
  onLogout
}) {
  const [showAddForm, setShowAddForm] = useState(false)

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      {/* Приветствие */}
      <div className="mb-4 pb-4 border-b border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900">Добро пожаловать, {admin.full_name}!</h2>
        <p className="text-xs text-slate-500 mt-0.5">Вы вошли в панель управления PointMaster 2.0</p>
      </div>

      {/* Текущий рабочий ПВЗ */}
      <div className="mb-3">
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Текущий рабочий ПВЗ
        </label>
        <div className="flex items-center gap-2">
          <select
            id="activePointSelect"
            value={activePointId}
            onChange={onPointChange}
            className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors whitespace-nowrap border border-blue-200"
          >
            {showAddForm ? 'Отмена' : '+ Добавить'}
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm"
            title="Выйти"
          >
            <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Форма добавления нового ПВЗ */}
      {showAddForm && (
        <form onSubmit={(e) => { onAddPoint(e); setShowAddForm(false) }} className="flex items-center gap-2 mb-3">
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
      )}

      {/* Сообщения об ошибках/успехе */}
      {actionError && (
        <p className="text-xs text-red-500 mb-2">{actionError}</p>
      )}
      {actionSuccess && (
        <p className="text-xs text-green-600 mb-2">{actionSuccess}</p>
      )}

      {/* Список ПВЗ (только если есть пункты) */}
      {points.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {points.map((pointId) => (
            <span
              key={pointId}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                pointId === activePointId
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              ПВЗ №{pointId}
              <button
                onClick={() => onRemovePoint(pointId)}
                disabled={pointsLoading}
                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Удалить"
              >
                <svg className="w-3 h-3" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
})

export default AdminPanel
