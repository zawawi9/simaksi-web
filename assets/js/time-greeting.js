// Function to update the current time and greeting
function updateTimeAndGreeting() {
    const now = new Date();
    
    // Array of day names in Indonesian
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    // Array of month names in Indonesian
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    // Get day, date, month, year, hours, minutes, and seconds
    const dayName = days[now.getDay()];
    const date = now.getDate().toString().padStart(2, '0');
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    // Format the date and time string in Indonesian format
    const dateTimeString = `${dayName}, ${date} ${monthName} ${year} | ${hours}:${minutes}:${seconds}`;
    
    // Update the time display
    document.getElementById('current-time').textContent = dateTimeString;
    
    // Determine greeting based on time of day
    let greeting = '';
    if (hours >= 5 && hours < 10) {
        greeting = 'Selamat Pagi';
    } else if (hours >= 10 && hours < 15) {
        greeting = 'Selamat Siang';
    } else if (hours >= 15 && hours < 18) {
        greeting = 'Selamat Sore';
    } else {
        greeting = 'Selamat Malam';
    }
    
    // Update the greeting
    document.getElementById('greeting-text').textContent = greeting;
}

// Initialize the time and greeting immediately when the page loads
document.addEventListener('DOMContentLoaded', function() {
    updateTimeAndGreeting(); // Show the initial time and greeting
    
    // Update the time every second
    setInterval(updateTimeAndGreeting, 1000);
});