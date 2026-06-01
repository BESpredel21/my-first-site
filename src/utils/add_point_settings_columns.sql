-- =====================================================
-- Миграция: Добавление полей настроек ПВЗ в manager_points
-- Шаг 7.2.4 AI_INSTRUCTIONS.md
-- =====================================================

ALTER TABLE manager_points
  ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS shift_rate NUMERIC(10,2) DEFAULT 2000;