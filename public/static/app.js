// Potato Seeds Reservation System - Frontend Application
// Author: AI Assistant
// Date: 2024

class PotatoSeedsApp {
    constructor() {
        this.currentSection = 'home';
        this.currentFarmer = null;
        this.cart = [];
        this.provinces = [];
        this.seedVarieties = [];
        this.distributors = [];
        
        this.init();
    }

    init() {
        this.loadInitialData();
        this.setupEventListeners();
        this.showSection('home');
    }

    async loadInitialData() {
        try {
            await Promise.all([
                this.loadProvinces(),
                this.loadSeedVarieties()
            ]);
        } catch (error) {
            console.error('خطأ في تحميل البيانات الأولية:', error);
            this.showError('خطأ في تحميل البيانات. يرجى إعادة تحميل الصفحة.');
        }
    }

    async loadProvinces() {
        try {
            const response = await axios.get('/api/provinces');
            if (response.data.success) {
                this.provinces = response.data.data;
            }
        } catch (error) {
            console.error('Error loading provinces:', error);
        }
    }

    async loadSeedVarieties() {
        try {
            const response = await axios.get('/api/seed-varieties');
            if (response.data.success) {
                this.seedVarieties = response.data.data;
            }
        } catch (error) {
            console.error('Error loading seed varieties:', error);
        }
    }

