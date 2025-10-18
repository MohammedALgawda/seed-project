-- Advanced Features Migration
-- Add quota movements tracking and province allocations

-- Table for tracking quota movements for each province
CREATE TABLE IF NOT EXISTS quota_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  province_id INTEGER NOT NULL,
  reservation_id INTEGER,
  movement_type TEXT NOT NULL, -- 'deduction', 'addition', 'adjustment'
  quantity_kg DECIMAL(10,2) NOT NULL,
  previous_quota DECIMAL(10,2) NOT NULL,
  new_quota DECIMAL(10,2) NOT NULL,
  description TEXT,
  admin_user TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

-- Table for province seed variety allocations (what seeds are available per province)
CREATE TABLE IF NOT EXISTS province_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  province_id INTEGER NOT NULL,
  seed_variety_id INTEGER NOT NULL,
  allocated_quantity_kg DECIMAL(10,2) NOT NULL DEFAULT 0, -- How much allocated for this province
  min_order_kg DECIMAL(10,2),
  max_order_kg DECIMAL(10,2),
  is_active INTEGER DEFAULT 1,
  admin_user TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (province_id) REFERENCES provinces(id),
  FOREIGN KEY (seed_variety_id) REFERENCES seed_varieties(id),
  UNIQUE(province_id, seed_variety_id)
);

-- Add columns to reservations for tracking changes
ALTER TABLE reservations ADD COLUMN original_total_quantity_kg DECIMAL(10,2);
ALTER TABLE reservations ADD COLUMN original_total_amount DECIMAL(10,2);
ALTER TABLE reservations ADD COLUMN edited_by_admin INTEGER DEFAULT 0;
ALTER TABLE reservations ADD COLUMN edit_reason TEXT;
ALTER TABLE reservations ADD COLUMN admin_notes TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quota_movements_province ON quota_movements(province_id);
CREATE INDEX IF NOT EXISTS idx_quota_movements_reservation ON quota_movements(reservation_id);
CREATE INDEX IF NOT EXISTS idx_province_allocations_province ON province_allocations(province_id);
CREATE INDEX IF NOT EXISTS idx_province_allocations_seed ON province_allocations(seed_variety_id);