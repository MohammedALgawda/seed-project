import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

// Type definitions for Cloudflare bindings
type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for frontend-backend communication
app.use('/api/*', cors())

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes for Potato Seeds Reservation System

// Get all provinces with quotas
app.get('/api/provinces', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, quota_tons, remaining_quota, is_active 
      FROM provinces 
      WHERE is_active = 1 
      ORDER BY name
    `).all();
    
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب بيانات المحافظات' }, 500);
  }
});

// Get distributors for a specific province
app.get('/api/distributors/:provinceId', async (c) => {
  try {
    const provinceId = c.req.param('provinceId');
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, commission_percentage, phone, address 
      FROM distributors 
      WHERE province_id = ? AND is_active = 1
    `).bind(provinceId).all();
    
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب بيانات الموزعين' }, 500);
  }
});

// Get all seed varieties
app.get('/api/seed-varieties', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, description, price_per_kg, rank, min_order_kg, max_order_kg, image_url
      FROM seed_varieties 
      WHERE is_active = 1 
      ORDER BY rank ASC, name ASC
    `).all();
    
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب بيانات الأصناف' }, 500);
  }
});

// Register a new farmer
app.post('/api/farmers', async (c) => {
  try {
    const { name, id_number, phone, province_id, address } = await c.req.json();
    
    // Check if farmer with this ID number already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM farmers WHERE id_number = ?
    `).bind(id_number).first();
    
    if (existing) {
      return c.json({ success: false, error: 'رقم الهوية مسجل مسبقاً' }, 400);
    }
    
    const result = await c.env.DB.prepare(`
      INSERT INTO farmers (name, id_number, phone, province_id, address, is_verified)
      VALUES (?, ?, ?, ?, ?, 0)
    `).bind(name, id_number, phone, province_id, address).run();
    
    return c.json({ 
      success: true, 
      farmer_id: result.meta.last_row_id,
      message: 'تم تسجيل المزارع بنجاح' 
    });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في تسجيل المزارع' }, 500);
  }
});

// Get farmer by ID number
app.get('/api/farmers/:idNumber', async (c) => {
  try {
    const idNumber = c.req.param('idNumber');
    const farmer = await c.env.DB.prepare(`
      SELECT f.*, p.name as province_name 
      FROM farmers f 
      JOIN provinces p ON f.province_id = p.id 
      WHERE f.id_number = ?
    `).bind(idNumber).first();
    
    if (!farmer) {
      return c.json({ success: false, error: 'المزارع غير مسجل' }, 404);
    }
    
    return c.json({ success: true, data: farmer });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب بيانات المزارع' }, 500);
  }
});

