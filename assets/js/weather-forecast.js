// Weather Forecast Module
class WeatherForecast {
    constructor() {
        // To use real weather data, sign up for a free API key at OpenWeatherMap
        // https://openweathermap.org/api
        // For now, we'll use a flag to determine whether to use mock data or real API
        this.useMockData = true; // Set to false when you have an API key
        this.apiKey = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key
        this.forecastContainer = document.getElementById('weather-forecast');
        this.location = 'Malang, ID'; // Using Malang as the location for Gunung Butak
        this.init();
    }

    async init() {
        if (this.forecastContainer) {
            await this.displayWeatherData();
        }
    }

    async getWeatherData() {
        try {
            if (this.useMockData) {
                return this.getMockWeatherData();
            } else {
                // In a real implementation, you would fetch from an API like:
                const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${this.location}&appid=${this.apiKey}&units=metric&lang=id`);
                
                if (!response.ok) {
                    if (response.status === 401) {
                        console.error('Invalid API key. Switching to mock data.');
                        this.useMockData = true;
                        return this.getMockWeatherData();
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                return data;
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
            // If real API fails, fall back to mock data
            return this.getMockWeatherData();
        }
    }

    getMockWeatherData() {
        // Mock weather data for demonstration purposes
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const day3 = new Date();
        day3.setDate(day3.getDate() + 2);
        const day4 = new Date();
        day4.setDate(day4.getDate() + 3);

        return {
            list: [
                {
                    dt: today.getTime() / 1000,
                    main: { temp: 19, feels_like: 18, temp_min: 17, temp_max: 21, humidity: 75 },
                    weather: [{ id: 801, main: 'Clouds', description: 'sedikit berawan', icon: '03d' }],
                    wind: { speed: 3.1, deg: 180 },
                    dt_txt: today.toISOString().split('T')[0] + ' 12:00:00'
                },
                {
                    dt: tomorrow.getTime() / 1000,
                    main: { temp: 20, feels_like: 19, temp_min: 16, temp_max: 22, humidity: 70 },
                    weather: [{ id: 800, main: 'Clear', description: 'cerah', icon: '01d' }],
                    wind: { speed: 2.8, deg: 150 },
                    dt_txt: tomorrow.toISOString().split('T')[0] + ' 12:00:00'
                },
                {
                    dt: day3.getTime() / 1000,
                    main: { temp: 18, feels_like: 17, temp_min: 15, temp_max: 20, humidity: 80 },
                    weather: [{ id: 500, main: 'Rain', description: 'hujan ringan', icon: '10d' }],
                    wind: { speed: 4.2, deg: 200 },
                    dt_txt: day3.toISOString().split('T')[0] + ' 12:00:00'
                },
                {
                    dt: day4.getTime() / 1000,
                    main: { temp: 17, feels_like: 16, temp_min: 14, temp_max: 19, humidity: 85 },
                    weather: [{ id: 802, main: 'Clouds', description: 'berawan tebal', icon: '04d' }],
                    wind: { speed: 3.5, deg: 250 },
                    dt_txt: day4.toISOString().split('T')[0] + ' 12:00:00'
                }
            ]
        };
    }

    async displayWeatherData() {
        this.forecastContainer.innerHTML = this.getLoadingHTML();

        try {
            const data = await this.getWeatherData();
            if (data && data.list) {
                this.forecastContainer.innerHTML = this.createForecastHTML(data);
                this.addWeatherAnimations();
            } else {
                this.forecastContainer.innerHTML = this.getErrorHTML();
            }
        } catch (error) {
            console.error('Error displaying weather data:', error);
            this.forecastContainer.innerHTML = this.getErrorHTML();
        }
    }

    getLoadingHTML() {
        return `
            <div class="flex flex-col items-center justify-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mb-4"></div>
                <p class="text-gray-600">Memuat perkiraan cuaca Gunung Butak...</p>
            </div>
        `;
    }

    getErrorHTML() {
        return `
            <div class="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
                <i class="fas fa-cloud-showers-heavy text-5xl text-red-500 mb-4"></i>
                <h3 class="text-2xl font-bold text-red-700 mb-2">Gagal Memuat Data Cuaca</h3>
                <p class="text-gray-600">Mohon cek koneksi internet Anda atau coba lagi nanti</p>
            </div>
        `;
    }

    createForecastHTML(data) {
        const forecasts = data.list.slice(0, 4); // Take only first 4 forecasts (today + 3 days)

        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                ${forecasts.map((item, index) => this.createForecastCard(item, index)).join('')}
            </div>
        `;
    }

    createForecastCard(forecast, index) {
        const date = new Date(forecast.dt * 1000);
        const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });
        const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        // Determine the period (Today, Tomorrow, etc.)
        let period = dayName;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const forecastDate = new Date(forecast.dt * 1000);
        forecastDate.setHours(0, 0, 0, 0);
        
        const diffDays = (forecastDate - today) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 0) {
            period = 'Hari Ini';
        } else if (diffDays === 1) {
            period = 'Besok';
        } else if (diffDays === 2) {
            period = 'Lusa';
        } else {
            period = dayName;
        }

