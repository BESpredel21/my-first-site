-- ============================================
-- Полный набор индексов для оптимизации PointMaster
-- Запустить в Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Индексы для таблицы manager_points
CREATE INDEX IF NOT EXISTS idx_manager_points_manager_id
ON manager_points (manager_id);

CREATE INDEX IF NOT EXISTS idx_manager_points_created_at
ON manager_points (created_at);

-- 2. Индексы для таблицы work_schedules
CREATE INDEX IF NOT EXISTS idx_work_schedules_point_date
ON work_schedules (point_id, work_date);

CREATE INDEX IF NOT EXISTS idx_work_schedules_date
ON work_schedules (work_date);

-- 3. Индексы для таблицы staff_points (поиск сотрудников по ПВЗ)
CREATE INDEX IF NOT EXISTS idx_staff_points_point_id
ON staff_points (point_id);

CREATE INDEX IF NOT EXISTS idx_staff_points_staff_id
ON staff_points (staff_id);

-- 4. Индекс для поиска профиля по short_id
CREATE INDEX IF NOT EXISTS idx_profiles_short_id
ON profiles (short_id);

-- 5. Индекс для поиска сотрудников по роли и ПВЗ
CREATE INDEX IF NOT EXISTS idx_profiles_role_point
ON profiles (role, point_id);