// Create a new reservation
app.post('/api/reservations', async (c) => {
  try {
    const { farmer_id, province_id, distributor_id, delivery_date, distribution_method, items } = await c.req.json();
    
    // Calculate totals
    let total_quantity = 0;
    let total_amount = 0;
    
    for (const item of items) {
      total_quantity += item.quantity_kg;
      total_amount += item.total_price;
    }
    
    // Check province quota
    const province = await c.env.DB.prepare(`
      SELECT remaining_quota FROM provinces WHERE id = ?
    `).bind(province_id).first();
    
    if (!province || province.remaining_quota < total_quantity) {
      return c.json({ success: false, error: 'الكمية المطلوبة تتجاوز الحصة المتاحة للمحافظة' }, 400);
    }
    
    // Create reservation
    const reservationResult = await c.env.DB.prepare(`
      INSERT INTO reservations (farmer_id, province_id, distributor_id, total_quantity_kg, total_amount, delivery_date, distribution_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(farmer_id, province_id, distributor_id, total_quantity, total_amount, delivery_date, distribution_method).run();
    
    const reservation_id = reservationResult.meta.last_row_id;
    
    // Insert reservation items
    for (const item of items) {
      await c.env.DB.prepare(`
        INSERT INTO reservation_items (reservation_id, seed_variety_id, quantity_kg, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
      `).bind(reservation_id, item.seed_variety_id, item.quantity_kg, item.unit_price, item.total_price).run();
    }
    
    return c.json({ 
      success: true, 
      reservation_id, 
      message: 'تم تقديم طلب الحجز بنجاح. سيتم مراجعته من قبل الشركة.' 
    });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في تقديم طلب الحجز' }, 500);
  }
});

// Get farmer's reservations
app.get('/api/farmers/:farmerId/reservations', async (c) => {
  try {
    const farmerId = c.req.param('farmerId');
    const { results } = await c.env.DB.prepare(`
      SELECT r.*, p.name as province_name, d.name as distributor_name
      FROM reservations r
      LEFT JOIN provinces p ON r.province_id = p.id
      LEFT JOIN distributors d ON r.distributor_id = d.id
      WHERE r.farmer_id = ?
      ORDER BY r.created_at DESC
    `).bind(farmerId).all();
    
    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب الحجوزات' }, 500);
  }
});

// Main page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>نظام حجز بذور البطاطا</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  'arabic': ['Tajawal', 'Arial', 'sans-serif']
                }
              }
            }
          }
        </script>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gradient-to-br from-green-50 to-emerald-100 font-arabic">
        <!-- Header -->
        <header class="bg-white shadow-lg border-b-4 border-green-500">
            <div class="container mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4 space-x-reverse">
                        <div class="bg-green-500 text-white p-3 rounded-full">
                            <i class="fas fa-seedling text-xl"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-800">نظام حجز بذور البطاطا</h1>
                            <p class="text-sm text-gray-600">منصة إلكترونية لإدارة حجوزات البذور للمزارعين</p>
                        </div>
                    </div>
                    <div class="hidden md:flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                        <div class="flex items-center">
                            <i class="fas fa-phone-alt ml-2"></i>
                            <span>+964 770 123 4567</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-envelope ml-2"></i>
                            <span>info@potato-seeds.iq</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Navigation -->
        <nav class="bg-green-600 text-white shadow-md">
            <div class="container mx-auto px-6">
                <div class="flex items-center justify-between h-16">
                    <div class="flex items-center space-x-6 space-x-reverse">
                        <button id="nav-home" class="nav-btn px-4 py-2 rounded-lg transition-all duration-300 hover:bg-green-700 active">
                            <i class="fas fa-home ml-2"></i>الصفحة الرئيسية
                        </button>
                        <button id="nav-varieties" class="nav-btn px-4 py-2 rounded-lg transition-all duration-300 hover:bg-green-700">
                            <i class="fas fa-list ml-2"></i>الأصناف المتوفرة
                        </button>
                        <button id="nav-reservation" class="nav-btn px-4 py-2 rounded-lg transition-all duration-300 hover:bg-green-700">
                            <i class="fas fa-calendar-plus ml-2"></i>حجز جديد
                        </button>
                        <button id="nav-status" class="nav-btn px-4 py-2 rounded-lg transition-all duration-300 hover:bg-green-700">
                            <i class="fas fa-search ml-2"></i>حالة الحجز
                        </button>
                    </div>
                    <div class="flex items-center space-x-4 space-x-reverse">
                        <span class="text-green-200">أهلاً وسهلاً بك</span>
                        <button id="staff-login" class="bg-green-800 hover:bg-green-900 px-3 py-1 rounded text-sm transition-colors">
                            <i class="fas fa-user-shield ml-1"></i>دخول الموظفين
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <main class="container mx-auto px-6 py-8">
            <!-- Welcome Section -->
            <section id="home-section">
                <div class="text-center mb-12">
                    <div class="inline-flex items-center bg-green-100 text-green-800 px-6 py-3 rounded-full text-sm font-medium mb-6">
                        <i class="fas fa-info-circle ml-2"></i>
                        نظام حجز متقدم وموثوق لبذور البطاطا عالية الجودة
                    </div>
                    
                    <h2 class="text-4xl font-bold text-gray-800 mb-4">مرحباً بكم في نظام حجز بذور البطاطا</h2>
                    <p class="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                        منصة إلكترونية حديثة تمكن المزارعين من حجز بذور البطاطا بسهولة وأمان، مع ضمان الجودة العالية والتوزيع العادل
                    </p>
                </div>

                <!-- Features Grid -->
                <div class="grid md:grid-cols-3 gap-8 mb-12">
                    <div class="bg-white rounded-xl shadow-lg p-8 text-center border-t-4 border-green-500 hover:shadow-xl transition-shadow">
                        <div class="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fas fa-seedling text-3xl text-green-600"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-4">أصناف متنوعة</h3>
                        <p class="text-gray-600">مجموعة واسعة من أصناف بذور البطاطا عالية الجودة ومقاومة للأمراض</p>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-8 text-center border-t-4 border-blue-500 hover:shadow-xl transition-shadow">
                        <div class="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fas fa-calendar-check text-3xl text-blue-600"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-4">حجز مسبق</h3>
                        <p class="text-gray-600">إمكانية الحجز المسبق حتى 6 أشهر لضمان التخطيط الأمثل للزراعة</p>
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-8 text-center border-t-4 border-orange-500 hover:shadow-xl transition-shadow">
                        <div class="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <i class="fas fa-truck text-3xl text-orange-600"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-4">توزيع منظم</h3>
                        <p class="text-gray-600">شبكة موزعين في جميع المحافظات مع نظام حصص عادل ومنظم</p>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6 text-center">ابدأ رحلتك معنا</h3>
                    <div class="grid md:grid-cols-2 gap-6">
                        <button id="start-reservation" class="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            <div class="flex items-center justify-center mb-4">
                                <i class="fas fa-plus-circle text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-2">حجز جديد</h4>
                            <p class="text-green-100">ابدأ بحجز بذور البطاطا الآن</p>
                        </button>

                        <button id="check-status" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                            <div class="flex items-center justify-center mb-4">
                                <i class="fas fa-search text-3xl"></i>
                            </div>
                            <h4 class="text-xl font-bold mb-2">تتبع الحجز</h4>
                            <p class="text-blue-100">تحقق من حالة حجوزاتك الحالية</p>
                        </button>
                    </div>
                </div>
            </section>

            <!-- Dynamic Content Sections -->
            <section id="varieties-section" class="hidden">
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <div class="flex items-center justify-between mb-8">
                        <h2 class="text-3xl font-bold text-gray-800">الأصناف المتوفرة</h2>
                        <div class="flex items-center space-x-4 space-x-reverse">
                            <select id="sort-varieties" class="border border-gray-300 rounded-lg px-4 py-2">
                                <option value="rank">ترتيب حسب الجودة</option>
                                <option value="price_asc">السعر: من الأقل للأعلى</option>
                                <option value="price_desc">السعر: من الأعلى للأقل</option>
                                <option value="name">ترتيب أبجدي</option>
                            </select>
                            <button id="refresh-varieties" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                                <i class="fas fa-sync-alt ml-2"></i>تحديث
                            </button>
                        </div>
                    </div>
                    <div id="varieties-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <!-- Varieties will be loaded here -->
                    </div>
                </div>
            </section>

            <section id="reservation-section" class="hidden">
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <h2 class="text-3xl font-bold text-gray-800 mb-8">حجز جديد</h2>
                    <div id="reservation-content">
                        <!-- Reservation form will be loaded here -->
                    </div>
                </div>
            </section>

            <section id="status-section" class="hidden">
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <h2 class="text-3xl font-bold text-gray-800 mb-8">حالة الحجز</h2>
                    <div id="status-content">
                        <!-- Status check form will be loaded here -->
                    </div>
                </div>
            </section>
        </main>

        <!-- Footer -->
        <footer class="bg-gray-800 text-white mt-12">
            <div class="container mx-auto px-6 py-8">
                <div class="grid md:grid-cols-4 gap-8">
                    <div>
                        <div class="flex items-center mb-4">
                            <div class="bg-green-500 text-white p-2 rounded-full ml-3">
                                <i class="fas fa-seedling"></i>
                            </div>
                            <h3 class="text-xl font-bold">نظام حجز البذور</h3>
                        </div>
                        <p class="text-gray-300 text-sm">منصة إلكترونية موثوقة لحجز وتوزيع بذور البطاطا عالية الجودة في العراق</p>
                    </div>
                    
                    <div>
                        <h4 class="text-lg font-bold mb-4">روابط مفيدة</h4>
                        <ul class="space-y-2 text-sm text-gray-300">
                            <li><a href="#" class="hover:text-green-400 transition-colors">دليل المستخدم</a></li>
                            <li><a href="#" class="hover:text-green-400 transition-colors">الشروط والأحكام</a></li>
                            <li><a href="#" class="hover:text-green-400 transition-colors">سياسة الخصوصية</a></li>
                            <li><a href="#" class="hover:text-green-400 transition-colors">اتصل بنا</a></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="text-lg font-bold mb-4">معلومات التواصل</h4>
                        <ul class="space-y-2 text-sm text-gray-300">
                            <li><i class="fas fa-phone ml-2"></i>+964 770 123 4567</li>
                            <li><i class="fas fa-envelope ml-2"></i>info@potato-seeds.iq</li>
                            <li><i class="fas fa-map-marker-alt ml-2"></i>بغداد، العراق</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="text-lg font-bold mb-4">أوقات العمل</h4>
                        <ul class="space-y-2 text-sm text-gray-300">
                            <li>الأحد - الخميس: 8:00 ص - 4:00 م</li>
                            <li>الجمعة: 9:00 ص - 2:00 م</li>
                            <li>السبت: مغلق</li>
                        </ul>
                    </div>
                </div>
                
                <div class="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
                    <p>&copy; 2024 نظام حجز بذور البطاطا. جميع الحقوق محفوظة.</p>
                </div>
            </div>
        </footer>

        <!-- Loading Overlay -->
        <div id="loading-overlay" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden">
            <div class="bg-white rounded-lg p-8 flex items-center space-x-4 space-x-reverse">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span class="text-gray-700">جاري التحميل...</span>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app