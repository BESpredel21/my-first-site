import React, { useState, useEffect, useCallback, useRef } from 'react'
import AdminStaffAttach from './AdminStaffAttach'
import AdminScheduleCalendar from './AdminScheduleCalendar'
import SalaryCalculator from './SalaryCalculator'
import {
  getSalaryPeriods,
  generateSalaryPeriods,
  createSalaryPeriod,
  deleteSalaryPeriod,
  deleteSalaryPeriods
} from '../../services/salaryService'

const TABS = [
  { id: 'staff', label: 'Сотрудники пункта', icon: '👥' },
  { id: 'schedule', label: 'График', icon: '📅' },
  { id: 'settings', label: 'Настройки ПВЗ', icon: '⚙️' },
  { id: 'salary', label: 'Расчёт зарплаты', icon: '💰' }
]

export default function AdminTabs({
  activePointId,
  staffList,
  staffLoadingList,
  staffIdInput,
  onStaffIdInputChange,
  staffLoading,
  staffError,
  staffSuccess,
  onAttachStaff,
  onRemoveStaff,
  pointSettings,
  onPointSettingsChange,
  settingsSaving,
  settingsError,
  settingsSuccess,
  onSaveSettings,
  onLoadStaffList,
  onLoadPointSettings
}) {
  const [activeTab, setActiveTab] = useState(null)
  const [tabStatus, setTabStatus] = useState({}) // { tabId: 'idle' | 'loading' | 'loaded' }
  const loadingRef = useRef(false)
  const queueRef = useRef([])
  const activeTabRef = useRef(null)

  // Состояние для периодов ЗП
  const [salaryPeriods, setSalaryPeriods] = useState([])
  const [salaryPeriodsLoading, setSalaryPeriodsLoading] = useState(false)
  const [salaryPeriodsError, setSalaryPeriodsError] = useState('')
  const [salaryPeriodsSuccess, setSalaryPeriodsSuccess] = useState('')
  const [genConfig, setGenConfig] = useState({ weekday: 2, interval: 2, start_date: '' })
  const [genLoading, setGenLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPeriodData, setNewPeriodData] = useState({
    period_name: '',
    start_date: '',
    end_date: '',
    payment_date: ''
  })
  const [createPeriodLoading, setCreatePeriodLoading] = useState(false)
  const [selectedPeriodIds, setSelectedPeriodIds] = useState([])

  // Загрузка периодов ЗП
  const loadSalaryPeriods = useCallback(async () => {
    if (!activePointId) return
    setSalaryPeriodsLoading(true)
    setSalaryPeriodsError('')
    const { data, error } = await getSalaryPeriods(activePointId)
    setSalaryPeriodsLoading(false)
    if (error) {
      setSalaryPeriodsError(error)
    } else {
      setSalaryPeriods(data || [])
    }
  }, [activePointId])

  // Загружаем периоды при смене ПВЗ
  useEffect(() => {
    if (activePointId) {
      loadSalaryPeriods()
    }
  }, [activePointId, loadSalaryPeriods])

  // Генерация периодов
  const handleGeneratePeriods = async () => {
    if (!activePointId) return
    setGenLoading(true)
    setSalaryPeriodsError('')
    setSalaryPeriodsSuccess('')
    const { error } = await generateSalaryPeriods(activePointId, genConfig)
    setGenLoading(false)
    if (error) {
      setSalaryPeriodsError(error)
    } else {
      setSalaryPeriodsSuccess('Периоды успешно сгенерированы')
      setTimeout(() => setSalaryPeriodsSuccess(''), 3000)
      await loadSalaryPeriods()
    }
  }

  // Создание периода вручную
  const handleCreatePeriod = async (e) => {
    e.preventDefault()
    if (!activePointId) return
    setCreatePeriodLoading(true)
    setSalaryPeriodsError('')
    setSalaryPeriodsSuccess('')
    const { error } = await createSalaryPeriod({
      point_id: activePointId,
      period_name: newPeriodData.period_name,
      start_date: newPeriodData.start_date,
      end_date: newPeriodData.end_date,
      payment_date: newPeriodData.payment_date || null
    })
    setCreatePeriodLoading(false)
    if (error) {
      setSalaryPeriodsError(error)
    } else {
      setSalaryPeriodsSuccess('Период успешно создан')
      setTimeout(() => setSalaryPeriodsSuccess(''), 3000)
      setShowCreateForm(false)
      setNewPeriodData({ period_name: '', start_date: '', end_date: '', payment_date: '' })
      await loadSalaryPeriods()
    }
  }

  // Удаление периода
  const handleDeletePeriod = async (periodId) => {
    if (!window.confirm('Удалить этот период? Все связанные премии и удержания также будут удалены.')) return
    setSalaryPeriodsError('')
    setSalaryPeriodsSuccess('')
    const { error } = await deleteSalaryPeriod(periodId)
    if (error) {
      setSalaryPeriodsError(error)
    } else {
      setSalaryPeriodsSuccess('Период удалён')
      setTimeout(() => setSalaryPeriodsSuccess(''), 3000)
      setSelectedPeriodIds(prev => prev.filter(id => id !== periodId))
      await loadSalaryPeriods()
    }
  }

  // Массовое удаление выбранных периодов
  const handleDeleteSelected = async () => {
    if (selectedPeriodIds.length === 0) return
    if (!window.confirm(`Удалить ${selectedPeriodIds.length} выбранных периодов? Все связанные премии и удержания также будут удалены.`)) return
    setSalaryPeriodsError('')
    setSalaryPeriodsSuccess('')
    const { error } = await deleteSalaryPeriods(selectedPeriodIds)
    if (error) {
      setSalaryPeriodsError(error)
    } else {
      setSalaryPeriodsSuccess(`Удалено ${selectedPeriodIds.length} периодов`)
      setTimeout(() => setSalaryPeriodsSuccess(''), 3000)
      setSelectedPeriodIds([])
      await loadSalaryPeriods()
    }
  }

  // Удалить все периоды
  const handleDeleteAll = async () => {
    if (salaryPeriods.length === 0) return
    if (!window.confirm(`Удалить ВСЕ ${salaryPeriods.length} периодов? Это действие нельзя отменить.`)) return
    setSalaryPeriodsError('')
    setSalaryPeriodsSuccess('')
    const allIds = salaryPeriods.map(p => p.id)
    const { error } = await deleteSalaryPeriods(allIds)
    if (error) {
      setSalaryPeriodsError(error)
    } else {
      setSalaryPeriodsSuccess(`Удалено ${allIds.length} периодов`)
      setTimeout(() => setSalaryPeriodsSuccess(''), 3000)
      setSelectedPeriodIds([])
      await loadSalaryPeriods()
    }
  }

  // Переключение чекбокса периода
  const togglePeriodSelection = (periodId) => {
    setSelectedPeriodIds(prev =>
      prev.includes(periodId)
        ? prev.filter(id => id !== periodId)
        : [...prev, periodId]
    )
  }

  // Выбрать все / снять все
  const toggleSelectAll = () => {
    if (selectedPeriodIds.length === salaryPeriods.length) {
      setSelectedPeriodIds([])
    } else {
      setSelectedPeriodIds(salaryPeriods.map(p => p.id))
    }
  }

  // Функция загрузки данных для конкретного таба
  const loadTab = useCallback(async (tabId, pointId) => {
    if (!pointId) return

    // Settings всегда загружаем заново (без кэширования)
    if (tabId === 'settings') {
      setTabStatus(prev => ({ ...prev, [tabId]: 'loading' }))
      try {
        await onLoadPointSettings(pointId)
        setTabStatus(prev => ({ ...prev, [tabId]: 'loaded' }))
      } catch (err) {
        console.error('Ошибка загрузки настроек:', err)
        setTabStatus(prev => ({ ...prev, [tabId]: 'idle' }))
      } finally {
        loadingRef.current = false
        processQueue()
      }
      return
    }

    // Остальные табы с кэшированием
    if (tabStatus[tabId] === 'loaded') return

    setTabStatus(prev => ({ ...prev, [tabId]: 'loading' }))

    try {
      if (tabId === 'staff') {
        await onLoadStaffList(pointId)
      } else if (tabId === 'schedule') {
        await onLoadStaffList(pointId)
      } else if (tabId === 'salary') {
        // Ничего не загружаем
      }

      setTabStatus(prev => ({ ...prev, [tabId]: 'loaded' }))
    } catch (err) {
      console.error(`Ошибка загрузки таба ${tabId}:`, err)
      setTabStatus(prev => ({ ...prev, [tabId]: 'idle' }))
    } finally {
      loadingRef.current = false
      processQueue()
    }
  }, [tabStatus, onLoadStaffList, onLoadPointSettings])

  // Обработчик очереди
  const processQueue = useCallback(() => {
    if (loadingRef.current || queueRef.current.length === 0) return

    const nextTab = queueRef.current.shift()
    loadingRef.current = true
    loadTab(nextTab, activePointId)
  }, [loadTab, activePointId])

  // Добавление таба в очередь с приоритетом
  const enqueueTab = useCallback((tabId) => {
    // Убираем таб из очереди, если он уже там
    queueRef.current = queueRef.current.filter(t => t !== tabId)
    // Добавляем в начало (приоритет)
    queueRef.current.unshift(tabId)

    // Если ничего не грузится — запускаем немедленно
    if (!loadingRef.current) {
      processQueue()
    }
  }, [processQueue])

  // Клик по табу
  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    activeTabRef.current = tabId
    enqueueTab(tabId)
  }

  // Фоновая последовательная загрузка при изменении activePointId
  useEffect(() => {
    if (!activePointId) return

    // Очищаем всё при смене ПВЗ
    setTabStatus({})
    setActiveTab(null)
    activeTabRef.current = null
    queueRef.current = []
    loadingRef.current = false

    // Запускаем фоновую последовательную загрузку
    const backgroundTabs = TABS.map(t => t.id)
    queueRef.current = [...backgroundTabs]
    processQueue()
  }, [activePointId])

  return (
    <div className="bg-white rounded-2xl shadow-sm">
      {/* Панель табов */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
              ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }
              ${tabStatus[tab.id] === 'loading' ? 'opacity-70' : ''}
            `}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
            {tabStatus[tab.id] === 'loading' && (
              <div className="w-3 h-3 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
            )}
          </button>
        ))}
      </div>

      {/* Контент таба */}
      <div className="p-6">
        {activeTab === null ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">Выберите раздел для работы</p>
          </div>
        ) : activeTab === 'staff' ? (
          <AdminStaffAttach
            staffList={staffList}
            staffLoadingList={staffLoadingList}
            staffIdInput={staffIdInput}
            onStaffIdInputChange={onStaffIdInputChange}
            staffLoading={staffLoading}
            staffError={staffError}
            staffSuccess={staffSuccess}
            onAttachStaff={onAttachStaff}
            onRemoveStaff={onRemoveStaff}
          />
        ) : activeTab === 'schedule' ? (
          <AdminScheduleCalendar
            activePointId={activePointId}
            staffList={staffList}
            pvzHours={`${pointSettings.work_start_time} — ${pointSettings.work_end_time}`}
          />
        ) : activeTab === 'settings' ? (
          <div className="p-4 bg-white rounded-2xl">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Настройки текущего ПВЗ</h3>
            {settingsError && (
              <div className="mb-3 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">{settingsError}</div>
            )}
            {settingsSuccess && (
              <div className="mb-3 px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg">{settingsSuccess}</div>
            )}
            <form onSubmit={onSaveSettings} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Открытие ПВЗ</label>
                <input
                  type="time"
                  step="60"
                  value={pointSettings.work_start_time}
                  onChange={(e) => onPointSettingsChange(prev => ({ ...prev, work_start_time: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Закрытие ПВЗ</label>
                <input
                  type="time"
                  step="60"
                  value={pointSettings.work_end_time}
                  onChange={(e) => onPointSettingsChange(prev => ({ ...prev, work_end_time: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Ставка за смену (руб)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={pointSettings.shift_rate}
                  onChange={(e) => onPointSettingsChange(prev => ({ ...prev, shift_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={settingsSaving}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {settingsSaving ? 'Сохранение...' : 'Сохранить настройки'}
              </button>
            </form>

            {/* ===== Периоды расчёта зарплаты ===== */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              <h4 className="text-lg font-semibold text-slate-900 mb-4">Периоды расчёта зарплаты</h4>

              {salaryPeriodsError && (
                <div className="mb-3 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">{salaryPeriodsError}</div>
              )}
              {salaryPeriodsSuccess && (
                <div className="mb-3 px-3 py-2 text-sm text-green-600 bg-green-50 rounded-lg">{salaryPeriodsSuccess}</div>
              )}

              {/* Автогенерация периодов */}
              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <h5 className="text-sm font-medium text-slate-700 mb-3">Автогенерация периодов на год</h5>
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Дата начала первого периода</label>
                  <input
                    type="date"
                    value={genConfig.start_date}
                    onChange={(e) => setGenConfig(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-slate-400 mt-1">От этой даты будет строиться первый период</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">День выплаты</label>
                    <select
                      value={genConfig.weekday}
                      onChange={(e) => setGenConfig(prev => ({ ...prev, weekday: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="1">Понедельник</option>
                      <option value="2">Вторник</option>
                      <option value="3">Среда</option>
                      <option value="4">Четверг</option>
                      <option value="5">Пятница</option>
                      <option value="6">Суббота</option>
                      <option value="7">Воскресенье</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Интервал</label>
                    <select
                      value={genConfig.interval}
                      onChange={(e) => setGenConfig(prev => ({ ...prev, interval: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="1">Каждую неделю</option>
                      <option value="2">Каждые 2 недели</option>
                      <option value="3">Каждые 3 недели</option>
                      <option value="4">Раз в месяц</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleGeneratePeriods}
                  disabled={genLoading || !activePointId}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {genLoading ? 'Генерация...' : 'Сгенерировать периоды'}
                </button>
                <p className="text-xs text-slate-400 mt-2">
                  Будут созданы периоды, начиная с ближайшего {['', 'понедельника', 'вторника', 'среды', 'четверга', 'пятницы', 'субботы', 'воскресенья'][genConfig.weekday]}.
                  Предыдущие периоды перезаписаны не будут.
                </p>
              </div>

              {/* Кнопка создания периода вручную */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                >
                  {showCreateForm ? 'Отмена' : '+ Создать период вручную'}
                </button>
                <button
                  onClick={loadSalaryPeriods}
                  className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                >
                  Обновить список
                </button>
              </div>

              {/* Форма создания периода */}
              {showCreateForm && (
                <form onSubmit={handleCreatePeriod} className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Название периода</label>
                    <input
                      type="text"
                      value={newPeriodData.period_name}
                      onChange={(e) => setNewPeriodData(prev => ({ ...prev, period_name: e.target.value }))}
                      placeholder="Напр. Выплата 14.01 - 28.01"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Начало</label>
                      <input
                        type="date"
                        value={newPeriodData.start_date}
                        onChange={(e) => setNewPeriodData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Конец</label>
                      <input
                        type="date"
                        value={newPeriodData.end_date}
                        onChange={(e) => setNewPeriodData(prev => ({ ...prev, end_date: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Выплата</label>
                      <input
                        type="date"
                        value={newPeriodData.payment_date}
                        onChange={(e) => setNewPeriodData(prev => ({ ...prev, payment_date: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={createPeriodLoading || !newPeriodData.period_name || !newPeriodData.start_date || !newPeriodData.end_date}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createPeriodLoading ? 'Сохранение...' : 'Создать период'}
                  </button>
                </form>
              )}

              {/* Кнопки массового удаления */}
              {salaryPeriods.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={toggleSelectAll}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  >
                    {selectedPeriodIds.length === salaryPeriods.length ? 'Снять все' : 'Выбрать все'}
                  </button>
                  {selectedPeriodIds.length > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      Удалить выбранные ({selectedPeriodIds.length})
                    </button>
                  )}
                  <button
                    onClick={handleDeleteAll}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200 ml-auto"
                  >
                    Удалить все
                  </button>
                </div>
              )}

              {/* Список существующих периодов */}
              {salaryPeriodsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : salaryPeriods.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center bg-slate-50 rounded-xl">
                  Периодов расчёта зарплаты пока нет. Сгенерируйте автоматически или создайте вручную.
                </p>
              ) : (
                <div className="space-y-2">
                  {salaryPeriods.map(period => (
                    <div key={period.id} className={`flex items-center justify-between px-3 py-2 bg-white border rounded-lg text-sm transition-colors ${
                      selectedPeriodIds.includes(period.id)
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedPeriodIds.includes(period.id)}
                          onChange={() => togglePeriodSelection(period.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="font-medium text-slate-900">{period.period_name}</span>
                        <span className="text-slate-400 text-xs">
                          {period.start_date} — {period.end_date}
                        </span>
                        {period.payment_date && (
                          <span className="text-slate-400 text-xs">
                            выплата: {period.payment_date}
                          </span>
                        )}
                        {period.auto_generated && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium text-green-600 bg-green-50 border border-green-200">
                            авто
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePeriod(period.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Удалить период"
                      >
                        <svg className="w-4 h-4" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'salary' ? (
          <SalaryCalculator activePointId={activePointId} />
        ) : null}
      </div>
    </div>
  )
}