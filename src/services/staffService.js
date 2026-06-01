import { supabase } from './supabaseClient'

/**
 * Сервис для работы с сотрудниками
 */

export async function addStaffMember({ full_name, phone, pin, point_id }) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert([{
        id: crypto.randomUUID(),
        full_name,
        phone,
        pin,
        point_id,
        role: 'staff'
      }])
      .select('id, full_name, phone, role, point_id')

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка добавления сотрудника:', err)
    return { data: null, error: err.message }
  }
}

export async function getStaffByPoint(pointId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, pin, role, point_id')
      .eq('point_id', pointId)
      .eq('role', 'staff')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { data: data || [], error: null }
  } catch (err) {
    console.error('Ошибка получения сотрудников:', err)
    return { data: [], error: err.message }
  }
}

export async function removeStaffMember(staffId) {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', staffId)
      .eq('role', 'staff')

    if (error) throw error

    return { data: null, error: null }
  } catch (err) {
    console.error('Ошибка удаления сотрудника:', err)
    return { data: null, error: err.message }
  }
}

export async function addStaffToPoint(staffId, pointId) {
  try {
    const { data, error } = await supabase
      .from('staff_points')
      .insert([{
        id: crypto.randomUUID(),
        staff_id: staffId,
        point_id: pointId
      }])
      .select('id, staff_id, point_id')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка привязки сотрудника к ПВЗ:', err)
    return { data: null, error: err.message }
  }
}

export async function getStaffByPointWithPoints(pointId) {
  try {
    const { data, error } = await supabase
      .from('staff_points')
      .select(`
        id,
        staff_id,
        point_id,
        created_at,
        profiles:staff_id (
          id,
          full_name,
          phone,
          pin,
          role
        )
      `)
      .eq('point_id', pointId)

    if (error) throw error

    const result = (data || []).map(sp => ({
      id: sp.staff_id,
      staff_point_id: sp.id,
      full_name: sp.profiles?.full_name,
      phone: sp.profiles?.phone,
      pin: sp.profiles?.pin,
      role: sp.profiles?.role,
      point_id: sp.point_id,
      created_at: sp.created_at
    }))

    return { data: result, error: null }
  } catch (err) {
    console.error('Ошибка получения сотрудников через staff_points:', err)
    return { data: [], error: err.message }
  }
}

export async function removeStaffToPoint(staffPointId) {
  try {
    const { error } = await supabase
      .from('staff_points')
      .delete()
      .eq('id', staffPointId)

    if (error) throw error

    return { data: null, error: null }
  } catch (err) {
    console.error('Ошибка отвязки сотрудника от ПВЗ:', err)
    return { data: null, error: err.message }
  }
}