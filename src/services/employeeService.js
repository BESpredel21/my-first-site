import { supabase } from './supabaseClient'

/**
 * Сервисный слой для работы с таблицей profiles в Supabase
 */

/**
 * Найти сотрудника по номеру телефона и ID пункта
 */
export async function findEmployeeByPhoneAndPoint(phone, pointId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .eq('point_id', pointId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Не найдено
        return { data: null, error: null }
      }
      throw error
    }

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка поиска сотрудника:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Найти сотрудника по ID
 */
export async function findEmployeeById(id) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка получения профиля:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Проверить ПИН-код сотрудника
 */
export async function verifyEmployeePin(profileId, pin) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, point_id, pin, role')
      .eq('id', profileId)
      .eq('pin', pin)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null, valid: false }
      }
      throw error
    }

    return { data, error: null, valid: true }
  } catch (err) {
    console.error('Ошибка проверки ПИН-кода:', err)
    return { data: null, error: err.message, valid: false }
  }
}

/**
 * Сохранить ПИН-код для сотрудника
 */
export async function updateEmployeePin(profileId, pin) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ pin })
      .eq('id', profileId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка сохранения ПИН-кода:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Генерировать уникальный short_id из 6-8 случайных цифр
 */
export function generateShortId() {
  const length = Math.floor(Math.random() * 3) + 6 // 6, 7 или 8
  const digits = '0123456789'
  let result
  let exists = true
  while (exists) {
    result = ''
    for (let i = 0; i < length; i++) {
      result += digits.charAt(Math.floor(Math.random() * digits.length))
    }
    // Проверяем, не занят ли уже
    exists = false // будет проверено при использовании
  }
  return result
}

/**
 * Проверить, зарегистрирован ли уже номер телефона
 */
export async function checkPhoneExists(phone) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, phone')
      .eq('phone', phone)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Не найдено — телефон свободен
        return { exists: false, error: null }
      }
      throw error
    }

    // Найден — телефон занят
    return { exists: true, error: null }
  } catch (err) {
    console.error('Ошибка проверки номера телефона:', err)
    return { exists: false, error: err.message }
  }
}

/**
 * Создать нового сотрудника с именем, телефоном, ПИН-кодом и short_id
 */
export async function createEmployeeWithPin(name, phone, pin) {
  try {
    let shortId = generateShortId()

    // Повторяем генерацию, пока не найдём уникальный short_id
    let existingShortId
    let attempts = 0
    do {
      shortId = generateShortId()
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('short_id', shortId)
        .maybeSingle()
      existingShortId = existing
      attempts++
    } while (existingShortId && attempts < 10)

    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: crypto.randomUUID(),
        full_name: name,
        phone,
        pin,
        role: 'staff',
        short_id: shortId,
        point_id: null
      }])
      .select()
      .single()

    if (error) throw error

    return { data: data?.[0], error: null, shortId }
  } catch (err) {
    console.error('Ошибка создания сотрудника:', err)
    return { data: null, error: err.message, shortId: null }
  }
}

/**
 * Создать нового сотрудника с short_id (если его нет в базе)
 */
export async function createEmployee(employeeData) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([employeeData])
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка создания сотрудника:', err)
    return { data: null, error: err.message }
  }
}

/**
 * Создать нового сотрудника с генерацией short_id
 */
export async function createEmployeeWithShortId(phone) {
  try {
    const shortId = generateShortId()
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: crypto.randomUUID(),
        phone,
        short_id: shortId,
        role: 'employee',
        full_name: `Сотрудник (${phone})`,
        point_id: null,
        pin: null
      }])
      .select()
      .single()

    if (error) throw error

    return { data: data?.[0], error: null, shortId }
  } catch (err) {
    console.error('Ошибка создания сотрудника:', err)
    return { data: null, error: err.message, shortId: null }
  }
}
