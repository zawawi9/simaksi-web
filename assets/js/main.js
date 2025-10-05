// assets/js/main.js - Main landing page functionality

let supabase;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Load config module
    const configModule = await import('./config.js');
    supabase = configModule.supabase;
    
    // Load testimonials from Supabase
    loadTestimonials();
    
    // Set up login form (if exists on current page)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Initialize interactive features
    initInteractiveFeatures();
});

// Function to load testimonials from Supabase
async function loadTestimonials() {
    try {
        // Query the komentar table for testimonials
        const { data: testimonials, error } = await supabase
            .from('komentar')
            .select(`
                id_komentar,
                komentar,
                dibuat_pada,
                id_pengguna,
                pengguna!inner(nama_lengkap)
            `)
            .order('dibuat_pada', { ascending: false })   // Order by creation date, newest first
            .limit(3); // Limit to 3 latest testimonials
        
        if (error) {
            console.error('Error fetching testimonials:', error);
            showTestimonialError();
            return;
        }
        
        // Update the UI with the testimonials data
        updateTestimonials(testimonials);
    } catch (err) {
        console.error('Error loading testimonials:', err);
        showTestimonialError();
    }
}

// Function to update the testimonials section with data
function updateTestimonials(testimonials) {
    const container = document.getElementById('testimoni-container');
    
    // Clear existing content (loading placeholders)
    container.innerHTML = '';
    
    if (!testimonials || testimonials.length === 0) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-12">
                <p class="text-gray-600 text-lg">Tidak ada testimonial saat ini</p>
            </div>
        `;
        return;
    }
    
    // Populate with testimonial cards
    testimonials.forEach(testimonial => {
        // Format the date
        const formattedDate = new Date(testimonial.dibuat_pada).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Create a card for the testimonial
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl shadow-xl p-6 card-hover testimonial-card transition-all duration-300';
        card.innerHTML = `
            <div class="flex items-start mb-4">
                <div class="w-14 h-14 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center text-white mr-4 flex-shrink-0">
                    <i class="fas fa-user text-lg"></i>
                </div>
                <div class="flex-1">
                    <h4 class="font-bold text-gray-800 text-lg">${testimonial.pengguna.nama_lengkap}</h4>
                    <p class="text-sm text-gray-500">${formattedDate}</p>
                    <div class="flex text-yellow-400 mt-1">
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                        <i class="fas fa-star"></i>
                    </div>
                </div>
            </div>
            <p class="text-gray-600 italic text-lg relative pl-6 before:content-['"'] before:absolute before:left-0 before:top-0 before:text-4xl before:text-accent before:opacity-20">"${testimonial.komentar}"</p>
        `;
        
        container.appendChild(card);
    });
}

// Function to show an error if testimonials fail to load
function showTestimonialError() {
    const container = document.getElementById('testimoni-container');
    container.innerHTML = `
        <div class="col-span-3 text-center py-12">
            <p class="text-red-500 text-lg">Gagal memuat testimonial. Silakan coba lagi nanti.</p>
        </div>
    `;
}

// Function to handle login (for login form that might be on a different page)
async function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission
    
    // Get email and password from form
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Clear previous messages
    hideMessage('error-message');
    hideMessage('success-message');
    
    try {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            // Show error message if login fails
            showMessage('error-message', 'Kombinasi email/password salah');
            return;
        }
        
        // If login is successful, get user role from the pengguna table
        const user = data.user;
        const userId = user.id;
        
        // Query the pengguna table to get the user's role
        const { data: userData, error: userError } = await supabase
            .from('pengguna')
            .select('peran')
            .eq('id_pengguna', userId)
            .single();
            
        if (userError) {
            showMessage('error-message', 'Terjadi kesalahan saat mengambil data pengguna');
            return;
        }
        
        // Check the user's role
        if (userData.peran === 'admin') {
            // Redirect to admin dashboard
            window.location.href = 'dashboard-admin.html';
        } else if (userData.peran === 'pendaki') {
            // Show success message and hide login form for regular users
            showMessage('success-message', 'Login berhasil. Silakan lakukan pemesanan tiket melalui aplikasi mobile kami.');
            
            // Hide the login form
            document.getElementById('loginForm').style.display = 'none';
        } else {
            showMessage('error-message', 'Peran pengguna tidak dikenali');
        }
    } catch (err) {
        console.error('Login error:', err);
        showMessage('error-message', 'Terjadi kesalahan saat login');
    }
}

// Function to show a message
function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
    }
}

// Function to hide a message
function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
    }
}

// Function to initialize interactive features
function initInteractiveFeatures() {
    // Add parallax effect to hero section
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.hero-background');
        if (parallax) {
            const speed = scrolled * 0.3;
            parallax.style.backgroundPosition = `center calc(50% + ${speed}px)`;
        }
    });
    
    // Add scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-on-scroll', 'visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    document.querySelectorAll('.card-hover, .feature-card, .stat-card, .testimoni-card').forEach(el => {
        observer.observe(el);
    });
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Add scroll to top button
    const scrollToTopBtn = document.createElement('div');
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(scrollToTopBtn);
    
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
    
    // Add counter animations
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;
            const speed = 200; // Lower is faster
            const increment = target / speed;
            
            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(updateCount, 1);
            } else {
                counter.innerText = target + '+';
            }
        };
        
        updateCount();
    });
    
    // Add interactive tooltip functionality
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'absolute bg-gray-800 text-white text-sm py-1 px-2 rounded-md z-50 whitespace-nowrap';
            tooltip.textContent = this.getAttribute('data-tooltip');
            tooltip.style.top = this.getBoundingClientRect().top - 40 + 'px';
            tooltip.style.left = this.getBoundingClientRect().left + 'px';
            tooltip.id = 'dynamic-tooltip';
            document.body.appendChild(tooltip);
        });
        
        el.addEventListener('mouseleave', function() {
            const tooltip = document.getElementById('dynamic-tooltip');
            if (tooltip) tooltip.remove();
        });
    });
    
    // Add image hover effects
    document.querySelectorAll('.gallery-item img, .feature-card img').forEach(img => {
        img.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        img.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
        
        img.style.transition = 'transform 0.3s ease';
    });
    
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
    
    // Add enhanced interactive hover effects to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-12px) scale(1.03)';
        });
        card.addEventListener('mouseleave', function() {
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
            ripple.style.borderRadius = '50%';
            ripple.style.position = 'absolute';
            ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 600ms linear';
            ripple.style.pointerEvents = 'none';
            
            // Add keyframes for ripple animation
            if (!document.querySelector('#ripple-animation')) {
                const style = document.createElement('style');
                style.id = 'ripple-animation';
                style.textContent = `
                    @keyframes ripple {
                        to {
                            transform: scale(2);
                            opacity: 0;
                        }
                    }
                `;
                document.head.appendChild(style);
            }
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}