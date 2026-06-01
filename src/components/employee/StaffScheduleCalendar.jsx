import React, { useState, useEffect, useCallback, useMemo, memo } from 'react'
import { supabase } from '../../services/supabaseClient'

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

const DAYS_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const CACHE_PREFIX = 'staffCalendarCache_'

const TIME_OPTIONS = []
for (let h = 8; h <= 22; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []
  const startPadding = (firstDay.getDay() + 6) % 7
  for (let i = 0; i < startPadding; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
  return days
}

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatTime(t) {
  if (!t) return ''
  return t.slice(0, 5)
}

function getCacheKey(pointId, year, month) {
  return `${CACHE_PREFIX}${pointId}_${year}_${month}`
}

let nextTempId = -1
function tempId() { return nextTempId-- }

const StaffScheduleCalendar = memo(function StaffScheduleCalendar({ currentEmployee, resolvedPointId }) {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [allSchedules, setAllSchedules] = useState({})
  const [pendingChanges, setPendingChanges] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modalDay, setModalDay] = useState(null)
  const [modalDate, setModalDate] = useState('')
  const [isFullDay, setIsFullDay] = useState(true)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [modalExisting, setModalExisting] = useState(null)
  const [saving, setSaving] = useState(false)

  const pointId = resolvedPointId || currentEmployee?.point_id

  // Слияние данных из базы и локальных изменений
  const mergedSchedules = useMemo(() => {
    const result = {}
    for (const [dateStr, entries] of Object.entries(allSchedules)) {
      result[dateStr] = [...entries]
    }
    for (const [dateStr, changes] of Object.entries(pendingChanges)) {
      if (!result[dateStr]) result[dateStr] = []
      for (const change of changes) {
        if (change.isDeleting) {
          result[dateStr] = result[dateStr].filter(e => e._tempId !== change._tempId && e.id !== change._tempId)
        } else {
          const existingIdx = result[dateStr].findIndex(e => e._tempId === change._tempId)
          if (existingIdx !== -1) {
            result[dateStr][existingIdx] = { ...change, isEditing: false, isDeleting: false }
          } else {
            result[dateStr].push({ ...change, isEditing: false, isDeleting: false })
          }
        }
      }
      if (result[dateStr].length === 0) delete result[dateStr]
    }
    return result
  }, [allSchedules, pendingChanges])

  // Восстанавливаем кеш при смене ПВЗ или месяца
  useEffect(() => {
    if (!pointId) return
    const cacheKey = getCacheKey(pointId, currentYear, currentMonth)
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        setAllSchedules(parsed)
        setPendingChanges({})
        return
      } catch (e) {
        console.error('Ошибка парсинга кеша календаря:', e)
      }
    }
    setAllSchedules({})
    loadSchedules()
  }, [pointId, currentYear, currentMonth])

  const loadSchedules = useCallback(async () => {
    if (!pointId) return
    setLoading(true)
    setError('')

    const firstDay = formatDate(currentYear, currentMonth, 1)
    const lastDay = formatDate(currentYear, currentMonth, new Date(currentYear, currentMonth + 1, 0).getDate())

    const { data, error: err } = await supabase
      .from('work_schedules')
      .select('id, staff_id, work_date, is_full_day, start_time, end_time, profiles!inner(full_name)')
      .eq('point_id', pointId)
      .gte('work_date', firstDay)
      .lte('work_date', lastDay)

    setLoading(false)

    if (err) {
      setError('Ошибка загрузки графика')
      console.error(err)
      return
    }

    const map = {}
    if (data) {
      data.forEach(row => {
        const d = row.work_date
        if (!map[d]) map[d] = []
        map[d].push({
          id: row.id,
          _tempId: row.id,
          staff_id: row.staff_id,
          full_name: row.profiles?.full_name || 'Сотрудник',
          is_full_day: row.is_full_day,
          start_time: row.start_time,
          end_time: row.end_time
        })
      })
    }
    setAllSchedules(map)
    sessionStorage.setItem(getCacheKey(pointId, currentYear, currentMonth), JSON.stringify(map))
    setPendingChanges({})
  }, [pointId, currentYear, currentMonth])

  // Мемоизация getDayBadgeColor
  const getDayBadgeColor = useCallback((entry) => {
    if (entry.staff_id === currentEmployee?.id) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }, [currentEmployee?.id])

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11) }
    else { setCurrentMonth(m => m - 1) }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0) }
    else { setCurrentMonth(m => m + 1) }
  }

  const openModal = (day) => {
    if (day === null) return
    const dateStr = formatDate(currentYear, currentMonth, day)
    const daySchedules = mergedSchedules[dateStr] || []
    const myRecord = daySchedules.find(s => s.staff_id === currentEmployee?.id)

    setModalDay(day)
    setModalDate(dateStr)
    setModalExisting(myRecord || null)
    setIsFullDay(myRecord ? (myRecord.is_full_day !== false) : true)
    setStartTime(myRecord?.start_time ? formatTime(myRecord.start_time) : '09:00')
    setEndTime(myRecord?.end_time ? formatTime(myRecord.end_time) : '18:00')
    setError('')
  }

  const closeModal = () => {
    setModalDay(null)
    setModalDate('')
    setModalExisting(null)
    setIsFullDay(true)
    setStartTime('09:00')
    setEndTime('18:00')
    setError('')
  }

  const checkOverlap = (daySchedules, myId, start, end) => {
    if (!daySchedules || daySchedules.length === 0) return null
    const myRecordId = modalExisting?.id
    for (const s of daySchedules) {
      if (s.staff_id === myId && (s.id === myRecordId || s._tempId === myRecordId)) continue
      if (s.is_full_day) return s.full_name
      if (s.start_time && s.end_time) {
        const sStart = s.start_time.slice(0, 5)
        const sEnd = s.end_time.slice(0, 5)
        if (start < sEnd && end > sStart) return s.full_name
      }
    }
    return null
  }

  const handleSave = () => {
    if (!pointId || !modalDate || !currentEmployee?.id) return

    const daySchedules = mergedSchedules[modalDate] || []
    let effectiveStart = null
    let effectiveEnd = null

    if (!isFullDay) {
      if (!startTime || !endTime) {
        setError('Укажите время начала и окончания')
        return
      }
      if (startTime >= endTime) {
        setError('Время начала должно быть раньше времени окончания')
        return
      }
      effectiveStart = startTime + ':00'
      effectiveEnd = endTime + ':00'

      const overlap = checkOverlap(daySchedules, currentEmployee.id, startTime, endTime)
      if (overlap) {
        setError(`Это время уже занято коллегой (${overlap})!`)
        return
      }
    } else {
      const overlap = checkOverlap(daySchedules, currentEmployee.id, '00:00', '23:59')
      if (overlap) {
        setError(`Это время уже занято коллегой (${overlap})!`)
        return
      }
    }

    setPendingChanges(prev => {
      const dateChanges = prev[modalDate] ? [...prev[modalDate]] : []
      const existing = dateChanges.find(c => c._tempId === (modalExisting?._tempId || modalExisting?.id))
      if (existing) {
        Object.assign(existing, {
          is_full_day: isFullDay,
          start_time: effectiveStart,
          end_time: effectiveEnd,
          isDeleting: false
        })
      } else {
        dateChanges.push({
          _tempId: modalExisting?.id && !modalExisting._tempId?.toString().startsWith('-')
            ? modalExisting.id
            : tempId(),
          staff_id: currentEmployee.id,
          full_name: currentEmployee.full_name || currentEmployee.name || 'Я',
          is_full_day: isFullDay,
          start_time: effectiveStart,
          end_time: effectiveEnd,
          isEditing: false,
          isDeleting: false
        })
      }
      return { ...prev, [modalDate]: dateChanges }
    })

    closeModal()
  }

  const handleDelete = () => {
    if (!modalExisting) return

    setPendingChanges(prev => {
      const dateChanges = prev[modalDate] ? [...prev[modalDate]] : []
      const existingIdx = dateChanges.findIndex(c =>
        c._tempId === modalExisting._tempId || c._tempId === modalExisting.id
      )
      if (existingIdx !== -1) {
        dateChanges[existingIdx].isDeleting = true
      } else {
        dateChanges.push({
          _tempId: modalExisting.id,
          staff_id: currentEmployee.id,
          full_name: currentEmployee.full_name || 'Я',
          is_full_day: modalExisting.is_full_day,
          start_time: modalExisting.start_time,
          end_time: modalExisting.end_time,
          isEditing: false,
          isDeleting: true
        })
      }
      return { ...prev, [modalDate]: dateChanges }
    })

    closeModal()
  }

  const handleBatchSave = async () => {
    setSaving(true)
    setError('')

    const inserts = []
    const updates = []
    const deletions = []

    for (const [dateStr, changes] of Object.entries(pendingChanges)) {
      for (const change of changes) {
        if (change.isDeleting) {
          if (typeof change._tempId === 'number' && change._tempId > 0) {
            deletions.push(change._tempId)
          }
        } else if (change._tempId < 0 || !change.id) {
          inserts.push({
            staff_id: change.staff_id,
            point_id: pointId,
            work_date: dateStr,
            is_full_day: change.is_full_day,
            start_time: change.start_time,
            end_time: change.end_time
          })
        } else {
          updates.push({
            id: change._tempId > 0 ? change._tempId : change.id,
            staff_id: change.staff_id,
            point_id: pointId,
            work_date: dateStr,
            is_full_day: change.is_full_day,
            start_time: change.start_time,
            end_time: change.end_time
          })
        }
      }
    }

    try {
      if (inserts.length > 0) {
        const { error: insErr } = await supabase
          .from('work_schedules')
          .insert(inserts)
        if (insErr) throw insErr
      }

      if (updates.length > 0) {
        const { error: updErr } = await supabase
          .from('work_schedules')
          .upsert(updates)
        if (updErr) throw updErr
      }

      if (deletions.length > 0) {
        const { error: delErr } = await supabase
          .from('work_schedules')
          .delete()
          .in('id', deletions)
        if (delErr) throw delErr
      }

      setPendingChanges({})
      // Очищаем кеш, чтобы при следующем открытии перезагрузить
      sessionStorage.removeItem(getCacheKey(pointId, currentYear, currentMonth))
      await loadSchedules()
    } catch (err) {
      console.error('Ошибка пакетного сохранения:', err)
      setError('Ошибка при сохранении изменений')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelChanges = () => {
    setPendingChanges({})
    setError('')
  }

  // Подсчёт несохранённых правок
  const pendingCount = useMemo(() => {
    let count = 0
    for (const changes of Object.values(pendingChanges)) {
      count += changes.length
    }
    return count
  }, [pendingChanges])

  const days = getMonthDays(currentYear, currentMonth)
  const monthLabel = `${MONTHS_RU[currentMonth]} ${currentYear}`

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">График работы</h3>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          ←
        </button>
        <span className="text-sm font-semibold text-slate-700">{monthLabel}</span>
        <button
          onClick={handleNextMonth}
          className="px-3 py-1 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-blue-500 rounded-sm inline-block"></span> Моя запись
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-slate-300 rounded-sm inline-block"></span> Коллега
        </span>
        <span className="text-slate-400">(кликните по дню для записи)</span>
      </div>

      {error && !modalDay && (
        <div className="mb-3 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      <div className="grid grid-cols-7 gap-1">
        {DAYS_RU.map((d, i) => (
          <div key={i} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="min-h-[80px]" />
          const dateStr = formatDate(currentYear, currentMonth, day)
          const dayData = mergedSchedules[dateStr] || []
          const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()

          return (
            <button
              key={dateStr}
              onClick={() => openModal(day)}
              className={`min-h-[80px] p-1 rounded-lg text-xs transition-all cursor-pointer flex flex-col items-start gap-0.5 border
                ${isToday ? 'border-blue-400 ring-2 ring-blue-100' : 'border-transparent'}
                ${dayData.length > 0 ? 'bg-blue-50/50' : ''}
                hover:border-blue-300 hover:bg-blue-50
              `}
              title={`${day} ${MONTHS_RU[currentMonth]}`}
            >
              <span className="text-xs font-medium text-slate-700 mb-0.5">{day}</span>
              {dayData.slice(0, 3).map(entry => (
                <span
                  key={entry._tempId || entry.id}
                  className={`inline-block w-full px-1 py-0.5 rounded text-[10px] leading-tight font-medium border ${getDayBadgeColor(entry)}`}
                >
                  <span className="truncate block">
                    {entry.full_name?.split(' ')[0] || 'Я'}
                    {': '}
                    {entry.is_full_day ? 'Полный день' : `${formatTime(entry.start_time)}-${formatTime(entry.end_time)}`}
                  </span>
                </span>
              ))}
              {dayData.length > 3 && (
                <span className="text-[10px] text-slate-400 pl-1">+{dayData.length - 3}...</span>
              )}
            </button>
          )
        })}
      </div>

      {pendingCount > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800 font-medium mb-3">
            ⏳ Несохраненных правок: {pendingCount}
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleBatchSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {saving && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              {saving ? 'Сохранение...' : '💾 Сохранить изменения графика'}
            </button>
            <button
              onClick={handleCancelChanges}
              disabled={saving}
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 text-slate-700 font-medium rounded-xl transition-colors"
            >
              Отменить правки
            </button>
          </div>
        </div>
      )}

      {modalDay !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 z-10">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {modalDay} {MONTHS_RU[currentMonth]} {currentYear}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {modalExisting ? 'Редактирование записи' : 'Новая запись'}
            </p>

            <label className="flex items-center gap-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={isFullDay}
                onChange={(e) => setIsFullDay(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm font-medium text-slate-700">Полный день</span>
            </label>

            {!isFullDay && (
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Время начала</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Время окончания</label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIME_OPTIONS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
              >
                {modalExisting ? 'Сохранить' : 'Записаться'}
              </button>

              {modalExisting && (
                <button
                  onClick={handleDelete}
                  className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-xl transition-colors"
                >
                  Удалить
                </button>
              )}

              <button
                onClick={closeModal}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default StaffScheduleCalendar