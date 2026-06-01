import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminLocalStorage } from './useLocalStorage'
import { supabase } from '../services/supabaseClient'

/**
 * Хук для управления процессом авторизации руководителя (админа)
 * Работает через email + ПИН-код
 */
export function useAdminAuth() {
  const navigate = useNavigate()
  const { cachedAdmins, addAdminToCache } = useAdminLocalStorage()

  // Состояния процесса авторизации
  const [step, setStep] = useState('login') // login, register, pin
  const [selectedAdmin, setSelectedAdmin] = useState(null)
  const [foundAdmin, setFoundAdmin] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', point_id: '' })

  /**
   * Сбросить ошибки
   */
  const clearError = useCallback(() => setError(null), [])

  /**
   * Выбрать админа из кеша для входа по ПИН
   */
  const selectFromCache = useCallback((admin) => {
    setSelectedAdmin(admin)
    setStep('pin')
    setError(null)
  }, [])

  /**
   * Перейти к режиму регистрации
   */
  const goToRegister = useCallback(() => {
    setStep('register')
    setError(null)
    setSelectedAdmin(null)
    setFoundAdmin(null)
    setForm({ email: '', firstName: '', lastName: '', point_id: '' })
  }, [])

  /**
   * Вернуться к входу
   */
  const goToLogin = useCallback(() => {
    setStep('login')
    setError(null)
    setSelectedAdmin(null)
    setFoundAdmin(null)
    setForm({ email: '', firstName: '', lastName: '', point_id: '' })
  }, [])

  /**
   * Поиск админа по email (при входе)
   * Прямой запрос к profiles без использования сервисов
   */
  const findAdmin = useCallback(async (email) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: searchError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, pin, point_id')
        .eq('email', email)
        .eq('role', 'admin')
        .single()

      if (searchError) {
        if (searchError.code === 'PGRST116') {
          // Не найдено
          setError('Администратор с таким email не найден. Вы можете зарегистрироваться.')
        } else {
          setError('Ошибка при поиске администратора')
        }
        setLoading(false)
        return { success: false }
      }

      if (!data) {
        setError('Администратор с таким email не найден. Вы можете зарегистрироваться.')
        setLoading(false)
        return { success: false }
      }

      // Проверяем наличие ПИН-кода
      if (!data.pin) {
        setError('У администратора не установлен ПИН-код. Пожалуйста, зарегистрируйтесь заново.')
        setLoading(false)
        return { success: false }
      }

      setFoundAdmin(data)
      // Добавляем в кеш для быстрого входа в будущем
      addAdminToCache({
        id: data.id,
        full_name: data.full_name,
        email: data.email,
        role: data.role,
        pin: data.pin,
        point_id: data.point_id
      })
      setStep('pin')
      setError(null)
      setLoading(false)
      return { success: true, admin: data }
    } catch (err) {
      setError('Ошибка при поиске администратора')
      setLoading(false)
      return { success: false }
    }
  }, [])

  /**
   * Проверка ПИН-кода админа
   * Максимально простая логика: проверяем ПИН локально из объекта
   */
  const verifyPin = useCallback(async (pin) => {
    setLoading(true)
    setError(null)

    const adminToVerify = selectedAdmin || foundAdmin

    if (!adminToVerify) {
      setError('Администратор не выбран')
      setLoading(false)
      return { success: false }
    }

    // Проверяем, есть ли ПИН в объекте (должен быть из кеша или поиска)
    if (adminToVerify.pin === undefined || adminToVerify.pin === null) {
      setError('Ошибка проверки ПИН. Попробуйте войти через поиск.')
      setLoading(false)
      return { success: false }
    }

    // Сравниваем ПИН локально
    if (adminToVerify.pin !== pin) {
      setError('Неверный ПИН-код')
      setLoading(false)
      return { success: false }
    }

    // Проверяем роль
    if (adminToVerify.role !== 'admin') {
      setError('У вас нет доступа к панели руководителя')
      setLoading(false)
      return { success: false }
    }

    // Успешная авторизация — добавляем в кеш (сохраняем и ПИН для быстрого входа)
    addAdminToCache({
      id: adminToVerify.id,
      full_name: adminToVerify.full_name,
      email: adminToVerify.email,
      role: adminToVerify.role,
      pin: adminToVerify.pin,
      point_id: adminToVerify.point_id
    })

    // Сохраняем в sessionStorage для доступа на странице /admin
    sessionStorage.setItem('adminProfile', JSON.stringify(adminToVerify))

    setLoading(false)
    navigate('/admin')
    return { success: true, admin: adminToVerify }
  }, [selectedAdmin, foundAdmin, addAdminToCache, navigate])

  /**
   * Создать нового админа (регистрация)
   * Прямая вставка в таблицу profiles без использования supabase.auth
   */
  const createAdmin = useCallback(async (pin) => {
    setLoading(true)
    setError(null)

    const { email, firstName, lastName } = form

    if (!email || !firstName.trim()) {
      setError('Заполните обязательные поля (Почта и Имя)')
      setLoading(false)
      return { success: false }
    }

    if (!pin || pin.length < 4) {
      setError('ПИН-код должен содержать минимум 4 цифры')
      setLoading(false)
      return { success: false }
    }

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
      // Прямой INSERT в profiles (без supabase.auth)
      const { data, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: crypto.randomUUID(),
          full_name: fullName,
          email,
          pin,
          point_id: null,
          role: 'admin'
        }])
        .select()

      if (createError) {
        setError(createError.message || 'Ошибка создания администратора')
        setLoading(false)
        return { success: false }
      }

      // Успешная регистрация — сохраняем профиль и редиректим
      const newAdmin = data[0]
      sessionStorage.setItem('adminProfile', JSON.stringify(newAdmin))
      
      // Добавляем в кеш
      addAdminToCache({
        id: newAdmin.id,
        full_name: newAdmin.full_name,
        email: newAdmin.email,
        role: newAdmin.role,
        pin: newAdmin.pin,
        point_id: newAdmin.point_id
      })
      
      setLoading(false)
      navigate('/admin')
      return { success: true }
    } catch (err) {
      setError('Ошибка создания администратора')
      setLoading(false)
      return { success: false }
    }
  }, [form, navigate, addAdminToCache])

  /**
   * Вернуться к выбору роли (главная)
   */
  const goToRoleSelection = useCallback(() => {
    setStep('login')
    setSelectedAdmin(null)
    setFoundAdmin(null)
    setForm({ email: '', firstName: '', lastName: '', point_id: '' })
    setError(null)
    setLoading(false)
    navigate('/')
  }, [navigate])

  /**
   * Сбросить весь процесс
   */
  const reset = useCallback(() => {
    setStep('login')
    setSelectedAdmin(null)
    setFoundAdmin(null)
    setForm({ email: '', firstName: '', lastName: '', point_id: '' })
    setError(null)
    setLoading(false)
  }, [])

  return {
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
    reset,
    clearError,
  }
}
