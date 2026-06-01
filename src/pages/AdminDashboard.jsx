import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getManagerPoints, addManagerPoint, removeManagerPoint } from '../services/pointService'
import { findProfileById } from '../services/authService'
import { addStaffToPoint, getStaffByPointWithPoints, removeStaffToPoint } from '../services/staffService'
import { getPointSettings, updatePointSettings } from '../services/pointService'
import AdminPanel from '../components/admin/AdminPanel'
import AdminTabs from '../components/admin/AdminTabs'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [currentAdmin, setCurrentAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [points, setPoints] = useState([])
  const [newPointId, setNewPointId] = useState('')
  const [pointsLoading, setPointsLoading] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [activePointId, setActivePointId] = useState('')

  const [staffIdInput, setStaffIdInput] = useState('')
  const [staffSuccess, setStaffSuccess] = useState('')
  const [staffError, setStaffError] = useState('')
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffList, setStaffList] = useState([])
  const [staffLoadingList, setStaffLoadingList] = useState(false)

  const [pointSettings, setPointSettings] = useState({ work_start_time: '08:00', work_end_time: '21:00', shift_rate: 2000 })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settingsSuccess, setSettingsSuccess] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('adminProfile')
    if (stored) {
      try {
        const admin = JSON.parse(stored)
        setCurrentAdmin(admin)
      } catch (err) {
        console.error('Ошибка парсинга данных администратора:', err)
        sessionStorage.removeItem('adminProfile')
        navigate('/login/manager')
      }
    } else {
      navigate('/login/manager')
    }
    setLoading(false)
  }, [navigate])

  const loadPoints = useCallback(async () => {
    if (!currentAdmin?.id) return
    setPointsLoading(true)
    setActionError('')
    setActionSuccess('')
    const { data, error } = await getManagerPoints(currentAdmin.id)
    setPointsLoading(false)
    if (error) {
      setActionError(error)
    } else {
      sessionStorage.setItem('cachedManagerPoints', JSON.stringify(data || []))
      setPoints(data || [])
    }
  }, [currentAdmin])

  useEffect(() => {
    if (currentAdmin?.id) {
      const cachedPoints = sessionStorage.getItem('cachedManagerPoints')
      if (cachedPoints) {
        try {
          const parsed = JSON.parse(cachedPoints)
          setPoints(parsed)
        } catch (e) {
          console.error('Ошибка парсинга кеша точек:', e)
        }
      }
      loadPoints()
    }
  }, [currentAdmin, loadPoints])

  // Предзагрузка данных для первого ПВЗ при загрузке страницы
  useEffect(() => {
    if (points.length > 0 && !activePointId) {
      const firstPoint = points[0]
      setActivePointId(firstPoint)
      sessionStorage.setItem('activePointId', firstPoint)

      // Предварительно загружаем список сотрудников из кеша
      const cachedStaff = sessionStorage.getItem(`staffList_${firstPoint}`)
      if (cachedStaff) {
        try {
          setStaffList(JSON.parse(cachedStaff))
        } catch (e) {}
      }

      // Предварительно загружаем настройки ПВЗ из кеша
      const cachedSettings = sessionStorage.getItem(`pointSettings_${firstPoint}`)
      if (cachedSettings) {
        try {
          setPointSettings(JSON.parse(cachedSettings))
        } catch (e) {}
      }
    }
  }, [points, activePointId])

  const handlePointChange = (e) => {
    const selectedPointId = e.target.value
    setActivePointId(selectedPointId)
    sessionStorage.setItem('activePointId', selectedPointId)
  }

  const handleAddPoint = async (e) => {
    e.preventDefault()
    setActionError('')
    setActionSuccess('')
    if (!newPointId || newPointId.trim().length < 2) {
      setActionError('Введите название пункта (минимум 2 символа)')
      return
    }
    setPointsLoading(true)
    const { error } = await addManagerPoint(currentAdmin.id, newPointId.trim())
    setPointsLoading(false)
    if (error) {
      setActionError(error)
    } else {
      setActionSuccess(`ПВЗ "${newPointId.trim()}" успешно добавлен`)
      setNewPointId('')
      await loadPoints()
    }
  }

  const handleRemovePoint = async (pointId) => {
    setActionError('')
    setPointsLoading(true)
    const { error } = await removeManagerPoint(currentAdmin.id, pointId)
    setPointsLoading(false)
    if (error) {
      setActionError(error)
    } else {
      setActionSuccess(`ПВЗ №${pointId} успешно удален`)
      await loadPoints()
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminProfile')
    navigate('/')
  }

  const loadPointSettings = useCallback(async (pointId) => {
    if (!pointId) return
    setSettingsLoading(true)
    setSettingsError('')
    const { data, error } = await getPointSettings(pointId)
    setSettingsLoading(false)
    if (!error && data) {
      const settings = {
        work_start_time: data.work_start_time?.slice(0, 5) || '08:00',
        work_end_time: data.work_end_time?.slice(0, 5) || '21:00',
        shift_rate: data.shift_rate ?? 2000
      }
      setPointSettings(settings)
      sessionStorage.setItem(`pointSettings_${pointId}`, JSON.stringify(settings))
    } else {
      setPointSettings({ work_start_time: '08:00', work_end_time: '21:00', shift_rate: 2000 })
    }
  }, [])

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    if (!activePointId) return
    setSettingsError('')
    setSettingsSuccess('')
    setSettingsSaving(true)
    const { error } = await updatePointSettings(activePointId, {
      work_start_time: pointSettings.work_start_time,
      work_end_time: pointSettings.work_end_time,
      shift_rate: pointSettings.shift_rate
    })
    setSettingsSaving(false)
    if (error) {
      setSettingsError('Ошибка при сохранении настроек')
    } else {
      setSettingsSuccess('Настройки сохранены')
      setTimeout(() => setSettingsSuccess(''), 3000)
    }
  }

  const loadStaffList = useCallback(async (pointId) => {
    if (!pointId) return
    setStaffLoadingList(true)
    const { data, error } = await getStaffByPointWithPoints(pointId)
    setStaffLoadingList(false)
    if (!error) {
      setStaffList(data || [])
      sessionStorage.setItem(`staffList_${pointId}`, JSON.stringify(data || []))
    }
  }, [])

  const handleAttachStaffToPoint = async (e) => {
    e.preventDefault()
    setStaffError('')
    setStaffSuccess('')
    const staffId = staffIdInput.trim()
    if (!staffId) { setStaffError('Введите ID сотрудника'); return }
    const pointId = sessionStorage.getItem('activePointId')
    if (!pointId) { setStaffError('Сначала выберите пункт ПВЗ'); return }
    setStaffLoading(true)
    const { data: profile, error: findError } = await findProfileById(staffId)
    if (findError || !profile) {
      setStaffError('Сотрудник с таким ID не зарегистрирован')
      setStaffLoading(false)
      return
    }
    const isAlreadyAttached = staffList.some(s => s.id === staffId)
    if (isAlreadyAttached) { setStaffError('Этот сотрудник уже привязан к текущему ПВЗ'); setStaffLoading(false); return }
    const { error: insertError } = await addStaffToPoint(profile.id, pointId)
    setStaffLoading(false)
    if (insertError) {
      setStaffError('Ошибка при привязке сотрудника: ' + insertError)
    } else {
      setStaffSuccess(`Сотрудник ${profile.full_name} успешно привязан к ПВЗ ${pointId}`)
      setStaffIdInput('')
      setTimeout(() => setStaffSuccess(''), 3000)
      await loadStaffList(pointId)
    }
  }

  const handleRemoveStaffMember = async (staffPointId) => {
    const { error } = await removeStaffToPoint(staffPointId)
    if (!error) {
      if (activePointId) await loadStaffList(activePointId)
      else setStaffList(prev => prev.filter(s => s.staff_point_id !== staffPointId))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Загрузка...</p>
        </div>
      </div>
    )
  }

  if (!currentAdmin) return null

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <main className="px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <AdminPanel
            admin={currentAdmin}
            points={points}
            pointsLoading={pointsLoading}
            activePointId={activePointId}
            actionError={actionError}
            actionSuccess={actionSuccess}
            newPointId={newPointId}
            onNewPointIdChange={setNewPointId}
            onPointChange={handlePointChange}
            onAddPoint={handleAddPoint}
            onRemovePoint={handleRemovePoint}
            onLogout={handleLogout}
          />

          <AdminTabs
            activePointId={activePointId}
            staffList={staffList}
            staffLoadingList={staffLoadingList}
            staffIdInput={staffIdInput}
            onStaffIdInputChange={setStaffIdInput}
            staffLoading={staffLoading}
            staffError={staffError}
            staffSuccess={staffSuccess}
            onAttachStaff={handleAttachStaffToPoint}
            onRemoveStaff={handleRemoveStaffMember}
            pointSettings={pointSettings}
            onPointSettingsChange={setPointSettings}
            settingsSaving={settingsSaving}
            settingsError={settingsError}
            settingsSuccess={settingsSuccess}
            onSaveSettings={handleSaveSettings}
            onLoadStaffList={loadStaffList}
            onLoadPointSettings={loadPointSettings}
          />
        </div>
      </main>
    </div>
  )
}