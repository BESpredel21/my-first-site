import React from 'react'

const SearchStep = ({ email, setEmail, isEmailValid, searchError, searchLoading, onSubmit, goBack, goToRegister }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(e)
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold text-slate-900">Поиск аккаунта</h1>
        <p className="text-slate-500 mt-1">Введите email для входа</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="search-email" className="block text-sm font-medium text-slate-700 mb-2">
            Email
          </label>
          <input
            id="search-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            className={`input-standard ${email.trim() && !isEmailValid ? 'border-b-red-400' : ''}`}
            placeholder="example@mail.com"
            required
            disabled={searchLoading}
            autoFocus
          />
          {email.trim() && !isEmailValid && (
            <p className="text-sm text-red-500 mt-1">Введите корректный email (например, example@mail.com)</p>
          )}
        </div>

         {searchError && (
           <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
             {searchError}
           </div>
         )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors group"
            disabled={searchLoading}
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Назад</span>
          </button>
          <button
            type="submit"
            disabled={searchLoading || !isEmailValid}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {searchLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Поиск...
              </>
            ) : (
              'Далее'
            )}
          </button>
        </div>

        {/* Всегда видимая ссылка для регистрации нового аккаунта */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={goToRegister}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium underline transition-colors"
          >
            Зарегистрировать новый аккаунт руководителя
          </button>
        </div>
      </form>
    </>
  )
}

export default SearchStep
