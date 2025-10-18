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

// Get all seed varieties (for admin)
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

// ======================================
// Admin APIs for Quotas and Reports Management
// ======================================

// Update province quota (Admin only)
app.put('/api/admin/provinces/:id/quota', async (c) => {
  try {
    const provinceId = c.req.param('id');
    const { quota_tons } = await c.req.json();
    
    if (!quota_tons || quota_tons <= 0) {
      return c.json({ success: false, error: 'يجب أن تكون الحصة أكبر من صفر' }, 400);
    }

    // Get current province data
    const province = await c.env.DB.prepare(`
      SELECT quota_tons, remaining_quota FROM provinces WHERE id = ?
    `).bind(provinceId).first();

    if (!province) {
      return c.json({ success: false, error: 'المحافظة غير موجودة' }, 404);
    }

    // Calculate new remaining quota
    const consumedQuota = province.quota_tons - province.remaining_quota;
    const newRemainingQuota = quota_tons - consumedQuota;

    if (newRemainingQuota < 0) {
      return c.json({ 
        success: false, 
        error: `لا يمكن تقليل الحصة إلى أقل من الكمية المستهلكة (${consumedQuota} طن)` 
      }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE provinces 
      SET quota_tons = ?, remaining_quota = ? 
      WHERE id = ?
    `).bind(quota_tons, newRemainingQuota, provinceId).run();

    return c.json({ 
      success: true, 
      message: 'تم تحديث الحصة بنجاح',
      data: { 
        quota_tons: quota_tons,
        remaining_quota: newRemainingQuota,
        consumed_quota: consumedQuota
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في تحديث الحصة' }, 500);
  }
});

// Get detailed quotas report
app.get('/api/admin/quotas-report', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        p.id,
        p.name as province_name,
        p.quota_tons,
        p.remaining_quota,
        (p.quota_tons - p.remaining_quota) as consumed_quota,
        ROUND(((p.quota_tons - p.remaining_quota) * 100.0 / p.quota_tons), 2) as consumption_percentage,
        COUNT(r.id) as total_reservations,
        COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as approved_reservations,
        COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_reservations
      FROM provinces p
      LEFT JOIN reservations r ON p.id = r.province_id
      WHERE p.is_active = 1
      GROUP BY p.id, p.name, p.quota_tons, p.remaining_quota
      ORDER BY consumption_percentage DESC
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب تقرير الحصص' }, 500);
  }
});

// Get distributors with commission settings
app.get('/api/admin/distributors', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        d.id,
        d.name,
        d.commission_percentage,
        d.phone,
        d.address,
        d.is_active,
        p.name as province_name,
        COUNT(r.id) as total_reservations
      FROM distributors d
      LEFT JOIN provinces p ON d.province_id = p.id
      LEFT JOIN reservations r ON d.id = r.distributor_id
      GROUP BY d.id, d.name, d.commission_percentage, d.phone, d.address, d.is_active, p.name
      ORDER BY p.name, d.name
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب بيانات الموزعين' }, 500);
  }
});

// Update distributor commission percentage
app.put('/api/admin/distributors/:id/commission', async (c) => {
  try {
    const distributorId = c.req.param('id');
    const { commission_percentage } = await c.req.json();
    
    if (commission_percentage < 0 || commission_percentage > 100) {
      return c.json({ success: false, error: 'نسبة العمولة يجب أن تكون بين 0 و 100%' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE distributors 
      SET commission_percentage = ? 
      WHERE id = ?
    `).bind(commission_percentage, distributorId).run();

    return c.json({ 
      success: true, 
      message: 'تم تحديث نسبة العمولة بنجاح'
    });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في تحديث نسبة العمولة' }, 500);
  }
});

// Get consumption statistics by province
app.get('/api/admin/consumption-stats', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        p.name as province_name,
        p.quota_tons,
        p.remaining_quota,
        (p.quota_tons - p.remaining_quota) as consumed_quota,
        ROUND(((p.quota_tons - p.remaining_quota) * 100.0 / p.quota_tons), 1) as consumption_percentage,
        COUNT(DISTINCT f.id) as total_farmers,
        COUNT(DISTINCT r.id) as total_reservations,
        COALESCE(SUM(CASE WHEN r.status = 'approved' THEN ri.quantity_kg ELSE 0 END), 0) as approved_quantity,
        COALESCE(SUM(CASE WHEN r.status = 'pending' THEN ri.quantity_kg ELSE 0 END), 0) as pending_quantity
      FROM provinces p
      LEFT JOIN farmers f ON p.id = f.province_id
      LEFT JOIN reservations r ON p.id = r.province_id
      LEFT JOIN reservation_items ri ON r.id = ri.reservation_id
      WHERE p.is_active = 1
      GROUP BY p.id, p.name, p.quota_tons, p.remaining_quota
      ORDER BY consumed_quota DESC
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب إحصائيات الاستهلاك' }, 500);
  }
});

