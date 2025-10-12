// Sliding komentar system with auto-rotation
document.addEventListener('DOMContentLoaded', async function() {
    // Load Supabase client
    if (typeof supabase === 'undefined') {
        const configModule = await import('./config.js');
        supabase = configModule.supabase;
    }
    
    // Set up rating system
    setupRatingSystem();
    
    // Check if user is logged in as pendaki
    checkLoginStatus();
    
    // Subscribe to auth state changes
    subscribeToAuthChanges();
    
    // Set up komentar form
    const komentarForm = document.getElementById('komentarForm');
    if (komentarForm) {
        komentarForm.addEventListener('submit', handleKomentarSubmit);
    }
    
    // Load and display all comments in sliding format
    await loadAllKomentar();
    
    // Set up auto-rotation for testimonials
    setupAutoRotation();
    
    // Set up manual navigation
    setupManualNavigation();
    
    // Set up resize handler to maintain proper slide display
    window.addEventListener('resize', function() {
        updateSlidePosition();
    });
});

// Function to load all comments from database and create sliding system
async function loadAllKomentar() {
    try {
        // Query the komentar table with user profiles - using correct foreign key reference syntax
        const { data: komentarList, error } = await supabase
            .from('komentar')
            .select(`
                id_komentar,
                komentar,
                rating,
                dibuat_pada,
                id_pengguna,
                profiles(nama_lengkap)
            `)
            .order('dibuat_pada', { ascending: false }); // Order by creation date, newest first
        
        if (error) {
            console.error('Error fetching comments:', error);
            showKomentarError();
            return;
        }
        
        // Update the UI with the comments data
        updateSlidingTestimonials(komentarList);
    } catch (err) {
        console.error('Error loading comments:', err);
        showKomentarError();
    }
}

// Function to update the UI with sliding testimonials
function updateSlidingTestimonials(komentarList) {
    const container = document.getElementById('testimoni-container');
    const dotsContainer = document.getElementById('testimonial-dots');
    
    // Check if container exists before trying to access it
    if (!container) {
        console.error('testimoni-container not found');
        return;
    }
    
    // Clear all loading placeholders first - remove any elements with animate-pulse class
    const placeholders = container.querySelectorAll('.animate-pulse');
    placeholders.forEach(placeholder => placeholder.remove());
    
    // Clear remaining containers
    if (dotsContainer) dotsContainer.innerHTML = '';
    
    if (!komentarList || komentarList.length === 0) {
        container.innerHTML = `
            <div class="w-full text-center py-12">
                <p class="text-gray-600 text-lg">Belum ada komentar dari pendaki</p>
            </div>
        `;
        // Update stats to show 0 when no comments
        updateStats(0, 0);
        return;
    }
    
    // Calculate stats
    const totalComments = komentarList.length;
    const avgRating = komentarList.reduce((sum, komentar) => sum + komentar.rating, 0) / totalComments;
    
    // Update stats display
    updateStats(totalComments, avgRating);
    
    // Create testimonial cards
    komentarList.forEach((komentar, index) => {
        // Format the date
        const formattedDate = new Date(komentar.dibuat_pada).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Create a card for the comment
        const card = document.createElement('div');
        card.className = 'testimonial-card w-full flex-shrink-0 px-4';
        card.style.minWidth = '100%'; // Ensure each card takes full width
        card.innerHTML = `
            <div class="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-8 h-full">
                <div class="flex items-center mb-6">
                    <div class="w-20 h-20 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center text-white font-bold text-2xl mr-6">
                        ${komentar.profiles.nama_lengkap.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 class="font-bold text-2xl text-gray-800">${komentar.profiles.nama_lengkap}</h4>
                        <div class="flex items-center mt-2">
                            <div class="rating-display text-yellow-400 flex text-2xl">
                                ${generateStars(komentar.rating)}
                            </div>
                            <span class="ml-3 text-gray-600 text-lg">${komentar.rating}/5</span>
                        </div>
                    </div>
                </div>
                <p class="text-gray-700 text-xl italic mb-6 leading-relaxed">"${komentar.komentar}"</p>
                <div class="text-gray-500 text-lg">- ${formattedDate}</div>
            </div>
        `;
        
        container.appendChild(card);
        
        // Create pagination dot
        if (dotsContainer) {
            const dot = document.createElement('button');
            dot.className = `testimonial-dot w-4 h-4 rounded-full ${index === 0 ? 'bg-primary' : 'bg-gray-300'} transition-colors`;
            dot.setAttribute('data-index', index);
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        }
    });
    
    // Initialize current slide
    currentSlide = 0;
    totalSlides = komentarList.length; // Set total slides after loading comments
    updateSlidePosition();
}

