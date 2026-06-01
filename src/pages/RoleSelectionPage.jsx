import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function RoleSelectionPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8 fade-in">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">PointMaster 2.0</h1>
          <p className="text-slate-500 text-lg">Выберите свою роль для входа</p>
        </div>

        {/* Role Cards */}
        <div className="space-y-4 fade-in">
          {/* Employee Card */}
          <button
            onClick={() => navigate('/login/employee')}
            className="w-full bg-white rounded-3xl shadow-xl hover:shadow-2xl hover:bg-slate-50 transition-all text-left group p-6 border border-slate-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <svg className="w-7 h-7 text-indigo-600" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Войти как сотрудник</h2>
                <p className="text-slate-500 text-sm mt-1">Доступ к сменам, списаниям МЦ, уведомлениям</p>
              </div>
            </div>
          </button>

          {/* Manager Card */}
          <button
            onClick={() => navigate('/login/manager')}
            className="w-full bg-white rounded-3xl shadow-xl hover:shadow-2xl hover:bg-slate-50 transition-all text-left group p-6 border border-slate-100"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                <svg className="w-7 h-7 text-indigo-600" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">Войти как руководитель</h2>
                <p className="text-slate-500 text-sm mt-1">Доступ к управлению графиком, рассылкам, контролю МЦ</p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-400 text-sm mt-8">
          PointMaster 2.0 © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
