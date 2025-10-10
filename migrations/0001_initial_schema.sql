-- تهيئة قاعدة البيانات لنظام حجز بذور البطاطا

-- جدول المحافظات وحصصها
CREATE TABLE IF NOT EXISTS provinces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    quota_tons INTEGER NOT NULL DEFAULT 0,
    remaining_quota INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الموزعين
CREATE TABLE IF NOT EXISTS distributors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    province_id INTEGER NOT NULL,
    commission_percentage REAL NOT NULL DEFAULT 5.0,
    phone TEXT,
    address TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES provinces(id)
);

-- جدول المزارعين
CREATE TABLE IF NOT EXISTS farmers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    id_number TEXT NOT NULL UNIQUE,
    phone TEXT,
    province_id INTEGER NOT NULL,
    address TEXT,
    is_verified BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (province_id) REFERENCES provinces(id)
);

-- جدول أصناف البذور
CREATE TABLE IF NOT EXISTS seed_varieties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price_per_kg REAL NOT NULL,
    rank INTEGER DEFAULT 1,
    availability_status TEXT DEFAULT 'available',
    min_order_kg INTEGER DEFAULT 1,
    max_order_kg INTEGER DEFAULT 1000,
    image_url TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول الحجوزات الرئيسي
CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    farmer_id INTEGER NOT NULL,
    province_id INTEGER NOT NULL,
    distributor_id INTEGER,
    total_quantity_kg INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    delivery_date DATE NOT NULL,
    distribution_method TEXT CHECK(distribution_method IN ('direct', 'distributor')) DEFAULT 'distributor',
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'delivered')) DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    approved_by INTEGER,
    FOREIGN KEY (farmer_id) REFERENCES farmers(id),
    FOREIGN KEY (province_id) REFERENCES provinces(id),
    FOREIGN KEY (distributor_id) REFERENCES distributors(id),
    FOREIGN KEY (approved_by) REFERENCES staff(id)
);

-- جدول عناصر الحجز (تفاصيل الأصناف)
CREATE TABLE IF NOT EXISTS reservation_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reservation_id INTEGER NOT NULL,
    seed_variety_id INTEGER NOT NULL,
    quantity_kg INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (seed_variety_id) REFERENCES seed_varieties(id)
);

-- جدول موظفي الشركة
CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'manager', 'operator')) DEFAULT 'operator',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء الفهارس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_farmers_id_number ON farmers(id_number);
CREATE INDEX IF NOT EXISTS idx_farmers_province ON farmers(province_id);
CREATE INDEX IF NOT EXISTS idx_distributors_province ON distributors(province_id);
CREATE INDEX IF NOT EXISTS idx_reservations_farmer ON reservations(farmer_id);
CREATE INDEX IF NOT EXISTS idx_reservations_province ON reservations(province_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_delivery_date ON reservations(delivery_date);
CREATE INDEX IF NOT EXISTS idx_reservation_items_reservation ON reservation_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_items_variety ON reservation_items(seed_variety_id);