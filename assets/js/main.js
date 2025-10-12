// assets/js/main.js - Main landing page functionality

let supabase;

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', async function() {
    // Load config module
    const configModule = await import('./config.js');
    supabase = configModule.supabase;
    
    // ONLY load testimonials through main.js if sliding-komentar system is NOT active
    // Since sliding-komentar.js is loaded before main.js in index.html and exports functions to window,
    // the functions should be available at this point
    if (typeof loadAllKomentar !== 'function') {
        // Only load testimonials through main.js if sliding system is not available
        loadTestimonials();
    }
    // If sliding system IS active, let sliding-komentar.js handle loading testimonials independently
    
    // Load active announcements from Supabase
    loadActiveAnnouncements();
    
    // Set up login form (if exists on current page)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Set up register form (if exists on current page)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Set up forgot password form (if exists on current page)
    const forgotForm = document.getElementById('forgotForm');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }
    
    // Set up auth tabs functionality
    setupAuthTabs();
    
    // Initialize interactive features
    initInteractiveFeatures();
    
    // Update auth UI based on current session status
    updateAuthUI();
    
    // On page load, show login tab by default (only if not logged in)
    setTimeout(() => {
        if (document.getElementById('login-tab')) {
            // Only switch to login tab if user is not logged in
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (!session) {
                    switchToTab('login');
                } else {
                    // If logged in, show forgot password tab as the default
                    switchToTab('forgot');
                }
            });
        }
    }, 100); // Small delay to ensure everything is loaded
});

// Function to set up authentication tabs
function setupAuthTabs() {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const forgotTab = document.getElementById('forgot-tab');
    
    const loginContent = document.getElementById('login-content');
    const registerContent = document.getElementById('register-content');
    const forgotContent = document.getElementById('forgot-content');
    
    // Tab switching functionality
    if (loginTab) {
        loginTab.addEventListener('click', function(e) {
            e.preventDefault();
            switchToTab('login');
        });
    }
    
    if (registerTab) {
        registerTab.addEventListener('click', function(e) {
            e.preventDefault();
            switchToTab('register');
        });
    }
    
    if (forgotTab) {
        forgotTab.addEventListener('click', function(e) {
            e.preventDefault();
            switchToTab('forgot');
        });
    }
    
    // Additional buttons for switching between forms
    const showRegisterBtn = document.getElementById('show-register');
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchToTab('register');
        });
    }
    
    const showLoginBtn = document.getElementById('show-login');
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchToTab('login');
        });
    }
    
    const showLoginFromForgotBtn = document.getElementById('show-login-from-forgot');
    if (showLoginFromForgotBtn) {
        showLoginFromForgotBtn.addEventListener('click', function(e) {
            e.preventDefault();
            switchToTab('login');
        });
    }
    
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            switchToTab('forgot');
        });
    }
    
    // Also handle all links that might trigger auth forms
    const forgotPasswordLinks = document.querySelectorAll('a[href=\"#\"], a[href^=\"javascript\"], button[data-action=\"forgot-password\"]');
    forgotPasswordLinks.forEach(link => {
        if (link.textContent && (link.textContent.includes('Lupa password') || link.textContent.includes('Lupa Password'))) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                switchToTab('forgot');
            });
        }
    });
    
    const registerLinks = document.querySelectorAll('a[href=\"#\"], a[href^=\"javascript\"], button[data-action=\"register\"]');
    registerLinks.forEach(link => {
        if (link.textContent && (link.textContent.includes('Daftar di sini') || link.textContent.includes('Register') || link.textContent.includes('Sign up'))) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                switchToTab('register');
            });
        }
    });
}

