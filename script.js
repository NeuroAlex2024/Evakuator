// DOM Elements
const modal = document.getElementById('callbackModal');
const distanceSlider = document.getElementById('distance');
const distanceValue = document.getElementById('distanceValue');
const vehicleType = document.getElementById('vehicleType');
const basePrice = document.getElementById('basePrice');
const kmPrice = document.getElementById('kmPrice');
const totalPrice = document.getElementById('totalPrice');
const callbackForm = document.getElementById('callbackForm');

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeCalculator();
    initializePhoneMask();
    initializeScrollAnimations();
});

// Calculator functionality
function calculatePrice() {
    const distance = parseInt(distanceSlider.value);
    const vehiclePrice = parseInt(vehicleType.value);
    const kmCost = distance * 50;
    const total = vehiclePrice + kmCost;

    distanceValue.textContent = `${distance} км`;
    basePrice.textContent = `${vehiclePrice}₽`;
    kmPrice.textContent = `${kmCost}₽`;
    totalPrice.textContent = `${total}₽`;

    // Update slider background
    const percentage = (distance / 100) * 100;
    distanceSlider.style.background = `linear-gradient(to right, #ff6b35 0%, #ff6b35 ${percentage}%, #e2e8f0 ${percentage}%, #e2e8f0 100%)`;
}

function initializeCalculator() {
    if (distanceSlider && vehicleType) {
        distanceSlider.addEventListener('input', calculatePrice);
        vehicleType.addEventListener('change', calculatePrice);
        calculatePrice(); // Initial calculation
    }
}



// Modal functionality
function openCallbackModal() {
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        startCallbackTimer();
    }
}

function closeCallbackModal() {
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        stopCallbackTimer();
        
        // Reset modal content to original
        const modalTitle = modal.querySelector('h3');
        const modalDescription = modal.querySelector('p');
        
        if (modalTitle) modalTitle.textContent = 'Заказать обратный звонок';
        if (modalDescription) modalDescription.textContent = 'Оставьте номер телефона и мы перезвоним в течение 30 секунд';
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === modal) {
        closeCallbackModal();
    }
}

// Callback timer
let callbackTimer;
let callbackActive = false;

function startCallbackTimer() {
    if (callbackActive) return;
    
    const idleTimer = document.querySelector('.callback-timer-idle');
    const activeTimer = document.querySelector('.callback-timer-active');
    const finishedTimer = document.querySelector('.callback-timer-finished');
    const progressBar = document.querySelector('.timer-slider-progress');
    
    // Show progress bar animation
    if (progressBar) {
        progressBar.style.width = '100%';
    }
    
    // Show active timer after form submission
    setTimeout(() => {
        if (idleTimer) idleTimer.style.display = 'none';
        if (activeTimer) activeTimer.style.display = 'block';
        if (finishedTimer) finishedTimer.style.display = 'none';
    }, 500);
}

function activateCallbackTimer() {
    callbackActive = true;
    let seconds = 30;
    const timerElement = document.getElementById('callbackCountdown');
    const idleTimer = document.querySelector('.callback-timer-idle');
    const activeTimer = document.querySelector('.callback-timer-active');
    const finishedTimer = document.querySelector('.callback-timer-finished');
    
    // Hide idle, show active
    if (idleTimer) idleTimer.style.display = 'none';
    if (activeTimer) activeTimer.style.display = 'block';
    if (finishedTimer) finishedTimer.style.display = 'none';
    
    if (timerElement) {
        callbackTimer = setInterval(() => {
            timerElement.textContent = seconds;
            seconds--;
            
            if (seconds < 0) {
                clearInterval(callbackTimer);
                // Show finished message
                if (activeTimer) activeTimer.style.display = 'none';
                if (finishedTimer) finishedTimer.style.display = 'block';
                callbackActive = false;
            }
        }, 1000);
    }
}

function stopCallbackTimer() {
    if (callbackTimer) {
        clearInterval(callbackTimer);
    }
    // Reset to idle state
    const idleTimer = document.querySelector('.callback-timer-idle');
    const activeTimer = document.querySelector('.callback-timer-active');
    const finishedTimer = document.querySelector('.callback-timer-finished');
    const progressBar = document.querySelector('.timer-slider-progress');
    
    if (idleTimer) idleTimer.style.display = 'block';
    if (activeTimer) activeTimer.style.display = 'none';
    if (finishedTimer) finishedTimer.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    
    callbackActive = false;
}

// Phone mask
function initializePhoneMask() {
    const phoneInput = document.getElementById('clientPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 0) {
                if (value[0] === '8') {
                    value = '7' + value.slice(1);
                }
                if (value[0] === '7') {
                    value = value.slice(1);
                }
            }
            
            let formattedValue = '+7';
            if (value.length > 0) {
                formattedValue += ' (' + value.substring(0, 3);
            }
            if (value.length >= 4) {
                formattedValue += ') ' + value.substring(3, 6);
            }
            if (value.length >= 7) {
                formattedValue += '-' + value.substring(6, 8);
            }
            if (value.length >= 9) {
                formattedValue += '-' + value.substring(8, 10);
            }
            
            e.target.value = formattedValue;
        });
    }
}

