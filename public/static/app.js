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

    async loadSeedVarieties(provinceId = null) {
        try {
            let url = '/api/seed-varieties';
            if (provinceId) {
                url = `/api/seed-varieties/${provinceId}`;
            }
            
            const response = await axios.get(url);
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
                                <button onclick="app.logout()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">
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
                            <button onclick="app.showAdminSection('allocations')" 
                                class="admin-nav-btn py-4 px-2 border-b-2 border-transparent hover:border-blue-500 text-gray-700 hover:text-blue-600 whitespace-nowrap transition-colors">
                                <i class="fas fa-cogs ml-1"></i>تخصيصات المحافظات
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
            case 'allocations':
                this.showAllocationsManagement();
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

    logout() {
        // Clear current staff info
        this.currentStaff = null;
        
        // Show confirmation message
        this.showSuccess('تم تسجيل الخروج بنجاح');
        
        // Return to home section
        this.showSection('home');
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
            <div class="space-y-6">
                <!-- Statistics Cards -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-clipboard-list text-blue-600"></i>
                            </div>
                            <div class="mr-3">
                                <p class="text-sm font-medium text-gray-600">إجمالي الحجوزات</p>
                                <p class="text-xl font-semibold text-gray-900" id="total-reservations">-</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-clock text-yellow-600"></i>
                            </div>
                            <div class="mr-3">
                                <p class="text-sm font-medium text-gray-600">في الانتظار</p>
                                <p class="text-xl font-semibold text-gray-900" id="pending-reservations">-</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-check-circle text-green-600"></i>
                            </div>
                            <div class="mr-3">
                                <p class="text-sm font-medium text-gray-600">تمت الموافقة</p>
                                <p class="text-xl font-semibold text-gray-900" id="approved-reservations">-</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-times-circle text-red-600"></i>
                            </div>
                            <div class="mr-3">
                                <p class="text-sm font-medium text-gray-600">مرفوضة</p>
                                <p class="text-xl font-semibold text-gray-900" id="rejected-reservations">-</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                        <div class="flex items-center">
                            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <i class="fas fa-truck text-purple-600"></i>
                            </div>
                            <div class="mr-3">
                                <p class="text-sm font-medium text-gray-600">تم التسليم</p>
                                <p class="text-xl font-semibold text-gray-900" id="delivered-reservations">-</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Reservations Table -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex justify-between items-center">
                            <h2 class="text-xl font-semibold text-gray-900">إدارة الحجوزات</h2>
                            <div class="flex space-x-3 space-x-reverse">
                                <select id="status-filter" class="border border-gray-300 rounded-lg px-3 py-2">
                                    <option value="">جميع الحالات</option>
                                    <option value="pending">في الانتظار</option>
                                    <option value="approved">تمت الموافقة</option>
                                    <option value="rejected">مرفوضة</option>
                                    <option value="delivered">تم التسليم</option>
                                </select>
                                <button onclick="app.refreshReservationsData()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                                    <i class="fas fa-refresh ml-1"></i>تحديث
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="p-6">
                        <div id="reservations-table-container">
                            <div class="flex justify-center items-center py-8">
                                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span class="mr-2">جاري تحميل البيانات...</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load reservations data
        this.loadReservationsData();
        this.loadReservationsStats();
    }

    async loadReservationsStats() {
        try {
            const response = await axios.get('/api/admin/reservations-stats');
            if (response.data.success) {
                const stats = response.data.data;
                document.getElementById('total-reservations').textContent = stats.total_reservations || 0;
                document.getElementById('pending-reservations').textContent = stats.pending_reservations || 0;
                document.getElementById('approved-reservations').textContent = stats.approved_reservations || 0;
                document.getElementById('rejected-reservations').textContent = stats.rejected_reservations || 0;
                document.getElementById('delivered-reservations').textContent = stats.delivered_reservations || 0;
            }
        } catch (error) {
            console.error('Error loading reservations stats:', error);
        }
    }

    async loadReservationsData() {
        try {
            const response = await axios.get('/api/admin/reservations');
            if (response.data.success) {
                this.renderReservationsTable(response.data.data);
            }
        } catch (error) {
            console.error('Error loading reservations data:', error);
            this.showError('خطأ في تحميل بيانات الحجوزات');
        }
    }

    renderReservationsTable(reservationsData) {
        const container = document.getElementById('reservations-table-container');
        if (!container) return;

        if (reservationsData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-inbox text-2xl text-gray-400"></i>
                    </div>
                    <p class="text-gray-500">لا توجد حجوزات حالياً</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">رقم الحجز</th>
                            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المزارع</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">المحافظة</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">الكمية</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">تاريخ التسليم</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">الحالة</th>
                            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${reservationsData.map(reservation => `
                            <tr class="hover:bg-gray-50">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">#${reservation.id}</div>
                                    <div class="text-sm text-gray-500">${new Date(reservation.created_at).toLocaleDateString('ar-YE')}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="text-sm font-medium text-gray-900">${reservation.farmer_name}</div>
                                    <div class="text-sm text-gray-500">${reservation.farmer_phone}</div>
                                    <div class="text-sm text-gray-500">هوية: ${reservation.farmer_id_number}</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-sm text-gray-900">${reservation.province_name}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-sm font-medium text-gray-900">${reservation.total_quantity_kg} كيلو</span>
                                    <div class="text-sm text-gray-500">${reservation.items_count} صنف</div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-sm font-medium text-green-600">${this.formatPrice(reservation.total_amount)} ر.ي</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="text-sm text-gray-900">${new Date(reservation.delivery_date).toLocaleDateString('ar-YE')}</span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusBadgeClass(reservation.status)}">
                                        ${this.getStatusText(reservation.status)}
                                    </span>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-center">
                                    <div class="flex justify-center space-x-2 space-x-reverse">
                                        <button onclick="app.viewReservationDetails(${reservation.id})" 
                                            class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-colors">
                                            <i class="fas fa-eye ml-1"></i>عرض
                                        </button>
                                        <button onclick="app.updateReservationStatus(${reservation.id}, '${reservation.status}')" 
                                            class="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded transition-colors">
                                            <i class="fas fa-edit ml-1"></i>تحديث
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getStatusBadgeClass(status) {
        switch(status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'delivered': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    getStatusText(status) {
        switch(status) {
            case 'pending': return 'في الانتظار';
            case 'approved': return 'تمت الموافقة';
            case 'rejected': return 'مرفوض';
            case 'delivered': return 'تم التسليم';
            default: return 'غير محدد';
        }
    }

    async viewReservationDetails(reservationId) {
        try {
            const response = await axios.get(`/api/admin/reservations/${reservationId}`);
            if (response.data.success) {
                const { reservation, items } = response.data.data;
                this.showReservationDetailsModal(reservation, items);
            }
        } catch (error) {
            console.error('Error loading reservation details:', error);
            this.showError('خطأ في تحميل تفاصيل الحجز');
        }
    }

    showReservationDetailsModal(reservation, items) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold">تفاصيل الحجز #${reservation.id}</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6 space-y-6">
                    <!-- Farmer Information -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800 mb-3">بيانات المزارع</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><span class="font-medium">الاسم:</span> ${reservation.farmer_name}</div>
                            <div><span class="font-medium">رقم الهوية:</span> ${reservation.farmer_id_number}</div>
                            <div><span class="font-medium">الهاتف:</span> ${reservation.farmer_phone}</div>
                            <div><span class="font-medium">المحافظة:</span> ${reservation.province_name}</div>
                            <div class="md:col-span-2"><span class="font-medium">العنوان:</span> ${reservation.farmer_address}</div>
                        </div>
                    </div>

                    <!-- Reservation Information -->
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-800 mb-3">بيانات الحجز</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><span class="font-medium">تاريخ الطلب:</span> ${new Date(reservation.created_at).toLocaleDateString('ar-YE')}</div>
                            <div><span class="font-medium">تاريخ التسليم:</span> ${new Date(reservation.delivery_date).toLocaleDateString('ar-YE')}</div>
                            <div><span class="font-medium">طريقة التوزيع:</span> ${reservation.distribution_method === 'direct' ? 'التسليم المباشر' : 'عبر الموزع'}</div>
                            <div><span class="font-medium">الحالة:</span> 
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusBadgeClass(reservation.status)}">
                                    ${this.getStatusText(reservation.status)}
                                </span>
                            </div>
                            ${reservation.distributor_name ? `
                                <div><span class="font-medium">الموزع:</span> ${reservation.distributor_name}</div>
                                <div><span class="font-medium">هاتف الموزع:</span> ${reservation.distributor_phone}</div>
                            ` : ''}
                        </div>
                        ${reservation.notes ? `
                            <div class="mt-3"><span class="font-medium">ملاحظات المزارع:</span> ${reservation.notes}</div>
                        ` : ''}
                        ${reservation.admin_notes ? `
                            <div class="mt-3"><span class="font-medium">ملاحظات الإدارة:</span> ${reservation.admin_notes}</div>
                        ` : ''}
                    </div>

                    <!-- Order Items -->
                    <div>
                        <h4 class="font-semibold text-gray-800 mb-3">أصناف البذور المطلوبة</h4>
                        <div class="overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-2 text-right text-xs font-medium text-gray-500">الصنف</th>
                                        <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">الكمية (كيلو)</th>
                                        <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">السعر للكيلو</th>
                                        <th class="px-4 py-2 text-center text-xs font-medium text-gray-500">المجموع</th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white divide-y divide-gray-200">
                                    ${items.map(item => `
                                        <tr>
                                            <td class="px-4 py-2">
                                                <div class="font-medium">${item.seed_name}</div>
                                                <div class="text-sm text-gray-500">${item.seed_description}</div>
                                            </td>
                                            <td class="px-4 py-2 text-center">${item.quantity_kg}</td>
                                            <td class="px-4 py-2 text-center">${this.formatPrice(item.unit_price)} ر.ي</td>
                                            <td class="px-4 py-2 text-center font-medium text-green-600">${this.formatPrice(item.total_price)} ر.ي</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                                <tfoot class="bg-gray-50">
                                    <tr>
                                        <td class="px-4 py-2 font-medium">المجموع الكلي</td>
                                        <td class="px-4 py-2 text-center font-medium">${reservation.total_quantity_kg} كيلو</td>
                                        <td class="px-4 py-2"></td>
                                        <td class="px-4 py-2 text-center font-bold text-green-700">${this.formatPrice(reservation.total_amount)} ر.ي</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-center space-x-3 space-x-reverse pt-4 border-t">
                        <button onclick="app.updateReservationStatus(${reservation.id}, '${reservation.status}'); this.closest('.fixed').remove();" 
                            class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                            <i class="fas fa-edit ml-2"></i>تحديث الحالة
                        </button>
                        <button onclick="this.closest('.fixed').remove()" 
                            class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors">
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    updateReservationStatus(reservationId, currentStatus) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">تحديث حالة الحجز #${reservationId}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">الحالة الجديدة</label>
                    <select id="new-status-${reservationId}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="pending" ${currentStatus === 'pending' ? 'selected' : ''}>في الانتظار</option>
                        <option value="approved" ${currentStatus === 'approved' ? 'selected' : ''}>تمت الموافقة</option>
                        <option value="rejected" ${currentStatus === 'rejected' ? 'selected' : ''}>مرفوض</option>
                        <option value="delivered" ${currentStatus === 'delivered' ? 'selected' : ''}>تم التسليم</option>
                    </select>
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">ملاحظات الإدارة</label>
                    <textarea id="admin-notes-${reservationId}" rows="3" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="أضف ملاحظات إضافية (اختياري)"></textarea>
                </div>
                
                <div class="flex space-x-3 space-x-reverse">
                    <button onclick="app.saveReservationStatus(${reservationId})" 
                        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                        حفظ التحديث
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

    async saveReservationStatus(reservationId) {
        const newStatus = document.getElementById(`new-status-${reservationId}`).value;
        const adminNotes = document.getElementById(`admin-notes-${reservationId}`).value.trim();
        
        this.showLoading(true);
        try {
            const response = await axios.put(`/api/admin/reservations/${reservationId}/status`, {
                status: newStatus,
                admin_notes: adminNotes || null
            });

            if (response.data.success) {
                this.showSuccess('تم تحديث حالة الحجز بنجاح');
                document.querySelector('.fixed.inset-0').remove();
                this.loadReservationsData(); // Refresh the table
                this.loadReservationsStats(); // Refresh stats
            } else {
                this.showError(response.data.error);
            }
        } catch (error) {
            this.showError('خطأ في تحديث حالة الحجز');
        } finally {
            this.showLoading(false);
        }
    }

    refreshReservationsData() {
        this.loadReservationsData();
        this.loadReservationsStats();
        this.showSuccess('تم تحديث البيانات');
    }

    // Enhanced reservation details with edit capability
    async viewReservationDetails(reservationId) {
        this.showLoading(true);
        try {
            const response = await axios.get(`/api/admin/reservations/${reservationId}`);
            if (response.data.success) {
                const { reservation, items } = response.data.data;
                this.showReservationModal(reservation, items);
            } else {
                this.showError('خطأ في جلب تفاصيل الحجز');
            }
        } catch (error) {
            this.showError('خطأ في الاتصال بالخادم');
        } finally {
            this.showLoading(false);
        }
    }

    showReservationModal(reservation, items) {
        const statusLabels = {
            'pending': 'في الانتظار',
            'approved': 'تمت الموافقة', 
            'rejected': 'مرفوض',
            'delivered': 'تم التسليم'
        };
        
        const statusColors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800', 
            'delivered': 'bg-blue-100 text-blue-800'
        };

        const canEdit = reservation.status === 'pending';
        const isEdited = reservation.edited_by_admin === 1;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-white border-b p-6">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-bold text-gray-900">تفاصيل الحجز #${reservation.id}</h2>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                <div class="p-6 space-y-6">
                    <!-- Status and Edit Info -->
                    <div class="flex justify-between items-center">
                        <span class="px-3 py-1 rounded-full text-sm font-medium ${statusColors[reservation.status]}">
                            ${statusLabels[reservation.status]}
                        </span>
                        ${isEdited ? '<span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">تم التعديل بواسطة الإدارة</span>' : ''}
                    </div>

                    <!-- Farmer Information -->
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="font-semibold mb-3">معلومات المزارع</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div><strong>الاسم:</strong> ${reservation.farmer_name}</div>
                            <div><strong>الهاتف:</strong> ${reservation.farmer_phone}</div>
                            <div><strong>رقم الهوية:</strong> ${reservation.farmer_id_number}</div>
                            <div><strong>المحافظة:</strong> ${reservation.province_name}</div>
                        </div>
                        <div class="mt-2"><strong>العنوان:</strong> ${reservation.farmer_address || 'غير محدد'}</div>
                    </div>

                    <!-- Order Information -->
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h3 class="font-semibold mb-3">معلومات الطلب</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div><strong>إجمالي الكمية:</strong> ${reservation.total_quantity_kg} كجم</div>
                            <div><strong>إجمالي المبلغ:</strong> ${reservation.total_amount.toLocaleString()} ر.ي</div>
                            <div><strong>تاريخ التسليم:</strong> ${new Date(reservation.delivery_date).toLocaleDateString('ar')}</div>
                            <div><strong>طريقة التوزيع:</strong> ${reservation.distribution_method === 'distributor' ? 'عن طريق الموزع' : 'استلام مباشر'}</div>
                        </div>
                        ${reservation.distributor_name ? `<div class="mt-2"><strong>الموزع:</strong> ${reservation.distributor_name}</div>` : ''}
                    </div>

                    ${isEdited ? `
                        <div class="bg-orange-50 rounded-lg p-4">
                            <h3 class="font-semibold mb-3">تفاصيل التعديل</h3>
                            <div class="grid grid-cols-2 gap-4">
                                <div><strong>الكمية الأصلية:</strong> ${reservation.original_total_quantity_kg} كجم</div>
                                <div><strong>المبلغ الأصلي:</strong> ${reservation.original_total_amount?.toLocaleString()} ر.ي</div>
                            </div>
                            ${reservation.edit_reason ? `<div class="mt-2"><strong>سبب التعديل:</strong> ${reservation.edit_reason}</div>` : ''}
                        </div>
                    ` : ''}

                    <!-- Items Table -->
                    <div>
                        <h3 class="font-semibold mb-3">تفاصيل الأصناف</h3>
                        <div class="overflow-x-auto">
                            <table class="min-w-full border border-gray-200">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="border border-gray-200 px-4 py-2 text-right">الصنف</th>
                                        <th class="border border-gray-200 px-4 py-2 text-center">الكمية (كجم)</th>
                                        <th class="border border-gray-200 px-4 py-2 text-center">سعر الكيلو (ر.ي)</th>
                                        <th class="border border-gray-200 px-4 py-2 text-center">الإجمالي (ر.ي)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${items.map(item => `
                                        <tr>
                                            <td class="border border-gray-200 px-4 py-2">
                                                <div class="font-medium">${item.seed_name}</div>
                                                <div class="text-sm text-gray-500">${item.seed_description}</div>
                                            </td>
                                            <td class="border border-gray-200 px-4 py-2 text-center">${item.quantity_kg}</td>
                                            <td class="border border-gray-200 px-4 py-2 text-center">${item.unit_price.toLocaleString()}</td>
                                            <td class="border border-gray-200 px-4 py-2 text-center font-medium">${item.total_price.toLocaleString()}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    ${reservation.admin_notes ? `
                        <div class="bg-yellow-50 rounded-lg p-4">
                            <h3 class="font-semibold mb-2">ملاحظات الإدارة</h3>
                            <p class="text-gray-700">${reservation.admin_notes}</p>
                        </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="flex space-x-3 space-x-reverse pt-4 border-t">
                        ${canEdit ? `
                            <button onclick="app.editReservation(${reservation.id}); this.closest('.fixed').remove();" 
                                class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors">
                                <i class="fas fa-edit ml-1"></i>تعديل الطلب
                            </button>
                        ` : ''}
                        <button onclick="app.updateReservationStatus(${reservation.id}, '${reservation.status}'); this.closest('.fixed').remove();" 
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                            <i class="fas fa-edit ml-1"></i>تحديث الحالة
                        </button>
                        <button onclick="this.closest('.fixed').remove()" 
                            class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async editReservation(reservationId) {
        // Get current reservation details
        this.showLoading(true);
        try {
            const response = await axios.get(`/api/admin/reservations/${reservationId}`);
            if (response.data.success) {
                const { reservation, items } = response.data.data;
                this.showEditReservationModal(reservation, items);
            }
        } catch (error) {
            this.showError('خطأ في جلب بيانات الحجز');
        } finally {
            this.showLoading(false);
        }
    }

    showEditReservationModal(reservation, items) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-white border-b p-6">
                    <h2 class="text-xl font-bold text-gray-900">تعديل الحجز #${reservation.id}</h2>
                </div>

                <div class="p-6 space-y-6">
                    <form id="edit-reservation-form">
                        <!-- Delivery Date -->
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">تاريخ التسليم</label>
                            <input type="date" id="edit-delivery-date" value="${reservation.delivery_date}" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>

                        <!-- Items Table -->
                        <div>
                            <h3 class="font-semibold mb-3">تعديل الأصناف والكميات</h3>
                            <div id="edit-items-container">
                                ${items.map((item, index) => `
                                    <div class="border rounded-lg p-4 mb-3" data-item-index="${index}">
                                        <div class="grid grid-cols-4 gap-4">
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">الصنف</label>
                                                <select class="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                                                    onchange="app.updateEditItemPrice(${index})" data-seed-id="${item.seed_variety_id}">
                                                    <option value="${item.seed_variety_id}">${item.seed_name}</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">الكمية (كجم)</label>
                                                <input type="number" min="1" value="${item.quantity_kg}" 
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    onchange="app.updateEditItemTotal(${index})">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">سعر الكيلو (ر.ي)</label>
                                                <input type="number" readonly value="${item.unit_price}" 
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                                            </div>
                                            <div>
                                                <label class="block text-sm font-medium text-gray-700 mb-1">الإجمالي (ر.ي)</label>
                                                <input type="number" readonly value="${item.total_price}" 
                                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                                            </div>
                                        </div>
                                        <button type="button" onclick="this.parentElement.remove(); app.updateEditTotals();" 
                                            class="mt-2 text-red-600 hover:text-red-800 text-sm">
                                            <i class="fas fa-trash ml-1"></i>حذف الصنف
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- Edit Reason -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">سبب التعديل</label>
                            <textarea id="edit-reason" rows="3" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="اذكر سبب التعديل..."></textarea>
                        </div>

                        <!-- Totals -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div><strong>إجمالي الكمية:</strong> <span id="edit-total-quantity">${reservation.total_quantity_kg}</span> كجم</div>
                                <div><strong>إجمالي المبلغ:</strong> <span id="edit-total-amount">${reservation.total_amount.toLocaleString()}</span> ر.ي</div>
                            </div>
                        </div>

                        <!-- Buttons -->
                        <div class="flex space-x-3 space-x-reverse pt-4 border-t">
                            <button type="button" onclick="app.saveReservationEdit(${reservation.id})" 
                                class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                                <i class="fas fa-save ml-1"></i>حفظ التعديل
                            </button>
                            <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg transition-colors">
                                إلغاء
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.loadSeedVarietiesForEdit();
    }

    async loadSeedVarietiesForEdit() {
        // Load available seed varieties for dropdowns
        try {
            const response = await axios.get('/api/seed-varieties');
            if (response.data.success) {
                const varieties = response.data.data;
                document.querySelectorAll('#edit-items-container select').forEach(select => {
                    const currentSeedId = select.dataset.seedId;
                    select.innerHTML = varieties.map(variety => 
                        `<option value="${variety.id}" ${variety.id == currentSeedId ? 'selected' : ''}>${variety.name}</option>`
                    ).join('');
                });
            }
        } catch (error) {
            console.error('Error loading seed varieties:', error);
        }
    }

    updateEditItemPrice(itemIndex) {
        // Update price when seed variety changes
        const container = document.querySelector(`[data-item-index="${itemIndex}"]`);
        const select = container.querySelector('select');
        const seedId = select.value;
        
        // Here you would fetch the price for the selected seed
        // For now, we'll use a placeholder
        const priceInput = container.querySelector('input[type="number"]:nth-of-type(2)');
        // Fetch price from seedVarieties array or API call
        this.updateEditItemTotal(itemIndex);
    }

    updateEditItemTotal(itemIndex) {
        const container = document.querySelector(`[data-item-index="${itemIndex}"]`);
        const quantityInput = container.querySelector('input[type="number"]:nth-of-type(1)');
        const priceInput = container.querySelector('input[type="number"]:nth-of-type(2)');
        const totalInput = container.querySelector('input[type="number"]:nth-of-type(3)');
        
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;
        
        totalInput.value = total;
        this.updateEditTotals();
    }

    updateEditTotals() {
        let totalQuantity = 0;
        let totalAmount = 0;
        
        document.querySelectorAll('#edit-items-container [data-item-index]').forEach(container => {
            const quantity = parseFloat(container.querySelector('input[type="number"]:nth-of-type(1)').value) || 0;
            const total = parseFloat(container.querySelector('input[type="number"]:nth-of-type(3)').value) || 0;
            
            totalQuantity += quantity;
            totalAmount += total;
        });
        
        document.getElementById('edit-total-quantity').textContent = totalQuantity;
        document.getElementById('edit-total-amount').textContent = totalAmount.toLocaleString();
    }

    async saveReservationEdit(reservationId) {
        const deliveryDate = document.getElementById('edit-delivery-date').value;
        const editReason = document.getElementById('edit-reason').value.trim();
        
        if (!editReason) {
            this.showError('يجب إدخال سبب التعديل');
            return;
        }
        
        // Collect items data
        const items = [];
        document.querySelectorAll('#edit-items-container [data-item-index]').forEach(container => {
            const seedId = container.querySelector('select').value;
            const quantity = parseFloat(container.querySelector('input[type="number"]:nth-of-type(1)').value);
            const price = parseFloat(container.querySelector('input[type="number"]:nth-of-type(2)').value);
            const total = parseFloat(container.querySelector('input[type="number"]:nth-of-type(3)').value);
            
            if (seedId && quantity > 0 && price > 0) {
                items.push({
                    seed_variety_id: seedId,
                    quantity_kg: quantity,
                    unit_price: price,
                    total_price: total
                });
            }
        });
        
        if (items.length === 0) {
            this.showError('يجب إضافة صنف واحد على الأقل');
            return;
        }
        
        this.showLoading(true);
        try {
            const response = await axios.put(`/api/admin/reservations/${reservationId}/edit`, {
                items: items,
                delivery_date: deliveryDate,
                edit_reason: editReason
            });
            
            if (response.data.success) {
                this.showSuccess('تم تحديث الطلب بنجاح');
                document.querySelector('.fixed.inset-0').remove();
                this.loadReservationsData();
            } else {
                this.showError(response.data.error);
            }
        } catch (error) {
            this.showError('خطأ في حفظ التعديل');
        } finally {
            this.showLoading(false);
        }
    }

    // Allocations Management
    async showAllocationsManagement() {
        const content = document.getElementById('admin-content');
        if (!content) return;

        content.innerHTML = `
            <div class="space-y-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex justify-between items-center">
                            <h2 class="text-xl font-semibold text-gray-900">إدارة تخصيصات الأصناف للمحافظات</h2>
                            <select id="province-selector" onchange="app.loadProvinceAllocations(this.value)"
                                class="border border-gray-300 rounded-lg px-3 py-2">
                                <option value="">اختر المحافظة</option>
                                ${this.provinces.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="p-6">
                        <div id="allocations-content">
                            <div class="text-center py-8 text-gray-500">
                                <i class="fas fa-arrow-up text-4xl mb-4"></i>
                                <p>اختر محافظة لعرض وإدارة تخصيصاتها</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async loadProvinceAllocations(provinceId) {
        if (!provinceId) return;
        
        const container = document.getElementById('allocations-content');
        container.innerHTML = `
            <div class="flex justify-center items-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span class="mr-2">جاري تحميل البيانات...</span>
            </div>
        `;
        
        try {
            const [allocationsRes, varietiesRes] = await Promise.all([
                axios.get(`/api/admin/provinces/${provinceId}/allocations`),
                axios.get('/api/seed-varieties')
            ]);
            
            if (allocationsRes.data.success && varietiesRes.data.success) {
                this.renderAllocationsTable(provinceId, allocationsRes.data.data, varietiesRes.data.data);
            }
        } catch (error) {
            container.innerHTML = '<div class="text-center py-8 text-red-500">خطأ في تحميل البيانات</div>';
        }
    }

    renderAllocationsTable(provinceId, allocations, allVarieties) {
        const container = document.getElementById('allocations-content');
        const provinceName = this.provinces.find(p => p.id == provinceId)?.name || '';
        
        container.innerHTML = `
            <div class="mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">تخصيصات محافظة ${provinceName}</h3>
                    <button onclick="app.showAddAllocationModal(${provinceId})" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                        <i class="fas fa-plus ml-1"></i>إضافة تخصيص جديد
                    </button>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الصنف</th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">الكمية المخصصة</th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">الحد الأدنى</th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">الحد الأقصى</th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">السعر</th>
                                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${allocations.map(allocation => `
                                <tr>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        <div class="text-sm font-medium text-gray-900">${allocation.seed_name}</div>
                                        <div class="text-sm text-gray-500">${allocation.seed_description}</div>
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">${allocation.allocated_quantity_kg} كجم</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">${allocation.min_order_kg} كجم</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">${allocation.max_order_kg} كجم</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">${allocation.price_per_kg.toLocaleString()} ر.ي</td>
                                    <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button onclick="app.editAllocation(${allocation.id})" 
                                            class="text-blue-600 hover:text-blue-900 ml-3">تعديل</button>
                                        <button onclick="app.deleteAllocation(${provinceId}, ${allocation.id})" 
                                            class="text-red-600 hover:text-red-900">حذف</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                ${allocations.length === 0 ? `
                    <div class="text-center py-8 text-gray-500">
                        <i class="fas fa-seedling text-4xl mb-4"></i>
                        <p>لم يتم تخصيص أي أصناف لهذه المحافظة بعد</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    showAddAllocationModal(provinceId) {
        // Implementation for adding new allocation
        this.showSuccess('ميزة إضافة التخصيص قيد التطوير');
    }

    editAllocation(allocationId) {
        // Implementation for editing allocation
        this.showSuccess('ميزة تعديل التخصيص قيد التطوير');
    }

    async deleteAllocation(provinceId, allocationId) {
        if (confirm('هل أنت متأكد من حذف هذا التخصيص؟')) {
            try {
                const response = await axios.delete(`/api/admin/provinces/${provinceId}/allocations/${allocationId}`);
                if (response.data.success) {
                    this.showSuccess('تم حذف التخصيص بنجاح');
                    this.loadProvinceAllocations(provinceId);
                }
            } catch (error) {
                this.showError('خطأ في حذف التخصيص');
            }
        }
    }

    async generateQuotasReport() {
        const container = document.getElementById('reports-content');
        if (!container) return;

        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">تقرير حصص المحافظات</h3>
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
            const response = await axios.get('/api/admin/quotas-report');
            if (response.data.success) {
                this.renderQuotasReportDetailed(response.data.data);
            }
        } catch (error) {
            console.error('Error generating quotas report:', error);
            this.showError('خطأ في إنشاء تقرير الحصص');
        }
    }

    renderQuotasReportDetailed(data) {
        const container = document.getElementById('reports-content');
        if (!container) return;

        const totalQuota = data.reduce((sum, item) => sum + item.quota_tons, 0);
        const totalConsumed = data.reduce((sum, item) => sum + item.consumed_quota, 0);
        const totalRemaining = data.reduce((sum, item) => sum + item.remaining_quota, 0);

        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-900">تقرير حصص المحافظات المفصل</h3>
                        <div class="flex space-x-2 space-x-reverse">
                            <button onclick="app.exportQuotasReportPDF()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                                <i class="fas fa-file-pdf ml-1"></i>تصدير PDF
                            </button>
                            <div class="text-sm text-gray-500">تاريخ التقرير: ${new Date().toLocaleDateString('ar-YE')}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Summary Cards -->
                <div class="p-6 border-b border-gray-200">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="text-sm text-blue-600 font-medium">إجمالي الحصص</div>
                            <div class="text-2xl font-bold text-blue-700">${totalQuota.toLocaleString()} طن</div>
                            <div class="text-sm text-blue-600">في ${data.length} محافظة يمنية</div>
                        </div>
                        <div class="bg-red-50 p-4 rounded-lg">
                            <div class="text-sm text-red-600 font-medium">المستهلك</div>
                            <div class="text-2xl font-bold text-red-700">${totalConsumed.toLocaleString()} طن</div>
                            <div class="text-sm text-red-600">${totalQuota > 0 ? ((totalConsumed / totalQuota) * 100).toFixed(1) : 0}% من الإجمالي</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="text-sm text-green-600 font-medium">المتبقي</div>
                            <div class="text-2xl font-bold text-green-700">${totalRemaining.toLocaleString()} طن</div>
                            <div class="text-sm text-green-600">${totalQuota > 0 ? ((totalRemaining / totalQuota) * 100).toFixed(1) : 0}% من الإجمالي</div>
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
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">عدد الحجوزات</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${data.map(item => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.province_name}</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">${item.quota_tons} طن</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-red-600 font-medium">${item.consumed_quota} طن</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">${item.remaining_quota} طن</td>
                                        <td class="px-6 py-4 whitespace-nowrap text-center">
                                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                item.consumption_percentage > 80 ? 'bg-red-100 text-red-800' :
                                                item.consumption_percentage > 60 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }">
                                                ${item.consumption_percentage}%
                                            </span>
                                        </td>
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

    async generateDistributorsReport() {
        const container = document.getElementById('reports-content');
        if (!container) return;

        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                <div class="p-6 border-b border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-900">تقرير الموزعين</h3>
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
            const response = await axios.get('/api/admin/distributors');
            if (response.data.success) {
                this.renderDistributorsReportDetailed(response.data.data);
            }
        } catch (error) {
            console.error('Error generating distributors report:', error);
            this.showError('خطأ في إنشاء تقرير الموزعين');
        }
    }

    renderDistributorsReportDetailed(data) {
        const container = document.getElementById('reports-content');
        if (!container) return;

        const totalDistributors = data.length;
        const activeDistributors = data.filter(d => d.is_active).length;
        const averageCommission = totalDistributors > 0 ? data.reduce((sum, d) => sum + d.commission_percentage, 0) / totalDistributors : 0;
        const totalReservations = data.reduce((sum, d) => sum + d.total_reservations, 0);

        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-900">تقرير الموزعين اليمنيين</h3>
                        <div class="flex space-x-2 space-x-reverse">
                            <button onclick="app.exportDistributorsReportPDF()" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm">
                                <i class="fas fa-file-pdf ml-1"></i>تصدير PDF
                            </button>
                            <div class="text-sm text-gray-500">تاريخ التقرير: ${new Date().toLocaleDateString('ar-YE')}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Summary Cards -->
                <div class="p-6 border-b border-gray-200">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="text-sm text-blue-600 font-medium">إجمالي الموزعين</div>
                            <div class="text-2xl font-bold text-blue-700">${totalDistributors}</div>
                            <div class="text-sm text-blue-600">موزع في اليمن</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="text-sm text-green-600 font-medium">الموزعين النشطين</div>
                            <div class="text-2xl font-bold text-green-700">${activeDistributors}</div>
                            <div class="text-sm text-green-600">${totalDistributors > 0 ? ((activeDistributors / totalDistributors) * 100).toFixed(1) : 0}% من الإجمالي</div>
                        </div>
                        <div class="bg-orange-50 p-4 rounded-lg">
                            <div class="text-sm text-orange-600 font-medium">متوسط العمولة</div>
                            <div class="text-2xl font-bold text-orange-700">${averageCommission.toFixed(1)}%</div>
                            <div class="text-sm text-orange-600">عمولة متوسطة</div>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <div class="text-sm text-purple-600 font-medium">إجمالي الحجوزات</div>
                            <div class="text-2xl font-bold text-purple-700">${totalReservations}</div>
                            <div class="text-sm text-purple-600">عبر الموزعين</div>
                        </div>
                    </div>
                </div>

                <!-- Detailed Table -->
                <div class="p-6">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الموزع</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">المحافظة</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">نسبة العمولة</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">عدد الحجوزات</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                    <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">التقييم</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${data.map(item => {
                                    const performance = item.total_reservations > 10 ? 'ممتاز' : 
                                                       item.total_reservations > 5 ? 'جيد' : 
                                                       item.total_reservations > 0 ? 'مقبول' : 'لا يوجد';
                                    const performanceClass = item.total_reservations > 10 ? 'text-green-600' : 
                                                            item.total_reservations > 5 ? 'text-blue-600' : 
                                                            item.total_reservations > 0 ? 'text-yellow-600' : 'text-gray-600';
                                    return `
                                        <tr class="hover:bg-gray-50">
                                            <td class="px-6 py-4 whitespace-nowrap">
                                                <div class="text-sm font-medium text-gray-900">${item.name}</div>
                                                <div class="text-sm text-gray-500">${item.phone}</div>
                                                <div class="text-sm text-gray-500">${item.address}</div>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">${item.province_name}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    ${item.commission_percentage}%
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">${item.total_reservations}</td>
                                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }">
                                                    ${item.is_active ? 'نشط' : 'غير نشط'}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium ${performanceClass}">
                                                ${performance}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    // PDF Export Functions
    exportReportsPDF() {
        // Generate combined PDF report
        this.showSuccess('ميزة تصدير التقارير المجمعة قيد التطوير');
    }

    exportQuotasReportPDF() {
        // Create a simple PDF export functionality
        const printWindow = window.open('', '', 'height=600,width=800');
        const content = document.getElementById('reports-content').innerHTML;
        
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>تقرير حصص المحافظات اليمنية - ${new Date().toLocaleDateString('ar-YE')}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    .grid { display: none; }
                    button { display: none; }
                    .summary-cards { margin: 20px 0; }
                    h1, h3 { text-align: center; color: #333; }
                    @media print {
                        button, .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <h1>تقرير حصص المحافظات اليمنية</h1>
                <p style="text-align: center;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-YE')}</p>
                ${content}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }

    exportDistributorsReportPDF() {
        // Create a simple PDF export functionality for distributors
        const printWindow = window.open('', '', 'height=600,width=800');
        const content = document.getElementById('reports-content').innerHTML;
        
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>تقرير الموزعين اليمنيين - ${new Date().toLocaleDateString('ar-YE')}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; direction: rtl; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
                    th { background-color: #f5f5f5; font-weight: bold; }
                    .grid { display: none; }
                    button { display: none; }
                    .summary-cards { margin: 20px 0; }
                    h1, h3 { text-align: center; color: #333; }
                    @media print {
                        button, .no-print { display: none !important; }
                    }
                </style>
            </head>
            <body>
                <h1>تقرير الموزعين اليمنيين</h1>
                <p style="text-align: center;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-YE')}</p>
                ${content}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
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