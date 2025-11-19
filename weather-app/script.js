// API Configuration
const API_KEY = '8b329977167aed59782259569a721685'; // Replace with your OpenWeatherMap API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const currentTemp = document.getElementById('current-temp');
const weatherIcon = document.getElementById('weather-icon');
const weatherDesc = document.getElementById('weather-desc');
const feelsLike = document.getElementById('feels-like');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const forecastContainer = document.getElementById('forecast-container');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');

// Initialize with default city
document.addEventListener('DOMContentLoaded', () => {
    getWeatherByCity('New York');
    
    // Set current date
    const now = new Date();
    currentDate.textContent = formatDate(now);
});

// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = searchInput.value.trim();
    if (city) {
        getWeatherByCity(city);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value.trim();
        if (city) {
            getWeatherByCity(city);
        }
    }
});

locationBtn.addEventListener('click', getWeatherByLocation);

// Get weather by city name
async function getWeatherByCity(city) {
    showLoading();
    hideError();
    
    try {
        // Get current weather
        const currentWeatherResponse = await fetch(
            `${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        
        if (!currentWeatherResponse.ok) {
            throw new Error('City not found');
        }
        
        const currentWeatherData = await currentWeatherResponse.json();
        
        // Get forecast
        const forecastResponse = await fetch(
            `${BASE_URL}/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        
        const forecastData = await forecastResponse.json();
        
        displayCurrentWeather(currentWeatherData);
        displayForecast(forecastData);
        
    } catch (error) {
        showError();
        console.error('Error fetching weather data:', error);
    } finally {
        hideLoading();
    }
}

// Get weather by user's location
function getWeatherByLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by your browser');
        return;
    }
    
    showLoading();
    hideError();
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            
            try {
                // Get current weather
                const currentWeatherResponse = await fetch(
                    `${BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
                );
                
                const currentWeatherData = await currentWeatherResponse.json();
                
                // Get forecast
                const forecastResponse = await fetch(
                    `${BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
                );
                
                const forecastData = await forecastResponse.json();
                
                displayCurrentWeather(currentWeatherData);
                displayForecast(forecastData);
                
            } catch (error) {
                showError();
                console.error('Error fetching weather data:', error);
            } finally {
                hideLoading();
            }
        },
        (error) => {
            hideLoading();
            alert('Unable to retrieve your location');
            console.error('Geolocation error:', error);
        }
    );
}

// Display current weather data
function displayCurrentWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country}`;
    currentTemp.textContent = Math.round(data.main.temp);
    weatherDesc.textContent = data.weather[0].description;
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${data.wind.speed} m/s`;
    pressure.textContent = `${data.main.pressure} hPa`;
    
    // Set weather icon
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `icons/${iconCode}.png`;
    weatherIcon.alt = data.weather[0].description;
}

// Display 5-day forecast
function displayForecast(data) {
    // Clear previous forecast
    forecastContainer.innerHTML = '';
    
    // Get forecast for next 5 days (one reading per day at 12:00)
    const dailyForecasts = [];
    
    for (let i = 0; i < data.list.length; i++) {
        const forecast = data.list[i];
        const forecastDate = new Date(forecast.dt * 1000);
        const hours = forecastDate.getHours();
        
        // Use forecast closest to 12:00 PM for each day
        if (hours === 12) {
            dailyForecasts.push(forecast);
            
            if (dailyForecasts.length === 5) {
                break;
            }
        }
    }
    
    // If we don't have 5 forecasts with 12:00 data, take the first 5 unique days
    if (dailyForecasts.length < 5) {
        const uniqueDays = new Set();
        
        for (let i = 0; i < data.list.length; i++) {
            const forecast = data.list[i];
            const forecastDate = new Date(forecast.dt * 1000);
            const dateString = forecastDate.toDateString();
            
            if (!uniqueDays.has(dateString)) {
                uniqueDays.add(dateString);
                dailyForecasts.push(forecast);
                
                if (dailyForecasts.length === 5) {
                    break;
                }
            }
        }
    }
    
    // Create forecast items
    dailyForecasts.forEach(forecast => {
        const forecastDate = new Date(forecast.dt * 1000);
        const dayName = formatDay(forecastDate);
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        forecastItem.innerHTML = `
            <div class="forecast-date">${dayName}</div>
            <img class="forecast-icon" src="icons/${forecast.weather[0].icon}.png" alt="${forecast.weather[0].description}">
            <div class="forecast-temp">${Math.round(forecast.main.temp)}°C</div>
            <div class="forecast-desc">${forecast.weather[0].description}</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    });
}

// Helper functions
function formatDate(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatDay(date) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    } else {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
}

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError() {
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}