// Function to update stats display
function updateStats(totalComments, avgRating) {
    const totalCommentsEl = document.getElementById('total-komentar');
    const avgRatingEl = document.getElementById('avg-rating');
    const satisfactionEl = document.getElementById('total-pendaki-rating');
    
    if (totalCommentsEl) {
        totalCommentsEl.textContent = totalComments;
    }
    
    if (avgRatingEl) {
        avgRatingEl.textContent = avgRating ? avgRating.toFixed(1) + '/5' : '0/5';
    }
    
    if (satisfactionEl) {
        // Calculate satisfaction percentage based on average rating (assuming 5-star scale)
        const satisfactionPercentage = avgRating ? Math.round((avgRating / 5) * 100) : 0;
        satisfactionEl.textContent = totalComments > 0 ? satisfactionPercentage + '%' : '0%';
    }
}

// Function to generate star icons based on rating
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<span class="text-yellow-400">★</span>';
        } else {
            stars += '<span class="text-gray-300">★</span>';
        }
    }
    return stars;
}

// Function to show an error if comments fail to load
function showKomentarError() {
    const container = document.getElementById('testimoni-container');
    
    // Check if container exists before trying to access it
    if (!container) {
        console.error('testimoni-container not found');
        return;
    }
    
    container.innerHTML = `
        <div class="w-full text-center py-12">
            <p class="text-red-500 text-lg">Gagal memuat komentar. Silakan coba lagi nanti.</p>
        </div>
    `;
}

// Sliding functionality
let currentSlide = 0;
let totalSlides = 0;
let autoRotationInterval;

// Function to update slide position
function updateSlidePosition() {
    const container = document.getElementById('testimoni-container');
    if (!container) return;
    
    totalSlides = container.children.length;
    const offset = -currentSlide * 100;
    container.style.transform = `translateX(${offset}%)`;
    
    // Update active dot
    const dots = document.querySelectorAll('.testimonial-dot');
    dots.forEach((dot, index) => {
        if (index === currentSlide) {
            dot.className = 'testimonial-dot w-4 h-4 rounded-full bg-primary transition-colors';
        } else {
            dot.className = 'testimonial-dot w-4 h-4 rounded-full bg-gray-300 transition-colors';
        }
    });
}

// Function to go to a specific slide
function goToSlide(slideIndex) {
    if (slideIndex >= 0 && slideIndex < totalSlides) {
        currentSlide = slideIndex;
        updateSlidePosition();
        resetAutoRotation();
    }
}

// Function to go to the next slide
function nextSlide() {
    currentSlide = (currentSlide + 1) % totalSlides;
    updateSlidePosition();
}

// Function to go to the previous slide
function prevSlide() {
    currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
    updateSlidePosition();
}

// Function to set up auto rotation
function setupAutoRotation() {
    // Set up automatic rotation every 5 seconds
    autoRotationInterval = setInterval(() => {
        nextSlide();
    }, 5000);
}

// Function to reset auto rotation
function resetAutoRotation() {
    clearInterval(autoRotationInterval);
    setupAutoRotation();
}

// Function to set up manual navigation
function setupManualNavigation() {
    const nextBtn = document.getElementById('next-testimonial');
    const prevBtn = document.getElementById('prev-testimonial');
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoRotation();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoRotation();
        });
    }
}

// Function to set up rating system
function setupRatingSystem() {
    const ratingInputs = document.querySelectorAll('input[name="rating"]');
    const ratingValue = document.getElementById('rating-value');
    
    ratingInputs.forEach(input => {
        const label = document.querySelector(`label[for="${input.id}"]`);
        label.addEventListener('click', function() {
            // Reset all stars to empty
            document.querySelectorAll('.rating label').forEach(star => {
                star.classList.remove('text-yellow-400');
                star.classList.add('text-gray-300');
            });
            
            // Fill stars up to selected value
            const value = parseInt(input.value);
            for (let i = 1; i <= value; i++) {
                const star = document.getElementById(`star${i}`).nextElementSibling;
                star.classList.remove('text-gray-300');
                star.classList.add('text-yellow-400');
            }
            
            // Update rating text
            ratingValue.textContent = `Rating: ${value}/5`;
        });
    });
}

