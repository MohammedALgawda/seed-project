-- بيانات تجريبية لنظام حجز بذور البطاطا

-- إدراج المحافظات مع حصصها (بالطن)
INSERT OR IGNORE INTO provinces (name, quota_tons, remaining_quota) VALUES 
  ('بغداد', 500, 500),
  ('البصرة', 300, 300),
  ('نينوى', 400, 400),
  ('الأنبار', 250, 250),
  ('أربيل', 200, 200),
  ('السليمانية', 180, 180),
  ('دهوك', 150, 150),
  ('كربلاء', 220, 220),
  ('النجف', 200, 200),
  ('واسط', 180, 180),
  ('بابل', 190, 190),
  ('القادسية', 160, 160),
  ('المثنى', 120, 120),
  ('ذي قار', 170, 170),
  ('ميسان', 140, 140),
  ('صلاح الدين', 200, 200),
  ('ديالى', 180, 180),
  ('كركوك', 170, 170);

-- إدراج الموزعين
INSERT OR IGNORE INTO distributors (name, province_id, commission_percentage, phone, address) VALUES 
  ('شركة الزراعة المتقدمة', 1, 7.5, '07701234567', 'الكرخ - بغداد'),
  ('مؤسسة البذور الذهبية', 1, 6.0, '07809876543', 'الرصافة - بغداد'),
  ('شركة بذور الجنوب', 2, 8.0, '07703456789', 'الجمعيات - البصرة'),
  ('مركز بذور نينوى', 3, 7.0, '07801234567', 'حي الزهراء - الموصل'),
  ('شركة أنبار الزراعية', 4, 6.5, '07909876543', 'الرمادي المركز'),
  ('مؤسسة كردستان للبذور', 5, 7.5, '07503456789', 'عنكاوا - أربيل'),
  ('شركة الفرات الأوسط', 8, 6.0, '07801234567', 'الحيدرية - كربلاء');

-- إدراج أصناف البذور
INSERT OR IGNORE INTO seed_varieties (name, description, price_per_kg, rank, min_order_kg, max_order_kg, image_url) VALUES 
  ('سبونتا', 'صنف عالي الإنتاجية مقاوم للأمراض، مناسب للمناخ العراقي', 3500, 1, 25, 500, '/static/images/spunta.jpg'),
  ('أريندا', 'صنف متوسط النضج، جودة عالية للاستهلاك المحلي', 3200, 2, 25, 300, '/static/images/arinda.jpg'),
  ('لادي روزيتا', 'صنف مبكر النضج، مقاوم للحرارة', 3800, 1, 25, 400, '/static/images/lady_rosetta.jpg'),
  ('ساتينا', 'صنف متأخر النضج، إنتاجية عالية', 3300, 2, 50, 600, '/static/images/satina.jpg'),
  ('ديزيريه', 'صنف أحمر اللون، مقاوم للتخزين', 3600, 1, 25, 350, '/static/images/desiree.jpg'),
  ('كونكورد', 'صنف للمعالجة الصناعية', 2900, 3, 100, 1000, '/static/images/concord.jpg'),
  ('أجريا', 'صنف عالي الجودة للقلي', 3400, 2, 25, 400, '/static/images/agria.jpg'),
  ('رويال', 'صنف محلي محسن، مناسب للظروف المحلية', 2800, 3, 50, 800, '/static/images/royal.jpg');

-- إدراج بعض المزارعين التجريبيين
INSERT OR IGNORE INTO farmers (name, id_number, phone, province_id, address, is_verified) VALUES 
  ('أحمد محمد علي', '19850312001', '07701234567', 1, 'الدورة - بغداد', 1),
  ('فاطمة حسن محمود', '19920815002', '07809876543', 1, 'الشعلة - بغداد', 1),
  ('عباس كريم جاسم', '19780923003', '07703456789', 2, 'الزبير - البصرة', 1),
  ('زينب عادل فاضل', '19881205004', '07801234567', 3, 'تلعفر - نينوى', 0),
  ('محمد قاسم صالح', '19750618005', '07909876543', 4, 'الفلوجة - الأنبار', 1),
  ('سارة أكرم توفيق', '19901020006', '07503456789', 5, 'قوشتپه - أربيل', 1);

-- إدراج موظفي الشركة (كلمة المرور: password123)
INSERT OR IGNORE INTO staff (username, password_hash, full_name, role) VALUES 
  ('admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'مدير النظام', 'admin'),
  ('manager1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'مدير العمليات الأول', 'manager'),
  ('operator1', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'مشغل النظام الأول', 'operator');

-- بعض الحجوزات التجريبية
INSERT OR IGNORE INTO reservations (farmer_id, province_id, distributor_id, total_quantity_kg, total_amount, delivery_date, distribution_method, status) VALUES 
  (1, 1, 1, 100, 350000, '2024-12-15', 'distributor', 'pending'),
  (2, 1, 2, 75, 262500, '2024-12-20', 'distributor', 'approved'),
  (3, 2, 3, 200, 680000, '2025-01-10', 'distributor', 'pending');

-- عناصر الحجوزات
INSERT OR IGNORE INTO reservation_items (reservation_id, seed_variety_id, quantity_kg, unit_price, total_price) VALUES 
  (1, 1, 50, 3500, 175000),
  (1, 3, 50, 3800, 190000),
  (2, 2, 75, 3200, 240000),
  (3, 1, 100, 3500, 350000),
  (3, 4, 100, 3300, 330000);