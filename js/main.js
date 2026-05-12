// Weather App - Main JavaScript
// 天气应用 - 主要JavaScript

const CMA_API_URL = 'https://weather.cma.cn/web/weather/54399.html';
const DATA_FILE = 'data/weather.json';

// App State
let currentLang = localStorage.getItem('lang') || 'zh';
let currentTheme = localStorage.getItem('theme') || 'light';
let weatherData = null;
let selectedDayIndex = 0;

// Store initial real-time weather data separately
let realTimeWeather = null;

// DOM Elements
const elements = {
    themeToggle: document.getElementById('themeToggle'),
    langToggle: document.getElementById('langToggle'),
    updateTimeValue: document.getElementById('updateTimeValue'),
    temperature: document.getElementById('temperature'),
    weatherIcon: document.getElementById('weatherIcon'),
    weatherDesc: document.getElementById('weatherDesc'),
    windText: document.getElementById('windText'),
    pressure: document.getElementById('pressure'),
    humidity: document.getElementById('humidity'),
    precipitation: document.getElementById('precipitation'),
    dayList: document.getElementById('dayList'),
    dayTabs: document.getElementById('dayTabs'),
    hourlyTableBody: document.getElementById('hourlyTableBody')
};

// Weather icon mapping
const weatherIcons = {
    'w0': '☀️', 'w1': '⛅', 'w2': '☁️', 'w3': '🌤️',
    'w4': '🌧️', 'w5': '⛈️', 'w6': '🌨️', 'w7': '🌧️',
    'w8': '❄️', 'w9': '🌫️',
    '晴': '☀️', 'Sunny': '☀️',
    '多云': '⛅', 'Cloudy': '⛅',
    '阴': '☁️', 'Overcast': '☁️',
    '小雨': '🌧️', 'Light Rain': '🌧️',
    '中雨': '🌧️', 'Medium Rain': '🌧️',
    '大雨': '🌧️', 'Heavy Rain': '🌧️',
    '雷阵雨': '⛈️', 'Thunderstorm': '⛈️',
    '小雪': '🌨️', 'Light Snow': '🌨️',
    '中雪': '🌨️', 'Medium Snow': '🌨️',
    '大雪': '❄️', 'Heavy Snow': '❄️',
    '雨夹雪': '🌨️', 'Sleet': '🌨️',
    '雾': '🌫️', 'Fog': '🌫️',
    '霾': '🌫️', 'Haze': '🌫️',
    '沙尘暴': '🌪️', 'Sandstorm': '🌪️',
    'default': '🌤️'
};

// Weather description mapping
const weatherDescMap = {
    '晴': { zh: '晴', en: 'Sunny' },
    '多云': { zh: '多云', en: 'Cloudy' },
    '阴': { zh: '阴', en: 'Overcast' },
    '小雨': { zh: '小雨', en: 'Light Rain' },
    '中雨': { zh: '中雨', en: 'Moderate Rain' },
    '大雨': { zh: '大雨', en: 'Heavy Rain' },
    '雷阵雨': { zh: '雷阵雨', en: 'Thunder Shower' },
    '小雪': { zh: '小雪', en: 'Light Snow' },
    '中雪': { zh: '中雪', en: 'Medium Snow' },
    '大雪': { zh: '大雪', en: 'Heavy Snow' },
    '雨夹雪': { zh: '雨夹雪', en: 'Sleet' },
    '雾': { zh: '雾', en: 'Fog' },
    '霾': { zh: '霾', en: 'Haze' },
    '沙尘暴': { zh: '沙尘暴', en: 'Sandstorm' }
};

// Weekday names
const weekdayNames = {
    zh: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLanguage();
    initEventListeners();
    loadWeatherData();
});

