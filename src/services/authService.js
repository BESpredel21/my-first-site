import { supabase } from './supabaseClient'

/**
 * Сервис для работы с аутентификацией и профилями
 */

export async function findAdminByEmail(email) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, pin, point_id')
      .eq('email', email)
      .eq('role', 'admin')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      throw error
    }

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка поиска администратора:', err)
    return { data: null, error: err.message }
  }
}

export async function findAdminById(id) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, pin, point_id')
      .eq('id', id)
      .eq('role', 'admin')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка получения профиля администратора:', err)
    return { data: null, error: err.message }
  }
}

export async function verifyAdminPin(profileId, pin) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, pin, point_id')
      .eq('id', profileId)
      .eq('pin', pin)
      .eq('role', 'admin')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null, valid: false }
      }
      throw error
    }

    return { data, error: null, valid: true }
  } catch (err) {
    console.error('Ошибка проверки ПИН-кода администратора:', err)
    return { data: null, error: err.message, valid: false }
  }
}

export async function updateAdminPin(profileId, pin) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ pin })
      .eq('id', profileId)
      .eq('role', 'admin')
      .select('id, full_name, email, role, pin, point_id')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка сохранения ПИН-кода администратора:', err)
    return { data: null, error: err.message }
  }
}

export async function createAdminDirect({ full_name, email, pin, point_id }) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: crypto.randomUUID(),
        full_name,
        email,
        pin,
        point_id,
        role: 'admin'
      }])
      .select('id, full_name, email, role, point_id')

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка создания администратора:', err)
    return { data: null, error: err.message }
  }
}

export async function findProfileById(shortId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, pin, role, short_id')
      .eq('short_id', shortId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      throw error
    }

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка поиска профиля по short_id:', err)
    return { data: null, error: err.message }
  }
}