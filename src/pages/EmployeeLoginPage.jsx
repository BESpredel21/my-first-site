import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEmployeeAuth } from '../hooks/useEmployeeAuth'
import { supabase } from '../services/supabaseClient'

const phoneMask = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 1) return '+7'
  if (digits.length <= 4) return '+7 (' + digits.slice(1)
  if (digits.length <= 7) return '+7 (' + digits.slice(1, 4) + ') ' + digits.slice(4)
  if (digits.length <= 9) return '+7 (' + digits.slice(1, 4) + ') ' + digits.slice(4, 7) + '-' + digits.slice(7)
  if (digits.length <= 11) return '+7 (' + digits.slice(1, 4) + ') ' + digits.slice(4, 7) + '-' + digits.slice(7, 9) + '-' + digits.slice(9)
  return '+7 (' + digits.slice(1, 4) + ') ' + digits.slice(4, 7) + '-' + digits.slice(7, 9) + '-' + digits.slice(9)
}

const cleanPhone = (raw) => '+7' + raw.replace(/\D/g, '').slice(1)

const pinOnly = (value) => value.replace(/\D/g, '').slice(0, 4)

export default function EmployeeLoginPage() {
  const navigate = useNavigate()
  const { handleLogin, loading: authLoading } = useEmployeeAuth()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [screen, setScreen] = useState('login')
  const [isRegistering, setIsRegistering] = useState(false)
  const [registeredShortId, setRegisteredShortId] = useState('')

  const handlePhoneChange = (e) => setPhone(phoneMask(e.target.value))
  const handlePinChange = (e) => setPin(pinOnly(e.target.value))

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (phone.replace(/\D/g, '').length < 11) {
      setError('Введите полный номер телефона')
      return
    }
    if (pin.length !== 4) {
      setError('ПИН-код должен содержать 4 цифры')
      return
    }

    const phoneNum = cleanPhone(phone)
    console.log("Попытка входа с телефоном:", phoneNum)

    if (typeof handleLogin !== 'function') {
      setError('Ошибка: функция входа недоступна')
      return
    }

    try {
      const result = await handleLogin(phoneNum, pin)
      if (result && !result.success && result.error) {
        setError(result.error)
      }
    } catch (err) {
      console.error('Ошибка при вызове handleLogin:', err)
      setError('Произошла ошибка при входе. Пожалуйста, попробуйте снова.')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Введите ваше имя')
      return
    }
    if (phone.replace(/\D/g, '').length < 11) {
      setError('Введите полный номер телефона')
      return
    }
    if (pin.length !== 4) {
      setError('ПИН-код должен содержать 4 цифры')
      return
    }

    setLoading(true)
    const phoneNum = cleanPhone(phone)

    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phoneNum)
        .maybeSingle()

      if (existing) {
        setError('Этот телефон уже зарегистрирован')
        setLoading(false)
        return
      }

      const randomId = Math.floor(100000 + Math.random() * 900000).toString()

      const { error: insertError } = await supabase.from('profiles').insert([{
        id: crypto.randomUUID(),
        full_name: fullName.trim(),
        phone: phoneNum,
        pin: pin,
        role: 'staff',
        short_id: randomId,
      }])

      if (insertError) throw insertError

      setRegisteredShortId(randomId)
      setScreen('success')
    } catch (err) {
      setError(err.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  const currentError = error

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Назад</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-slate-900">
              {screen === 'login' ? 'Вход сотрудника' : screen === 'register' ? 'Регистрация сотрудника' : 'Регистрация завершена'}
            </h1>
            <p className="text-slate-500 mt-1">
              {screen === 'login' ? 'Введите телефон и ПИН-код' : screen === 'register' ? 'Заполните три поля ниже' : 'Запомните ваш Short ID'}
            </p>
          </div>

          {screen === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label htmlFor="loginPhone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Номер телефона
                </label>
                <input
                  id="loginPhone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="loginPin" className="block text-sm font-medium text-slate-700 mb-1.5">
                  ПИН-код
                </label>
                <input
                  id="loginPin"
                  type="password"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm tracking-widest text-center"
                  required
                />
              </div>

              {currentError && (
                <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg p-2">{currentError}</p>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {authLoading ? 'Вход...' : 'Войти'}
              </button>

              <p className="text-center text-sm text-slate-500">
                Нет аккаунта?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setScreen('register')
                    setError('')
                    setPhone('')
                    setPin('')
                    setFullName('')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Зарегистрироваться
                </button>
              </p>
            </form>
          )}

          {screen === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Ваше Имя
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ваше Имя"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Номер телефона
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm"
                  required
                />
              </div>

              <div>
                <label htmlFor="pin" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Придумайте ПИН-код
                </label>
                <input
                  id="pin"
                  type="password"
                  value={pin}
                  onChange={handlePinChange}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm tracking-widest text-center"
                  required
                />
              </div>

              {currentError && (
                <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg p-2">{currentError}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>

              <p className="text-center text-sm text-slate-500">
                Уже есть аккаунт?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setScreen('login')
                    setError('')
                    setPhone('')
                    setPin('')
                    setFullName('')
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Войти
                </button>
              </p>
            </form>
          )}

          {screen === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-green-600 font-semibold text-lg">✓ Регистрация успешна!</p>
              <div className="bg-slate-50 rounded-xl p-6">
                <p className="text-sm text-slate-500 mb-1">Ваш Short ID:</p>
                <p className="text-3xl font-bold text-slate-900 tracking-widest">{registeredShortId}</p>
              </div>
              <p className="text-sm text-slate-500">Сообщите этот код администратору</p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                На главную
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}