// Form submission
if (callbackForm) {
    callbackForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('clientName').value;
        const phone = document.getElementById('clientPhone').value;
        
        if (name && phone) {
            // Отправка данных в Telegram
            sendToTelegram(name, phone);
            
            // Start callback timer animation
            activateCallbackTimer();
            
            // Reset form but keep modal open
            callbackForm.reset();
        }
    });
}

// Функция отправки в Telegram
async function sendToTelegram(name, phone) {
    const BOT_TOKEN = '7855914150:AAF7tCCMaM0NLa_r_QLBJ1APTXquVZPb7ls';
    const CHAT_ID = '352283464'; // Ваш Chat ID
    
    const message = `🚛 НОВАЯ ЗАЯВКА НА ЭВАКУАТОР

👤 Имя: ${name}
📱 Телефон: ${phone}
🕐 Время: ${new Date().toLocaleString('ru-RU', {
        timeZone: 'Europe/Moscow',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    })}

⚡ Перезвоните клиенту срочно!`;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message
            })
        });
        
        if (response.ok) {
            console.log('✅ Заявка успешно отправлена в Telegram');
        } else {
            console.error('❌ Ошибка отправки в Telegram:', response.status);
        }
    } catch (error) {
        console.error('❌ Ошибка при отправке в Telegram:', error);
    }
}

// FAQ functionality
function toggleFaq(element) {
    const faqItem = element.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    const isActive = element.classList.contains('active');
    
    // Close all other FAQ items
    document.querySelectorAll('.faq-question').forEach(q => {
        q.classList.remove('active');
        q.parentElement.querySelector('.faq-answer').classList.remove('active');
    });
    
    // Toggle current item
    if (!isActive) {
        element.classList.add('active');
        answer.classList.add('active');
    }
}

// Countdown animation - removed as we now use static text

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Scroll animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animatedElements = document.querySelectorAll('.step, .advantage, .review, .fleet-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Header scroll effect
window.addEventListener('scroll', function() {
    const header = document.querySelector('.sticky-header');
    if (header) {
        if (window.scrollY > 100) {
            header.style.background = 'rgba(255, 255, 255, 0.98)';
            header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.background = 'rgba(255, 255, 255, 0.95)';
            header.style.boxShadow = 'none';
        }
    }
});

// Lazy loading for images (if any are added later)
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// Call tracking simulation
function trackCall(source) {
    console.log(`Call initiated from: ${source}`);
    // Here you would typically send data to analytics
}

// Add click tracking to phone links
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', function() {
        trackCall(this.textContent);
    });
});

// Add hover effects to cards
document.querySelectorAll('.step, .advantage, .review, .fleet-item').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-8px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Keyboard navigation for modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.style.display === 'block') {
        closeCallbackModal();
    }
});

// Performance optimization: debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debouncing to scroll events
const debouncedScrollHandler = debounce(function() {
    // Any scroll-based functionality can go here
}, 100);

window.addEventListener('scroll', debouncedScrollHandler);

// Price animation on calculator change
function animatePrice() {
    const priceElements = document.querySelectorAll('#basePrice, #kmPrice, #totalPrice');
    priceElements.forEach(el => {
        el.style.transform = 'scale(1.1)';
        el.style.color = '#ff6b35';
        setTimeout(() => {
            el.style.transform = 'scale(1)';
            el.style.color = '';
        }, 200);
    });
}

// Enhanced calculator with animation
if (distanceSlider) {
    distanceSlider.addEventListener('input', function() {
        calculatePrice();
        animatePrice();
    });
}

if (vehicleType) {
    vehicleType.addEventListener('change', function() {
        calculatePrice();
        animatePrice();
    });
}

// Add loading animation
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});

// Preload critical resources
function preloadResources() {
    const criticalResources = [
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
    ];
    
    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource;
        link.as = 'style';
        document.head.appendChild(link);
    });
}

// Initialize preloading
preloadResources();

// Add error handling for failed resource loads
window.addEventListener('error', function(e) {
    console.error('Resource failed to load:', e.target.src || e.target.href);
});

// Add focus management for accessibility
function manageFocus() {
    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Tab') {
            const focusable = Array.from(document.querySelectorAll(focusableElements));
            const index = focusable.indexOf(document.activeElement);
            
            if (e.shiftKey) {
                const nextIndex = index > 0 ? index - 1 : focusable.length - 1;
                focusable[nextIndex].focus();
            } else {
                const nextIndex = index < focusable.length - 1 ? index + 1 : 0;
                focusable[nextIndex].focus();
            }
        }
    });
}

// Initialize focus management
manageFocus();

// Add touch support for mobile
function addTouchSupport() {
    let touchStartY = 0;
    
    document.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
    });
    
    document.addEventListener('touchmove', function(e) {
        const touchY = e.touches[0].clientY;
        const touchDiff = touchStartY - touchY;
        
        // Add any touch-specific functionality here
    });
}

// Initialize touch support
addTouchSupport(); 