// Function to switch between auth tabs
function switchToTab(tabName) {
    // Hide all content
    document.getElementById('login-content').classList.add('hidden');
    document.getElementById('register-content').classList.add('hidden');
    document.getElementById('forgot-content').classList.add('hidden');
    
    // Remove active class from all tabs
    document.getElementById('login-tab').classList.remove('text-blue-600', 'border-blue-600');
    document.getElementById('register-tab').classList.remove('text-blue-600', 'border-blue-600');
    document.getElementById('forgot-tab').classList.remove('text-blue-600', 'border-blue-600');
    
    document.getElementById('login-tab').classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    document.getElementById('register-tab').classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    document.getElementById('forgot-tab').classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    
    // Show selected content and activate tab
    if (tabName === 'login') {
        document.getElementById('login-content').classList.remove('hidden');
        document.getElementById('login-tab').classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        document.getElementById('login-tab').classList.add('text-blue-600', 'border-blue-600');
    } else if (tabName === 'register') {
        document.getElementById('register-content').classList.remove('hidden');
        document.getElementById('register-tab').classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        document.getElementById('register-tab').classList.add('text-blue-600', 'border-blue-600');
    } else if (tabName === 'forgot') {
        document.getElementById('forgot-content').classList.remove('hidden');
        document.getElementById('forgot-tab').classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        document.getElementById('forgot-tab').classList.add('text-blue-600', 'border-blue-600');
    }
}

// Function to load testimonials from Supabase
async function loadTestimonials() {
    try {
        // Query the komentar table for testimonials - using correct foreign key reference syntax
        const { data: testimonials, error } = await supabase
            .from('komentar')
            .select(`
                id_komentar,
                komentar,
                dibuat_pada,
                id_pengguna,
                rating,
                profiles(nama_lengkap)
            `)
            .order('dibuat_pada', { ascending: false })   // Order by creation date, newest first
            .limit(10); // Increase the limit to have more testimonials for the sliding system
        
        if (error) {
            console.error('Error fetching testimonials:', error);
            showTestimonialError();
            return;
        }
        
        // Instead of updating testimonials directly, we'll call the function from sliding-komentar.js
        // if it's available, otherwise use the original method
        if (typeof updateSlidingTestimonials === 'function') {
            updateSlidingTestimonials(testimonials);
        } else {
            // Fallback to the original updateTestimonials function
            updateTestimonials(testimonials);
        }
    } catch (err) {
        console.error('Error loading testimonials:', err);
        showTestimonialError();
    }
}

// Function to update the testimonials section with data (fallback if sliding system is not available)
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
                    <h4 class="font-bold text-gray-800 text-lg">${testimonial.profiles.nama_lengkap}</h4>
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
            <p class="text-gray-600 italic text-lg relative pl-6 before:content-['\"'] before:absolute before:left-0 before:top-0 before:text-4xl before:text-accent before:opacity-20">"${testimonial.komentar}"</p>
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

// Function to load active announcements from Supabase
async function loadActiveAnnouncements() {
    try {
        // Get current date for filtering
        const now = new Date().toISOString();
        
        // Query the pengumuman table for active announcements
        // An announcement is active if:
        // 1. start_date <= now (announcement has started already)
        // 2. end_date >= now (announcement hasn't ended yet)
        // 3. telah_terbit is true
        const { data: announcements, error } = await supabase
            .from('pengumuman')
            .select(`
                id_pengumuman,
                judul,
                konten,
                start_date,
                end_date,
                dibuat_pada,
                id_admin,
                profiles!inner(nama_lengkap)
            `)
            .lte('start_date', now)      // start_date is less than or equal to now (announcement has started)
            .gte('end_date', now)        // end_date is greater than or equal to now (announcement hasn't ended)
            .eq('telah_terbit', true)    // Only published announcements
            .order('dibuat_pada', { ascending: false }); // Order by creation date, newest first
        
        if (error) {
            console.error('Error fetching announcements:', error);
            showAnnouncementError();
            return;
        }
        
        // Update the UI with the announcements data
        updateAnnouncements(announcements);
    } catch (err) {
        console.error('Error loading announcements:', err);
        showAnnouncementError();
    }
}

