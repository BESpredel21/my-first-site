-- Индекс для ускорения поиска ПВЗ по manager_id в таблице manager_points
CREATE INDEX IF NOT EXISTS idx_manager_points_manager_id
ON manager_points (manager_id);

-- Индекс для сортировки по created_at
CREATE INDEX IF NOT EXISTS idx_manager_points_created_at
ON manager_points (created_at);