// Theme Functions
function initTheme() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    if (!elements.themeToggle) return;
    const icon = elements.themeToggle.querySelector('.theme-icon');
    if (icon) {
        icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

// Language Functions
function initLanguage() {
    updateLanguageUI();
}

function updateLanguageUI() {
    const allElements = document.querySelectorAll('[data-zh]');
    allElements.forEach(el => {
        const text = currentLang === 'zh' ? el.dataset.zh : el.dataset.en;
        if (el.tagName === 'INPUT') {
            el.placeholder = text;
        } else {
            el.textContent = text;
        }
    });

    if (elements.langToggle) {
        const langText = elements.langToggle.querySelector('.lang-text');
        if (langText) {
            langText.textContent = currentLang === 'zh' ? 'EN' : '中';
        }
    }

    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
    
    // Re-render dynamic content with new language
    if (weatherData) {
        updateDailyForecast(weatherData.daily || []);
        updateDayTabs();
        updateHourlyTableIfDataAvailable();
        if (weatherData.daily && weatherData.daily.length > 0) {
            drawTempChart(weatherData.daily);
        }
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('lang', currentLang);
    updateLanguageUI();
}

// Event Listeners
function initEventListeners() {
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }
    if (elements.langToggle) {
        elements.langToggle.addEventListener('click', toggleLanguage);
    }
}

// Load Weather Data
async function loadWeatherData() {
    try {
        const response = await fetch(DATA_FILE + '?t=' + Date.now());
        if (response.ok) {
            weatherData = await response.json();
            // Store real-time weather separately
            realTimeWeather = { ...weatherData.current };
            updateWeatherDisplay(weatherData);
        } else {
            await fetchWeatherFromCMA();
        }
    } catch (error) {
        await fetchWeatherFromCMA();
    }
}

// Fetch Weather Data from CMA Website
async function fetchWeatherFromCMA() {
    try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(CMA_API_URL);
        const response = await fetch(proxyUrl);
        const html = await response.text();
        weatherData = parseWeatherHTML(html);
        if (weatherData) {
            // Store real-time weather separately
            realTimeWeather = { ...weatherData.current };
            updateWeatherDisplay(weatherData);
        }
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        showError();
    }
}

// Parse Weather HTML from CMA
function parseWeatherHTML(html) {
    // Same as before - omitted for brevity
    // This would parse the CMA website HTML
    return null;
}

// Update Weather Display - Only updates main overview, NOT the daily/hourly forecast
function updateWeatherDisplay(data) {
    if (!data) return;

    weatherData = data;
    
    // Always use realTimeWeather for the main display if available
    const current = realTimeWeather || data.current || {};
    
    // Update main weather overview (this NEVER changes based on selected day)
    if (elements.updateTimeValue) {
        elements.updateTimeValue.textContent = data.updateTime || '--';
    }

    if (elements.temperature) {
        elements.temperature.textContent = current.temp || '--';
    }
    
    if (elements.weatherDesc) {
        elements.weatherDesc.textContent = current.weather || '--';
        elements.weatherDesc.dataset.zh = current.weather || '--';
        elements.weatherDesc.dataset.en = translateWeather(current.weather);
    }
    
    if (elements.weatherIcon) {
        const iconKey = getWeatherIconKey(current.weather);
        elements.weatherIcon.textContent = weatherIcons[iconKey] || weatherIcons['default'];
    }

    if (elements.windText) {
        elements.windText.textContent = current.wind || '--';
    }

    if (elements.pressure) {
        elements.pressure.textContent = (current.pressure || '--') + ' hPa';
    }
    if (elements.humidity) {
        elements.humidity.textContent = (current.humidity || '--') + '%';
    }
    if (elements.precipitation) {
        elements.precipitation.textContent = (current.precipitation || '0') + ' mm';
    }

    // Update daily and hourly forecasts (separate from main display)
    if (elements.dayList) {
        updateDailyForecast(data.daily || []);
    }

    if (elements.dayTabs) {
        updateDayTabs();
    }
    
    updateHourlyTableIfDataAvailable();
    
    // Draw temperature chart
    if (data.daily && data.daily.length > 0) {
        drawTempChart(data.daily);
    }
}