// Function to update the announcements section with data
function updateAnnouncements(announcements) {
    const container = document.getElementById('pengumuman-content');
    const loadingElement = document.getElementById('pengumuman-loading');
    const emptyElement = document.getElementById('pengumuman-empty');
    
    // Hide loading indicator
    loadingElement.classList.add('hidden');
    
    if (!announcements || announcements.length === 0) {
        // Show empty state
        emptyElement.classList.remove('hidden');
        return;
    }
    
    // Hide empty state
    emptyElement.classList.add('hidden');
    
    // Clear existing content
    container.innerHTML = '';
    
    // Populate with announcement cards
    announcements.forEach(announcement => {
        // Format the dates
        const formattedStartDate = new Date(announcement.start_date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const formattedEndDate = new Date(announcement.end_date).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Create a card for the announcement
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-lg p-6 mb-4 border-l-4 border-accent';
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-xl font-bold text-gray-800">${announcement.judul}</h3>
                <span class="bg-accent text-white text-xs px-3 py-1 rounded-full">Pengumuman</span>
            </div>
            <div class="flex items-center text-sm text-gray-500 mb-4">
                <i class="fas fa-user text-accent mr-2"></i>
                <span class="mr-4">${announcement.profiles.nama_lengkap}</span>
                <i class="fas fa-calendar-alt text-accent mr-2"></i>
                <span>${formattedStartDate} - ${formattedEndDate}</span>
            </div>
            <div class="text-gray-700 mb-4">${announcement.konten}</div>
            <div class="flex justify-between items-center">
                <span class="text-xs text-gray-500">Dibuat: ${new Date(announcement.dibuat_pada).toLocaleDateString('id-ID')}</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Function to show an error if announcements fail to load
function showAnnouncementError() {
    const container = document.getElementById('pengumuman-content');
    const loadingElement = document.getElementById('pengumuman-loading');
    const emptyElement = document.getElementById('pengumuman-empty');
    
    // Hide loading indicator
    loadingElement.classList.add('hidden');
    
    // Show error message
    emptyElement.classList.remove('hidden');
    emptyElement.innerHTML = `
        <i class="fas fa-exclamation-triangle text-5xl text-red-500 mb-4"></i>
        <h3 class="text-2xl font-bold text-gray-700 mb-2">Gagal Memuat Pengumuman</h3>
        <p class="text-gray-600">Terjadi kesalahan saat mengambil data pengumuman. Silakan coba lagi nanti.</p>
    `;
}

// Function to handle login
async function handleLogin(event) {
    event.preventDefault(); // Prevent default form submission
    
    // Get email and password from form
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    // Clear previous messages
    hideMessage('login-error-message');
    hideMessage('login-success-message');
    
    try {
        // Sign in with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            // Show error message if login fails
            showMessage('login-error-message', 'Kombinasi email/password salah');
            console.error('Login error:', error);
            return;
        }
        
        // Small delay to ensure session is properly established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // If login is successful, get user role from the profiles table
        const user = data.user;
        const userId = user.id;
        
        // Query the profiles table to get the user's role
        const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('peran, nama_lengkap')
            .eq('id', userId)
            .single();
            
        if (userError) {
            showMessage('login-error-message', 'Profil pengguna tidak ditemukan. Hubungi administrator.');
            console.error('User role error:', userError);
            return;
        }
        
        console.log('User role:', userData.peran); // Debug log
        
        // Check the user's role
        if (userData.peran === 'admin') {
            // Redirect to admin dashboard
            console.log('Redirecting admin to dashboard');
            window.location.href = 'dashboard-admin.html';
        } else if (userData.peran === 'pendaki') {
            // Show success message
            showMessage('login-success-message', 'Login berhasil. Silakan lakukan pemesanan tiket melalui aplikasi mobile kami.');
            
            // Show the comment form for pendaki users
            const komentarFormSection = document.getElementById('komentar-form-section');
            if (komentarFormSection) {
                komentarFormSection.classList.remove('hidden');
            }
            
            // Update UI to reflect logged in state
            updateUIAfterLogin(userData.nama_lengkap);
        } else {
            showMessage('login-error-message', 'Peran pengguna tidak dikenali');
        }
    } catch (err) {
        console.error('Login error:', err);
        showMessage('login-error-message', 'Terjadi kesalahan saat login');
    }
}

// Function to handle registration
async function handleRegister(event) {
    event.preventDefault(); // Prevent default form submission
    
    // Get form values
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    // Validate form
    if (password !== confirmPassword) {
        showMessage('register-error-message', 'Password dan konfirmasi password tidak cocok');
        return;
    }
    
    if (password.length < 6) {
        showMessage('register-error-message', 'Password minimal 6 karakter');
        return;
    }
    
    // Clear previous messages
    hideMessage('register-error-message');
    hideMessage('register-success-message');
    
    try {
        // Sign up with Supabase
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nama_lengkap: name,
                    nomor_telepon: phone
                },
                emailRedirectTo: window.location.origin
            }
        });
        
        if (error) {
            console.error('Registration error:', error);
            showMessage('register-error-message', error.message || 'Terjadi kesalahan saat pendaftaran');
            return;
        }
        
        // Check if user needs email confirmation
        if (data.user) {
            // User created successfully in Supabase Auth, now add to profiles table
            const { error: insertError } = await supabase
                .from('profiles')
                .insert([{
                    id: data.user.id,
                    nama_lengkap: name,
                    email: email,
                    nomor_telepon: phone,
                    peran: 'pendaki'
                }]);
            
            if (insertError) {
                console.error('Error inserting to profiles table:', insertError);
                showMessage('register-error-message', 'Terjadi kesalahan saat menyimpan data profil');
                return;
            }
            
            // Show success message
            showMessage('register-success-message', 'Pendaftaran berhasil! Silakan cek email Anda untuk verifikasi.');
            
            // Reset form
            document.getElementById('registerForm').reset();
            
            // Show verification modal to enter the token
            // In a real implementation, you would have the token from the registration response
            // For now, we'll just show the modal for users to enter the token they received
            setTimeout(showVerifikasiModal, 1000); // Show modal after 1 second to let user read the message
        } else if (data.session) {
            // User is already logged in after registration
            showMessage('register-success-message', 'Pendaftaran berhasil! Anda telah login.');
            
            // Redirect based on role
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('peran')
                .eq('id', data.session.user.id)
                .single();
                
            if (!userError && userData.peran === 'admin') {
                window.location.href = 'dashboard-admin.html';
            } else {
                // Redirect to appropriate page or reload
                window.location.reload();
            }
        }
    } catch (err) {
        console.error('Registration error:', err);
        showMessage('register-error-message', 'Terjadi kesalahan saat pendaftaran');
    }
}

