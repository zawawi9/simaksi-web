// admin-greeting-fix.js - Minimal script to add greeting and real admin name

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin greeting fix initializing...');
    
    try {
        // Check if Supabase is available globally (from existing working system)
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase not available');
            return;
        }
        
        const supabase = window.supabase;
        
        // Get admin name element
        const adminNameElement = document.getElementById('admin-name');
        if (!adminNameElement) {
            console.log('Admin name element not found');
            return;
        }
        
        // Set initial greeting with "Admin" while we fetch real name
        const initialGreeting = getTimeBasedGreeting();
        adminNameElement.textContent = `${initialGreeting}, Admin`;
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
            console.log('No valid session');
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
            // Keep "Admin" name with greeting
            return;
        }
        
        console.log('User data:', userData);
        
        // Update with real name and greeting
        if (userData && userData.nama_lengkap) {
            const greeting = getTimeBasedGreeting();
            adminNameElement.textContent = `${greeting}, ${userData.nama_lengkap}`;
        }
        
        // Update greeting every minute
        setInterval(() => {
            updateAdminGreetingWithRealName();
        }, 60000);
        
    } catch (error) {
        console.error('Error in admin greeting fix:', error);
    }
});

// Helper function to get time-based greeting
function getTimeBasedGreeting() {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 10) {
        return 'Pagi'; // 05:00 - 09:59
    } else if (currentHour >= 10 && currentHour < 15) {
        return 'Siang'; // 10:00 - 14:59
    } else if (currentHour >= 15 && currentHour < 19) {
        return 'Sore'; // 15:00 - 18:59
    } else {
        return 'Malam'; // 19:00 - 04:59
    }
}

// Function to update admin greeting with real name periodically
function updateAdminGreetingWithRealName() {
    const adminNameElement = document.getElementById('admin-name');
    if (adminNameElement) {
        const currentText = adminNameElement.textContent.trim();
        if (currentText.includes(',')) {
            // Extract current name from existing greeting
            const namePart = currentText.split(',')[1].trim();
            if (namePart) {
                const greeting = getTimeBasedGreeting();
                adminNameElement.textContent = `${greeting}, ${namePart}`;
            }
        } else {
            // Just use current text as name with default greeting
            const greeting = getTimeBasedGreeting();
            adminNameElement.textContent = `${greeting}, ${currentText || 'Admin'}`;
        }
    }
}