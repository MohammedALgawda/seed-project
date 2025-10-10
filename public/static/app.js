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
                            <span class="font-bold text-green-600">${this.formatPrice(variety.price_per_kg)} د.ع</span>
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
                                <span id="total-amount">0 د.ع</span>
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
                        <span class="font-bold text-green-600">${this.formatPrice(variety.price_per_kg)} د.ع/كيلو</span>
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
                        <span class="text-sm text-gray-500 block">${item.quantity_kg} كيلو × ${this.formatPrice(item.unit_price)} د.ع</span>
                    </div>
                    <span class="font-bold text-green-600">${this.formatPrice(item.total_price)} د.ع</span>
                </div>
            `).join('');
        }

        // Update totals
        const totalQuantity = this.cart.reduce((sum, item) => sum + item.quantity_kg, 0);
        const totalAmount = this.cart.reduce((sum, item) => sum + item.total_price, 0);

        document.getElementById('total-quantity').textContent = `${totalQuantity} كيلو`;
        document.getElementById('total-amount').textContent = `${this.formatPrice(totalAmount)} د.ع`;
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
                                <p class="text-gray-600">تاريخ الطلب: ${new Date(reservation.created_at).toLocaleDateString('ar-IQ')}</p>
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
                                <span class="font-medium mr-2 text-green-600">${this.formatPrice(reservation.total_amount)} د.ع</span>
                            </div>
                            <div>
                                <span class="text-gray-500">موعد التسليم:</span>
                                <span class="font-medium mr-2">${new Date(reservation.delivery_date).toLocaleDateString('ar-IQ')}</span>
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
        return new Intl.NumberFormat('ar-IQ').format(price);
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
        // Placeholder for staff login functionality
        alert('صفحة دخول الموظفين قيد التطوير');
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
                                <div class="text-sm text-gray-600">${item.quantity_kg} كيلو × ${this.formatPrice(item.unit_price)} د.ع</div>
                            </div>
                            <div class="font-bold text-green-700">${this.formatPrice(item.total_price)} د.ع</div>
                        </div>
                    `).join('')}
                    <div class="border-t-2 border-green-300 pt-3">
                        <div class="flex justify-between text-lg font-bold">
                            <span>المجموع الكلي:</span>
                            <span class="text-green-700">${this.formatPrice(totalAmount)} د.ع</span>
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
                    <div><strong>تاريخ التسليم:</strong> ${new Date(deliveryDate).toLocaleDateString('ar-IQ')}</div>
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PotatoSeedsApp();
});