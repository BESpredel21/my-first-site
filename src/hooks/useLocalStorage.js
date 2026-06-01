import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'pm_employees_cache'
const ADMINS_STORAGE_KEY = 'pm_admins_cache'

/**
 * Хук для работы с кешем авторизованных сотрудников в localStorage
 */
export function useLocalStorage(key = STORAGE_KEY) {
  const [cachedEmployees, setCachedEmployees] = useState([])

  // Чтение из localStorage при монтировании
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        setCachedEmployees(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Ошибка чтения из localStorage:', err)
      setCachedEmployees([])
    }
  }, [key])

  // Сохранение в localStorage
  const saveToStorage = useCallback(
    (employees) => {
      try {
        localStorage.setItem(key, JSON.stringify(employees))
        setCachedEmployees(employees)
      } catch (err) {
        console.error('Ошибка записи в localStorage:', err)
      }
    },
    [key]
  )

  /**
   * Получить всех кешированных сотрудников
   */
  const getCachedEmployees = useCallback(() => {
    return cachedEmployees
  }, [cachedEmployees])

  /**
   * Добавить сотрудника в кеш (если его там ещё нет)
   */
  const addEmployeeToCache = useCallback(
    (employee) => {
      const exists = cachedEmployees.find((e) => e.id === employee.id)
      if (!exists) {
        const updated = [...cachedEmployees, employee]
        saveToStorage(updated)
      }
    },
    [cachedEmployees, saveToStorage]
  )

  /**
   * Удалить сотрудника из кеша
   */
  const removeEmployeeFromCache = useCallback(
    (employeeId) => {
      const updated = cachedEmployees.filter((e) => e.id !== employeeId)
      saveToStorage(updated)
    },
    [cachedEmployees, saveToStorage]
  )

  /**
   * Очистить весь кеш
   */
  const clearCache = useCallback(() => {
    saveToStorage([])
  }, [saveToStorage])

  return {
    cachedEmployees,
    getCachedEmployees,
    addEmployeeToCache,
    removeEmployeeFromCache,
    clearCache,
  }
}

/**
 * Хук для работы с кешем администраторов в localStorage
 */
export function useAdminLocalStorage(key = ADMINS_STORAGE_KEY) {
  const [cachedAdmins, setCachedAdmins] = useState([])

  // Чтение из localStorage при монтировании
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        setCachedAdmins(JSON.parse(stored))
      }
    } catch (err) {
      console.error('Ошибка чтения из localStorage:', err)
      setCachedAdmins([])
    }
  }, [key])

  // Сохранение в localStorage
  const saveToStorage = useCallback(
    (admins) => {
      try {
        localStorage.setItem(key, JSON.stringify(admins))
        setCachedAdmins(admins)
      } catch (err) {
        console.error('Ошибка записи в localStorage:', err)
      }
    },
    [key]
  )

  /**
   * Получить всех кешированных администраторов
   */
  const getCachedAdmins = useCallback(() => {
    return cachedAdmins
  }, [cachedAdmins])

  /**
   * Добавить администратора в кеш или обновить существующего
   */
  const addAdminToCache = useCallback(
    (admin) => {
      const exists = cachedAdmins.find((a) => a.id === admin.id)
      let updated
      if (exists) {
        // Обновляем существующего админа (например, добавляем ПИН)
        updated = cachedAdmins.map((a) => (a.id === admin.id ? { ...a, ...admin } : a))
      } else {
        // Добавляем нового админа
        updated = [...cachedAdmins, admin]
      }
      saveToStorage(updated)
    },
    [cachedAdmins, saveToStorage]
  )

  /**
   * Удалить администратора из кеша
   */
  const removeAdminFromCache = useCallback(
    (adminId) => {
      const updated = cachedAdmins.filter((a) => a.id !== adminId)
      saveToStorage(updated)
    },
    [cachedAdmins, saveToStorage]
  )

  /**
   * Очистить весь кеш администраторов
   */
  const clearAdminCache = useCallback(() => {
    saveToStorage([])
  }, [saveToStorage])

  return {
    cachedAdmins,
    getCachedAdmins,
    addAdminToCache,
    removeAdminFromCache,
    clearAdminCache,
  }
}