        // Get weather icon based on weather condition
        const iconCode = forecast.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        const description = forecast.weather[0].description;
        const temp = Math.round(forecast.main.temp);
        const humidity = forecast.main.humidity;
        const windSpeed = forecast.wind.speed;

        // Get appropriate weather emoji
        let weatherEmoji = '☀️';
        if (description.includes('hujan') || description.includes('rain')) {
            weatherEmoji = '🌧️';
        } else if (description.includes('berawan') || description.includes('cloud')) {
            weatherEmoji = '⛅';
        } else if (description.includes('gerimis') || description.includes('drizzle')) {
            weatherEmoji = '🌦️';
        } else if (description.includes('badai') || description.includes('storm')) {
            weatherEmoji = '⛈️';
        } else if (description.includes('salju') || description.includes('snow')) {
            weatherEmoji = '❄️';
        } else if (description.includes('asap') || description.includes('mist') || description.includes('kabut')) {
            weatherEmoji = '🌫️';
        }

        return `
            <div class="weather-card bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all duration-300 transform feature-badge card-hover text-center">
                <div class="text-center mb-4">
                    <h4 class="font-bold text-lg text-gray-800">${period}</h4>
                    <p class="text-gray-500 text-sm">${dateStr}</p>
                </div>
                
                <div class="flex justify-center mb-4">
                    <div class="weather-icon-container">
                        <span class="text-5xl">${weatherEmoji}</span>
                        <!-- Fallback image if needed -->
                        <img src="${iconUrl}" alt="${description}" class="hidden" />
                    </div>
                </div>
                
                <div class="text-center mb-4">
                    <div class="text-3xl font-bold text-primary mb-1">${temp}°C</div>
                    <p class="text-gray-700 capitalize font-medium">${description}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-3 mt-4">
                    <div class="flex flex-col items-center">
                        <i class="fas fa-tint text-blue-500 text-lg mb-1"></i>
                        <span class="text-sm text-gray-600">${humidity}%</span>
                        <span class="text-xs text-gray-500">Kelembaban</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <i class="fas fa-wind text-gray-500 text-lg mb-1"></i>
                        <span class="text-sm text-gray-600">${windSpeed} m/s</span>
                        <span class="text-xs text-gray-500">Angin</span>
                    </div>
                </div>
                
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <div class="flex justify-between text-xs text-gray-500">
                        <span>Min: ${Math.round(forecast.main.temp_min)}°C</span>
                        <span>Max: ${Math.round(forecast.main.temp_max)}°C</span>
                    </div>
                </div>
                
                <div class="mt-4">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full" style="width: ${humidity}%"></div>
                    </div>
                </div>
            </div>
        `;
    }

    addWeatherAnimations() {
        // Add animation to weather cards
        const cards = document.querySelectorAll('.weather-card');
        cards.forEach((card, index) => {
            // Set initial state
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            // Animate in sequence
            setTimeout(() => {
                card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 150 * index);
        });
    }
}

// Initialize weather forecast when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if weather forecast container exists on the page
    if (document.getElementById('weather-forecast')) {
        const weatherForecast = new WeatherForecast();
    }
});