// Get all reservations for admin management
app.get('/api/admin/reservations', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT 
        r.id,
        r.farmer_id,
        r.total_quantity_kg,
        r.total_amount,
        r.delivery_date,
        r.distribution_method,
        r.status,
        r.notes,
        r.created_at,
        f.name as farmer_name,
        f.phone as farmer_phone,
        f.id_number as farmer_id_number,
        p.name as province_name,
        d.name as distributor_name,
        COUNT(ri.id) as items_count
      FROM reservations r
      INNER JOIN farmers f ON r.farmer_id = f.id
      INNER JOIN provinces p ON r.province_id = p.id
      LEFT JOIN distributors d ON r.distributor_id = d.id
      LEFT JOIN reservation_items ri ON r.id = ri.reservation_id
      GROUP BY r.id, r.farmer_id, r.total_quantity_kg, r.total_amount, r.delivery_date, 
               r.distribution_method, r.status, r.notes, r.created_at, 
               f.name, f.phone, f.id_number, p.name, d.name
      ORDER BY r.created_at DESC
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب بيانات الحجوزات' }, 500);
  }
});

// Get reservation details with items
app.get('/api/admin/reservations/:id', async (c) => {
  try {
    const reservationId = c.req.param('id');
    
    // Get reservation details
    const reservation = await c.env.DB.prepare(`
      SELECT 
        r.*,
        f.name as farmer_name,
        f.phone as farmer_phone,
        f.id_number as farmer_id_number,
        f.address as farmer_address,
        p.name as province_name,
        d.name as distributor_name,
        d.phone as distributor_phone,
        d.address as distributor_address
      FROM reservations r
      INNER JOIN farmers f ON r.farmer_id = f.id
      INNER JOIN provinces p ON r.province_id = p.id
      LEFT JOIN distributors d ON r.distributor_id = d.id
      WHERE r.id = ?
    `).bind(reservationId).first();

    if (!reservation) {
      return c.json({ success: false, error: 'الحجز غير موجود' }, 404);
    }

    // Get reservation items
    const { results: items } = await c.env.DB.prepare(`
      SELECT 
        ri.*,
        sv.name as seed_name,
        sv.description as seed_description
      FROM reservation_items ri
      INNER JOIN seed_varieties sv ON ri.seed_variety_id = sv.id
      WHERE ri.reservation_id = ?
    `).bind(reservationId).all();

    return c.json({ success: true, data: { reservation, items } });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب تفاصيل الحجز' }, 500);
  }
});

