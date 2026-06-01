-- =====================================================
-- Таблица salary_periods
-- Периоды расчёта зарплаты для каждого ПВЗ
-- =====================================================

CREATE TABLE IF NOT EXISTS salary_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  point_id TEXT NOT NULL,
  period_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_date DATE,
  auto_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по ПВЗ
CREATE INDEX IF NOT EXISTS idx_salary_periods_point ON salary_periods(point_id);

-- Индекс для поиска текущего периода
CREATE INDEX IF NOT EXISTS idx_salary_periods_dates ON salary_periods(point_id, start_date, end_date);

-- Включение RLS
ALTER TABLE salary_periods ENABLE ROW LEVEL SECURITY;

-- Политики RLS
DROP POLICY IF EXISTS "Все видят периоды ЗП" ON salary_periods;
CREATE POLICY "Все видят периоды ЗП" ON salary_periods
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Менеджеры и админы управляют периодами" ON salary_periods;
CREATE POLICY "Менеджеры и админы управляют периодами" ON salary_periods
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Менеджеры и админы удаляют периоды" ON salary_periods;
CREATE POLICY "Менеджеры и админы удаляют периоды" ON salary_periods
  FOR DELETE USING (true);