// Function to check if user is logged in as pendaki
async function checkLoginStatus() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error getting session:', error);
            return;
        }
        
        if (session) {
            // Get user profile to check role
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('peran, nama_lengkap')
                .eq('id', session.user.id)
                .single();
            
            if (userError) {
                console.error('Error getting user data:', userError);
                return;
            }
            
            if (userData.peran === 'pendaki') {
                // Show the comment form for pendaki
                const komentarFormSection = document.getElementById('komentar-form-section');
                if (komentarFormSection) {
                    komentarFormSection.classList.remove('hidden');
                }
            } else {
                // For admin or other roles, don't show the comment form
                const komentarFormSection = document.getElementById('komentar-form-section');
                if (komentarFormSection) {
                    komentarFormSection.classList.add('hidden');
                }
            }
        } else {
            // If not logged in, hide the comment form
            const komentarFormSection = document.getElementById('komentar-form-section');
            if (komentarFormSection) {
                komentarFormSection.classList.add('hidden');
            }
        }
    } catch (err) {
        console.error('Check login status error:', err);
    }
}

// Function to subscribe to auth state changes
function subscribeToAuthChanges() {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            // User has logged in or token has been refreshed
            checkLoginStatus();
        } else if (event === 'SIGNED_OUT') {
            // User has logged out
            const komentarFormSection = document.getElementById('komentar-form-section');
            if (komentarFormSection) {
                komentarFormSection.classList.add('hidden');
            }
        }
    });
}

// Function to handle komentar form submission
async function handleKomentarSubmit(event) {
    event.preventDefault();
    
    // Get the session to check if user is logged in
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
        showMessage('komentar-error-message', 'Anda harus login terlebih dahulu untuk memberikan komentar');
        return;
    }
    
    // Check if user role is 'pendaki'
    const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('peran')
        .eq('id', session.user.id)
        .single();
    
    if (userError || !userData || userData.peran !== 'pendaki') {
        showMessage('komentar-error-message', 'Hanya pengguna dengan role pendaki yang dapat memberikan komentar');
        return;
    }
    
    // Get form values
    const komentar = document.getElementById('isi-komentar').value;
    const rating = document.querySelector('input[name="rating"]:checked');
    
    if (!komentar.trim()) {
        showMessage('komentar-error-message', 'Komentar tidak boleh kosong');
        return;
    }
    
    if (!rating) {
        showMessage('komentar-error-message', 'Silakan berikan rating terlebih dahulu');
        return;
    }
    
    try {
        // Insert komentar to database
        const { error } = await supabase
            .from('komentar')
            .insert([
                {
                    id_pengguna: session.user.id,
                    komentar: komentar,
                    rating: parseInt(rating.value)
                }
            ]);
        
        if (error) {
            console.error('Error inserting komentar:', error);
            showMessage('komentar-error-message', 'Gagal menyimpan komentar. Silakan coba lagi.');
            return;
        }
        
        // Show success message and reset form
        showMessage('komentar-success-message', 'Komentar berhasil dikirim!');
        document.getElementById('komentarForm').reset();
        
        // Reset rating display
        document.querySelectorAll('.rating label').forEach(star => {
            star.classList.remove('text-yellow-400');
            star.classList.add('text-gray-300');
        });
        document.getElementById('rating-value').textContent = 'Pilih rating';
        
        // Reload comments to include the new one
        await loadAllKomentar();
        updateSlidePosition(); // Update the slide position after reload
    } catch (err) {
        console.error('Error submitting komentar:', err);
        showMessage('komentar-error-message', 'Terjadi kesalahan saat mengirim komentar');
    }
}

// Function to show a message
function showMessage(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.remove('hidden');
        
        // Auto-hide success messages after 5 seconds
        if (elementId.includes('success')) {
            setTimeout(() => {
                element.classList.add('hidden');
            }, 5000);
        }
    }
}

// Function to hide a message
function hideMessage(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
    }
}

// Make functions available globally to be used by main.js
window.updateSlidingTestimonials = updateSlidingTestimonials;
window.loadAllKomentar = loadAllKomentar;