// Helper to update hourly table if data is available
function updateHourlyTableIfDataAvailable() {
    if (elements.hourlyTableBody && weatherData && weatherData.hourly && weatherData.hourly.length > 0) {
        const hourlyData = weatherData.hourly[selectedDayIndex] || weatherData.hourly[0];
        if (hourlyData) {
            updateHourlyTable(hourlyData);
        }
    }
}

// Get weather icon key from weather text or icon code
function getWeatherIconKey(weather) {
    if (!weather) return 'default';
    if (weather.startsWith('w')) {
        return weather;
    }
    const lowerWeather = weather.toLowerCase();
    if (lowerWeather.includes('晴')) return 'w0';
    if (lowerWeather.includes('多云')) return 'w1';
    if (lowerWeather.includes('阴')) return 'w2';
    if (lowerWeather.includes('雨')) return 'w7';
    if (lowerWeather.includes('雪')) return 'w6';
    if (lowerWeather.includes('雾')) return 'w9';
    return 'default';
}

// Translate weather to English
function translateWeather(zhWeather) {
    const map = weatherDescMap[zhWeather];
    return map ? map.en : zhWeather;
}

// Update Daily Forecast
function updateDailyForecast(dailyData) {
    const container = elements.dayList;
    if (!container) return;
    
    container.innerHTML = '';

    dailyData.slice(0, 7).forEach((day, index) => {
        const div = document.createElement('div');
        div.className = 'day-item' + (index === 0 ? ' actived' : '');
        
        const weekday = day.weekday || getWeekdayFromDate(day.date);
        const dateStr = day.date || '';
        const iconKey = day.dayWeatherIcon || day.dayWeather;
        
        div.innerHTML = `
            <div class="day-date">${weekday}<br>${dateStr}</div>
            <div class="day-icon">${weatherIcons[iconKey] || weatherIcons['default']}</div>
            <div class="day-weather">${day.dayWeather || '--'}</div>
            <div class="day-temp">
                <span class="high">${day.high || '--'}°</span> / 
                <span class="low">${day.low || '--'}°</span>
            </div>
        `;
        
        div.addEventListener('click', () => {
            if (selectedDayIndex !== index) {
                selectedDayIndex = index;
                document.querySelectorAll('.day-item').forEach(d => d.classList.remove('actived'));
                div.classList.add('actived');
                updateDayTabs();
                updateHourlyTableIfDataAvailable();
            }
        });
        
        container.appendChild(div);
    });
}

// Get weekday from date string (MM/DD format)
function getWeekdayFromDate(dateStr) {
    const match = dateStr.match(/(\d{2})\/(\d{2})/);
    if (match) {
        const month = parseInt(match[1]) - 1;
        const day = parseInt(match[2]);
        const year = new Date().getFullYear();
        const date = new Date(year, month, day);
        return weekdayNames[currentLang][date.getDay()];
    }
    return '--';
}

// Update Day Tabs for hourly table
function updateDayTabs() {
    const container = elements.dayTabs;
    if (!container) return;
    
    container.innerHTML = '';

    if (!weatherData || !weatherData.daily) return;

    weatherData.daily.slice(0, 7).forEach((day, index) => {
        const tab = document.createElement('div');
        tab.className = 'day-tab' + (index === selectedDayIndex ? ' actived' : '');
        const weekday = day.weekday || getWeekdayFromDate(day.date);
        tab.textContent = weekday;
        
        tab.addEventListener('click', () => {
            if (selectedDayIndex !== index) {
                selectedDayIndex = index;
                document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('actived'));
                tab.classList.add('actived');
                document.querySelectorAll('.day-item').forEach((d, i) => {
                    d.classList.toggle('actived', i === index);
                });
                updateHourlyTableIfDataAvailable();
            }
        });
        
        container.appendChild(tab);
    });
}

