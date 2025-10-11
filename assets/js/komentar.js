// Fungsi untuk menangani form komentar
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
    
    // Load existing comments
    loadKomentar();
});

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
        
        // Reload comments
        loadKomentar();
    } catch (err) {
        console.error('Error submitting komentar:', err);
        showMessage('komentar-error-message', 'Terjadi kesalahan saat mengirim komentar');
    }
}

// Function to load comments from database
async function loadKomentar() {
    try {
        // Query the komentar table with user profiles
        const { data: komentarList, error } = await supabase
            .from('komentar')
            .select(`
                id_komentar,
                komentar,
                rating,
                dibuat_pada,
                id_pengguna,
                profiles!inner(nama_lengkap)
            `)
            .order('dibuat_pada', { ascending: false }); // Order by creation date, newest first
        
        if (error) {
            console.error('Error fetching comments:', error);
            showKomentarError();
            return;
        }
        
        // Update the UI with the comments data
        updateKomentarList(komentarList);
    } catch (err) {
        console.error('Error loading comments:', err);
        showKomentarError();
    }
}

// Function to update the comments section with data
function updateKomentarList(komentarList) {
    const container = document.getElementById('daftar-komentar');
    
    // Check if container exists before trying to access it
    if (!container) {
        console.error('daftar-komentar container not found');
        return;
    }
    
    if (!komentarList || komentarList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-600 text-lg">Belum ada komentar dari pendaki</p>
            </div>
        `;
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
    // Populate with comment cards
    komentarList.forEach(komentar => {
        // Format the date
        const formattedDate = new Date(komentar.dibuat_pada).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Create a card for the comment
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl shadow-lg p-6 border-l-4 border-primary mb-4';
        card.innerHTML = `
            <div class="flex items-center mb-3">
                <div class="w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center text-white font-bold mr-4">
                    ${komentar.profiles.nama_lengkap.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h4 class="font-bold text-lg text-gray-800">${komentar.profiles.nama_lengkap}</h4>
                    <div class="flex items-center">
                        <div class="rating-display text-yellow-400 flex">
                            ${generateStars(komentar.rating)}
                        </div>
                        <span class="ml-2 text-gray-600 text-sm">${komentar.rating}/5</span>
                    </div>
                </div>
            </div>
            <p class="text-gray-700">${komentar.komentar}</p>
            <div class="mt-2 text-right text-sm text-gray-500">${formattedDate}</div>
        `;
        
        container.appendChild(card);
    });
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
    const container = document.getElementById('daftar-komentar');
    
    // Check if container exists before trying to access it
    if (!container) {
        console.error('daftar-komentar container not found');
        return;
    }
    
    container.innerHTML = `
        <div class="text-center py-8">
            <p class="text-red-500 text-lg">Gagal memuat komentar. Silakan coba lagi nanti.</p>
        </div>
    `;
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