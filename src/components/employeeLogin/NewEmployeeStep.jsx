import React from 'react'
import { PatternFormat } from 'react-number-format'

const NewEmployeeStep = ({ searchForm, setSearchForm, loading, error, handleCreateSubmit, goBack }) => {
  const isNameValid = searchForm.name && searchForm.name.trim().length >= 2
  const isPhoneValid = searchForm.phone && searchForm.phone.length === 11
  const isPinValid = searchForm.pin && /^\d{4}$/.test(searchForm.pin)
  const isFormValid = isNameValid && isPhoneValid && isPinValid

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isFormValid) return
    handleCreateSubmit(e)
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Поле: Имя сотрудника */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
            Имя сотрудника
          </label>
          <input
            id="name"
            type="text"
            value={searchForm.name || ''}
            onChange={(e) => setSearchForm({ ...searchForm, name: e.target.value })}
            className="input-standard"
            placeholder="Введите имя"
            required
            disabled={loading}
            autoFocus
          />
          <p className={`text-xs mt-1 ${isNameValid ? 'text-green-600' : 'text-slate-500'}`}>
            {isNameValid ? 'Имя введено корректно' : 'Минимум 2 символа'}
          </p>
        </div>

        {/* Поле: Номер телефона */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-2">
            Номер телефона
          </label>
          <PatternFormat
            id="phone"
            format="+7 (###) ###-##-##"
            mask="_"
            value={searchForm.phone ? searchForm.phone.slice(1) : ''}
            onValueChange={(values) => {
              const cleanDigits = values.value
              if (cleanDigits.length <= 10) {
                setSearchForm({ ...searchForm, phone: '7' + cleanDigits })
              }
            }}
            className="input-standard"
            placeholder="+7 (___) ___-__-__"
            required
            disabled={loading}
          />
          <p className={`text-xs mt-1 ${isPhoneValid ? 'text-green-600' : 'text-slate-500'}`}>
            {isPhoneValid ? 'Номер введен полностью' : `Введите ${10 - (searchForm.phone?.slice(1)?.length || 0)} цифр`}
          </p>
        </div>

        {/* Поле: ПИН-код */}
        <div>
          <label htmlFor="pin" className="block text-sm font-medium text-slate-700 mb-2">
            Придумайте ПИН-код
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            maxLength={4}
            value={searchForm.pin || ''}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4)
              setSearchForm({ ...searchForm, pin: val })
            }}
            className="input-standard text-center tracking-[0.5em] text-xl"
            placeholder="••••"
            required
            disabled={loading}
            pattern="[0-9]{4}"
          />
          <p className={`text-xs mt-1 ${isPinValid ? 'text-green-600' : 'text-slate-500'}`}>
            {isPinValid ? 'ПИН-код установлен' : `Введите ${4 - (searchForm.pin?.length || 0)} цифр`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors group order-first"
            disabled={loading}
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Назад</span>
          </button>
          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="btn-primary flex-1"
          >
            {loading ? 'Создание...' : 'Зарегистрироваться'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default NewEmployeeStep