// Function to handle forgot password
async function handleForgotPassword(event) {
    event.preventDefault(); // Prevent default form submission
    
    // Get email from form
    const email = document.getElementById('forgot-email').value;
    
    // Clear previous messages
    hideMessage('forgot-error-message');
    hideMessage('forgot-success-message');
    
    try {
        // Use Supabase's built-in password reset functionality
        // This will send a reset password email through Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password` // Redirect to password reset page
        });
        
        if (error) {
            console.error('Forgot password error:', error);
            showMessage('forgot-error-message', error.message || 'Terjadi kesalahan saat mengirim email reset password');
            return;
        }
        
        // Show success message
        showMessage('forgot-success-message', 'Instruksi reset password telah dikirim ke email Anda. Silakan cek inbox Anda.');
    } catch (err) {
        console.error('Forgot password error:', err);
        showMessage('forgot-error-message', 'Terjadi kesalahan saat mengirim email reset password');
    }
}

// Function to handle email verification callback
async function handleEmailVerification() {
    // This function should be called on the page that handles email verification redirects
    // Check URL parameters for verification details
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    const token = urlParams.get('token');
    const nextUrl = urlParams.get('next');
    
    if (type === 'signup' && token) {
        try {
            // Verify the signup using the token
            const { data, error } = await supabase.auth.verifyOtp({
                type: 'email',
                token: token,
            });
            
            if (error) {
                console.error('Email verification error:', error);
                return { success: false, message: error.message };
            }
            
            // Update the user's verification status in our profiles table
            if (data.user) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({}) // No need to update anything since is_verified was removed
                    .eq('id', data.user.id);
                
                if (updateError) {
                    console.error('Error updating verification status:', updateError);
                    // Don't fail the process, just log the error
                }
                
                return { success: true, message: 'Email berhasil diverifikasi', user: data.user };
            }
        } catch (err) {
            console.error('Email verification error:', err);
            return { success: false, message: 'Terjadi kesalahan saat memverifikasi email' };
        }
    }
    
    return { success: false, message: 'Tidak ada parameter verifikasi yang valid' };
}

