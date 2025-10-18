-- Sample province allocations for testing
-- Assign seed varieties to different provinces with different quantities

-- Sanaa Province (صنعاء) - All varieties available
INSERT OR IGNORE INTO province_allocations (province_id, seed_variety_id, allocated_quantity_kg, min_order_kg, max_order_kg, admin_user) VALUES
(1, 1, 200, 10, 100, 'admin'), -- روسيت برباك
(1, 2, 150, 10, 80, 'admin'),  -- سبونتا
(1, 3, 180, 15, 90, 'admin'),  -- لادى روزيتا
(1, 4, 120, 10, 60, 'admin'),  -- أريندا
(1, 5, 100, 15, 50, 'admin'),  -- ديامانت
(1, 6, 80, 10, 40, 'admin'),   -- كارا
(1, 7, 90, 20, 45, 'admin'),   -- نيكولا
(1, 8, 70, 15, 35, 'admin');   -- أجريا

-- Aden Province (عدن) - Limited varieties
INSERT OR IGNORE INTO province_allocations (province_id, seed_variety_id, allocated_quantity_kg, min_order_kg, max_order_kg, admin_user) VALUES
(2, 1, 150, 10, 80, 'admin'),  -- روسيت برباك
(2, 2, 100, 10, 60, 'admin'),  -- سبونتا
(2, 3, 120, 15, 70, 'admin'),  -- لادى روزيتا
(2, 5, 80, 15, 40, 'admin');   -- ديامانت

-- Taiz Province (تعز) - Medium variety selection
INSERT OR IGNORE INTO province_allocations (province_id, seed_variety_id, allocated_quantity_kg, min_order_kg, max_order_kg, admin_user) VALUES
(3, 1, 180, 10, 90, 'admin'),  -- روسيت برباك
(3, 2, 130, 10, 70, 'admin'),  -- سبونتا
(3, 3, 150, 15, 80, 'admin'),  -- لادى روزيتا
(3, 4, 100, 10, 50, 'admin'),  -- أريندا
(3, 6, 60, 10, 30, 'admin'),   -- كارا
(3, 7, 70, 20, 35, 'admin');   -- نيكولا

-- Hodeidah Province (الحديدة) - Coastal varieties
INSERT OR IGNORE INTO province_allocations (province_id, seed_variety_id, allocated_quantity_kg, min_order_kg, max_order_kg, admin_user) VALUES
(4, 1, 160, 10, 80, 'admin'),  -- روسيت برباك
(4, 2, 120, 10, 60, 'admin'),  -- سبونتا
(4, 3, 140, 15, 70, 'admin'),  -- لادى روزيتا
(4, 5, 90, 15, 45, 'admin');   -- ديامانت

-- Ibb Province (إب) - Mountain varieties
INSERT OR IGNORE INTO province_allocations (province_id, seed_variety_id, allocated_quantity_kg, min_order_kg, max_order_kg, admin_user) VALUES
(5, 2, 110, 10, 60, 'admin'),  -- سبونتا
(5, 4, 80, 10, 40, 'admin'),   -- أريندا
(5, 6, 70, 10, 35, 'admin'),   -- كارا
(5, 7, 60, 20, 30, 'admin'),   -- نيكولا
(5, 8, 50, 15, 25, 'admin');   -- أجريا