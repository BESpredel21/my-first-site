import React from 'react'

const CacheStep = ({ cachedAdmins, selectFromCache, goToNewAdmin, goToLogin, goToRegister }) => (
  <div className="space-y-4">
    {cachedAdmins.length > 0 && (
      <div className="space-y-3">
        <p className="text-sm font-medium text-slate-500 mb-3">Быстрый вход</p>
        <div className="space-y-2">
          {cachedAdmins.map((admin) => (
            <button
              key={admin.id}
              onClick={() => selectFromCache(admin)}
              className="w-full bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left group p-5 border border-gray-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                  <svg className="w-6 h-6 text-indigo-600" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{admin.full_name}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{admin.email}</p>
                  {admin.point_id && (
                    <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">
                      <svg className="w-3 h-3" width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      ПВЗ №{admin.point_id}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    )}

    {cachedAdmins.length === 0 && (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-slate-500 mb-4">Нет сохраненных руководителей</p>
        <button
          onClick={goToRegister || goToNewAdmin}
          className="btn-primary"
        >
          Войти как новый руководитель
        </button>
      </div>
    )}
  </div>
)

export default CacheStep