// Function to handle password reset with token (usually on a separate page)
async function handlePasswordResetWithToken(token, newPassword) {
    try {
        const { data, error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token: token,
            password: newPassword
        });
        
        if (error) {
            console.error('Password reset error:', error);
            return { success: false, message: error.message };
        }
        
        return { success: true, message: 'Password berhasil direset' };
    } catch (err) {
        console.error('Password reset error:', err);
        return { success: false, message: 'Terjadi kesalahan saat mereset password' };
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

// Function to show a message with type (for multiple message types)
function showAuthMessage(messageType, message) {
    let elementId;
    switch(messageType) {
        case 'login-error':
            elementId = 'login-error-message';
            break;
        case 'login-success':
            elementId = 'login-success-message';
            break;
        case 'register-error':
            elementId = 'register-error-message';
            break;
        case 'register-success':
            elementId = 'register-success-message';
            break;
        case 'forgot-error':
            elementId = 'forgot-error-message';
            break;
        case 'forgot-success':
            elementId = 'forgot-success-message';
            break;
        default:
            elementId = messageType;
    }
    
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
    }
}

// Function to hide auth messages
function hideAuthMessages() {
    const messageIds = [
        'login-error-message', 'login-success-message',
        'register-error-message', 'register-success-message',
        'forgot-error-message', 'forgot-success-message'
    ];
    
    messageIds.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    });
}

// Function to update UI after login
function updateUIAfterLogin(userName) {
    // Change login button to user profile or logout
    const loginButton = document.querySelector('a[href="#auth"]');
    if (loginButton) {
        // In this case, we just change the text since auth section is on the same page
        // We'll update the auth section to show logout option
        loginButton.innerHTML = '<i class="fas fa-user mr-2"></i> Profil';
    }
    
    // Update auth section to show user info and logout
    const authSection = document.querySelector('#auth');
    if (authSection) {
        // We'll add a simple message after successful login
        const loginSuccessMsg = document.createElement('div');
        loginSuccessMsg.id = 'login-success-user';
        loginSuccessMsg.className = 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded';
        loginSuccessMsg.innerHTML = `<p>Selamat datang, <strong>${userName}</strong>! Anda telah login sebagai pendaki.</p>`;
        
        const authContainer = document.querySelector('#auth .container');
        if (authContainer) {
            // Insert after the heading
            const heading = authContainer.querySelector('h2');
            if (heading && !document.getElementById('login-success-user')) {
                heading.insertAdjacentElement('afterend', loginSuccessMsg);
            }
        }
    }
}

// Function to get time-based greeting
function getTimeBasedGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return 'Selamat Pagi,';
    } else if (hour >= 12 && hour < 15) {
        return 'Selamat Siang,';
    } else if (hour >= 15 && hour < 18) {
        return 'Selamat Sore,';
    } else {
        return 'Selamat Malam,';
    }
}

