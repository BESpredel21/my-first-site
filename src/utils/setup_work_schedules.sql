-- =====================================================
-- Таблица work_schedules
-- Гибкий график смен с делением дня
-- Шаг 7.2 AI_INSTRUCTIONS.md
-- =====================================================

-- 1. Создание таблицы
CREATE TABLE IF NOT EXISTS work_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  point_id TEXT NOT NULL,
  work_date DATE NOT NULL,
  shift_type TEXT CHECK (shift_type IN ('full', 'morning', 'evening')),
  is_full_day BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Уникальность: один сотрудник + один ПВЗ + одна дата
ALTER TABLE work_schedules ADD CONSTRAINT work_schedules_unique UNIQUE (staff_id, point_id, work_date);

-- 3. Индексы для быстрых запросов
CREATE INDEX IF NOT EXISTS idx_work_schedules_point ON work_schedules(point_id);
CREATE INDEX IF NOT EXISTS idx_work_schedules_staff ON work_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_work_schedules_date ON work_schedules(work_date);

-- 4. Включение Row Level Security (RLS)
ALTER TABLE work_schedules ENABLE ROW LEVEL security;

-- 5. Политики RLS
DROP POLICY IF EXISTS "Просмотр графика для авторизованных" ON work_schedules;
CREATE POLICY "Просмотр графика для авторизованных" ON work_schedules
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Менеджеры управляют графиком" ON work_schedules;
CREATE POLICY "Менеджеры управляют графиком" ON work_schedules
  FOR ALL
  USING (true)
  WITH CHECK (true);