// Update reservation status with quota deduction
app.put('/api/admin/reservations/:id/status', async (c) => {
  try {
    const reservationId = c.req.param('id');
    const { status, admin_notes } = await c.req.json();
    
    if (!['pending', 'approved', 'rejected', 'delivered'].includes(status)) {
      return c.json({ success: false, error: 'حالة غير صحيحة' }, 400);
    }

    // Get current reservation details
    const reservation = await c.env.DB.prepare(`
      SELECT r.*, p.name as province_name, p.remaining_quota 
      FROM reservations r 
      INNER JOIN provinces p ON r.province_id = p.id 
      WHERE r.id = ?
    `).bind(reservationId).first();

    if (!reservation) {
      return c.json({ success: false, error: 'الحجز غير موجود' }, 404);
    }

    const currentStatus = reservation.status;
    
    // Handle quota changes when status changes
    let quotaChange = 0;
    let movementDescription = '';
    
    if (currentStatus !== status) {
      // If changing from non-approved to approved: deduct quota
      if (currentStatus !== 'approved' && status === 'approved') {
        quotaChange = -reservation.total_quantity_kg;
        movementDescription = `خصم حصة عند الموافقة على الحجز #${reservationId}`;
        
        // Check if enough quota available
        if (reservation.remaining_quota < reservation.total_quantity_kg) {
          return c.json({ 
            success: false, 
            error: `الكمية المطلوبة (${reservation.total_quantity_kg} كجم) تتجاوز الحصة المتاحة (${reservation.remaining_quota} كجم) للمحافظة` 
          }, 400);
        }
      }
      // If changing from approved to non-approved: add quota back
      else if (currentStatus === 'approved' && status !== 'approved') {
        quotaChange = reservation.total_quantity_kg;
        movementDescription = `إرجاع حصة عند إلغاء الموافقة على الحجز #${reservationId}`;
      }
    }

    // Start transaction-like operations
    // Update reservation status
    await c.env.DB.prepare(`
      UPDATE reservations 
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(status, admin_notes || null, reservationId).run();

    // Update province quota if needed
    if (quotaChange !== 0) {
      const newQuota = reservation.remaining_quota + quotaChange;
      
      await c.env.DB.prepare(`
        UPDATE provinces 
        SET remaining_quota = ? 
        WHERE id = ?
      `).bind(newQuota, reservation.province_id).run();

      // Record quota movement
      await c.env.DB.prepare(`
        INSERT INTO quota_movements 
        (province_id, reservation_id, movement_type, quantity_kg, previous_quota, new_quota, description, admin_user)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        reservation.province_id,
        reservationId,
        quotaChange < 0 ? 'deduction' : 'addition',
        Math.abs(quotaChange),
        reservation.remaining_quota,
        newQuota,
        movementDescription,
        'admin'
      ).run();
    }

    return c.json({ 
      success: true, 
      message: 'تم تحديث حالة الحجز بنجاح',
      quota_updated: quotaChange !== 0,
      new_quota: quotaChange !== 0 ? reservation.remaining_quota + quotaChange : reservation.remaining_quota
    });
  } catch (error) {
    console.error('Error updating reservation status:', error);
    return c.json({ success: false, error: 'خطأ في تحديث حالة الحجز' }, 500);
  }
});

// Get/Set province seed allocations
app.get('/api/admin/provinces/:id/allocations', async (c) => {
  try {
    const provinceId = c.req.param('id');
    
    const { results } = await c.env.DB.prepare(`
      SELECT 
        pa.*,
        sv.name as seed_name,
        sv.description as seed_description,
        sv.price_per_kg,
        sv.image_url
      FROM province_allocations pa
      INNER JOIN seed_varieties sv ON pa.seed_variety_id = sv.id
      WHERE pa.province_id = ? AND pa.is_active = 1
      ORDER BY sv.rank ASC, sv.name ASC
    `).bind(provinceId).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب تخصيصات المحافظة' }, 500);
  }
});