// Function to update auth UI based on login status
function updateAuthUI() {
    // Check if user is logged in
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
        const loginTab = document.getElementById('login-tab');
        const registerTab = document.getElementById('register-tab');
        const forgotTab = document.getElementById('forgot-tab');
        const loginContent = document.getElementById('login-content');
        const registerContent = document.getElementById('register-content');
        const forgotContent = document.getElementById('forgot-content');
        const authSection = document.querySelector('#auth');
        
        // Update header navbar authentication elements
        const authLink = document.getElementById('auth-link');
        const logoutLink = document.getElementById('logout-link');
        const authContainer = document.getElementById('auth-container');
        const userGreeting = document.getElementById('user-greeting');
        const greetingText = document.getElementById('greeting-text');
        const userFullname = document.getElementById('user-fullname');
        const logoutLinkHeader = document.getElementById('logout-link-header');
        
        if (session) {
            // User is logged in - fetch user profile
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('nama_lengkap')
                    .eq('id', session.user.id)
                    .single();
                
                if (profileError) {
                    console.error('Error fetching profile:', profileError);
                }
                
                // User is logged in
                // Hide login and register forms, show only forgot password form
                if (loginContent) {
                    loginContent.classList.add('hidden');
                }
                if (registerContent) {
                    registerContent.classList.add('hidden');
                }
                
                // Show forgot password form as default when logged in
                if (forgotContent) {
                    forgotContent.classList.remove('hidden');
                }
                
                // Update the tabs to show appropriate text when logged in
                if (loginTab) {
                    loginTab.textContent = 'Profil Saya';
                    // Remove active class and make it non-interactive when logged in
                    loginTab.classList.remove('text-blue-600', 'border-blue-600');
                    loginTab.classList.add('text-gray-400', 'cursor-not-allowed');
                    loginTab.onclick = null; // Remove default click behavior
                }
                if (registerTab) {
                    registerTab.textContent = 'Logout';
                    // Make register tab function as logout button when logged in
                    registerTab.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                    registerTab.classList.add('text-red-500', 'hover:text-red-700');
                    registerTab.onclick = function(e) {
                        e.preventDefault();
                        handleLogout();
                    };
                }
                if (forgotTab) {
                    // Make forgot tab the active tab when logged in
                    forgotTab.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                    forgotTab.classList.add('text-blue-600', 'border-blue-600');
                }
                
                // Update header navbar - show personalized greeting, hide login/logout buttons
                if (authContainer) {
                    authContainer.classList.add('hidden');
                }
                if (userGreeting) {
                    userGreeting.classList.remove('hidden');
                    
                    if (greetingText) {
                        greetingText.textContent = profileData ? getTimeBasedGreeting() : 'Halo,';
                    }
                    if (userFullname) {
                        userFullname.textContent = profileData ? profileData.nama_lengkap : 'Pendaki';
                    }
                    if (logoutLinkHeader) {
                        logoutLinkHeader.onclick = function(e) {
                            e.preventDefault();
                            handleLogout();
                        };
                    }
                }
                
                // Update UI to show logged in state
                if (authSection) {
                    // Add user greeting or hide the form section completely
                    const authFormContainer = authSection.querySelector('.bg-gradient-to-r'); // The main form container
                    if (authFormContainer) {
                        // Show a message that user is logged in
                        const loggedInMsg = document.createElement('div');
                        loggedInMsg.id = 'logged-in-message';
                        loggedInMsg.className = 'bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded';
                        loggedInMsg.innerHTML = '<p>Anda sudah login. Gunakan tombol "Logout" untuk keluar.</p>';
                        
                        // Insert message before the form container if it doesn't exist yet
                        if (!document.getElementById('logged-in-message')) {
                            authFormContainer.parentNode.insertBefore(loggedInMsg, authFormContainer);
                        }
                        
                        // Hide the main form container since user is logged in
                        authFormContainer.style.display = 'none';
                    }
                }
            } catch (error) {
                console.error('Error in updateAuthUI:', error);
            }
        } else {
            // User is not logged in, show normal auth UI
            if (authSection) {
                const existingMsg = document.getElementById('logged-in-message');
                const authFormContainer = authSection.querySelector('.bg-gradient-to-r');
                if (existingMsg) {
                    existingMsg.remove();
                }
                if (authFormContainer) {
                    authFormContainer.style.display = 'block';
                }
            }
            
            // Restore original tab text and functionality when not logged in
            if (loginTab) {
                loginTab.textContent = 'Login';
                loginTab.classList.remove('text-gray-400', 'cursor-not-allowed');
                loginTab.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
                // Restore click functionality handled elsewhere
            }
            if (registerTab) {
                registerTab.textContent = 'Daftar';
                registerTab.classList.remove('text-red-500', 'hover:text-red-700');
                registerTab.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            }
            if (forgotTab) {
                forgotTab.classList.remove('text-blue-600', 'border-blue-600');
                forgotTab.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
            }
            
            // Show login form by default when not logged in
            if (loginContent) {
                loginContent.classList.remove('hidden');
            }
            if (registerContent) {
                registerContent.classList.add('hidden');
            }
            if (forgotContent) {
                forgotContent.classList.add('hidden');
            }
            
            // Update header navbar - show login, hide personalized greeting
            if (authContainer) {
                authContainer.classList.remove('hidden');
            }
            if (userGreeting) {
                userGreeting.classList.add('hidden');
            }
            if (logoutLink) {
                logoutLink.classList.add('hidden');
            }
        }
    });
}

// Function to handle logout
async function handleLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
            showAuthMessage('login-error', 'Terjadi kesalahan saat logout');
        } else {
            // Clear any user-specific UI elements
            const komentarFormSection = document.getElementById('komentar-form-section');
            if (komentarFormSection) {
                komentarFormSection.classList.add('hidden');
            }
            
            // Update UI to reflect logged out state
            updateAuthUI();
            
            // Show success message
            showAuthMessage('login-success', 'Berhasil logout');
        }
    } catch (err) {
        console.error('Logout error:', err);
        showAuthMessage('login-error', 'Terjadi kesalahan saat logout');
    }
}

