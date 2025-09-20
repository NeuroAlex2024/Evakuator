const CallbackService = {
    async send(endpoint, payload) {
        if (endpoint) {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('REQUEST_FAILED');
            }

            try {
                return await response.json();
            } catch (error) {
                return { success: true };
            }
        }

        await new Promise(resolve => setTimeout(resolve, 600));
        return { success: true };
    }
};

const App = {
    config: {
        kmRate: 50,
        expressCost: 500,
        callbackSeconds: 30,
        priceAnimationDuration: 320,
        analyticsCounterId: 103201010,
        apiEndpoint: ''
    },
    state: {
        menuOpen: false,
        modalOpen: false,
        callbackInterval: null,
        lastCalculation: null
    },
    elements: {},

    init() {
        this.cacheElements();
        this.bindEvents();
        this.updateCalculatorDisplay({ animate: false });
        this.updateSliderBackground();
        this.resetCallbackTimerUI();
        this.initSmoothScroll();
        this.initializeScrollAnimations();
        this.handleScroll();
        this.maskPhoneInput();
        window.addEventListener('load', () => document.body.classList.add('loaded'));
    },

    cacheElements() {
        this.elements.body = document.body;
        this.elements.header = document.querySelector('.sticky-header');
        this.elements.navMenu = document.getElementById('navMenu');
        this.elements.mobileToggle = document.querySelector('.mobile-menu-toggle');
        this.elements.navLinks = Array.from(document.querySelectorAll('.nav-link'));
        this.elements.vehicleButtons = Array.from(document.querySelectorAll('.vehicle-btn'));
        this.elements.optionButtons = Array.from(document.querySelectorAll('.option-btn'));
        this.elements.distanceInput = document.getElementById('distance');
        this.elements.distanceValue = document.getElementById('distanceValue');
        this.elements.expressCheckbox = document.getElementById('expressService');
        this.elements.basePrice = document.getElementById('basePrice');
        this.elements.kmPrice = document.getElementById('kmPrice');
        this.elements.totalPrice = document.getElementById('totalPrice');
        this.elements.complexityRow = document.getElementById('complexityPrice');
        this.elements.complexityValue = this.elements.complexityRow?.querySelector('span');
        this.elements.expressRow = document.getElementById('expressPrice');
        this.elements.expressValue = this.elements.expressRow?.querySelector('span');
        this.elements.modal = document.getElementById('callbackModal');
        this.elements.modalClose = this.elements.modal?.querySelector('.close');
        this.elements.modalTriggers = Array.from(document.querySelectorAll('[data-modal="callback"]'));
        this.elements.callbackForm = document.getElementById('callbackForm');
        this.elements.callbackSubmit = this.elements.callbackForm?.querySelector('button[type="submit"]');
        this.elements.callbackFeedback = document.getElementById('callbackFeedback');
        this.elements.clientName = document.getElementById('clientName');
        this.elements.clientPhone = document.getElementById('clientPhone');
        this.elements.modalTitle = this.elements.modal?.querySelector('h3');
        this.elements.modalDescription = this.elements.modal?.querySelector('p');
        this.elements.timerIdle = document.querySelector('.callback-timer-idle');
        this.elements.timerActive = document.querySelector('.callback-timer-active');
        this.elements.timerFinished = document.querySelector('.callback-timer-finished');
        this.elements.timerProgress = document.querySelector('.timer-slider-progress');
        this.elements.callbackCountdown = document.getElementById('callbackCountdown');
        this.elements.faqQuestions = Array.from(document.querySelectorAll('.faq-question'));
        this.elements.analyticsTargets = Array.from(document.querySelectorAll('[data-ym-goal]'));
    },

    bindEvents() {
        if (this.elements.mobileToggle) {
            this.elements.mobileToggle.addEventListener('click', () => this.toggleMenu());
        }

        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMenu();
            });
        });

        document.addEventListener('click', event => this.handleDocumentClick(event));
        window.addEventListener('keydown', event => this.handleKeydown(event));
        window.addEventListener('scroll', () => this.handleScroll());

        this.elements.vehicleButtons.forEach(button => {
            button.addEventListener('click', () => this.handleVehicleSelect(button));
        });

        this.elements.optionButtons.forEach(button => {
            button.addEventListener('click', () => this.handleOptionSelect(button));
        });

        if (this.elements.distanceInput) {
            this.elements.distanceInput.addEventListener('input', () => {
                this.updateSliderBackground();
                this.updateCalculatorDisplay();
            });
        }

        if (this.elements.expressCheckbox) {
            this.elements.expressCheckbox.addEventListener('change', () => this.updateCalculatorDisplay());
        }

        this.elements.modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', event => {
                event.preventDefault();
                this.callAnalytics(trigger.dataset.ymGoal);
                this.openModal();
            });
        });

        if (this.elements.modalClose) {
            this.elements.modalClose.addEventListener('click', () => this.closeModal());
        }

        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', event => this.handleModalClick(event));
        }

        if (this.elements.callbackForm) {
            this.elements.callbackForm.addEventListener('submit', event => this.handleCallbackSubmit(event));
        }

        this.elements.faqQuestions.forEach(question => {
            question.setAttribute('tabindex', '0');
            question.setAttribute('role', 'button');
            question.addEventListener('click', event => this.toggleFaq(event.currentTarget));
            question.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.toggleFaq(event.currentTarget);
                }
            });
        });

        this.elements.analyticsTargets
            .filter(target => !target.dataset.modal && target !== this.elements.callbackSubmit)
            .forEach(target => {
                target.addEventListener('click', () => this.callAnalytics(target.dataset.ymGoal));
            });
    },

    toggleMenu() {
        if (!this.elements.navMenu || !this.elements.mobileToggle) {
            return;
        }

        this.state.menuOpen = !this.state.menuOpen;
        this.elements.navMenu.classList.toggle('mobile-active', this.state.menuOpen);
        this.elements.mobileToggle.classList.toggle('active', this.state.menuOpen);
        this.elements.mobileToggle.setAttribute('aria-expanded', String(this.state.menuOpen));
        this.elements.body.style.overflow = this.state.menuOpen ? 'hidden' : '';
    },

    closeMenu() {
        if (!this.state.menuOpen) {
            return;
        }
        this.state.menuOpen = false;
        this.elements.navMenu?.classList.remove('mobile-active');
        this.elements.mobileToggle?.classList.remove('active');
        this.elements.mobileToggle?.setAttribute('aria-expanded', 'false');
        this.elements.body.style.overflow = '';
    },

    handleDocumentClick(event) {
        if (this.state.menuOpen && this.elements.header && !this.elements.header.contains(event.target)) {
            this.closeMenu();
        }
    },

    handleKeydown(event) {
        if (event.key === 'Escape') {
            if (this.state.menuOpen) {
                this.closeMenu();
            }
            if (this.state.modalOpen) {
                this.closeModal();
            }
        }
    },

    handleScroll() {
        const header = this.elements.header;
        if (!header) {
            return;
        }

        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
    },

    handleVehicleSelect(button) {
        this.elements.vehicleButtons.forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        this.updateCalculatorDisplay();
    },

    handleOptionSelect(button) {
        const group = button.closest('.button-group');
        const buttonsInGroup = group ? Array.from(group.querySelectorAll('.option-btn')) : [];
        buttonsInGroup.forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        this.updateCalculatorDisplay();
    },

    updateSliderBackground() {
        const slider = this.elements.distanceInput;
        if (!slider) {
            return;
        }

        const min = Number(slider.min) || 0;
        const max = Number(slider.max) || 100;
        const value = Number(slider.value) || min;
        const percentage = max === min ? 0 : ((value - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, #ff6b35 0%, #ff6b35 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
    },

    calculatePrice() {
        const distance = Number(this.elements.distanceInput?.value || 0);
        const activeVehicle = this.elements.vehicleButtons.find(button => button.classList.contains('active'));
        const vehiclePrice = activeVehicle ? Number(activeVehicle.dataset.price || 0) : 0;
        const vehicleType = activeVehicle ? activeVehicle.dataset.type || 'vehicle' : 'vehicle';

        const wheelsOption = document.querySelector('.option-btn.active[data-wheels]');
        const wheels = wheelsOption ? Number(wheelsOption.dataset.wheels) : 0;
        const steeringOption = document.querySelector('.option-btn.active[data-steering]');
        const steeringLocked = steeringOption ? steeringOption.dataset.steering === 'yes' : false;
        const expressSelected = Boolean(this.elements.expressCheckbox?.checked);

        let complexityCost = 0;
        if (steeringLocked || wheels > 2) {
            complexityCost = 500;
        } else if (wheels > 0) {
            complexityCost = 300;
        }

        const kmCost = distance * this.config.kmRate;
        const expressCost = expressSelected ? this.config.expressCost : 0;
        const total = vehiclePrice + kmCost + complexityCost + expressCost;

        return {
            distance,
            vehiclePrice,
            vehicleType,
            kmCost,
            complexityCost,
            expressCost,
            total,
            wheels,
            steeringLocked,
            expressSelected
        };
    },

    updateCalculatorDisplay({ animate = true } = {}) {
        const breakdown = this.calculatePrice();
        this.state.lastCalculation = breakdown;

        if (this.elements.distanceValue) {
            this.elements.distanceValue.textContent = `${breakdown.distance} км`;
        }

        this.animateCurrency(this.elements.basePrice, breakdown.vehiclePrice, { animate });
        this.animateCurrency(this.elements.kmPrice, breakdown.kmCost, { animate });
        this.animateCurrency(this.elements.totalPrice, breakdown.total, { animate });

        if (this.elements.complexityRow && this.elements.complexityValue) {
            if (breakdown.complexityCost > 0) {
                this.elements.complexityRow.style.display = 'flex';
                this.animateCurrency(this.elements.complexityValue, breakdown.complexityCost, { animate, signed: true });
            } else {
                this.elements.complexityRow.style.display = 'none';
            }
        }

        if (this.elements.expressRow && this.elements.expressValue) {
            if (breakdown.expressCost > 0) {
                this.elements.expressRow.style.display = 'flex';
                this.animateCurrency(this.elements.expressValue, breakdown.expressCost, { animate, signed: true });
            } else {
                this.elements.expressRow.style.display = 'none';
            }
        }

        return breakdown;
    },

    animateCurrency(element, value, { animate = true, signed = false } = {}) {
        if (!element) {
            return;
        }

        const formatted = number => {
            const sign = signed && number > 0 ? '+' : signed && number < 0 ? '−' : '';
            const absolute = Math.abs(number);
            return `${sign}${absolute.toLocaleString('ru-RU')}₽`;
        };

        const targetValue = Number(value) || 0;
        const startValue = Number(element.dataset.value || element.textContent.replace(/[^0-9-]/g, '')) || 0;

        if (!animate) {
            element.textContent = formatted(targetValue);
            element.dataset.value = String(targetValue);
            return;
        }

        const startTime = performance.now();
        const duration = this.config.priceAnimationDuration;

        const step = currentTime => {
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const currentValue = Math.round(startValue + (targetValue - startValue) * progress);
            element.textContent = formatted(currentValue);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.dataset.value = String(targetValue);
            }
        };

        requestAnimationFrame(step);
    },

    openModal() {
        if (!this.elements.modal) {
            return;
        }

        this.resetModalContent();
        this.elements.modal.style.display = 'block';
        this.elements.body.style.overflow = 'hidden';
        this.state.modalOpen = true;
    },

    closeModal() {
        if (!this.elements.modal) {
            return;
        }

        this.elements.modal.style.display = 'none';
        this.elements.body.style.overflow = '';
        this.state.modalOpen = false;
        this.elements.callbackForm?.reset();
        this.resetCallbackTimerUI();
        this.clearFormFeedback();
    },

    handleModalClick(event) {
        if (event.target === this.elements.modal) {
            this.closeModal();
        }
    },

    resetModalContent() {
        if (this.elements.modalTitle) {
            this.elements.modalTitle.textContent = 'Заказать обратный звонок';
        }
        if (this.elements.modalDescription) {
            this.elements.modalDescription.textContent = 'Оставьте номер телефона и мы перезвоним в течение 30 секунд';
        }
        this.clearFormFeedback();
        this.setFormLoading(false);
        this.resetCallbackTimerUI();
    },

    async handleCallbackSubmit(event) {
        event.preventDefault();
        if (!this.elements.callbackForm) {
            return;
        }

        const name = (this.elements.clientName?.value || '').trim();
        const phone = (this.elements.clientPhone?.value || '').trim();

        if (!name || !phone) {
            this.showFormFeedback('Пожалуйста, заполните имя и телефон.', 'error');
            return;
        }

        this.callAnalytics(this.elements.callbackSubmit?.dataset.ymGoal);
        this.clearFormFeedback();
        this.setFormLoading(true);

        const breakdown = this.state.lastCalculation || this.calculatePrice();
        const payload = {
            name,
            phone,
            requestedAt: new Date().toISOString(),
            calculator: breakdown
        };

        try {
            const response = await CallbackService.send(this.config.apiEndpoint, payload);
            if (!response || response.success === false) {
                throw new Error('SERVER_ERROR');
            }

            this.showFormFeedback('Спасибо! Заявка отправлена, мы перезвоним в ближайшее время.', 'success');
            this.elements.callbackForm.reset();
            this.resetCallbackTimerUI();
            this.startCallbackCountdown();
        } catch (error) {
            this.showFormFeedback('Не удалось отправить заявку. Попробуйте ещё раз.', 'error');
        } finally {
            this.setFormLoading(false);
        }
    },

    setFormLoading(isLoading) {
        if (!this.elements.callbackSubmit) {
            return;
        }
        this.elements.callbackSubmit.disabled = isLoading;
        this.elements.callbackSubmit.setAttribute('aria-busy', String(isLoading));
    },

    clearFormFeedback() {
        if (!this.elements.callbackFeedback) {
            return;
        }
        this.elements.callbackFeedback.textContent = '';
        this.elements.callbackFeedback.classList.remove('form-feedback--success', 'form-feedback--error');
    },

    showFormFeedback(message, type) {
        if (!this.elements.callbackFeedback) {
            return;
        }
        this.elements.callbackFeedback.textContent = message;
        this.elements.callbackFeedback.classList.remove('form-feedback--success', 'form-feedback--error');
        if (type === 'success') {
            this.elements.callbackFeedback.classList.add('form-feedback--success');
        }
        if (type === 'error') {
            this.elements.callbackFeedback.classList.add('form-feedback--error');
        }
    },

    resetCallbackTimerUI() {
        if (this.state.callbackInterval) {
            clearInterval(this.state.callbackInterval);
            this.state.callbackInterval = null;
        }

        if (this.elements.timerIdle) {
            this.elements.timerIdle.style.display = 'block';
        }
        if (this.elements.timerActive) {
            this.elements.timerActive.style.display = 'none';
        }
        if (this.elements.timerFinished) {
            this.elements.timerFinished.style.display = 'none';
        }
        if (this.elements.timerProgress) {
            this.elements.timerProgress.style.transition = 'none';
            this.elements.timerProgress.style.width = '0%';
            requestAnimationFrame(() => {
                if (this.elements.timerProgress) {
                    this.elements.timerProgress.style.transition = `width ${this.config.callbackSeconds}s linear`;
                }
            });
        }
        if (this.elements.callbackCountdown) {
            this.elements.callbackCountdown.textContent = String(this.config.callbackSeconds);
        }
    },

    startCallbackCountdown() {
        if (!this.elements.timerActive || !this.elements.callbackCountdown) {
            return;
        }

        if (this.state.callbackInterval) {
            clearInterval(this.state.callbackInterval);
        }

        let remaining = this.config.callbackSeconds;
        if (this.elements.timerIdle) {
            this.elements.timerIdle.style.display = 'none';
        }
        this.elements.timerActive.style.display = 'block';
        if (this.elements.timerFinished) {
            this.elements.timerFinished.style.display = 'none';
        }
        this.elements.callbackCountdown.textContent = String(remaining);

        if (this.elements.timerProgress) {
            this.elements.timerProgress.style.width = '0%';
            requestAnimationFrame(() => {
                if (this.elements.timerProgress) {
                    this.elements.timerProgress.style.width = '100%';
                }
            });
        }

        this.state.callbackInterval = window.setInterval(() => {
            remaining -= 1;
            if (remaining >= 0) {
                this.elements.callbackCountdown.textContent = String(remaining);
            }
            if (remaining < 0) {
                this.finishCallbackCountdown();
            }
        }, 1000);
    },

    finishCallbackCountdown() {
        if (this.state.callbackInterval) {
            clearInterval(this.state.callbackInterval);
            this.state.callbackInterval = null;
        }

        if (this.elements.timerActive) {
            this.elements.timerActive.style.display = 'none';
        }
        if (this.elements.timerFinished) {
            this.elements.timerFinished.style.display = 'block';
        }
    },

    callAnalytics(goal) {
        const counterId = this.config.analyticsCounterId;
        if (!goal || !counterId || typeof window === 'undefined') {
            return;
        }

        const metrika = window.ym;
        if (typeof metrika === 'function') {
            metrika(counterId, 'reachGoal', goal);
        }
    },

    initializeScrollAnimations() {
        const animatedElements = document.querySelectorAll('.step, .advantage, .review, .fleet-item');
        if (!animatedElements.length) {
            return;
        }

        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });
    },

    initSmoothScroll() {
        const anchors = document.querySelectorAll('a[href^="#"]');
        anchors.forEach(anchor => {
            anchor.addEventListener('click', event => {
                const href = anchor.getAttribute('href');
                if (!href || href === '#' || anchor.dataset.modal) {
                    return;
                }
                const target = document.querySelector(href);
                if (target) {
                    event.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    this.closeMenu();
                }
            });
        });
    },

    toggleFaq(question) {
        const answer = question.nextElementSibling;
        const isActive = question.classList.contains('active');

        this.elements.faqQuestions.forEach(item => {
            item.classList.remove('active');
            item.nextElementSibling?.classList.remove('active');
        });

        if (!isActive) {
            question.classList.add('active');
            answer?.classList.add('active');
        }
    },

    maskPhoneInput() {
        const input = this.elements.clientPhone;
        if (!input) {
            return;
        }

        input.addEventListener('input', event => {
            const target = event.target;
            let value = target.value.replace(/\D/g, '');

            if (value.startsWith('8')) {
                value = '7' + value.slice(1);
            }
            if (value.startsWith('7')) {
                value = value.slice(1);
            }

            let formatted = '+7';
            if (value.length > 0) {
                formatted += ' (' + value.substring(0, 3);
            }
            if (value.length >= 4) {
                formatted += ') ' + value.substring(3, 6);
            }
            if (value.length >= 7) {
                formatted += '-' + value.substring(6, 8);
            }
            if (value.length >= 9) {
                formatted += '-' + value.substring(8, 10);
            }

            target.value = formatted;
        });
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

window.App = App;
