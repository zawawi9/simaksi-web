# Weather API Setup for Gunung Butak Website

This document explains how to set up a real weather API to display accurate weather forecasts for Gunung Butak.

## Getting a Free Weather API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Click on "Sign Up" to create a free account
3. Once registered, go to your account dashboard
4. Find your API key under the "API keys" section
5. Copy the API key to use in the application

## Setting Up the Weather API

### 1. Configure the API Key

In `assets/js/weather-forecast.js`, update the following line:

```javascript
this.apiKey = 'YOUR_API_KEY'; // Replace with your OpenWeatherMap API key
```

### 2. Update the Location

For Gunung Butak specifically, you may want to use more precise coordinates. Update the location:

```javascript
this.location = 'Malang, ID'; // You can change to 'Gunung Butak, ID' or use coordinates
```

### 3. Enable Real API Data

In the WeatherForecast class constructor, change the `useMockData` flag to false:

```javascript
this.useMockData = false; // Set to false to use real API data
```

## API Endpoints Used

- Current weather: `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric&lang=id`
- Forecast: `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric&lang=id`

## Features

- Current weather conditions
- 5-day forecast with 3-hourly updates
- Temperature (current, min, max)
- Humidity levels
- Wind speed and direction
- Weather descriptions in Indonesian
- Visual weather icons

## Free Plan Limitations

The free OpenWeatherMap plan includes:
- 1,000 API calls per day
- Current weather data
- 5-day forecast
- Up to 16-day forecast with different limitations

## Troubleshooting

1. **Invalid API Key**: If you see an error about an invalid API key, double-check that you've copied it correctly and that your account is verified.

2. **No Data Showing**: Check that the location name is valid and recognized by OpenWeatherMap.

3. **CORS Issues**: If running locally, you might encounter CORS issues. Consider using a local server or deploying to a web server.

## Alternative Weather APIs

If OpenWeatherMap doesn't meet your needs, consider these alternatives:
- WeatherAPI (weatherapi.com)
- AccuWeather API
- Tomorrow.io

## Implementation Notes

- The current implementation falls back to mock data if the real API fails
- Weather data updates automatically when the page loads
- The UI is responsive and works on all device sizes
- Data is displayed in Indonesian (where supported by the API)