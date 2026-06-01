import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../hooks/useAdminAuth'
import CacheStep from '../components/managerLogin/CacheStep'
import SearchStep from '../components/managerLogin/SearchStep'
import RegisterStep from '../components/managerLogin/RegisterStep'

export default function ManagerLoginPage() {
  const navigate = useNavigate()
  const {
    step,
    selectedAdmin,
    foundAdmin,
    cachedAdmins,
    form,
    setForm,
    loading,
    error,
    setStep,
    selectFromCache,
    goToRegister,
    goToLogin,
    findAdmin,
    verifyPin,
    createAdmin,
    goToRoleSelection,
    clearError,
  } = useAdminAuth()

  const [email, setEmail] = useState('')
  const [pinCode, setPinCode] = useState('')
  const [registerPin, setRegisterPin] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isEmailValid, setIsEmailValid] = useState(false)

  useEffect(() => {
    setIsEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
  }, [email])

  // Синхронизация ошибки из хука
  useEffect(() => {
    if (error) {
      setLoginError(error)
    }
  }, [error])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')
    if (!isEmailValid) {
      setLoginError('Введите корректный email')
      return
    }
    await findAdmin(email.trim())
  }

  const handlePinLogin = async (e) => {
    e.preventDefault()
    if (!pinCode || pinCode.length < 4) {
      setLoginError('Введите ПИН-код')
      return
    }
    const result = await verifyPin(pinCode)
    if (result.success) {
      navigate('/admin')
    }
  }

  const handleSubmitRegister = async (pin) => {
    const result = await createAdmin(pin)
    if (result.success) {
      navigate('/admin')
    }
  }

  const renderCacheAndLogin = () => (
    <div className="space-y-6">
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
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 pt-6">
        <p className="text-sm text-slate-500 text-center mb-4">или</p>
        <SearchStep
          email={email}
          setEmail={(val) => { setEmail(val); setLoginError('') }}
          isEmailValid={isEmailValid}
          searchError={loginError}
          searchLoading={loading}
          onSubmit={handleEmailSubmit}
          goBack={goToRoleSelection}
          goToRegister={goToRegister}
        />
      </div>

      {/* Всегда видимая ссылка для регистрации с главного экрана входа */}
      <div className="mt-6 pt-6 border-t border-slate-200 text-center">
        <button
          type="button"
          onClick={goToRegister}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium underline transition-colors"
        >
          Зарегистрировать новый аккаунт руководителя
        </button>
      </div>
    </div>
  )

  const renderPinStep = () => {
    const adminToDisplay = selectedAdmin || foundAdmin
    return (
      <div className="space-y-5">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-slate-900">Введите ПИН-код</h1>
          <p className="text-slate-500 mt-1">{adminToDisplay?.email}</p>
        </div>
        <form onSubmit={handlePinLogin} className="space-y-5">
          <div>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pinCode}
              onChange={(e) => { setPinCode(e.target.value.replace(/\D/g, '')); setLoginError('') }}
              className="input-standard text-center text-lg tracking-widest"
              placeholder="0000"
              maxLength={4}
              required
              disabled={loading}
              autoFocus
            />
            {loginError && <p className="text-sm text-red-500 mt-2 text-center">{loginError}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || pinCode.length !== 4}
            className="btn-primary w-full"
          >
            {loading ? 'Проверка...' : 'Войти'}
          </button>
          <button
            type="button"
            onClick={goToRoleSelection}
            className="w-full text-center text-sm text-slate-500 hover:text-slate-700 transition-colors"
            disabled={loading}
          >
            ← Назад
          </button>
        </form>
      </div>
    )
  }

  const renderRegisterStep = () => (
    <RegisterStep
      form={form}
      setForm={setForm}
      registerPin={registerPin}
      setRegisterPin={setRegisterPin}
      loading={loading}
      error={loginError || error}
      createAdmin={handleSubmitRegister}
      goToLogin={goToLogin}
    />
  )

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {step === 'login' && renderCacheAndLogin()}
          {step === 'register' && renderRegisterStep()}
          {step === 'pin' && renderPinStep()}
        </div>
      </div>
    </div>
  )
}