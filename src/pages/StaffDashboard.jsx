import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabaseClient'
import { formatPhone } from '../utils/formatPhone'
import StaffScheduleCalendar from '../components/employee/StaffScheduleCalendar'
import EmployeeSalaryView from '../components/employee/EmployeeSalaryView'

export default function StaffDashboard() {
  const navigate = useNavigate()
  const [currentEmployee, setCurrentEmployee] = useState(null)
  const [loading, setLoading] = useState(true)
  // const [announcements, setAnnouncements] = useState([])
  // const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [resolvedPointId, setResolvedPointId] = useState(null)
  const [staffPoints, setStaffPoints] = useState([])
  const [selectedPointId, setSelectedPointId] = useState(null)
  const [activeSection, setActiveSection] = useState(null) // 'schedule' | 'salary' | null

  // // Состояния модального окна списания МЦ — ОТКЛЮЧЕНО (см. BUG_TRACKER.md)
  // const [isModalOpen, setIsModalOpen] = useState(false)
  // const [materials, setMaterials] = useState({ bags: '', tape: '', paper: '' })
  // const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('pm_current_employee')
    if (stored) {
      try {
        const employee = JSON.parse(stored)
        setCurrentEmployee(employee)
      } catch (err) {
        console.error('Ошибка парсинга данных сотрудника:', err)
        sessionStorage.removeItem('pm_current_employee')
        navigate('/login/employee')
      }
    } else {
      navigate('/login/employee')
    }
    setLoading(false)
  }, [navigate])

  // Загружаем все ПВЗ сотрудника (из profiles.point_id и/или staff_points)
  useEffect(() => {
    if (!currentEmployee?.id) return

    const loadPoints = async () => {
      // Сначала проверяем кеш
      const cached = sessionStorage.getItem(`staffPoints_${currentEmployee.id}`)
      if (cached) {
        try {
          const { points, targetPoint } = JSON.parse(cached)
          setStaffPoints(points)
          setSelectedPointId(targetPoint)
          setResolvedPointId(targetPoint)
          return
        } catch (e) {
          console.error('Ошибка парсинга кеша ПВЗ:', e)
        }
      }

      const points = []

      // ПВЗ из профиля (если есть)
      if (currentEmployee.point_id) {
        points.push(currentEmployee.point_id)
      }

      // ПВЗ из staff_points
      const { data, error } = await supabase
        .from('staff_points')
        .select('point_id')
        .eq('staff_id', currentEmployee.id)

      if (!error && data) {
        data.forEach(sp => {
          if (!points.includes(sp.point_id)) {
            points.push(sp.point_id)
          }
        })
      }

      if (points.length > 0) {
        setStaffPoints(points)
        const firstPoint = points[0]

        // Пытаемся найти точку из профиля или первую
        const targetPoint = currentEmployee.point_id || firstPoint
        setSelectedPointId(targetPoint)
        setResolvedPointId(targetPoint)

        // Сохраняем в кеш
        sessionStorage.setItem(`staffPoints_${currentEmployee.id}`, JSON.stringify({ points, targetPoint }))
      }
    }

    loadPoints()
  }, [currentEmployee])

  // При смене выбранного ПВЗ обновляем resolvedPointId
  useEffect(() => {
    if (selectedPointId) {
      setResolvedPointId(selectedPointId)
    }
  }, [selectedPointId])

  const handlePointChange = (e) => {
    setSelectedPointId(e.target.value)
  }

  // const loadAnnouncement = async (pointId) => {
  //   if (!pointId) return

  //   setAnnouncementsLoading(true)
  //   const { data, error } = await supabase
  //     .from('announcements')
  //     .select('id, text, created_at')
  //     .eq('point_id', pointId)
  //     .order('created_at', { ascending: false })
  //     .limit(1)
  //   setAnnouncementsLoading(false)

  //   if (!error) {
  //     setAnnouncements(data || [])
  //   }
  // }

  const handleLogout = () => {
    sessionStorage.removeItem('pm_current_employee')
    navigate('/')
  }

  // // Отключено: модалка списания МЦ (см. BUG_TRACKER.md)
  // const openModal = () => {
  //   setMaterials({ bags: '', tape: '', paper: '' })
  //   setIsModalOpen(true)
  // }

  // const closeModal = () => {
  //   setIsModalOpen(false)
  //   setMaterials({ bags: '', tape: '', paper: '' })
  // }

  // const handleMaterialChange = (field, value) => {
  //   const num = parseInt(value, 10)
  //   if (value !== '' && (isNaN(num) || num < 0)) return
  //   setMaterials(prev => ({ ...prev, [field]: value === '' ? '' : num }))
  // }

  // const handleSubmitWriteOff = async () => {
  //   const pointId = resolvedPointId || currentEmployee?.point_id
  //   if (!pointId) return

  //   const bags = parseInt(materials.bags, 10) || 0
  //   const tape = parseInt(materials.tape, 10) || 0
  //   const paper = parseInt(materials.paper, 10) || 0

  //   if (bags === 0 && tape === 0 && paper === 0) return

  //   setSubmitting(true)

  //   try {
  //     const { data: stock, error: fetchError } = await supabase
  //       .from('warehouse_stock')
  //       .select('*')
  //       .eq('point_id', pointId)
  //       .maybeSingle()

  //     if (fetchError) {
  //       console.error('Ошибка получения остатков:', fetchError)
  //       alert('Ошибка при списании. Попробуйте снова.')
  //       setSubmitting(false)
  //       return
  //     }

  //     if (!stock) {
  //       const { error: insertError } = await supabase
  //         .from('warehouse_stock')
  //         .insert({
  //           point_id: pointId,
  //           tape_count: 0,
  //           paper_count: 0,
  //           bag_count: 0
  //         })

  //       if (insertError) {
  //         console.error('Ошибка создания записи остатков:', insertError)
  //         alert('Ошибка при списании. Попробуйте снова.')
  //         setSubmitting(false)
  //         return
  //       }
  //     }

  //     const current = stock || { bag_count: 0, tape_count: 0, paper_count: 0 }
  //     const newBagCount = Math.max(0, (current.bag_count || 0) - bags)
  //     const newTapeCount = Math.max(0, (current.tape_count || 0) - tape)
  //     const newPaperCount = Math.max(0, (current.paper_count || 0) - paper)

  //     const { error: updateError } = await supabase
  //       .from('warehouse_stock')
  //       .update({
  //         bag_count: newBagCount,
  //         tape_count: newTapeCount,
  //         paper_count: newPaperCount
  //       })
  //       .eq('point_id', pointId)

  //     if (updateError) {
  //       console.error('Ошибка обновления остатков:', updateError)
  //       alert('Ошибка при списании. Попробуйте снова.')
  //       setSubmitting(false)
  //       return
  //     }

  //     alert('Списание выполнено успешно!')
  //     closeModal()
  //   } catch (err) {
  //     console.error('Ошибка списания:', err)
  //     alert('Ошибка при списании. Попробуйте снова.')
  //   } finally {
  //     setSubmitting(false)
  //   }
  // }

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

  if (!currentEmployee) {
    return null
  }

  const pointName = resolvedPointId || currentEmployee?.point_id || 'Не указан'

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      {/* Header Section — единая карточка */}
      <header className="px-4 pt-6">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm p-6">
          {/* Верхняя строка: логотип + кнопка выхода */}
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Панель сотрудника</h1>
              <p className="text-sm text-slate-500">PointMaster 2.0</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>

          {/* Приветствие и данные сотрудника */}
          <div className="mt-5">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              Добро пожаловать, {currentEmployee.full_name && currentEmployee.full_name.trim() ? currentEmployee.full_name : ''}!
            </h2>
            <div className="flex flex-wrap gap-6 text-sm text-slate-600 mt-4">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {formatPhone(currentEmployee.phone)}
              </span>
              {staffPoints.length > 1 ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <select
                    value={selectedPointId || ''}
                    onChange={handlePointChange}
                    className="text-sm text-slate-600 bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    {staffPoints.map(pId => (
                      <option key={pId} value={pId}>Пункт: {pId}</option>
                    ))}
                  </select>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Пункт: {pointName}
                </span>
              )}
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                Личный ID: {currentEmployee.short_id || '—'}
              </span>
            </div>
          </div>

          {/* Блок объявлений — отключён (см. BUG_TRACKER.md) */}
          {/* <div className="mt-5">
            {!announcementsLoading && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">🔔</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Важное объявление от руководства</h4>
                    {announcements.length > 0 ? (
                      <>
                        <p className="text-sm text-blue-900">{announcements[0].text}</p>
                        <p className="text-xs text-blue-600 mt-2">
                          {new Date(announcements[0].created_at).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-blue-700">🔔 Важных объявлений от руководства пока нет</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div> */}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-4">

          {/* Сетка кнопок */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Кнопка График работы */}
            <button
              onClick={() => setActiveSection(activeSection === 'schedule' ? null : 'schedule')}
              className={`bg-white rounded-2xl shadow-sm p-6 text-left transition-all hover:shadow-md ${
                activeSection === 'schedule' ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-7 h-7 text-white" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">График работы</h3>
                  <p className="text-sm text-slate-500">Управление сменами и расписанием</p>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-400 mt-2 transition-transform duration-200 ${
                    activeSection === 'schedule' ? 'rotate-180' : ''
                  }`}
                  width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Кнопка Мои начисления */}
            <button
              onClick={() => setActiveSection(activeSection === 'salary' ? null : 'salary')}
              className={`bg-white rounded-2xl shadow-sm p-6 text-left transition-all hover:shadow-md ${
                activeSection === 'salary' ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                  <svg className="w-7 h-7 text-white" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">Мои начисления</h3>
                  <p className="text-sm text-slate-500">Расчёт зарплаты и выплаты</p>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-400 mt-2 transition-transform duration-200 ${
                    activeSection === 'salary' ? 'rotate-180' : ''
                  }`}
                  width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
          </div>

          {/* Раскрывающиеся блоки */}
          {activeSection === 'schedule' && (
            <StaffScheduleCalendar
              currentEmployee={currentEmployee}
              resolvedPointId={resolvedPointId}
            />
          )}

          {activeSection === 'salary' && (
            <EmployeeSalaryView
              currentEmployee={currentEmployee}
              pointId={resolvedPointId || currentEmployee?.point_id}
            />
          )}

        </div>
      </main>

      {/* Модальное окно списания МЦ — ОТКЛЮЧЕНО (см. BUG_TRACKER.md)
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeModal}
          ></div>

          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10">
            <h2 className="text-xl font-bold text-slate-900 mb-6">
              Списание материалов (ПВЗ {pointName})
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Потрачено пакетов (шт)
                </label>
                <input
                  type="number"
                  min="0"
                  value={materials.bags}
                  onChange={e => handleMaterialChange('bags', e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Потрачено скотча (шт)
                </label>
                <input
                  type="number"
                  min="0"
                  value={materials.tape}
                  onChange={e => handleMaterialChange('tape', e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Потрачено бумаги (рулоны)
                </label>
                <input
                  type="number"
                  min="0"
                  value={materials.paper}
                  onChange={e => handleMaterialChange('paper', e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={handleSubmitWriteOff}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {submitting && (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                {submitting ? 'Списание...' : 'Подтвердить списание'}
              </button>
              <button
                onClick={closeModal}
                disabled={submitting}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
      */}
    </div>
  )
}