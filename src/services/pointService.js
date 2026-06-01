import { supabase } from './supabaseClient'

/**
 * Сервис для работы с ПВЗ (пунктами выдачи)
 */

export async function getManagerPoints(managerId) {
  try {
    const { data, error } = await supabase
      .from('manager_points')
      .select('point_id')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return { data: data?.map(d => d.point_id) || [], error: null }
  } catch (err) {
    console.error('Ошибка получения пунктов ПВЗ:', err)
    return { data: [], error: err.message }
  }
}

export async function addManagerPoint(managerId, pointId) {
  try {
    const { data, error } = await supabase
      .from('manager_points')
      .insert([{ manager_id: managerId, point_id: pointId }])
      .select('manager_id, point_id')
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Ошибка добавления пункта ПВЗ:', err)
    return { data: null, error: err.message }
  }
}

export async function removeManagerPoint(managerId, pointId) {
  try {
    const { error } = await supabase
      .from('manager_points')
      .delete()
      .eq('manager_id', managerId)
      .eq('point_id', pointId)

    if (error) throw error
    return { data: null, error: null }
  } catch (err) {
    console.error('Ошибка удаления пункта ПВЗ:', err)
    return { data: null, error: err.message }
  }
}

export async function getPointSettings(pointId) {
  try {
    const { data, error } = await supabase
      .from('manager_points')
      .select('work_start_time, work_end_time, shift_rate')
      .eq('point_id', pointId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { data: null, error: null }
      }
      throw error
    }

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка получения настроек ПВЗ:', err)
    return { data: null, error: err.message }
  }
}

export async function updatePointSettings(pointId, settings) {
  try {
    const { data, error } = await supabase
      .from('manager_points')
      .update({
        work_start_time: settings.work_start_time,
        work_end_time: settings.work_end_time,
        shift_rate: settings.shift_rate
      })
      .eq('point_id', pointId)
      .select('work_start_time, work_end_time, shift_rate')
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (err) {
    console.error('Ошибка обновления настроек ПВЗ:', err)
    return { data: null, error: err.message }
  }
}