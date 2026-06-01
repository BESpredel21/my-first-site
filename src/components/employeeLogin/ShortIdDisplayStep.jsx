import React from 'react'

const ShortIdDisplayStep = ({ shortId, employeeName, goBack, navigate }) => (
  <div className="space-y-6">
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-green-600" width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-900">
        Сотрудник {employeeName} успешно зарегистрирован!
      </h2>
      <p className="text-sm text-slate-500 mt-1">Данные сохранены, можно войти в личный кабинет</p>
    </div>

    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-8 text-center">
      <p className="text-xs text-blue-600 font-medium mb-2">ВАШ ЛИЧНЫЙ ID ДЛЯ ПРИВЯЗКИ</p>
      <p className="text-5xl font-bold text-blue-800 tracking-[0.2em]">{shortId}</p>
      <p className="text-sm text-blue-500 mt-4">Передайте его руководителю</p>
    </div>

    {/* Кнопка перехода в личный кабинет */}
    <button
      onClick={() => { if (navigate) navigate('/staff'); else window.location.href = '/staff' }}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
      <span>Перейти в личный кабинет</span>
    </button>

    {/* Кнопка назад ко входу */}
    <button
      onClick={goBack}
      className="w-full bg-white hover:bg-slate-50 text-slate-600 font-semibold py-3 rounded-xl transition-colors text-sm border border-slate-300 flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      <span>Назад ко входу</span>
    </button>
  </div>
)

export default ShortIdDisplayStep