// admin-greeting-fix.js - Minimal script to add greeting and real admin name

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin greeting fix initializing...');
    
    try {
        // Get admin name element
        const adminNameElement = document.getElementById('admin-name');
        if (!adminNameElement) {
            console.log('Admin name element not found');
            return;
        }
        
        // Set initial greeting
        const initialGreeting = getTimeBasedGreeting();
        const currentText = adminNameElement.textContent || 'Admin';
        
        // Check if greeting is already applied - avoid overwriting if already set properly
        if (!currentText.includes(initialGreeting)) {
            // Apply greeting to admin name
            adminNameElement.textContent = `${initialGreeting}, ${currentText}`;
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