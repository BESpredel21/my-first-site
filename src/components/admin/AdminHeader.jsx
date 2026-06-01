import React from 'react'

export default function AdminHeader({ admin, onLogout }) {
  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold text-slate-900">Панель руководителя</h1>
          <p className="text-sm text-slate-500">PointMaster 2.0</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:items-end flex-1 sm:text-right text-left">
        <p className="text-sm font-medium text-slate-900">{admin.full_name}</p>
        <p className="text-xs text-slate-400">{admin.email}</p>
      </div>

      {admin.point_id && (
        <div className="flex items-center gap-2 mt-3">
          <svg className="w-4 h-4 text-blue-600" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-full">
            ПВЗ №{admin.point_id}
          </span>
        </div>
      )}

      <button
        onClick={onLogout}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm mt-4"
      >
        <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Выйти</span>
      </button>
    </div>
  )
}