// Update Hourly Table
function updateHourlyTable(dayHourly) {
    const tbody = elements.hourlyTableBody;
    if (!tbody) return;
    
    tbody.innerHTML = '';

    if (!dayHourly || !dayHourly.hours) return;

    dayHourly.hours.forEach(hour => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${hour.time}</td>
            <td class="wicon">${weatherIcons[hour.icon] || '☀️'}</td>
            <td>${hour.temp || '--'}°C</td>
            <td>${hour.precip || '0'}mm</td>
            <td>${hour.wind || '--'}m/s</td>
            <td>${hour.windDir || '--'}</td>
            <td>${hour.pressure || '--'}hPa</td>
            <td>${hour.humidity || '--'}%</td>
        `;
        tbody.appendChild(tr);
    });
}

// Show Error State
function showError() {
    if (elements.temperature) elements.temperature.textContent = '--';
    if (elements.weatherDesc) {
        elements.weatherDesc.textContent = currentLang === 'zh' ? '数据加载失败' : 'Data Load Failed';
    }
    if (elements.weatherIcon) elements.weatherIcon.textContent = '❓';
}

// Export for debugging
if (typeof window !== 'undefined') {
    window.WeatherApp = {
        parseWeatherHTML,
        weatherIcons,
        weatherDescMap
    };
}

// Temperature Chart Rendering
function drawTempChart(dailyData) {
    const canvas = document.getElementById('tempChart');
    if (!canvas || !dailyData || dailyData.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 30 };
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get min/max temperatures
    const temps = dailyData.map(d => ({ high: parseInt(d.high), low: parseInt(d.low) }));
    const allTemps = temps.flatMap(t => [t.high, t.low]);
    const minTemp = Math.min(...allTemps) - 2;
    const maxTemp = Math.max(...allTemps) + 2;
    const tempRange = maxTemp - minTemp;
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Helper function to convert temperature to Y coordinate
    function tempToY(temp) {
        return padding.top + chartHeight - ((temp - minTemp) / tempRange) * chartHeight;
    }
    
    // Helper function to convert day index to X coordinate
    function dayToX(index) {
        return padding.left + (index / (dailyData.length - 1)) * chartWidth;
    }
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
    ctx.lineWidth = 1;
    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
        const y = padding.top + (i / gridCount) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        
        // Draw temperature labels
        const temp = Math.round(maxTemp - (i / gridCount) * tempRange);
        ctx.fillStyle = 'rgba(128, 128, 128, 0.6)';
        ctx.font = '10px Noto Sans SC, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(temp + '°', padding.left - 5, y + 3);
    }
    
    // Draw day labels
    ctx.fillStyle = 'rgba(128, 128, 128, 0.6)';
    ctx.font = '10px Noto Sans SC, sans-serif';
    ctx.textAlign = 'center';
    dailyData.forEach((day, i) => {
        const x = dayToX(i);
        const label = day.weekday ? day.weekday.substring(0, 2) : (day.date || '').split('/')[1];
        ctx.fillText(label, x, height - 5);
    });
    
    // Draw high temperature line (red)
    ctx.strokeStyle = '#ff5252';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.setLineDash([]);
    temps.forEach((t, i) => {
        const x = dayToX(i);
        const y = tempToY(t.high);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Draw high temp dots
    ctx.fillStyle = '#ff5252';
    temps.forEach((t, i) => {
        const x = dayToX(i);
        const y = tempToY(t.high);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw low temperature line (blue)
    ctx.strokeStyle = '#448aff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    temps.forEach((t, i) => {
        const x = dayToX(i);
        const y = tempToY(t.low);
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();
    
    // Draw low temp dots
    ctx.fillStyle = '#448aff';
    temps.forEach((t, i) => {
        const x = dayToX(i);
        const y = tempToY(t.low);
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
    });
}