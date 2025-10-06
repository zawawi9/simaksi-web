// admin-simple.js - Very simple admin dashboard

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin dashboard initializing...');
    
    try {
        // Check if Supabase is available
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase not loaded');
            return;
        }
        
        const supabase = window.supabase;
        console.log('Supabase client available');
        
        // Set up admin name with real name from database
        await setupAdminName(supabase);
        
        // Set up logout function
        window.simpleLogout = async function() {
            console.log('Logging out...');
            try {
                const { error } = await supabase.auth.signOut();
                if (error) {
                    console.error('Error logging out:', error);
                    alert('Gagal logout. Silakan coba lagi.');
                } else {
                    console.log('Logout successful, redirecting...');
                    window.location.href = 'index.html';
                }
            } catch (err) {
                console.error('Logout error:', err);
                alert('Terjadi kesalahan saat logout.');
            }
        };
        
        // Simple switch content function
        window.simpleSwitchContent = function(contentType) {
            console.log('Switching to content:', contentType);
            
            // Hide all content sections
            document.querySelectorAll('.content-section').forEach(content => {
                content.classList.add('hidden');
            });

            // Remove active class from all nav items
            document.querySelectorAll('nav a').forEach(link => {
                link.classList.remove('active');
                link.classList.remove('bg-green-700');
                link.classList.add('hover:bg-green-700');
            });

            // Show requested content and activate nav
            const contentElement = document.getElementById(contentType + '-content');
            const navElement = document.getElementById('nav-' + contentType);
            
            if (contentElement) {
                contentElement.classList.remove('hidden');
            }
            
            if (navElement) {
                navElement.classList.add('active');
                navElement.classList.remove('hover:bg-green-700');
                
                // Update title
                const titleElement = document.getElementById('page-title');
                if (titleElement) {
                    let title = '';
                    let icon = '';
                    switch(contentType) {
                        case 'dashboard':
                            title = 'Dashboard Utama';
                            icon = 'home';
                            break;
                        case 'reservasi':
                            title = 'Manajemen Reservasi';
                            icon = 'list';
                            break;
                        case 'kuota':
                            title = 'Manajemen Kuota';
                            icon = 'ticket-alt';
                            break;
                        case 'keuangan':
                            title = 'Manajemen Keuangan';
                            icon = 'money-bill-wave';
                            break;
                        case 'pendaki':
                            title = 'Manajemen Pendaki';
                            icon = 'users';
                            break;
                        case 'pengumuman':
                            title = 'Pengumuman';
                            icon = 'bullhorn';
                            break;
                        default:
                            title = 'Halaman';
                            icon = 'question';
                    }
                    titleElement.innerHTML = `<i class="fas fa-${icon} mr-2 text-green-600"></i> ${title}`;
                }
            }
        };
        
        console.log('Admin dashboard initialized successfully');
        
    } catch (error) {
        console.error('Error initializing admin dashboard:', error);
    }
});

// Function to set up admin name with real name from database
async function setupAdminName(supabase) {
    try {
        const adminNameElement = document.getElementById('admin-name');
        if (adminNameElement) {
            // Get current session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                console.log('No valid session found');
                adminNameElement.textContent = 'Admin';
                return;
            }
            
            const userId = session.user.id;
            console.log('User ID:', userId);
            
            // Get user data from pengguna table
            const { data: userData, error: userError } = await supabase
                .from('pengguna')
                .select('nama_lengkap')
                .eq('id_pengguna', userId)
                .single();
            
            if (userError) {
                console.error('Error fetching user data:', userError);
                adminNameElement.textContent = 'Admin';
                return;
            }
            
            console.log('User data:', userData);
            
            // Update admin name with real name
            if (userData && userData.nama_lengkap) {
                adminNameElement.textContent = userData.nama_lengkap;
            } else {
                adminNameElement.textContent = session.user.email || 'Admin';
            }
        }
    } catch (error) {
        console.error('Error setting up admin name:', error);
    }
}