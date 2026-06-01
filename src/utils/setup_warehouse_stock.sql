-- Таблица остатков материалов на складе МЦ по ПВЗ
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id SERIAL PRIMARY KEY,
  point_id TEXT UNIQUE NOT NULL,
  tape_count INTEGER NOT NULL DEFAULT 0,
  paper_count INTEGER NOT NULL DEFAULT 0,
  bag_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для быстрого поиска по ПВЗ
CREATE INDEX IF NOT EXISTS idx_warehouse_stock_point_id ON warehouse_stock(point_id);