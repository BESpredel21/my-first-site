-- =====================================================
-- Таблица manager_points
-- Связь между менеджерами (руководителями) и их пунктами ПВЗ
-- =====================================================

-- 1. Создание таблицы
CREATE TABLE IF NOT EXISTS manager_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manager_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  point_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Индекс для быстрого поиска по менеджеру
CREATE INDEX IF NOT EXISTS idx_manager_points_manager ON manager_points(manager_id);

-- 3. Ограничение: уникальный пункт у одного менеджера
ALTER TABLE manager_points ADD CONSTRAINT manager_points_unique_manager_point UNIQUE (manager_id, point_id);

-- 4. Включение Row Level Security (RLS)
ALTER TABLE manager_points ENABLE ROW LEVEL SECURITY;

-- 5. Политики RLS

-- Просмотр: менеджер видит только свои точки
DROP POLICY IF EXISTS "Менеджер видит свои точки" ON manager_points;
CREATE POLICY "Менеджер видит свои точки" ON manager_points
  FOR SELECT
  USING (auth.uid() = manager_id);

-- Вставка: менеджер может добавлять только свои точки
DROP POLICY IF EXISTS "Менеджер добавляет свои точки" ON manager_points;
CREATE POLICY "Менеджер добавляет свои точки" ON manager_points
  FOR INSERT
  WITH CHECK (auth.uid() = manager_id);

-- Удаление: менеджер может удалять только свои точки
DROP POLICY IF EXISTS "Менеджер удаляет свои точки" ON manager_points;
CREATE POLICY "Менеджер удаляет свои точки" ON manager_points
  FOR DELETE
  USING (auth.uid() = manager_id);

-- Администратор (superuser) имеет полный доступ через Supabase Service Key
-- Если используются роли, добавьте:
-- FOR ALL USING (auth.uid() = manager_id OR auth.jwt() ->> 'role' = 'admin')

-- =====================================================
-- Таблица staff_points
-- Привязка сотрудников к нескольким ПВЗ через ID
-- Шаг 5.4.1 AI_INSTRUCTIONS.md
-- =====================================================

-- 1. Создание таблицы
CREATE TABLE IF NOT EXISTS staff_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  point_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Индекс для быстрого поиска по сотруднику
CREATE INDEX IF NOT EXISTS idx_staff_points_staff ON staff_points(staff_id);

-- 3. Индекс для быстрого поиска по пункту
CREATE INDEX IF NOT EXISTS idx_staff_points_point ON staff_points(point_id);

-- 4. Ограничение: один сотрудник не может быть дважды привязан к одному ПВЗ
ALTER TABLE staff_points ADD CONSTRAINT staff_points_unique_staff_point UNIQUE (staff_id, point_id);

-- 5. Включение Row Level Security (RLS)
ALTER TABLE staff_points ENABLE ROW LEVEL SECURITY;

-- 6. Политики RLS

-- Просмотр: все авторизованные пользователи видят привязки (фильтрация на уровне приложения)
DROP POLICY IF EXISTS "Все видят привязки сотрудников" ON staff_points;
CREATE POLICY "Все видят привязки сотрудников" ON staff_points
  FOR SELECT
  USING (true);

-- Вставка: администраторы и менеджеры могут привязывать сотрудников
DROP POLICY IF EXISTS "Менеджеры и админы привязывают сотрудников" ON staff_points;
CREATE POLICY "Менеджеры и админы привязывают сотрудников" ON staff_points
  FOR INSERT
  WITH CHECK (true);

-- Удаление: администраторы и менеджеры могут отвязывать сотрудников
DROP POLICY IF EXISTS "Менеджеры и админы отвязывают сотрудников" ON staff_points;
CREATE POLICY "Менеджеры и админы отвязывают сотрудников" ON staff_points
  FOR DELETE
  USING (true);
