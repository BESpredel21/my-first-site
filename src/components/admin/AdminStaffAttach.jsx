import React from 'react'

export default function AdminStaffAttach({ staffList, staffLoadingList, staffIdInput, onStaffIdInputChange, staffLoading, staffError, staffSuccess, onAttachStaff, onRemoveStaff }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg className="w-7 h-7 text-white" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 mb-1">Сотрудники пункта</h3>
          <p className="text-sm text-slate-500">Добавление и управление сотрудниками</p>
        </div>
      </div>

      <form onSubmit={onAttachStaff} className="space-y-3 mb-4">
        <input
          type="text"
          value={staffIdInput}
          onChange={(e) => onStaffIdInputChange(e.target.value)}
          placeholder="Введите ID сотрудника"
          className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-slate-400 font-mono"
        />
        <button
          type="submit"
          disabled={staffLoading || !staffIdInput.trim()}
          className="w-full px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {staffLoading ? 'Привязка...' : 'Привязать к текущему ПВЗ'}
        </button>
      </form>

      {staffError && (
        <p className="text-xs text-red-500 mb-2">{staffError}</p>
      )}
      {staffSuccess && (
        <p className="text-xs text-green-600 mb-2">{staffSuccess}</p>
      )}

      <div className="border-t border-slate-200 pt-4">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">
          Сотрудники пункта ({staffList.length})
        </h4>
        {staffLoadingList ? (
          <p className="text-xs text-slate-400">Загрузка...</p>
        ) : staffList.length === 0 ? (
          <p className="text-xs text-slate-400">Нет сотрудников</p>
        ) : (
          <ul className="space-y-2">
            {staffList.map((staff) => (
              <li
                key={staff.staff_point_id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{staff.full_name}</p>
                  {staff.phone && (
                    <p className="text-xs text-slate-400">{staff.phone}</p>
                  )}
                  <p className="text-xs text-slate-300 font-mono mt-1">{staff.id}</p>
                </div>
                <button
                  onClick={() => onRemoveStaff(staff.staff_point_id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 ml-2"
                  title="Отвязать от текущего ПВЗ"
                >
                  <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}