// Function to initialize interactive features
function initInteractiveFeatures() {
    // Subscribe to auth state changes to update UI when user logs in/out
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // User has logged in or token has been refreshed
            updateAuthUI();
        } else if (event === 'SIGNED_OUT') {
            // User has logged out
            updateAuthUI();
        }
    });
    
    // Initialize UI based on current auth status
    updateAuthUI();
    
    // Add scroll effect to navbar to make it more visible when scrolling
    const navbar = document.querySelector('nav');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                // Add the navbar-scrolled class for enhanced visibility when scrolling
                navbar.classList.add('navbar-scrolled');
            } else {
                // Remove the scrolled class when at the top
                navbar.classList.remove('navbar-scrolled');
            }
        });
    }
    
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
    document.querySelectorAll('a[href^=\"#\"]').forEach(anchor => {
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
    
    // Add scroll to top button - avoid duplicate declaration
    if (typeof window.scrollToTopBtn === 'undefined') {
        var scrollToTopBtn = document.getElementById('scroll-to-top-btn');
        if (!scrollToTopBtn) {
            scrollToTopBtn = document.createElement('div');
            scrollToTopBtn.id = 'scroll-to-top-btn';
            scrollToTopBtn.className = 'scroll-to-top';
            scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
            document.body.appendChild(scrollToTopBtn);
        } else {
            // If element already exists, just ensure the functionality is attached
            scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
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
    
    // Add interactive cursor effects
    createInteractiveCursor();
    
    // Initialize progress bars for difficulty and elevation
    initializeProgressBars();
    
    // Add modern animations to elements
    addModernAnimations();
}

// Function to create interactive cursor effects
function createInteractiveCursor() {
    // Create custom cursor elements
    const cursor = document.createElement('div');
    cursor.id = 'custom-cursor';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        border: 2px solid var(--accent);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        transition: width 0.2s, height 0.2s, border-color 0.2s, opacity 0.2s;
        mix-blend-mode: difference;
    `;
    document.body.appendChild(cursor);
    
    const cursorFollower = document.createElement('div');
    cursorFollower.id = 'cursor-follower';
    cursorFollower.style.cssText = `
        position: fixed;
        width: 40px;
        height: 40px;
        border: 1px solid var(--accent);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9998;
        transform: translate(-50%, -50%);
        transition: width 0.3s, height 0.3s, opacity 0.3s, border-color 0.3s;
        opacity: 0.5;
    `;
    document.body.appendChild(cursorFollower);
    
    // Position cursor elements
    document.addEventListener('mousemove', function(e) {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        
        setTimeout(() => {
            cursorFollower.style.left = e.clientX + 'px';
            cursorFollower.style.top = e.clientY + 'px';
        }, 50);
    });
    
    // Change cursor style when hovering over interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .card-hover, .feature-card, .testimonial-card, .progress-bar');
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            cursor.style.width = '30px';
            cursor.style.height = '30px';
            cursor.style.border = '2px solid var(--primary)';
            cursorFollower.style.width = '50px';
            cursorFollower.style.height = '50px';
            cursorFollower.style.opacity = '0.7';
            cursorFollower.style.borderColor = 'var(--primary)';
        });
        
        element.addEventListener('mouseleave', function() {
            cursor.style.width = '20px';
            cursor.style.height = '20px';
            cursor.style.border = '2px solid var(--accent)';
            cursorFollower.style.width = '40px';
            cursorFollower.style.height = '40px';
            cursorFollower.style.opacity = '0.5';
            cursorFollower.style.borderColor = 'var(--accent)';
        });
    });
    
    // Hide cursor when mouse stops moving
    let cursorTimeout;
    document.addEventListener('mousemove', function() {
        cursor.style.opacity = '1';
        cursorFollower.style.opacity = '0.5';
        
        clearTimeout(cursorTimeout);
        cursorTimeout = setTimeout(() => {
            cursor.style.opacity = '0.5';
            cursorFollower.style.opacity = '0.2';
        }, 1000);
    });
}

// Function to initialize progress bars for difficulty and elevation
function initializeProgressBars() {
    // Example of initializing progress bars - in real implementation, data would come from your database
    const difficultyBars = document.querySelectorAll('.difficulty-bar');
    const elevationBars = document.querySelectorAll('.elevation-bar');
    
    // Set difficulty progress (example values)
    difficultyBars.forEach(bar => {
        const value = bar.getAttribute('data-value') || 0;
        const maxValue = bar.getAttribute('data-max') || 100;
        const percentage = (value / maxValue) * 100;
        
        // Update the progress fill
        const fill = bar.querySelector('.progress-fill');
        if (fill) {
            fill.style.width = percentage + '%';
        }
    });
    
    // Set elevation progress (example values)
    elevationBars.forEach(bar => {
        const value = bar.getAttribute('data-value') || 0;
        const maxValue = bar.getAttribute('data-max') || 2868; // Max height of Gunung Butak
        const percentage = (value / maxValue) * 100;
        
        // Update the progress fill
        const fill = bar.querySelector('.progress-fill');
        if (fill) {
            fill.style.width = percentage + '%';
        }
    });
    
    // Add hover effect to progress bars
    const allBars = document.querySelectorAll('.progress-bar');
    allBars.forEach(bar => {
        bar.addEventListener('mouseenter', function() {
            const fill = this.querySelector('.progress-fill');
            if (fill) {
                fill.style.filter = 'brightness(1.2)';
            }
        });
        
        bar.addEventListener('mouseleave', function() {
            const fill = this.querySelector('.progress-fill');
            if (fill) {
                fill.style.filter = 'none';
            }
        });
    });
}

// Function to add modern animations to elements
function addModernAnimations() {
    // Add subtle glow effect to cards on hover
    const cards = document.querySelectorAll('.card-hover, .feature-card, .stat-card');
    cards.forEach(card => {
        // Create glow element
        if (!card.querySelector('.card-glow')) {
            const glow = document.createElement('div');
            glow.className = 'card-glow';
            glow.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                border-radius: inherit;
                box-shadow: 0 0 20px rgba(46, 204, 113, 0.3);
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
                z-index: -1;
            `;
            card.style.position = 'relative';
            card.appendChild(glow);
        }
        
        card.addEventListener('mouseenter', function() {
            const glow = this.querySelector('.card-glow');
            if (glow) {
                glow.style.opacity = '1';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const glow = this.querySelector('.card-glow');
            if (glow) {
                glow.style.opacity = '0';
            }
        });
    });
    
    // Add dynamic background effect to sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.addEventListener('mousemove', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Calculate distance from center (for gradient effect)
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const distanceX = (x - centerX) / centerX;
            const distanceY = (y - centerY) / centerY;
            
            // Apply subtle effect based on mouse position
            if (this.dataset.bgEffect) {
                this.style.backgroundPosition = `calc(50% + ${distanceX * 2}px) calc(50% + ${distanceY * 2}px)`;
            }
        });
        
        section.addEventListener('mouseleave', function() {
            if (this.dataset.bgEffect) {
                this.style.backgroundPosition = 'center';
            }
        });
    });
}

// Function to show verification modal  
function showVerifikasiModal() {
    // Create modal HTML
    const modal = document.createElement('div');
    modal.id = 'verifikasi-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 class="text-lg font-bold mb-4">Verifikasi Email</h3>
            <p class="mb-4">Silakan masukkan token verifikasi yang dikirim ke email Anda.</p>
            <input type="text" id="verifikasi-token" class="w-full p-2 border rounded mb-4" placeholder="Masukkan token...">
            <div class="flex justify-end space-x-2">
                <button id="verifikasi-batal" class="px-4 py-2 bg-gray-300 rounded">Batal</button>
                <button id="verifikasi-submit" class="px-4 py-2 bg-green-600 text-white rounded">Verifikasi</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Set up event handlers
    document.getElementById('verifikasi-batal').addEventListener('click', function() {
        document.body.removeChild(modal);
    });
    
    document.getElementById('verifikasi-submit').addEventListener('click', async function() {
        const token = document.getElementById('verifikasi-token').value;
        if (!token) {
            alert('Silakan masukkan token verifikasi');
            return;
        }
        
        alert('Token verifikasi tidak valid atau telah kadaluarsa');
    });
}