app.post('/api/admin/provinces/:id/allocations', async (c) => {
  try {
    const provinceId = c.req.param('id');
    const { seed_variety_id, allocated_quantity_kg, min_order_kg, max_order_kg } = await c.req.json();
    
    // Insert or update allocation
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO province_allocations 
      (province_id, seed_variety_id, allocated_quantity_kg, min_order_kg, max_order_kg, admin_user, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(provinceId, seed_variety_id, allocated_quantity_kg, min_order_kg, max_order_kg, 'admin').run();

    return c.json({ success: true, message: 'تم حفظ تخصيص الصنف للمحافظة' });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في حفظ التخصيص' }, 500);
  }
});

app.delete('/api/admin/provinces/:provinceId/allocations/:allocationId', async (c) => {
  try {
    const allocationId = c.req.param('allocationId');
    
    await c.env.DB.prepare(`
      UPDATE province_allocations 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(allocationId).run();

    return c.json({ success: true, message: 'تم حذف التخصيص' });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في حذف التخصيص' }, 500);
  }
});

// Get allocated seed varieties for a specific province (for farmers)
app.get('/api/seed-varieties/:provinceId', async (c) => {
  try {
    const provinceId = c.req.param('provinceId');
    
    const { results } = await c.env.DB.prepare(`
      SELECT 
        sv.*,
        pa.allocated_quantity_kg,
        pa.min_order_kg as province_min_order_kg,
        pa.max_order_kg as province_max_order_kg
      FROM seed_varieties sv
      INNER JOIN province_allocations pa ON sv.id = pa.seed_variety_id
      WHERE pa.province_id = ? AND pa.is_active = 1 AND sv.is_active = 1
        AND pa.allocated_quantity_kg > 0
      ORDER BY sv.rank ASC, sv.name ASC
    `).bind(provinceId).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب أصناف المحافظة' }, 500);
  }
});

// Update reservation details (edit before approval)
app.put('/api/admin/reservations/:id/edit', async (c) => {
  try {
    const reservationId = c.req.param('id');
    const { items, delivery_date, edit_reason } = await c.req.json();
    
    // Get current reservation
    const reservation = await c.env.DB.prepare(`
      SELECT * FROM reservations WHERE id = ?
    `).bind(reservationId).first();
    
    if (!reservation) {
      return c.json({ success: false, error: 'الحجز غير موجود' }, 404);
    }
    
    if (reservation.status !== 'pending') {
      return c.json({ success: false, error: 'يمكن تعديل الطلبات المعلقة فقط' }, 400);
    }

    // Calculate new totals
    let newTotalQuantity = 0;
    let newTotalAmount = 0;
    
    for (const item of items) {
      newTotalQuantity += parseFloat(item.quantity_kg);
      newTotalAmount += parseFloat(item.total_price);
    }

    // Store original values if not already stored
    const originalQuantity = reservation.original_total_quantity_kg || reservation.total_quantity_kg;
    const originalAmount = reservation.original_total_amount || reservation.total_amount;

    // Update reservation
    await c.env.DB.prepare(`
      UPDATE reservations 
      SET total_quantity_kg = ?, total_amount = ?, delivery_date = ?,
          original_total_quantity_kg = ?, original_total_amount = ?,
          edited_by_admin = 1, edit_reason = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      newTotalQuantity, newTotalAmount, delivery_date,
      originalQuantity, originalAmount,
      edit_reason, reservationId
    ).run();

    // Delete existing items
    await c.env.DB.prepare(`DELETE FROM reservation_items WHERE reservation_id = ?`).bind(reservationId).run();

    // Insert new items
    for (const item of items) {
      await c.env.DB.prepare(`
        INSERT INTO reservation_items (reservation_id, seed_variety_id, quantity_kg, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
      `).bind(reservationId, item.seed_variety_id, item.quantity_kg, item.unit_price, item.total_price).run();
    }

    return c.json({ 
      success: true, 
      message: 'تم تحديث الطلب بنجاح',
      new_total_quantity: newTotalQuantity,
      new_total_amount: newTotalAmount
    });
  } catch (error) {
    console.error('Error editing reservation:', error);
    return c.json({ success: false, error: 'خطأ في تحديث الطلب' }, 500);
  }
});

// Get quota movements for a province
app.get('/api/admin/provinces/:id/quota-movements', async (c) => {
  try {
    const provinceId = c.req.param('id');
    
    const { results } = await c.env.DB.prepare(`
      SELECT 
        qm.*,
        r.id as reservation_number,
        f.name as farmer_name
      FROM quota_movements qm
      LEFT JOIN reservations r ON qm.reservation_id = r.id
      LEFT JOIN farmers f ON r.farmer_id = f.id
      WHERE qm.province_id = ?
      ORDER BY qm.created_at DESC
      LIMIT 50
    `).bind(provinceId).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب حركات الحصص' }, 500);
  }
});

// Get reservations summary statistics
app.get('/api/admin/reservations-stats', async (c) => {
  try {
    const { results: stats } = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_reservations,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_reservations,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_reservations,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_reservations,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_reservations,
        COALESCE(SUM(total_quantity_kg), 0) as total_quantity,
        COALESCE(SUM(total_amount), 0) as total_amount,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM reservations
    `).all();

    return c.json({ success: true, data: stats[0] || {} });
  } catch (error) {
    return c.json({ success: false, error: 'خطأ في جلب إحصائيات الحجوزات' }, 500);
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
                            <span>+967 777 123 456</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fas fa-envelope ml-2"></i>
                            <span>info@potato-seeds.ye</span>
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
        <main id="main-content" class="container mx-auto px-6 py-8">
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
                        <p class="text-gray-300 text-sm">منصة إلكترونية موثوقة لحجز وتوزيع بذور البطاطا عالية الجودة في اليمن</p>
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
                            <li><i class="fas fa-phone ml-2"></i>+967 777 123 456</li>
                            <li><i class="fas fa-envelope ml-2"></i>info@potato-seeds.ye</li>
                            <li><i class="fas fa-map-marker-alt ml-2"></i>صنعاء، اليمن</li>
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
                    <p>&copy; 2024 نظام حجز بذور البطاطا - اليمن. جميع الحقوق محفوظة.</p>
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