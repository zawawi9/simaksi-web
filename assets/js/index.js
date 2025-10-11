// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        // Check if href is not just "#" before trying to use as selector
        if (href && href !== '#') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Enhanced scroll to top functionality - avoid duplicate declaration
if (typeof scrollToTopBtn === 'undefined') {
    var scrollToTopBtn = document.getElementById('scroll-to-top-btn');
    if (!scrollToTopBtn) {
        scrollToTopBtn = document.createElement('div');
        scrollToTopBtn.id = 'scroll-to-top-btn';
        scrollToTopBtn.className = 'scroll-to-top';
        scrollToTopBtn.innerHTML = '<i class=\"fas fa-arrow-up\"></i>';
        document.body.appendChild(scrollToTopBtn);
    } else {
        // If element already exists, just ensure the functionality is attached
        scrollToTopBtn.innerHTML = '<i class=\"fas fa-arrow-up\"></i>';
    }

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Add animation on scroll for elements
function animateOnScroll() {
    const elements = document.querySelectorAll('.card-hover, .bg-white, .testimoni-container, .feature-badge');
    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        if (elementPosition < screenPosition) {
            // Don't animate if already animated
            if (element.style.opacity !== '1') {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        }
    });
}

window.addEventListener('scroll', animateOnScroll);

// Initialize elements with opacity 0 for animation
document.addEventListener('DOMContentLoaded', function() {
    const elements = document.querySelectorAll('.card-hover, .bg-white, .testimoni-container, .feature-badge');
    elements.forEach(element => {
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
    });
    
    // Trigger initial animation check
    setTimeout(animateOnScroll, 100);
});

// Add floating effect to hero section (avoid duplicate declaration)
if (typeof heroElements === 'undefined') {
    const heroElements = document.querySelectorAll('.hero-background h1, .hero-background h2, .hero-background p, .hero-background a, .hero-background .counter');
    heroElements.forEach(el => {
        el.classList.add('floating');
    });
}

// Enhanced counter animation for stats
function animateCounter(element, target, duration) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        element.textContent = Math.floor(start);
        
        if (start >= target) {
            element.textContent = Math.floor(target);
            clearInterval(timer);
        }
    }, 16);
}

// Activate counters when they come into view
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
};

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target.querySelector('.counter');
            if (counter) {
                const target = parseInt(counter.getAttribute('data-target')) || parseInt(counter.textContent);
                if (!isNaN(target)) {
                    animateCounter(counter, target, 2000);
                    counterObserver.unobserve(entry.target);
                }
            }
        }
    });
}, observerOptions);

// Observe counter elements
document.querySelectorAll('.stat-card, .bg-gradient-to-r').forEach(card => {
    counterObserver.observe(card);
});

// Enhanced testimonial animations
const testimonialObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.testimonial-card').forEach(card => {
    testimonialObserver.observe(card);
});

// Enhanced parallax effect to hero background
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero-background');
    if (parallax) {
        const speed = scrolled * 0.3;
        parallax.style.backgroundPosition = `center calc(50% + ${speed}px)`;
    }
    
    // Update animated background elements
    const bgElements = document.querySelectorAll('.hero-background .absolute');
    bgElements.forEach((el, index) => {
        const speedFactor = (index % 2 === 0 ? 0.5 : 0.3);
        const movement = scrolled * speedFactor;
        el.style.transform = `translateY(${movement}px)`;
    });
});

// Enhanced interactive hover effects to feature badges
const featureBadges = document.querySelectorAll('.feature-badge');
featureBadges.forEach(badge => {
    badge.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-12px) scale(1.03)';
    });
    badge.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Add ripple effect to buttons
const buttons = document.querySelectorAll('.pulse-button, .glow-button');
buttons.forEach(button => {
    button.addEventListener('click', function(e) {
        // Create ripple element
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// Add typing animation to hero text
function animateHeroText() {
    const heroTexts = document.querySelectorAll('.hero-background .text-white:not(.floating)');
    heroTexts.forEach((text, index) => {
        setTimeout(() => {
            text.style.opacity = '1';
            text.style.transform = 'translateY(0)';
        }, 300 + (index * 100));
    });
}

// Initialize hero text animations
setTimeout(animateHeroText, 500);

// Add particle effect to hero section
function createParticles() {
    const hero = document.querySelector('.hero-background');
    if (!hero) return;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'absolute w-1 h-1 bg-white rounded-full opacity-30';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float ${Math.random() * 10 + 5}s infinite ease-in-out`;
        
        // Add keyframes for float animation
        if (!document.querySelector('#particle-animation')) {
            const style = document.createElement('style');
            style.id = 'particle-animation';
            style.textContent = `
                @keyframes float {
                    0% { transform: translateY(0) translateX(0); opacity: 0.3; }
                    50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
                    100% { transform: translateY(0) translateX(0); opacity: 0.3; }
                }
            `;
            document.head.appendChild(style);
        }
        
        hero.appendChild(particle);
    }
}

// Create particles after page loads
window.addEventListener('load', createParticles);

// Add scroll progress indicator
function addScrollProgress() {
    const progressContainer = document.createElement('div');
    progressContainer.id = 'scroll-progress';
    progressContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, var(--accent), var(--primary));
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressContainer);
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / windowHeight) * 100;
        
        progressContainer.style.width = scrollPercent + '%';
    });
}

// Add scroll progress bar
addScrollProgress();

// Add enhanced navigation highlighting
function highlightNavOnScroll() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('nav a');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (pageYOffset >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('text-accent');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('text-accent');
        }
    });
}

window.addEventListener('scroll', highlightNavOnScroll);

// Add glassmorphism effect to navbar on scroll
const navbar = document.querySelector('nav');
window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});

// Ensure navbar remains visible on all scroll positions
window.addEventListener('scroll', function() {
    // Always ensure the navbar has appropriate contrast
    if (window.scrollY > 50) {
        navbar.classList.add('navbar-scrolled');
    } else {
        navbar.classList.remove('navbar-scrolled');
    }
});