    async loadDistributors(provinceId) {
        try {
            const response = await axios.get(`/api/distributors/${provinceId}`);
            if (response.data.success) {
                this.distributors = response.data.data;
                return this.distributors;
            }
        } catch (error) {
            console.error('Error loading distributors:', error);
            return [];
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sectionId = e.target.id.replace('nav-', '');
                this.showSection(sectionId);
            });
        });

        // Quick action buttons
        document.getElementById('start-reservation')?.addEventListener('click', () => {
            this.showSection('reservation');
        });

        document.getElementById('check-status')?.addEventListener('click', () => {
            this.showSection('status');
        });

        // Staff login button
        document.getElementById('staff-login')?.addEventListener('click', () => {
            this.showStaffLogin();
        });
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('[id$="-section"]').forEach(section => {
            section.classList.add('hidden');
        });

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected section
        const section = document.getElementById(`${sectionId}-section`);
        if (section) {
            section.classList.remove('hidden');
            section.classList.add('fade-in-up');
        }

        // Update active nav button
        const navBtn = document.getElementById(`nav-${sectionId}`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        // Load section content
        this.loadSectionContent(sectionId);
        this.currentSection = sectionId;
    }

    async loadSectionContent(sectionId) {
        switch (sectionId) {
            case 'varieties':
                this.renderVarieties();
                break;
            case 'reservation':
                this.renderReservationForm();
                break;
            case 'status':
                this.renderStatusForm();
                break;
        }
    }

    renderVarieties() {
        const container = document.getElementById('varieties-grid');
        if (!container || this.seedVarieties.length === 0) return;

        container.innerHTML = this.seedVarieties.map(variety => `
            <div class="variety-card bg-white rounded-xl shadow-lg overflow-hidden">
                <div class="h-48 bg-gradient-to-br from-green-100 to-emerald-200 flex items-center justify-center">
                    <i class="fas fa-seedling text-6xl text-green-600"></i>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-gray-800">${variety.name}</h3>
                        <span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                            رتبة ${variety.rank}
                        </span>
                    </div>
                    <p class="text-gray-600 mb-4 text-sm">${variety.description}</p>
                    <div class="space-y-2 text-sm">
                        <div class="flex justify-between">
                            <span class="text-gray-500">السعر لكل كيلو:</span>
                            <span class="font-bold text-green-600">${this.formatPrice(variety.price_per_kg)} ر.ي</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">الحد الأدنى للطلب:</span>
                            <span class="font-semibold">${variety.min_order_kg} كيلو</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-500">الحد الأقصى للطلب:</span>
                            <span class="font-semibold">${variety.max_order_kg} كيلو</span>
                        </div>
                    </div>
                    <button onclick="app.addToCart(${variety.id})" 
                            class="w-full mt-4 btn-primary text-white py-2 px-4 rounded-lg font-medium">
                        <i class="fas fa-cart-plus ml-2"></i>إضافة للسلة
                    </button>
                </div>
            </div>
        `).join('');

        // Setup sort functionality
        document.getElementById('sort-varieties')?.addEventListener('change', (e) => {
            this.sortVarieties(e.target.value);
        });

        document.getElementById('refresh-varieties')?.addEventListener('click', () => {
            this.loadSeedVarieties().then(() => this.renderVarieties());
        });
    }

    renderReservationForm() {
        const container = document.getElementById('reservation-content');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-8">
                <!-- Progress Steps -->
                <div class="flex items-center justify-center space-x-8 space-x-reverse mb-8">
                    <div class="progress-step active">
                        <div class="step-circle">1</div>
                        <span class="font-medium">بيانات المزارع</span>
                    </div>
                    <div class="progress-step">
                        <div class="step-circle">2</div>
                        <span class="font-medium">اختيار الأصناف</span>
                    </div>
                    <div class="progress-step">
                        <div class="step-circle">3</div>
                        <span class="font-medium">تفاصيل الحجز</span>
                    </div>
                    <div class="progress-step">
                        <div class="step-circle">4</div>
                        <span class="font-medium">التأكيد</span>
                    </div>
                </div>

                <!-- Step 1: Farmer Information -->
                <div id="step-1" class="bg-gray-50 rounded-lg p-6">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6">بيانات المزارع</h3>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل *</label>
                            <input type="text" id="farmer-name" class="form-input w-full px-4 py-3 rounded-lg" 
                                   placeholder="أدخل الاسم الكامل" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">رقم الهوية *</label>
                            <input type="text" id="farmer-id" class="form-input w-full px-4 py-3 rounded-lg" 
                                   placeholder="رقم الهوية الوطنية" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                            <input type="tel" id="farmer-phone" class="form-input w-full px-4 py-3 rounded-lg" 
                                   placeholder="07XX XXX XXXX" dir="ltr">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">المحافظة *</label>
                            <select id="farmer-province" class="form-input w-full px-4 py-3 rounded-lg" required>
                                <option value="">اختر المحافظة</option>
                                ${this.provinces.map(province => 
                                    `<option value="${province.id}">${province.name} - (متوفر: ${province.remaining_quota} طن)</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">العنوان</label>
                            <textarea id="farmer-address" class="form-input w-full px-4 py-3 rounded-lg" 
                                      rows="2" placeholder="العنوان التفصيلي"></textarea>
                        </div>
                    </div>
                    <div class="flex justify-between mt-6">
                        <button id="check-existing-farmer" class="btn-secondary text-white py-2 px-6 rounded-lg">
                            <i class="fas fa-search ml-2"></i>التحقق من مزارع موجود
                        </button>
                        <button id="continue-to-step2" class="btn-primary text-white py-2 px-6 rounded-lg">
                            التالي <i class="fas fa-arrow-left mr-2"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 2: Seed Selection (Hidden initially) -->
                <div id="step-2" class="bg-gray-50 rounded-lg p-6 hidden">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6">اختيار الأصناف والكميات</h3>
                    <div id="seed-selection-grid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <!-- Seed varieties will be loaded here -->
                    </div>
                    <div id="cart-summary" class="cart-summary hidden">
                        <h4 class="text-lg font-bold text-gray-800 mb-4">ملخص الطلب</h4>
                        <div id="cart-items"></div>
                        <div class="border-t border-green-300 pt-4 mt-4">
                            <div class="flex justify-between text-lg font-bold">
                                <span>المجموع الكلي:</span>
                                <span id="total-amount">0 ر.ي</span>
                            </div>
                            <div class="flex justify-between text-sm text-gray-600">
                                <span>إجمالي الكمية:</span>
                                <span id="total-quantity">0 كيلو</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex justify-between mt-6">
                        <button id="back-to-step1" class="btn-secondary text-white py-2 px-6 rounded-lg">
                            <i class="fas fa-arrow-right ml-2"></i>السابق
                        </button>
                        <button id="continue-to-step3" class="btn-primary text-white py-2 px-6 rounded-lg" disabled>
                            التالي <i class="fas fa-arrow-left mr-2"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 3: Reservation Details -->
                <div id="step-3" class="bg-gray-50 rounded-lg p-6 hidden">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6">تفاصيل الحجز</h3>
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">موعد التسليم المطلوب *</label>
                            <input type="date" id="delivery-date" class="form-input w-full px-4 py-3 rounded-lg" 
                                   min="" required>
                            <p class="text-xs text-gray-500 mt-1">يمكن الحجز حتى 6 أشهر مقدماً</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">طريقة التوزيع *</label>
                            <select id="distribution-method" class="form-input w-full px-4 py-3 rounded-lg" required>
                                <option value="">اختر طريقة التوزيع</option>
                                <option value="distributor">عبر الموزع المحلي</option>
                                <option value="direct">التسليم المباشر من الشركة</option>
                            </select>
                        </div>
                        <div id="distributor-selection" class="md:col-span-2 hidden">
                            <label class="block text-sm font-medium text-gray-700 mb-2">اختيار الموزع</label>
                            <select id="selected-distributor" class="form-input w-full px-4 py-3 rounded-lg">
                                <option value="">اختر الموزع</option>
                            </select>
                            <div id="distributor-info" class="mt-3 p-3 bg-blue-50 rounded-lg hidden">
                                <!-- Distributor details will be shown here -->
                            </div>
                        </div>
                        <div class="md:col-span-2">
                            <div class="bg-white border border-gray-200 rounded-lg p-4">
                                <h4 class="font-bold text-gray-800 mb-3">معلومات الحصة المتبقية</h4>
                                <div id="quota-info" class="grid md:grid-cols-3 gap-4">
                                    <!-- Quota information will be loaded here -->
                                </div>
                            </div>
                        </div>
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 mb-2">ملاحظات إضافية</label>
                            <textarea id="reservation-notes" class="form-input w-full px-4 py-3 rounded-lg" 
                                      rows="3" placeholder="أي ملاحظات أو طلبات خاصة..."></textarea>
                        </div>
                    </div>
                    <div class="flex justify-between mt-6">
                        <button id="back-to-step2" class="btn-secondary text-white py-2 px-6 rounded-lg">
                            <i class="fas fa-arrow-right ml-2"></i>السابق
                        </button>
                        <button id="continue-to-step4" class="btn-primary text-white py-2 px-6 rounded-lg">
                            التالي <i class="fas fa-arrow-left mr-2"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 4: Confirmation -->
                <div id="step-4" class="bg-gray-50 rounded-lg p-6 hidden">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6">تأكيد الحجز</h3>
                    <div class="bg-white rounded-lg p-6 shadow-sm">
                        <h4 class="text-xl font-bold text-gray-800 mb-4">مراجعة تفاصيل الحجز</h4>
                        
                        <!-- Farmer Information -->
                        <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h5 class="font-bold text-gray-700 mb-2">بيانات المزارع</h5>
                            <div id="farmer-summary" class="text-sm text-gray-600">
                                <!-- Farmer details will be shown here -->
                            </div>
                        </div>

                        <!-- Order Summary -->
                        <div class="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                            <h5 class="font-bold text-green-800 mb-3">ملخص الطلب</h5>
                            <div id="final-order-summary">
                                <!-- Final order summary will be shown here -->
                            </div>
                        </div>

                        <!-- Delivery Information -->
                        <div class="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <h5 class="font-bold text-blue-800 mb-2">معلومات التسليم</h5>
                            <div id="delivery-summary" class="text-sm text-gray-700">
                                <!-- Delivery details will be shown here -->
                            </div>
                        </div>

                        <!-- Terms and Conditions -->
                        <div class="mb-6 p-4 border border-gray-200 rounded-lg">
                            <h5 class="font-bold text-gray-700 mb-3">الشروط والأحكام</h5>
                            <div class="text-sm text-gray-600 space-y-2">
                                <div class="flex items-start">
                                    <i class="fas fa-check text-green-500 ml-2 mt-1"></i>
                                    <span>يتم مراجعة الطلب من قبل الشركة خلال 48 ساعة</span>
                                </div>
                                <div class="flex items-start">
                                    <i class="fas fa-check text-green-500 ml-2 mt-1"></i>
                                    <span>يجب دفع 30% من قيمة الطلب كعربون عند الموافقة</span>
                                </div>
                                <div class="flex items-start">
                                    <i class="fas fa-check text-green-500 ml-2 mt-1"></i>
                                    <span>يتم التسليم في التاريخ المحدد حسب التوفر</span>
                                </div>
                                <div class="flex items-start">
                                    <i class="fas fa-check text-green-500 ml-2 mt-1"></i>
                                    <span>ضمان جودة البذور لمدة عام من تاريخ التسليم</span>
                                </div>
                            </div>
                        </div>

                        <!-- Agreement Checkbox -->
                        <div class="mb-6">
                            <label class="flex items-center">
                                <input type="checkbox" id="terms-agreement" class="ml-2">
                                <span class="text-sm text-gray-700">أوافق على الشروط والأحكام المذكورة أعلاه</span>
                            </label>
                        </div>
                    </div>

                    <div class="flex justify-between mt-6">
                        <button id="back-to-step3" class="btn-secondary text-white py-2 px-6 rounded-lg">
                            <i class="fas fa-arrow-right ml-2"></i>السابق
                        </button>
                        <button id="confirm-reservation" class="btn-primary text-white py-3 px-8 rounded-lg text-lg font-bold" disabled>
                            <i class="fas fa-check-circle ml-2"></i>تأكيد الحجز
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.setupReservationEventListeners();
    }

    setupReservationEventListeners() {
        // Check existing farmer
        document.getElementById('check-existing-farmer')?.addEventListener('click', async () => {
            const idNumber = document.getElementById('farmer-id').value.trim();
            if (!idNumber) {
                this.showError('يرجى إدخال رقم الهوية أولاً');
                return;
            }

            this.showLoading(true);
            try {
                const response = await axios.get(`/api/farmers/${idNumber}`);
                if (response.data.success) {
                    const farmer = response.data.data;
                    // Fill form with existing farmer data
                    document.getElementById('farmer-name').value = farmer.name;
                    document.getElementById('farmer-phone').value = farmer.phone || '';
                    document.getElementById('farmer-province').value = farmer.province_id;
                    document.getElementById('farmer-address').value = farmer.address || '';
                    this.currentFarmer = farmer;
                    this.showSuccess('تم العثور على بيانات المزارع');
                } else {
                    this.showError('المزارع غير مسجل. يرجى ملء البيانات للتسجيل');
                }
            } catch (error) {
                this.showError('خطأ في البحث عن المزارع');
            } finally {
                this.showLoading(false);
            }
        });

        // Continue to step 2
        document.getElementById('continue-to-step2')?.addEventListener('click', async () => {
            if (await this.validateAndSaveFarmer()) {
                this.showStep(2);
            }
        });

        // Back to step 1
        document.getElementById('back-to-step1')?.addEventListener('click', () => {
            this.showStep(1);
        });

        // Continue to step 3
        document.getElementById('continue-to-step3')?.addEventListener('click', () => {
            if (this.validateCart()) {
                this.showStep(3);
            }
        });

        // Back to step 2
        document.getElementById('back-to-step2')?.addEventListener('click', () => {
            this.showStep(2);
        });

        // Continue to step 4
        document.getElementById('continue-to-step4')?.addEventListener('click', async () => {
            if (await this.validateDeliveryDetails()) {
                this.showStep(4);
            }
        });

        // Back to step 3
        document.getElementById('back-to-step3')?.addEventListener('click', () => {
            this.showStep(3);
        });

        // Confirm reservation
        document.getElementById('confirm-reservation')?.addEventListener('click', async () => {
            await this.submitReservation();
        });

        // Terms agreement
        document.getElementById('terms-agreement')?.addEventListener('change', (e) => {
            const confirmBtn = document.getElementById('confirm-reservation');
            if (confirmBtn) {
                if (e.target.checked) {
                    confirmBtn.removeAttribute('disabled');
                } else {
                    confirmBtn.setAttribute('disabled', 'true');
                }
            }
        });

        // Distribution method change
        document.getElementById('distribution-method')?.addEventListener('change', async (e) => {
            await this.handleDistributionMethodChange(e.target.value);
        });
    }

    async validateAndSaveFarmer() {
        const name = document.getElementById('farmer-name').value.trim();
        const idNumber = document.getElementById('farmer-id').value.trim();
        const provinceId = document.getElementById('farmer-province').value;
        
        if (!name || !idNumber || !provinceId) {
            this.showError('يرجى ملء الحقول المطلوبة (*)');
            return false;
        }

        // If farmer doesn't exist, register new one
        if (!this.currentFarmer) {
            this.showLoading(true);
            try {
                const response = await axios.post('/api/farmers', {
                    name,
                    id_number: idNumber,
                    phone: document.getElementById('farmer-phone').value.trim(),
                    province_id: parseInt(provinceId),
                    address: document.getElementById('farmer-address').value.trim()
                });

                if (response.data.success) {
                    this.currentFarmer = {
                        id: response.data.farmer_id,
                        name,
                        id_number: idNumber,
                        province_id: parseInt(provinceId)
                    };
                    this.showSuccess(response.data.message);
                    return true;
                } else {
                    this.showError(response.data.error);
                    return false;
                }
            } catch (error) {
                this.showError('خطأ في حفظ بيانات المزارع');
                return false;
            } finally {
                this.showLoading(false);
            }
        }

        return true;
    }

    showStep(stepNumber) {
        // Hide all steps
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`step-${i}`);
            if (step) step.classList.add('hidden');
        }

        // Show current step
        const currentStep = document.getElementById(`step-${stepNumber}`);
        if (currentStep) {
            currentStep.classList.remove('hidden');
            currentStep.classList.add('fade-in-up');
        }

        // Update progress
        document.querySelectorAll('.progress-step').forEach((step, index) => {
            if (index < stepNumber - 1) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (index === stepNumber - 1) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });

        // Load step-specific content
        if (stepNumber === 2) {
            this.renderSeedSelection();
        } else if (stepNumber === 3) {
            this.setupDeliveryStep();
        } else if (stepNumber === 4) {
            this.renderConfirmationStep();
        }
    }

    renderSeedSelection() {
        const container = document.getElementById('seed-selection-grid');
        if (!container || this.seedVarieties.length === 0) return;

        container.innerHTML = this.seedVarieties.map(variety => `
            <div class="variety-card bg-white rounded-lg p-4 border-2 border-gray-200" data-variety-id="${variety.id}">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="font-bold text-gray-800">${variety.name}</h4>
                    <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        رتبة ${variety.rank}
                    </span>
                </div>
                <p class="text-sm text-gray-600 mb-3">${variety.description}</p>
                <div class="text-sm space-y-1 mb-4">
                    <div class="flex justify-between">
                        <span>السعر:</span>
                        <span class="font-bold text-green-600">${this.formatPrice(variety.price_per_kg)} ر.ي/كيلو</span>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>الحد الأدنى: ${variety.min_order_kg} كيلو</span>
                        <span>الحد الأقصى: ${variety.max_order_kg} كيلو</span>
                    </div>
                </div>
                <div class="quantity-control">
                    <button class="quantity-btn" onclick="app.decreaseQuantity(${variety.id})">-</button>
                    <input type="number" class="quantity-input" id="qty-${variety.id}" 
                           value="0" min="0" max="${variety.max_order_kg}" 
                           onchange="app.updateQuantity(${variety.id}, this.value)">
                    <button class="quantity-btn" onclick="app.increaseQuantity(${variety.id})">+</button>
                </div>
            </div>
        `).join('');
    }

    addToCart(varietyId) {
        const variety = this.seedVarieties.find(v => v.id === varietyId);
        if (!variety) return;

        const existingItem = this.cart.find(item => item.seed_variety_id === varietyId);
        if (existingItem) {
            existingItem.quantity_kg += variety.min_order_kg;
        } else {
            this.cart.push({
                seed_variety_id: varietyId,
                variety_name: variety.name,
                quantity_kg: variety.min_order_kg,
                unit_price: variety.price_per_kg,
                total_price: variety.min_order_kg * variety.price_per_kg
            });
        }

        this.updateCartSummary();
    }

    increaseQuantity(varietyId) {
        const variety = this.seedVarieties.find(v => v.id === varietyId);
        const input = document.getElementById(`qty-${varietyId}`);
        const currentValue = parseInt(input.value) || 0;
        const newValue = Math.min(currentValue + variety.min_order_kg, variety.max_order_kg);
        input.value = newValue;
        this.updateQuantity(varietyId, newValue);
    }

    decreaseQuantity(varietyId) {
        const variety = this.seedVarieties.find(v => v.id === varietyId);
        const input = document.getElementById(`qty-${varietyId}`);
        const currentValue = parseInt(input.value) || 0;
        const newValue = Math.max(currentValue - variety.min_order_kg, 0);
        input.value = newValue;
        this.updateQuantity(varietyId, newValue);
    }

    updateQuantity(varietyId, quantity) {
        quantity = parseInt(quantity) || 0;
        const variety = this.seedVarieties.find(v => v.id === varietyId);
        if (!variety) return;

        // Validate quantity limits
        if (quantity < 0) quantity = 0;
        if (quantity > variety.max_order_kg) quantity = variety.max_order_kg;
        if (quantity > 0 && quantity < variety.min_order_kg) quantity = variety.min_order_kg;

        // Update input value
        document.getElementById(`qty-${varietyId}`).value = quantity;

        // Update cart
        const existingIndex = this.cart.findIndex(item => item.seed_variety_id === varietyId);
        
        if (quantity > 0) {
            const item = {
                seed_variety_id: varietyId,
                variety_name: variety.name,
                quantity_kg: quantity,
                unit_price: variety.price_per_kg,
                total_price: quantity * variety.price_per_kg
            };

            if (existingIndex >= 0) {
                this.cart[existingIndex] = item;
            } else {
                this.cart.push(item);
            }
        } else {
            if (existingIndex >= 0) {
                this.cart.splice(existingIndex, 1);
            }
        }

        // Update UI
        this.updateCartSummary();
        this.updateVarietyCardSelection(varietyId, quantity > 0);
    }

    updateVarietyCardSelection(varietyId, selected) {
        const card = document.querySelector(`[data-variety-id="${varietyId}"]`);
        if (card) {
            if (selected) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        }
    }

    updateCartSummary() {
        const cartSummary = document.getElementById('cart-summary');
        const continueBtn = document.getElementById('continue-to-step3');
        
        if (this.cart.length === 0) {
            cartSummary?.classList.add('hidden');
            continueBtn?.setAttribute('disabled', 'true');
            return;
        }

        cartSummary?.classList.remove('hidden');
        continueBtn?.removeAttribute('disabled');

        // Update cart items
        const cartItemsContainer = document.getElementById('cart-items');
        if (cartItemsContainer) {
            cartItemsContainer.innerHTML = this.cart.map(item => `
                <div class="flex justify-between items-center py-2 border-b border-green-200 last:border-b-0">
                    <div>
                        <span class="font-medium">${item.variety_name}</span>
                        <span class="text-sm text-gray-500 block">${item.quantity_kg} كيلو × ${this.formatPrice(item.unit_price)} ر.ي</span>
                    </div>
                    <span class="font-bold text-green-600">${this.formatPrice(item.total_price)} ر.ي</span>
                </div>
            `).join('');
        }

        // Update totals
        const totalQuantity = this.cart.reduce((sum, item) => sum + item.quantity_kg, 0);
        const totalAmount = this.cart.reduce((sum, item) => sum + item.total_price, 0);

        document.getElementById('total-quantity').textContent = `${totalQuantity} كيلو`;
        document.getElementById('total-amount').textContent = `${this.formatPrice(totalAmount)} ر.ي`;
    }

    renderStatusForm() {
        const container = document.getElementById('status-content');
        if (!container) return;

        container.innerHTML = `
            <div class="max-w-2xl mx-auto">
                <div class="bg-gray-50 rounded-lg p-6">
                    <h3 class="text-2xl font-bold text-gray-800 mb-6">تتبع حالة الحجز</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">رقم الهوية</label>
                            <input type="text" id="status-farmer-id" class="form-input w-full px-4 py-3 rounded-lg" 
                                   placeholder="أدخل رقم الهوية للبحث عن الحجوزات">
                        </div>
                        <button id="search-reservations" class="btn-primary text-white py-3 px-6 rounded-lg w-full">
                            <i class="fas fa-search ml-2"></i>البحث عن الحجوزات
                        </button>
                    </div>
                </div>
                <div id="reservations-results" class="mt-8 hidden">
                    <!-- Results will be displayed here -->
                </div>
            </div>
        `;

        // Setup search functionality
        document.getElementById('search-reservations')?.addEventListener('click', async () => {
            const idNumber = document.getElementById('status-farmer-id').value.trim();
            if (!idNumber) {
                this.showError('يرجى إدخال رقم الهوية');
                return;
            }

            this.showLoading(true);
            try {
                // First get farmer info
                const farmerResponse = await axios.get(`/api/farmers/${idNumber}`);
                if (!farmerResponse.data.success) {
                    this.showError('لم يتم العثور على مزارع بهذا الرقم');
                    return;
                }

                const farmer = farmerResponse.data.data;

                // Then get reservations
                const reservationsResponse = await axios.get(`/api/farmers/${farmer.id}/reservations`);
                if (reservationsResponse.data.success) {
                    this.displayReservations(reservationsResponse.data.data);
                } else {
                    this.showError('خطأ في جلب الحجوزات');
                }
            } catch (error) {
                this.showError('خطأ في البحث');
            } finally {
                this.showLoading(false);
            }
        });
    }

    displayReservations(reservations) {
        const container = document.getElementById('reservations-results');
        if (!container) return;

        if (reservations.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500 text-lg">لا توجد حجوزات لهذا المزارع</p>
                </div>
            `;
            container.classList.remove('hidden');
            return;
        }

        container.innerHTML = `
            <div class="space-y-4">
                <h4 class="text-xl font-bold text-gray-800">حجوزات المزارع (${reservations.length})</h4>
                ${reservations.map(reservation => `
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h5 class="text-lg font-bold text-gray-800">حجز رقم #${reservation.id}</h5>
                                <p class="text-gray-600">تاريخ الطلب: ${new Date(reservation.created_at).toLocaleDateString('ar-YE')}</p>
                            </div>
                            <span class="status-${reservation.status} px-3 py-1 rounded-full text-sm font-medium">
                                ${this.getStatusText(reservation.status)}
                            </span>
                        </div>
                        <div class="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500">المحافظة:</span>
                                <span class="font-medium mr-2">${reservation.province_name}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">طريقة التوزيع:</span>
                                <span class="font-medium mr-2">${reservation.distribution_method === 'direct' ? 'مباشر من الشركة' : 'عبر الموزع'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">إجمالي الكمية:</span>
                                <span class="font-medium mr-2">${reservation.total_quantity_kg} كيلو</span>
                            </div>
                            <div>
                                <span class="text-gray-500">إجمالي المبلغ:</span>
                                <span class="font-medium mr-2 text-green-600">${this.formatPrice(reservation.total_amount)} ر.ي</span>
                            </div>
                            <div>
                                <span class="text-gray-500">موعد التسليم:</span>
                                <span class="font-medium mr-2">${new Date(reservation.delivery_date).toLocaleDateString('ar-YE')}</span>
                            </div>
                            ${reservation.distributor_name ? `
                            <div>
                                <span class="text-gray-500">الموزع:</span>
                                <span class="font-medium mr-2">${reservation.distributor_name}</span>
                            </div>
                            ` : ''}
                        </div>
                        ${reservation.notes ? `
                        <div class="mt-4 p-3 bg-gray-50 rounded">
                            <span class="text-gray-500 text-sm">ملاحظات:</span>
                            <p class="text-gray-700 mt-1">${reservation.notes}</p>
                        </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
        container.classList.remove('hidden');
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'قيد المراجعة',
            'approved': 'تمت الموافقة',
            'rejected': 'مرفوض',
            'delivered': 'تم التسليم'
        };
        return statusMap[status] || status;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('ar-YE').format(price);
    }

    sortVarieties(sortBy) {
        switch (sortBy) {
            case 'rank':
                this.seedVarieties.sort((a, b) => a.rank - b.rank);
                break;
            case 'price_asc':
                this.seedVarieties.sort((a, b) => a.price_per_kg - b.price_per_kg);
                break;
            case 'price_desc':
                this.seedVarieties.sort((a, b) => b.price_per_kg - a.price_per_kg);
                break;
            case 'name':
                this.seedVarieties.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        this.renderVarieties();
    }

    showStaffLogin() {
        const container = document.getElementById('main-content');
        if (!container) return;

        container.innerHTML = `
            <div id="staff-login-container" class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
                <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                    <div class="text-center mb-8">
                        <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-user-shield text-3xl text-blue-600"></i>
                        </div>
                        <h2 class="text-3xl font-bold text-gray-800">دخول الموظفين</h2>
                        <p class="text-gray-600 mt-2">أدخل بيانات الدخول للوصول لوحة التحكم</p>
                    </div>
                    
                    <form id="staff-login-form" class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">اسم المستخدم</label>
                            <div class="relative">
                                <input type="text" id="staff-username" required 
                                    class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="أدخل اسم المستخدم">
                                <i class="fas fa-user absolute left-3 top-3.5 text-gray-400"></i>
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                            <div class="relative">
                                <input type="password" id="staff-password" required 
                                    class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="أدخل كلمة المرور">
                                <i class="fas fa-lock absolute left-3 top-3.5 text-gray-400"></i>
                            </div>
                        </div>
                        
                        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center">
                            <i class="fas fa-sign-in-alt ml-2"></i>
                            تسجيل الدخول
                        </button>
                    </form>
                    
                    <div class="mt-6 text-center">
                        <button onclick="app.showSection('home')" class="text-blue-600 hover:text-blue-800 font-medium">
                            <i class="fas fa-arrow-right ml-1"></i>العودة للصفحة الرئيسية
                        </button>
                    </div>
                    
                    <div class="mt-8 text-center text-sm text-gray-500">
                        <p>للاختبار: admin / password123</p>
                    </div>
                </div>
            </div>
        `;

        // Setup form submission
        document.getElementById('staff-login-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleStaffLogin();
        });
    }

    async handleStaffLogin() {
        const username = document.getElementById('staff-username').value.trim();
        const password = document.getElementById('staff-password').value;

        if (!username || !password) {
            this.showError('يرجى إدخال اسم المستخدم وكلمة المرور');
            return;
        }

        this.showLoading(true);
        try {
            // For demo purposes - in production use actual authentication API
            if (username === 'admin' && password === 'password123') {
                this.currentStaff = { username: 'admin', role: 'admin', full_name: 'مدير النظام' };
                this.showAdminDashboard();
            } else {
                this.showError('بيانات الدخول غير صحيحة');
            }
        } catch (error) {
            this.showError('خطأ في تسجيل الدخول');
        } finally {
            this.showLoading(false);
        }
    }

    showAdminDashboard() {
        const container = document.getElementById('main-content');
        if (!container) return;

        container.innerHTML = `
            <div class="min-h-screen bg-gray-50">
                <!-- Admin Header -->
                <div class="bg-white shadow-sm border-b">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div class="flex justify-between items-center py-4">
                            <div class="flex items-center space-x-4 space-x-reverse">
                                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <i class="fas fa-seedling text-2xl text-blue-600"></i>
                                </div>
                                <div>
                                    <h1 class="text-xl font-bold text-gray-900">لوحة التحكم الإدارية</h1>
                                    <p class="text-sm text-gray-500">نظام حجز بذور البطاطا</p>
                                </div>
                            </div>
                            <div class="flex items-center space-x-4 space-x-reverse">
                                <span class="text-gray-700">مرحباً، ${this.currentStaff.full_name}</span>
                                <button onclick="app.showSection('home')" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                                    <i class="fas fa-sign-out-alt ml-1"></i>تسجيل الخروج
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Admin Navigation -->
                <div class="bg-white shadow-sm">
                    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav class="flex space-x-8 space-x-reverse overflow-x-auto">
                            <button onclick="app.showAdminSection('dashboard')" 
                                class="admin-nav-btn py-4 px-2 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600 whitespace-nowrap transition-colors">
                                <i class="fas fa-tachometer-alt ml-1"></i>لوحة القيادة
                            </button>
                            <button onclick="app.showAdminSection('quotas')" 
                                class="admin-nav-btn py-4 px-2 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600 whitespace-nowrap transition-colors">
                                <i class="fas fa-chart-pie ml-1"></i>إدارة الحصص
                            </button>
                            <button onclick="app.showAdminSection('reports')" 
                                class="admin-nav-btn py-4 px-2 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600 whitespace-nowrap transition-colors">
                                <i class="fas fa-chart-bar ml-1"></i>التقارير
                            </button>
                            <button onclick="app.showAdminSection('distributors')" 
                                class="admin-nav-btn py-4 px-2 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600 whitespace-nowrap transition-colors">
                                <i class="fas fa-users ml-1"></i>الموزعون
                            </button>
                            <button onclick="app.showAdminSection('reservations')" 
                                class="admin-nav-btn py-4 px-2 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600 whitespace-nowrap transition-colors">
                                <i class="fas fa-clipboard-list ml-1"></i>الحجوزات
                            </button>
                        </nav>
                    </div>
                </div>

                <!-- Admin Content -->
                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div id="admin-content">
                        <!-- Content will be loaded here -->
                    </div>
                </div>
            </div>
        `;

        // Initialize current staff property if not exists
        if (!this.currentStaff) {
            this.currentStaff = { username: 'admin', role: 'admin', full_name: 'مدير النظام' };
        }

        // Show default dashboard
        this.showAdminSection('dashboard');
    }

    showAdminSection(sectionName) {
        // Update active navigation
        document.querySelectorAll('.admin-nav-btn').forEach(btn => {
            btn.classList.remove('border-blue-500', 'text-blue-600');
            btn.classList.add('border-transparent', 'text-gray-700');
        });
        
        event.target.classList.remove('border-transparent', 'text-gray-700');
        event.target.classList.add('border-blue-500', 'text-blue-600');

        // Show section content
        switch(sectionName) {
            case 'dashboard':
                this.showAdminDashboardContent();
                break;
            case 'quotas':
                this.showQuotasManagement();
                break;
            case 'reports':
                this.showReportsSection();
                break;
            case 'distributors':
                this.showDistributorsSection();
                break;
            case 'reservations':
                this.showReservationsManagement();
                break;
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            if (show) {
                overlay.classList.remove('hidden');
            } else {
                overlay.classList.add('hidden');
            }
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    validateCart() {
        if (this.cart.length === 0) {
            this.showError('يجب اختيار صنف واحد على الأقل');
            return false;
        }
        return true;
    }

    setupDeliveryStep() {
        // Set minimum date (today)
        const today = new Date().toISOString().split('T')[0];
        const deliveryDateInput = document.getElementById('delivery-date');
        if (deliveryDateInput) {
            deliveryDateInput.min = today;

            // Set maximum date (6 months from today)
            const sixMonthsLater = new Date();
            sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
            deliveryDateInput.max = sixMonthsLater.toISOString().split('T')[0];
        }

        this.updateQuotaInfo();
    }

    async handleDistributionMethodChange(method) {
        const distributorSelection = document.getElementById('distributor-selection');
        const distributorSelect = document.getElementById('selected-distributor');

        if (method === 'distributor' && this.currentFarmer) {
            distributorSelection.classList.remove('hidden');
            
            // Load distributors for farmer's province
            this.showLoading(true);
            try {
                const distributors = await this.loadDistributors(this.currentFarmer.province_id);
                distributorSelect.innerHTML = '<option value="">اختر الموزع</option>' +
                    distributors.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

                // Setup distributor selection handler
                distributorSelect.addEventListener('change', (e) => {
                    this.showDistributorInfo(e.target.value);
                });
            } catch (error) {
                this.showError('خطأ في تحميل بيانات الموزعين');
            } finally {
                this.showLoading(false);
            }
        } else {
            distributorSelection.classList.add('hidden');
        }
    }

    showDistributorInfo(distributorId) {
        const distributorInfo = document.getElementById('distributor-info');
        if (!distributorId) {
            distributorInfo.classList.add('hidden');
            return;
        }

        const distributor = this.distributors.find(d => d.id == distributorId);
        if (!distributor) return;

        distributorInfo.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <h6 class="font-bold text-blue-800">${distributor.name}</h6>
                    <p class="text-sm text-blue-600">عمولة: ${distributor.commission_percentage}%</p>
                    ${distributor.phone ? `<p class="text-sm text-blue-600">هاتف: ${distributor.phone}</p>` : ''}
                </div>
                <div class="text-xs text-blue-500">
                    ${distributor.address || ''}
                </div>
            </div>
        `;
        distributorInfo.classList.remove('hidden');
    }

    updateQuotaInfo() {
        const quotaInfo = document.getElementById('quota-info');
        if (!quotaInfo || !this.currentFarmer) return;

        const province = this.provinces.find(p => p.id === this.currentFarmer.province_id);
        if (!province) return;

        const totalOrderQuantity = this.cart.reduce((sum, item) => sum + item.quantity_kg, 0);
        const remainingAfterOrder = province.remaining_quota - totalOrderQuantity;

        quotaInfo.innerHTML = `
            <div class="text-center">
                <div class="text-2xl font-bold text-gray-800">${province.quota_tons}</div>
                <div class="text-sm text-gray-500">الحصة الإجمالية (طن)</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold ${province.remaining_quota > 0 ? 'text-green-600' : 'text-red-600'}">${province.remaining_quota}</div>
                <div class="text-sm text-gray-500">المتبقي (كيلو)</div>
            </div>
            <div class="text-center">
                <div class="text-2xl font-bold ${remainingAfterOrder >= 0 ? 'text-blue-600' : 'text-red-600'}">${remainingAfterOrder}</div>
                <div class="text-sm text-gray-500">بعد طلبك (كيلو)</div>
            </div>
        `;

        // Show warning if order exceeds quota
        if (remainingAfterOrder < 0) {
            const warningEl = document.createElement('div');
            warningEl.className = 'col-span-3 mt-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm';
            warningEl.innerHTML = `
                <i class="fas fa-exclamation-triangle ml-2"></i>
                تحذير: طلبك يتجاوز الحصة المتبقية للمحافظة بمقدار ${Math.abs(remainingAfterOrder)} كيلو
            `;
            quotaInfo.appendChild(warningEl);
        }
    }

    async validateDeliveryDetails() {
        const deliveryDate = document.getElementById('delivery-date').value;
        const distributionMethod = document.getElementById('distribution-method').value;
        
        if (!deliveryDate) {
            this.showError('يجب تحديد موعد التسليم');
            return false;
        }

        if (!distributionMethod) {
            this.showError('يجب اختيار طريقة التوزيع');
            return false;
        }

        if (distributionMethod === 'distributor') {
            const selectedDistributor = document.getElementById('selected-distributor').value;
            if (!selectedDistributor) {
                this.showError('يجب اختيار الموزع');
                return false;
            }
        }

        // Validate quota
        const province = this.provinces.find(p => p.id === this.currentFarmer.province_id);
        const totalOrderQuantity = this.cart.reduce((sum, item) => sum + item.quantity_kg, 0);
        
        if (province.remaining_quota < totalOrderQuantity) {
            this.showError('الكمية المطلوبة تتجاوز الحصة المتاحة للمحافظة');
            return false;
        }

        return true;
    }

    renderConfirmationStep() {
        // Farmer summary
        const farmerSummary = document.getElementById('farmer-summary');
        if (farmerSummary && this.currentFarmer) {
            const province = this.provinces.find(p => p.id === this.currentFarmer.province_id);
            farmerSummary.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div><strong>الاسم:</strong> ${this.currentFarmer.name}</div>
                    <div><strong>رقم الهوية:</strong> ${this.currentFarmer.id_number}</div>
                    <div><strong>المحافظة:</strong> ${province ? province.name : 'غير محدد'}</div>
                    <div><strong>الهاتف:</strong> ${this.currentFarmer.phone || 'غير محدد'}</div>
                </div>
            `;
        }

        // Final order summary
        const orderSummary = document.getElementById('final-order-summary');
        if (orderSummary) {
            const totalQuantity = this.cart.reduce((sum, item) => sum + item.quantity_kg, 0);
            const totalAmount = this.cart.reduce((sum, item) => sum + item.total_price, 0);

            orderSummary.innerHTML = `
                <div class="space-y-3">
                    ${this.cart.map(item => `
                        <div class="flex justify-between items-center border-b border-green-200 pb-2">
                            <div>
                                <div class="font-medium">${item.variety_name}</div>
                                <div class="text-sm text-gray-600">${item.quantity_kg} كيلو × ${this.formatPrice(item.unit_price)} ر.ي</div>
                            </div>
                            <div class="font-bold text-green-700">${this.formatPrice(item.total_price)} ر.ي</div>
                        </div>
                    `).join('')}
                    <div class="border-t-2 border-green-300 pt-3">
                        <div class="flex justify-between text-lg font-bold">
                            <span>المجموع الكلي:</span>
                            <span class="text-green-700">${this.formatPrice(totalAmount)} ر.ي</span>
                        </div>
                        <div class="flex justify-between text-sm text-gray-600">
                            <span>إجمالي الكمية:</span>
                            <span>${totalQuantity} كيلو</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Delivery summary
        const deliverySummary = document.getElementById('delivery-summary');
        if (deliverySummary) {
            const deliveryDate = document.getElementById('delivery-date').value;
            const distributionMethod = document.getElementById('distribution-method').value;
            const distributorId = document.getElementById('selected-distributor').value;
            const notes = document.getElementById('reservation-notes').value.trim();

            let deliveryMethod = distributionMethod === 'direct' ? 'التسليم المباشر من الشركة' : 'عبر الموزع';
            let distributorInfo = '';

            if (distributionMethod === 'distributor' && distributorId) {
                const distributor = this.distributors.find(d => d.id == distributorId);
                if (distributor) {
                    distributorInfo = `<div><strong>الموزع:</strong> ${distributor.name}</div>`;
                }
            }

            deliverySummary.innerHTML = `
                <div class="space-y-2">
                    <div><strong>تاريخ التسليم:</strong> ${new Date(deliveryDate).toLocaleDateString('ar-YE')}</div>
                    <div><strong>طريقة التوزيع:</strong> ${deliveryMethod}</div>
                    ${distributorInfo}
                    ${notes ? `<div><strong>ملاحظات:</strong> ${notes}</div>` : ''}
                </div>
            `;
        }
    }

    async submitReservation() {
        if (!this.validateFinalReservation()) {
            return;
        }

        this.showLoading(true);
        try {
            const deliveryDate = document.getElementById('delivery-date').value;
            const distributionMethod = document.getElementById('distribution-method').value;
            const distributorId = document.getElementById('selected-distributor').value || null;
            const notes = document.getElementById('reservation-notes').value.trim();

            const reservationData = {
                farmer_id: this.currentFarmer.id,
                province_id: this.currentFarmer.province_id,
                distributor_id: distributorId,
                delivery_date: deliveryDate,
                distribution_method: distributionMethod,
                items: this.cart,
                notes: notes
            };

            const response = await axios.post('/api/reservations', reservationData);

            if (response.data.success) {
                this.showReservationSuccess(response.data.reservation_id);
                this.resetReservationForm();
            } else {
                this.showError(response.data.error);
            }
        } catch (error) {
            this.showError('خطأ في تقديم طلب الحجز');
        } finally {
            this.showLoading(false);
        }
    }

    validateFinalReservation() {
        const termsAgreement = document.getElementById('terms-agreement');
        if (!termsAgreement.checked) {
            this.showError('يجب الموافقة على الشروط والأحكام');
            return false;
        }
        return true;
    }

    showReservationSuccess(reservationId) {
        const container = document.getElementById('reservation-content');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center py-12">
                <div class="mb-8">
                    <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <i class="fas fa-check-circle text-4xl text-green-600"></i>
                    </div>
                    <h3 class="text-3xl font-bold text-green-700 mb-4">تم تقديم طلب الحجز بنجاح!</h3>
                    <p class="text-xl text-gray-600 mb-6">رقم الحجز: #${reservationId}</p>
                    <div class="bg-green-50 border border-green-200 rounded-lg p-6 text-right max-w-2xl mx-auto">
                        <h4 class="font-bold text-green-800 mb-3">الخطوات التالية:</h4>
                        <ul class="text-green-700 space-y-2">
                            <li class="flex items-start">
                                <i class="fas fa-clock ml-3 mt-1"></i>
                                <span>سيتم مراجعة طلبك خلال 48 ساعة عمل</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-phone ml-3 mt-1"></i>
                                <span>سنتواصل معك عبر الهاتف لتأكيد التفاصيل</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-credit-card ml-3 mt-1"></i>
                                <span>يتوجب دفع عربون 30% عند الموافقة</span>
                            </li>
                            <li class="flex items-start">
                                <i class="fas fa-truck ml-3 mt-1"></i>
                                <span>سيتم تسليم البذور في الموعد المحدد</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div class="space-x-4 space-x-reverse">
                    <button onclick="app.showSection('status')" class="btn-primary text-white py-3 px-8 rounded-lg">
                        <i class="fas fa-search ml-2"></i>تتبع حالة الحجز
                    </button>
                    <button onclick="app.showSection('home')" class="btn-secondary text-white py-3 px-8 rounded-lg">
                        <i class="fas fa-home ml-2"></i>العودة للصفحة الرئيسية
                    </button>
                </div>
            </div>
        `;
    }

    resetReservationForm() {
        this.cart = [];
        this.currentFarmer = null;
        
        // Clear form inputs
        document.querySelectorAll('#reservation-content input, #reservation-content select, #reservation-content textarea').forEach(input => {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });

        // Reset to first step
        this.showStep(1);
    }

    showMessage(message, type) {
        // Remove existing messages
        document.querySelectorAll('.error-message, .success-message').forEach(el => el.remove());

        // Create new message
        const messageEl = document.createElement('div');
        messageEl.className = `${type}-message fixed top-4 right-4 z-50 max-w-md`;
        messageEl.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : 'check-circle'} ml-2"></i>
                <span>${message}</span>
                <button class="mr-4 hover:opacity-75" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(messageEl);

        // Auto remove after 5 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }

    // ======================================
    // Admin Dashboard Functions
    // ======================================

    async showAdminDashboardContent() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-map-marked-alt text-xl text-blue-600"></i>
                        </div>
                        <div class="mr-4">
                            <p class="text-sm font-medium text-gray-600">إجمالي المحافظات</p>
                            <p class="text-2xl font-semibold text-gray-900" id="total-provinces">-</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-weight text-xl text-green-600"></i>
                        </div>
                        <div class="mr-4">
                            <p class="text-sm font-medium text-gray-600">إجمالي الحصص (طن)</p>
                            <p class="text-2xl font-semibold text-gray-900" id="total-quotas">-</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-chart-line text-xl text-orange-600"></i>
                        </div>
                        <div class="mr-4">
                            <p class="text-sm font-medium text-gray-600">الكمية المستهلكة (طن)</p>
                            <p class="text-2xl font-semibold text-gray-900" id="consumed-quota">-</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <i class="fas fa-percentage text-xl text-red-600"></i>
                        </div>
                        <div class="mr-4">
                            <p class="text-sm font-medium text-gray-600">نسبة الاستهلاك</p>
                            <p class="text-2xl font-semibold text-gray-900" id="consumption-rate">-</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Recent Activity -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">النشاط الأخير</h3>
                    </div>
                    <div class="p-6">
                        <div id="recent-activity" class="space-y-4">
                            <!-- Activity items will be loaded here -->
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                        <h3 class="text-lg font-semibold text-gray-900">إجراءات سريعة</h3>
                    </div>
                    <div class="p-6 space-y-4">
                        <button onclick="app.showAdminSection('quotas')" class="w-full text-right bg-blue-50 hover:bg-blue-100 text-blue-700 p-4 rounded-lg transition-colors">
                            <i class="fas fa-edit ml-2"></i>إدارة حصص المحافظات
                        </button>
                        <button onclick="app.showAdminSection('reports')" class="w-full text-right bg-green-50 hover:bg-green-100 text-green-700 p-4 rounded-lg transition-colors">
                            <i class="fas fa-chart-bar ml-2"></i>عرض التقارير المفصلة
                        </button>
                        <button onclick="app.showAdminSection('distributors')" class="w-full text-right bg-orange-50 hover:bg-orange-100 text-orange-700 p-4 rounded-lg transition-colors">
                            <i class="fas fa-users ml-2"></i>إدارة الموزعين
                        </button>
                        <button onclick="app.showAdminSection('reservations')" class="w-full text-right bg-purple-50 hover:bg-purple-100 text-purple-700 p-4 rounded-lg transition-colors">
                            <i class="fas fa-clipboard-list ml-2"></i>مراجعة الحجوزات
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Load dashboard data
        this.loadDashboardStats();
    }

    async loadDashboardStats() {
        try {
            const [quotasResponse, consumptionResponse] = await Promise.all([
                axios.get('/api/admin/quotas-report'),
                axios.get('/api/admin/consumption-stats')
            ]);

            if (quotasResponse.data.success && consumptionResponse.data.success) {
                const quotasData = quotasResponse.data.data;
                const consumptionData = consumptionResponse.data.data;

                const totalProvinces = quotasData.length;
                const totalQuotas = quotasData.reduce((sum, item) => sum + item.quota_tons, 0);
                const consumedQuota = quotasData.reduce((sum, item) => sum + item.consumed_quota, 0);
                const consumptionRate = totalQuotas > 0 ? ((consumedQuota / totalQuotas) * 100).toFixed(1) : 0;

                document.getElementById('total-provinces').textContent = totalProvinces;
                document.getElementById('total-quotas').textContent = totalQuotas.toLocaleString();
                document.getElementById('consumed-quota').textContent = consumedQuota.toLocaleString();
                document.getElementById('consumption-rate').textContent = consumptionRate + '%';
            }
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }

    async showQuotasManagement() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-semibold text-gray-900">إدارة حصص المحافظات</h2>
                        <button onclick="app.refreshQuotasData()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-refresh ml-1"></i>تحديث البيانات
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <div id="quotas-table-container">
                        <div class="flex justify-center items-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span class="mr-2">جاري تحميل البيانات...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadQuotasData();
    }

    async loadQuotasData() {
        try {
            const response = await axios.get('/api/admin/quotas-report');
            if (response.data.success) {
                this.renderQuotasTable(response.data.data);
            }
        } catch (error) {
            console.error('Error loading quotas data:', error);
            this.showError('خطأ في تحميل بيانات الحصص');
        }
    }

    renderQuotasTable(quotasData) {
        const container = document.getElementById('quotas-table-container');
        if (!container) return;

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المحافظة</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الحصة الكلية (طن)</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">المستهلك (طن)</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">المتبقي (طن)</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">نسبة الاستهلاك</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${quotasData.map(item => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">${item.province_name}</div>
                                    <div class="text-sm text-gray-500">${item.total_reservations} حجز إجمالي</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-sm text-gray-900 font-medium">${item.quota_tons}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-sm text-red-600 font-medium">${item.consumed_quota}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-sm text-green-600 font-medium">${item.remaining_quota}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <div class="flex items-center justify-center">
                                        <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                            <div class="bg-${item.consumption_percentage > 80 ? 'red' : item.consumption_percentage > 60 ? 'yellow' : 'green'}-600 h-2 rounded-full" 
                                                style="width: ${Math.min(item.consumption_percentage, 100)}%"></div>
                                        </div>
                                        <span class="text-sm font-medium ${item.consumption_percentage > 80 ? 'text-red-600' : item.consumption_percentage > 60 ? 'text-yellow-600' : 'text-green-600'}">
                                            ${item.consumption_percentage}%
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <button onclick="app.editProvinceQuota(${item.id}, '${item.province_name}', ${item.quota_tons}, ${item.consumed_quota})" 
                                        class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition-colors">
                                        <i class="fas fa-edit ml-1"></i>تعديل الحصة
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    editProvinceQuota(provinceId, provinceName, currentQuota, consumedQuota) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">تعديل حصة ${provinceName}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <div class="bg-gray-50 p-4 rounded-lg mb-4">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-600">الحصة الحالية:</span>
                                <span class="font-medium text-gray-900">${currentQuota} طن</span>
                            </div>
                            <div>
                                <span class="text-gray-600">المستهلك:</span>
                                <span class="font-medium text-red-600">${consumedQuota} طن</span>
                            </div>
                        </div>
                    </div>
                    
                    <label class="block text-sm font-medium text-gray-700 mb-2">الحصة الجديدة (طن)</label>
                    <input type="number" id="new-quota-${provinceId}" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value="${currentQuota}" min="${consumedQuota}" step="0.1">
                    <p class="text-sm text-gray-500 mt-1">لا يمكن أن تكون أقل من الكمية المستهلكة (${consumedQuota} طن)</p>
                </div>
                
                <div class="flex space-x-3 space-x-reverse">
                    <button onclick="app.saveProvinceQuota(${provinceId}, '${provinceName}')" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                        حفظ التعديل
                    </button>
                    <button onclick="this.closest('.fixed').remove()" 
                        class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors">
                        إلغاء
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async saveProvinceQuota(provinceId, provinceName) {
        const newQuotaInput = document.getElementById(`new-quota-${provinceId}`);
        const newQuota = parseFloat(newQuotaInput.value);
        
        if (!newQuota || newQuota <= 0) {
            this.showError('يرجى إدخال حصة صحيحة');
            return;
        }

        this.showLoading(true);
        try {
            const response = await axios.put(`/api/admin/provinces/${provinceId}/quota`, {
                quota_tons: newQuota
            });

            if (response.data.success) {
                this.showSuccess(`تم تحديث حصة ${provinceName} بنجاح`);
                document.querySelector('.fixed.inset-0').remove();
                this.loadQuotasData(); // Refresh the table
            } else {
                this.showError(response.data.error);
            }
        } catch (error) {
            this.showError('خطأ في تحديث الحصة');
        } finally {
            this.showLoading(false);
        }
    }

    refreshQuotasData() {
        this.loadQuotasData();
        this.showSuccess('تم تحديث البيانات');
    }

    async showReportsSection() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-6">
                <!-- Reports Header -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">تقارير شاملة للاستهلاك والحصص</h2>
                    <div class="flex flex-wrap gap-4">
                        <button onclick="app.generateConsumptionReport()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-chart-pie ml-1"></i>تقرير الاستهلاك
                        </button>
                        <button onclick="app.generateQuotasReport()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-balance-scale ml-1"></i>تقرير الحصص
                        </button>
                        <button onclick="app.generateDistributorsReport()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-users ml-1"></i>تقرير الموزعين
                        </button>
                        <button onclick="app.exportReportsPDF()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-file-pdf ml-1"></i>تصدير PDF
                        </button>
                    </div>
                </div>

                <!-- Reports Content -->
                <div id="reports-content">
                    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                        <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="fas fa-chart-bar text-2xl text-gray-400"></i>
                        </div>
                        <h3 class="text-lg font-medium text-gray-900 mb-2">اختر نوع التقرير</h3>
                        <p class="text-gray-500">استخدم الأزرار أعلاه لإنشاء التقارير المختلفة</p>
                    </div>
                </div>
            </div>
        `;
    }

    async generateConsumptionReport() {
        const container = document.getElementById('reports-content');
        if (!container) return;

        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">تقرير استهلاك الحصص حسب المحافظة</h3>
                </div>
                <div class="p-6">
                    <div class="flex justify-center items-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span class="mr-2">جاري إنشاء التقرير...</span>
                    </div>
                </div>
            </div>
        `;

        try {
            const response = await axios.get('/api/admin/consumption-stats');
            if (response.data.success) {
                this.renderConsumptionReport(response.data.data);
            }
        } catch (error) {
            console.error('Error generating consumption report:', error);
            this.showError('خطأ في إنشاء تقرير الاستهلاك');
        }
    }

    renderConsumptionReport(data) {
        const container = document.getElementById('reports-content');
        if (!container) return;

        const totalQuota = data.reduce((sum, item) => sum + item.quota_tons, 0);
        const totalConsumed = data.reduce((sum, item) => sum + item.consumed_quota, 0);
        const totalRemaining = data.reduce((sum, item) => sum + item.remaining_quota, 0);

        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-900">تقرير استهلاك الحصص حسب المحافظة</h3>
                        <div class="text-sm text-gray-500">تاريخ التقرير: ${new Date().toLocaleDateString('ar-YE')}</div>
                    </div>
                </div>
                
                <!-- Summary Cards -->
                <div class="p-6 border-b border-gray-200">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="text-sm text-blue-600 font-medium">إجمالي الحصص</div>
                            <div class="text-2xl font-bold text-blue-700">${totalQuota.toLocaleString()} طن</div>
                        </div>
                        <div class="bg-red-50 p-4 rounded-lg">
                            <div class="text-sm text-red-600 font-medium">المستهلك</div>
                            <div class="text-2xl font-bold text-red-700">${totalConsumed.toLocaleString()} طن</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="text-sm text-green-600 font-medium">المتبقي</div>
                            <div class="text-2xl font-bold text-green-700">${totalRemaining.toLocaleString()} طن</div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Table -->
                <div class="p-6">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المحافظة</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">الحصة المقررة</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">المستهلك</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">المتبقي</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">نسبة الاستهلاك</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">عدد المزارعين</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">عدد الحجوزات</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${data.map(item => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.province_name}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">${item.quota_tons}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-medium">${item.consumed_quota}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">${item.remaining_quota}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-center">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                item.consumption_percentage > 80 ? 'bg-red-100 text-red-800' :
                                                item.consumption_percentage > 60 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }">
                                                ${item.consumption_percentage}%
                                            </span>
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">${item.total_farmers}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">${item.total_reservations}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    async showDistributorsSection() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-semibold text-gray-900">إدارة الموزعين ونسب العمولة</h2>
                        <button onclick="app.refreshDistributorsData()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-refresh ml-1"></i>تحديث البيانات
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <div id="distributors-table-container">
                        <div class="flex justify-center items-center py-8">
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span class="mr-2">جاري تحميل البيانات...</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadDistributorsData();
    }

    async loadDistributorsData() {
        try {
            const response = await axios.get('/api/admin/distributors');
            if (response.data.success) {
                this.renderDistributorsTable(response.data.data);
            }
        } catch (error) {
            console.error('Error loading distributors data:', error);
            this.showError('خطأ في تحميل بيانات الموزعين');
        }
    }

    renderDistributorsTable(distributorsData) {
        const container = document.getElementById('distributors-table-container');
        if (!container) return;

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الموزع</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">المحافظة</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">نسبة العمولة</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">عدد الحجوزات</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${distributorsData.map(item => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">${item.name}</div>
                                    <div class="text-sm text-gray-500">${item.phone}</div>
                                    <div class="text-sm text-gray-500">${item.address}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-sm text-gray-900">${item.province_name}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        ${item.commission_percentage}%
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-sm text-gray-900">${item.total_reservations}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }">
                                        ${item.is_active ? 'نشط' : 'غير نشط'}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <button onclick="app.editDistributorCommission(${item.id}, '${item.name}', ${item.commission_percentage})" 
                                        class="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded transition-colors mr-2">
                                        <i class="fas fa-edit ml-1"></i>تعديل العمولة
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    editDistributorCommission(distributorId, distributorName, currentCommission) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">تعديل عمولة ${distributorName}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <div class="bg-gray-50 p-4 rounded-lg mb-4">
                        <div class="text-sm">
                            <span class="text-gray-600">العمولة الحالية:</span>
                            <span class="font-medium text-gray-900">${currentCommission}%</span>
                        </div>
                    </div>
                    
                    <label class="block text-sm font-medium text-gray-700 mb-2">نسبة العمولة الجديدة (%)</label>
                    <input type="number" id="new-commission-${distributorId}" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value="${currentCommission}" min="0" max="100" step="0.1">
                    <p class="text-sm text-gray-500 mt-1">يجب أن تكون بين 0% و 100%</p>
                </div>
                
                <div class="flex space-x-3 space-x-reverse">
                    <button onclick="app.saveDistributorCommission(${distributorId}, '${distributorName}')" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                        حفظ التعديل
                    </button>
                    <button onclick="this.closest('.fixed').remove()" 
                        class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors">
                        إلغاء
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async saveDistributorCommission(distributorId, distributorName) {
        const newCommissionInput = document.getElementById(`new-commission-${distributorId}`);
        const newCommission = parseFloat(newCommissionInput.value);
        
        if (isNaN(newCommission) || newCommission < 0 || newCommission > 100) {
            this.showError('يرجى إدخال نسبة عمولة صحيحة بين 0% و 100%');
            return;
        }

        this.showLoading(true);
        try {
            const response = await axios.put(`/api/admin/distributors/${distributorId}/commission`, {
                commission_percentage: newCommission
            });

            if (response.data.success) {
                this.showSuccess(`تم تحديث عمولة ${distributorName} بنجاح`);
                document.querySelector('.fixed.inset-0').remove();
                this.loadDistributorsData(); // Refresh the table
            } else {
                this.showError(response.data.error);
            }
        } catch (error) {
            this.showError('خطأ في تحديث العمولة');
        } finally {
            this.showLoading(false);
        }
    }

    refreshDistributorsData() {
        this.loadDistributorsData();
        this.showSuccess('تم تحديث البيانات');
    }

    async showReservationsManagement() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-clipboard-list text-2xl text-gray-400"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">إدارة الحجوزات</h3>
                <p class="text-gray-500 mb-4">هذا القسم قيد التطوير</p>
                <p class="text-sm text-gray-400">سيتم إضافة إدارة شاملة للحجوزات قريباً</p>
            </div>
        `;
    }

    // Add success message method
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showError(message) {
        this.showMessage(message, 'error');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PotatoSeedsApp();
});