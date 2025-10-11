// Poster slider system with auto-rotation
document.addEventListener('DOMContentLoaded', async function() {
    // Load Supabase client
    if (typeof supabase === 'undefined') {
        try {
            const configModule = await import('./config.js');
            window.supabase = configModule.supabase;
        } catch (err) {
            console.error('Error loading Supabase config:', err);
            return;
        }
    }
    
    // Load and display all active posters in sliding format
    await loadAllPosters();
    
    // Set up auto-rotation for posters
    setupAutoRotation();
    
    // Set up manual navigation
    setupManualNavigation();
});

// Function to load all active posters from database and create sliding system
async function loadAllPosters() {
    try {
        // Query the promosi_poster table for active posters ordered by sequence
        const { data: posterList, error } = await supabase
            .from('promosi_poster')
            .select(`
                id_poster,
                judul_poster,
                deskripsi_poster,
                url_gambar,
                url_tautan,
                urutan
            `)
            .eq('is_aktif', true) // Only load active posters
            .order('urutan', { ascending: true }); // Order by sequence
        
        if (error) {
            console.error('Error fetching posters:', error);
            showPosterError();
            return;
        }
        
        // Update the UI with the posters data
        updateSlidingPosters(posterList);
    } catch (err) {
        console.error('Error loading posters:', err);
        showPosterError();
    }
}

// Function to update the UI with sliding posters
function updateSlidingPosters(posterList) {
    const container = document.getElementById('poster-container');
    const dotsContainer = document.getElementById('poster-dots');
    
    // Check if container exists before trying to access it
    if (!container) {
        console.error('poster-container not found');
        return;
    }
    
    // Clear containers
    container.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';
    
    if (!posterList || posterList.length === 0) {
        container.innerHTML = `
            <div class="w-full text-center py-12">
                <p class="text-gray-600 text-lg">Tidak ada poster promosi saat ini</p>
            </div>
        `;
        return;
    }
    
    // Create poster cards
    posterList.forEach((poster, index) => {
        // Create a card for the poster
        const card = document.createElement('div');
        card.className = 'poster-card w-full flex-shrink-0 px-4 card-hover';
        card.style.minWidth = '100%'; // Ensure each card takes full width
        
        // Generate the image URL from Supabase storage
        let imageUrl = poster.url_gambar;
        // If the url_gambar is a path in the storage bucket, generate the proper URL
        if (poster.url_gambar && poster.url_gambar.startsWith('poster-promosi/')) {
            const { data } = supabase.storage.from('poster-promosi').getPublicUrl(poster.url_gambar);
            if (data && data.publicUrl) {
                imageUrl = data.publicUrl;
            }
        }
        
        // Create card content with image, title, description, and optional link
        let cardContent = '';
        
        if (poster.url_tautan) {
            // If there's a link, make the whole card clickable
            cardContent = `
                <a href="${poster.url_tautan}" target="_blank" rel="noopener noreferrer">
                    <div class="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-8 h-full">
                        <div class="relative overflow-hidden rounded-2xl mb-6">
                            <img src="${imageUrl}" alt="${poster.judul_poster}" class="w-full h-64 object-cover transition-transform duration-500 hover:scale-105">
                            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <span class="text-white text-xl font-bold">Lihat Detail</span>
                            </div>
                        </div>
                        <div class="text-center">
                            <h4 class="font-bold text-2xl text-gray-800 mb-3">${poster.judul_poster}</h4>
                            <p class="text-gray-700 text-lg mb-4">${poster.deskripsi_poster}</p>
                        </div>
                    </div>
                </a>
            `;
        } else {
            // If no link, just show the poster
            cardContent = `
                <div class="bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-8 h-full">
                    <div class="relative overflow-hidden rounded-2xl mb-6">
                        <img src="${imageUrl}" alt="${poster.judul_poster}" class="w-full h-64 object-cover">
                    </div>
                    <div class="text-center">
                        <h4 class="font-bold text-2xl text-gray-800 mb-3">${poster.judul_poster}</h4>
                        <p class="text-gray-700 text-lg mb-4">${poster.deskripsi_poster}</p>
                    </div>
                </div>
            `;
        }
        
        card.innerHTML = cardContent;
        container.appendChild(card);
        
        // Create pagination dot
        if (dotsContainer) {
            const dot = document.createElement('button');
            dot.className = `poster-dot w-4 h-4 rounded-full ${index === 0 ? 'bg-primary' : 'bg-gray-300'} transition-colors`;
            dot.setAttribute('data-index', index);
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        }
    });
    
    // Initialize current slide
    window.posterCurrentSlide = 0;
    window.posterTotalSlides = posterList.length; // Set total slides after loading posters
    updateSlidePosition();
}

// Function to show an error if posters fail to load
function showPosterError() {
    const container = document.getElementById('poster-container');
    
    // Check if container exists before trying to access it
    if (!container) {
        console.error('poster-container not found');
        return;
    }
    
    container.innerHTML = `
        <div class="w-full text-center py-12">
            <p class="text-red-500 text-lg">Gagal memuat poster promosi. Silakan coba lagi nanti.</p>
        </div>
    `;
}

// Sliding functionality
// Using window object to prevent conflicts with other scripts
window.posterCurrentSlide = 0;
window.posterTotalSlides = 0;
window.posterAutoRotationInterval = null;

// Function to update slide position
function updateSlidePosition() {
    const container = document.getElementById('poster-container');
    if (!container) return;
    
    window.posterTotalSlides = container.children.length;
    const offset = -window.posterCurrentSlide * 100;
    container.style.transform = `translateX(${offset}%)`;
    
    // Update active dot
    const dots = document.querySelectorAll('.poster-dot');
    dots.forEach((dot, index) => {
        if (index === window.posterCurrentSlide) {
            dot.className = 'poster-dot w-4 h-4 rounded-full bg-primary transition-colors';
        } else {
            dot.className = 'poster-dot w-4 h-4 rounded-full bg-gray-300 transition-colors';
        }
    });
}

// Function to go to a specific slide
function goToSlide(slideIndex) {
    if (slideIndex >= 0 && slideIndex < window.posterTotalSlides) {
        window.posterCurrentSlide = slideIndex;
        updateSlidePosition();
        resetAutoRotation();
    }
}

// Function to go to the next slide
function nextSlide() {
    window.posterCurrentSlide = (window.posterCurrentSlide + 1) % window.posterTotalSlides;
    updateSlidePosition();
}

// Function to go to the previous slide
function prevSlide() {
    window.posterCurrentSlide = (window.posterCurrentSlide - 1 + window.posterTotalSlides) % window.posterTotalSlides;
    updateSlidePosition();
}

// Function to set up auto rotation
function setupAutoRotation() {
    // Clear any existing interval
    if (window.posterAutoRotationInterval) {
        clearInterval(window.posterAutoRotationInterval);
    }
    
    // Set up automatic rotation every 6 seconds
    window.posterAutoRotationInterval = setInterval(() => {
        nextSlide();
    }, 6000);
}

// Function to reset auto rotation
function resetAutoRotation() {
    clearInterval(window.posterAutoRotationInterval);
    setupAutoRotation();
}

// Function to set up manual navigation
function setupManualNavigation() {
    const nextBtn = document.getElementById('next-poster');
    const prevBtn = document.getElementById('prev-poster');
    
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