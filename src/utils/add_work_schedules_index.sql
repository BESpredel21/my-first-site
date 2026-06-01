-- Составной индекс для ускорения запросов календаря по point_id и датам
CREATE INDEX IF NOT EXISTS idx_work_schedules_point_date
ON work_schedules (point_id, work_date);

-- Индекс для сортировки по work_date
CREATE INDEX IF NOT EXISTS idx_work_schedules_date
ON work_schedules (work_date);