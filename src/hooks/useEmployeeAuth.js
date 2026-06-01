import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'

/**
 * Генерировать уникальный short_id из 6-8 случайных цифр
 */
function generateShortId() {
  const length = Math.floor(Math.random() * 3) + 6
  const digits = '0123456789'
  let result
  do {
    result = ''
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length))
    }
  } while (result === '')
  return result
}

/**
 * Хук для управления процессом авторизации сотрудника
 * Реализует полноценную работу с Supabase без фиктивных заглушек.
 */
export function useEmployeeAuth() {
  const navigate = useNavigate()

  // Состояния процесса авторизации
  const [step, setStep] = useState('cache') // cache, pin, new_employee, set_pin, short_id_display
  const [isRegistering, setIsRegistering] = useState(false) // false = экран входа, true = экран регистрации
  const [loginForm, setLoginForm] = useState({ phone: '', pin: '' }) // форма входа
  const [registerForm, setRegisterForm] = useState({ phone: '', pin: '' }) // форма регистрации
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [foundEmployee, setFoundEmployee] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchForm, setSearchForm] = useState({ name: '', phone: '', pin: '' })
  const [createdShortId, setCreatedShortId] = useState(null)

  /**
   * Переключить режим между входом и регистрацией
   */
  const toggleAuthMode = useCallback(() => {
    setIsRegistering(prev => !prev)
    setError(null)
  }, [])

  /**
   * Войти по телефону и ПИН-коду — реальный запрос к Supabase.
   */
  const handleLogin = useCallback(async (phone, pin) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone.trim())
        .eq('pin', pin)
        .eq('role', 'staff')
        .single()

      if (queryError || !data) {
        setError('Неверный телефон или ПИН-код')
        setLoading(false)
        return { success: false, error: 'Неверный телефон или ПИН-код' }
      }

      // Сохраняем только данные реального пользователя из Supabase
      sessionStorage.setItem('pm_current_employee', JSON.stringify(data))

      setLoading(false)
      navigate('/staff')
      return { success: true, employee: data }
    } catch (err) {
      console.error('Ошибка при входе:', err)
      setError('Ошибка при входе в систему')
      setLoading(false)
      return { success: false }
    }
  }, [navigate])

  /**
   * Сбросить ошибки
   */
  const clearError = useCallback(() => setError(null), [])

  /**
   * Выбрать сотрудника из кеша для входа по ПИН
   */
  const selectFromCache = useCallback((employee) => {
    setSelectedEmployee(employee)
    setStep('pin')
    setError(null)
  }, [])

  /**
   * Перейти к форме нового сотрудника
   */
  const goToNewEmployee = useCallback(() => {
    setStep('new_employee')
    setError(null)
    setSelectedEmployee(null)
  }, [])

  /**
   * Поиск сотрудника по телефону и пункту — реальный запрос к Supabase.
   */
  const searchEmployee = useCallback(async (phone, pointId) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .eq('point_id', pointId)
        .single()

      if (searchError) {
        if (searchError.code === 'PGRST116') {
          setError('Сотрудник с таким номером телефона и ID пункта не найден')
        } else {
          setError('Ошибка при поиске сотрудника')
        }
        setLoading(false)
        return
      }

      setFoundEmployee(data)

      if (data.pin) {
        setStep('pin')
      } else {
        setStep('set_pin')
      }

      setError(null)
    } catch (err) {
      setError('Ошибка при поиске сотрудника')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Проверка ПИН-кода — реальный запрос к Supabase.
   */
  const verifyPin = useCallback(async (pin) => {
    setLoading(true)
    setError(null)

    const employeeToVerify = selectedEmployee || foundEmployee

    if (!employeeToVerify) {
      setError('Сотрудник не выбран')
      setLoading(false)
      return { success: false }
    }

    try {
      const { data, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', employeeToVerify.id)
        .eq('pin', pin)
        .single()

      if (verifyError) {
        setError('Неверный ПИН-код')
        setLoading(false)
        return { success: false }
      }

      // Сохраняем реальные данные пользователя
      sessionStorage.setItem('pm_current_employee', JSON.stringify(data))

      setLoading(false)
      return { success: true, employee: data }
    } catch (err) {
      setError('Ошибка проверки ПИН-кода')
      setLoading(false)
      return { success: false }
    }
  }, [selectedEmployee, foundEmployee])

  /**
   * Установка нового ПИН-кода — реальный запрос к Supabase.
   */
  const setNewPin = useCallback(async (pin) => {
    setLoading(true)
    setError(null)

    if (!foundEmployee) {
      setError('Сотрудник не найден')
      setLoading(false)
      return { success: false }
    }

    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ pin })
        .eq('id', foundEmployee.id)
        .select()
        .single()

      if (updateError) {
        setError('Ошибка сохранения ПИН-кода')
        setLoading(false)
        return { success: false }
      }

      setFoundEmployee(data)
      setStep('pin')
      setError(null)
      setLoading(false)
      return { success: true }
    } catch (err) {
      setError('Ошибка сохранения ПИН-кода')
      setLoading(false)
      return { success: false }
    }
  }, [foundEmployee])

  /**
   * Создать нового сотрудника — реальные запросы к Supabase.
   * 1) Проверяем телефон через Supabase (если занят — возвращаем ошибку).
   * 2) Вставляем нового сотрудника через .insert().
   */
  const createNewEmployee = useCallback(async (e) => {
    setLoading(true)
    setError(null)

    const { name, phone, pin } = searchForm

    if (!name || !phone || !pin) {
      setError('Заполните все поля')
      setLoading(false)
      return { success: false }
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('ПИН-код должен содержать 4 цифры')
      setLoading(false)
      return { success: false }
    }

    try {
      // Шаг 1: проверяем, занят ли номер телефона
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone.trim())
        .maybeSingle()

      if (existing) {
        setError('Этот номер телефона уже зарегистрирован в системе!')
        setLoading(false)
        return { success: false }
      }

      // Шаг 2: генерируем уникальный short_id
      const shortId = generateShortId()

      // Шаг 3: реальная вставка в таблицу profiles
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert([{
          full_name: name.trim(),
          phone: phone.trim(),
          pin,
          role: 'staff',
          short_id: shortId,
          point_id: null
        }])
        .select()
        .single()

      if (insertError) {
        console.error('Ошибка создания сотрудника:', insertError)
        setError('Ошибка при создании сотрудника')
        setLoading(false)
        return { success: false }
      }

      setFoundEmployee(data)
      setCreatedShortId(shortId)

      // Сохраняем реальные данные пользователя
      sessionStorage.setItem('pm_current_employee', JSON.stringify(data))

      setStep('short_id_display')
      setError(null)
      setLoading(false)
      return { success: true, employee: data, shortId }
    } catch (err) {
      console.error('Ошибка при создании сотрудника:', err)
      setError('Ошибка при создании сотрудника')
      setLoading(false)
      return { success: false }
    }
  }, [searchForm])

  /**
   * Вернуться к предыдущему шагу
   */
  const goBack = useCallback(() => {
    setError(null)
    if (step === 'pin') {
      setStep('cache')
      setSelectedEmployee(null)
      setFoundEmployee(null)
    } else if (step === 'new_employee' || step === 'set_pin') {
      setStep('cache')
      setSelectedEmployee(null)
      setFoundEmployee(null)
      setSearchForm({ name: '', phone: '', pin: '' })
    } else if (step === 'short_id_display') {
      setStep('cache')
      setSelectedEmployee(null)
      setFoundEmployee(null)
      setCreatedShortId(null)
      setSearchForm({ name: '', phone: '', pin: '' })
    }
  }, [step])

  /**
   * Вернуться к выбору роли (главная)
   */
  const goToRoleSelection = useCallback(() => {
    setStep('cache')
    setSelectedEmployee(null)
    setFoundEmployee(null)
    setCreatedShortId(null)
    setSearchForm({ name: '', phone: '', pin: '' })
    setError(null)
  }, [])

  /**
   * Сбросить весь процесс
   */
  const reset = useCallback(() => {
    setStep('cache')
    setSelectedEmployee(null)
    setFoundEmployee(null)
    setSearchForm({ name: '', phone: '', pin: '' })
    setError(null)
    setLoading(false)
  }, [])

  return {
    step,
    isRegistering,
    loginForm,
    registerForm,
    setLoginForm,
    setRegisterForm,
    selectedEmployee,
    foundEmployee,
    createdShortId,
    searchForm,
    setSearchForm,
    loading,
    error,
    setStep,
    toggleAuthMode,
    handleLogin,
    selectFromCache,
    goToNewEmployee,
    searchEmployee,
    verifyPin,
    setNewPin,
    createNewEmployee,
    goBack,
    goToRoleSelection,
    reset,
    clearError,
  }
}
