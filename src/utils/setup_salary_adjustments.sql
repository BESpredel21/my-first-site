-- =====================================================
-- Таблица salary_adjustments
-- Премии и удержания для расчёта зарплаты
-- =====================================================

CREATE TABLE IF NOT EXISTS salary_adjustments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_id UUID REFERENCES salary_periods(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  point_id TEXT NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('bonus', 'hanging_barcode', 'replacement', 'defect', 'other')),
  barcode_number TEXT,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  comment TEXT,
  is_partial BOOLEAN DEFAULT FALSE,
  remaining_amount NUMERIC(10,2) DEFAULT 0,
  parent_adjustment_id UUID REFERENCES salary_adjustments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по периоду
CREATE INDEX IF NOT EXISTS idx_salary_adjustments_period ON salary_adjustments(period_id);

-- Индекс для быстрого поиска по сотруднику
CREATE INDEX IF NOT EXISTS idx_salary_adjustments_staff ON salary_adjustments(staff_id);

-- Индекс для проверки дублей ШК
CREATE INDEX IF NOT EXISTS idx_salary_adjustments_barcode ON salary_adjustments(barcode_number, point_id, created_at);

-- Индекс для поиска незакрытых удержаний
CREATE INDEX IF NOT EXISTS idx_salary_adjustments_remaining ON salary_adjustments(remaining_amount) WHERE remaining_amount > 0;

-- Включение RLS
ALTER TABLE salary_adjustments ENABLE ROW LEVEL SECURITY;

-- Политики RLS
DROP POLICY IF EXISTS "Все видят корректировки ЗП" ON salary_adjustments;
CREATE POLICY "Все видят корректировки ЗП" ON salary_adjustments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Менеджеры и админы управляют корректировками" ON salary_adjustments;
CREATE POLICY "Менеджеры и админы управляют корректировками" ON salary_adjustments
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Менеджеры и админы обновляют корректировки" ON salary_adjustments;
CREATE POLICY "Менеджеры и админы обновляют корректировки" ON salary_adjustments
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Менеджеры и админы удаляют корректировки" ON salary_adjustments;
CREATE POLICY "Менеджеры и админы удаляют корректировки" ON salary_adjustments
  FOR DELETE USING (true);