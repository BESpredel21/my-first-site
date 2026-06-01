import React from 'react'

const RegisterStep = ({ form, setForm, registerPin, setRegisterPin, loading, error, createAdmin, goToLogin }) => {
  const handleSubmit = async (e) => {
    e.preventDefault()
    await createAdmin(registerPin)
  }

  return (
    <div className="space-y-5">
      <div className="text-center mb-8">
        <h1 className="text-xl font-bold text-slate-900">Регистрация руководителя</h1>
        <p className="text-slate-500 mt-1">Создайте новый аккаунт</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
          <input
            id="reg-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-standard"
            placeholder="example@mail.com"
            required
            disabled={loading}
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="reg-firstName" className="block text-sm font-medium text-slate-700 mb-2">Имя</label>
          <input
            id="reg-firstName"
            type="text"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            className="input-standard"
            placeholder="Иван"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="reg-lastName" className="block text-sm font-medium text-slate-700 mb-2">Фамилия</label>
          <input
            id="reg-lastName"
            type="text"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            className="input-standard"
            placeholder="Иванов"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="reg-pin" className="block text-sm font-medium text-slate-700 mb-2">ПИН-код (4 цифры)</label>
          <input
            id="reg-pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={registerPin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '')
              setRegisterPin(val)
            }}
            className="input-standard text-center text-lg tracking-widest"
            placeholder="0000"
            maxLength={4}
            required
            disabled={loading}
          />
          <div className="text-center mt-2">
            <span className={`text-sm ${registerPin.length === 4 ? 'text-green-600' : 'text-slate-500'}`}>
              Введено {registerPin.length}/4 цифр
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={goToLogin}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors group"
            disabled={loading}
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Назад</span>
          </button>
          <button
            type="submit"
            disabled={loading || registerPin.length !== 4 || !form.email || !form.firstName || !form.lastName}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Создание...
              </>
            ) : (
              'Создать аккаунт'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default RegisterStep
