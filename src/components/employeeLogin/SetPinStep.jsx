import React from 'react'
import { formatPhone } from '../../utils/formatPhone'

const SetPinStep = ({ foundEmployee, pinInput, setPinInput, loading, error, handleSetPinSubmit, goBack }) => (
  <div className="space-y-5">
    <div className="text-center">
      <h2 className="text-lg font-semibold text-slate-900">{foundEmployee?.full_name}</h2>
      <p className="text-slate-500 text-sm mt-1">{formatPhone(foundEmployee?.phone)}</p>
    </div>

    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
      <p className="text-yellow-700 text-sm text-center">
        У этого сотрудника еще нет ПИН-кода. Пожалуйста, придумайте его для входа.
      </p>
    </div>

    <form onSubmit={handleSetPinSubmit} className="space-y-5">
      <div>
        <label htmlFor="newPin" className="block text-sm font-medium text-slate-700 mb-2">
          Новый ПИН-код
        </label>
        <input
          id="newPin"
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pinInput}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '')
            setPinInput(val)
          }}
          className="input-standard text-center text-lg tracking-widest"
          placeholder="Минимум 4 цифры"
          maxLength={8}
          required
          disabled={loading}
          autoFocus
        />
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
          disabled={loading || pinInput.length < 4}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Сохранение...
            </>
          ) : (
            'Сохранить ПИН'
          )}
        </button>
      </div>
    </form>
  </div>
)

export default SetPinStep
