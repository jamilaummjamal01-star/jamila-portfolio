ALTER TABLE project_calculations ADD COLUMN title TEXT;
ALTER TABLE project_calculations ADD COLUMN currency TEXT NOT NULL DEFAULT 'RUB';
ALTER TABLE calculation_items ADD COLUMN unit TEXT NOT NULL DEFAULT 'услуга';

CREATE INDEX IF NOT EXISTS idx_calculations_updated
  ON project_calculations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_calculation_items_sort
  ON calculation_items(calculation_id, sort_order);
