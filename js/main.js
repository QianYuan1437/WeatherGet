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
    feelsLike: document.getElementById('feelsLike'),
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
    '多云': { zh: '多云', en: 'Cloudly' },
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
    
    // Redraw chart with new theme colors
    if (weatherData && weatherData.daily) {
        setTimeout(() => drawTempChart(weatherData.daily), 100);
    }
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
    }
}

function toggleLanguage() {
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('lang', currentLang);
    updateLanguageUI();
    
    // Redraw chart with new language labels
    if (weatherData && weatherData.daily) {
        drawTempChart(weatherData.daily);
    }
}

// Event Listeners
function initEventListeners() {
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
    }
    if (elements.langToggle) {
        elements.langToggle.addEventListener('click', toggleLanguage);
    }
    
    // Handle window resize for chart
    window.addEventListener('resize', () => {
        if (weatherData && weatherData.daily) {
            drawTempChart(weatherData.daily);
        }
    });
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
    // Implementation would parse CMA HTML
    return null;
}

// Update Weather Display
function updateWeatherDisplay(data) {
    if (!data) return;

    weatherData = data;
    
    // Always use realTimeWeather for the main display if available
    const current = realTimeWeather || data.current || {};
    
    // Update main weather overview
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
    if (elements.feelsLike) {
        elements.feelsLike.textContent = (current.feelsLike || current.temp || '--') + '°C';
    }

    // Update daily and hourly forecasts
    if (elements.dayList) {
        updateDailyForecast(data.daily || []);
    }

    if (elements.dayTabs) {
        updateDayTabs();
    }
    
    updateHourlyTableIfDataAvailable();
    
    // Draw temperature chart
    if (data.daily && data.daily.length > 0) {
        setTimeout(() => drawTempChart(data.daily), 50);
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
        div.className = 'forecast-item' + (index === 0 ? ' active' : '');
        
        const weekday = day.weekday || getWeekdayFromDate(day.date);
        const dateStr = day.date || '';
        const iconKey = day.dayWeatherIcon || day.dayWeather;
        
        div.innerHTML = `
            <div class="forecast-date">${weekday}<br>${dateStr}</div>
            <div class="forecast-icon">${weatherIcons[iconKey] || weatherIcons['default']}</div>
            <div class="forecast-weather">${day.dayWeather || '--'}</div>
            <div class="forecast-temp">
                <span class="high">${day.high || '--'}°</span> / 
                <span class="low">${day.low || '--'}°</span>
            </div>
        `;
        
        div.addEventListener('click', () => {
            if (selectedDayIndex !== index) {
                selectedDayIndex = index;
                document.querySelectorAll('.forecast-item').forEach(d => d.classList.remove('active'));
                div.classList.add('active');
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
        tab.className = 'day-tab' + (index === selectedDayIndex ? ' active' : '');
        const weekday = day.weekday || getWeekdayFromDate(day.date);
        tab.textContent = weekday;
        
        tab.addEventListener('click', () => {
            if (selectedDayIndex !== index) {
                selectedDayIndex = index;
                document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.querySelectorAll('.forecast-item').forEach((d, i) => {
                    d.classList.toggle('active', i === index);
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

// Temperature Chart Rendering with smooth curves
function drawTempChart(dailyData) {
    const canvas = document.getElementById('tempChart');
    if (!canvas || !dailyData || dailyData.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    
    // Get actual display size
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const displayWidth = rect.width || 600;
    const displayHeight = rect.height || 180;
    
    // Set canvas resolution for high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';
    ctx.scale(dpr, dpr);
    
    const width = displayWidth;
    const height = displayHeight;
    const padding = { top: 25, right: 20, bottom: 35, left: 40 };
    
    // Clear canvas with theme-aware background
    const isDark = currentTheme === 'dark';
    ctx.fillStyle = isDark ? 'rgba(30, 38, 65, 0.5)' : 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(0, 0, width, height);
    
    // Get min/max temperatures
    const temps = dailyData.map(d => ({ high: parseInt(d.high), low: parseInt(d.low) }));
    const allTemps = temps.flatMap(t => [t.high, t.low]);
    const minTemp = Math.min(...allTemps) - 3;
    const maxTemp = Math.max(...allTemps) + 3;
    const tempRange = maxTemp - minTemp;
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Helper functions
    function tempToY(temp) {
        return padding.top + chartHeight - ((temp - minTemp) / tempRange) * chartHeight;
    }
    
    function dayToX(index) {
        return padding.left + (index / Math.max(dailyData.length - 1, 1)) * chartWidth;
    }
    
    // Get theme colors
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
    const textFont = '12px "Noto Sans SC", sans-serif';
    
    // Draw grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    const gridCount = 5;
    for (let i = 0; i <= gridCount; i++) {
        const y = padding.top + (i / gridCount) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        
        // Temperature labels
        const temp = Math.round(maxTemp - (i / gridCount) * tempRange);
        ctx.fillStyle = textColor;
        ctx.font = textFont;
        ctx.textAlign = 'right';
        ctx.fillText(temp + '°', padding.left - 8, y + 4);
    }
    
    // Day labels
    ctx.textAlign = 'center';
    dailyData.forEach((day, i) => {
        const x = dayToX(i);
        const label = day.weekday ? day.weekday.substring(0, 2) : (day.date || '').split('/')[1];
        ctx.fillText(label, x, height - 8);
    });
    
    // Draw smooth curves using bezier curves
    function drawSmoothCurve(points, color) {
        if (points.length < 2) return;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const midX = (p0.x + p1.x) / 2;
            
            ctx.quadraticCurveTo(p0.x, p0.y, midX, (p0.y + p1.y) / 2);
        }
        
        const lastPoint = points[points.length - 1];
        const secondLast = points[points.length - 2];
        const midX = (secondLast.x + lastPoint.x) / 2;
        ctx.quadraticCurveTo(secondLast.x, secondLast.y, lastPoint.x, lastPoint.y);
        
        ctx.stroke();
    }
    
    // Create points for curves
    const highPoints = temps.map((t, i) => ({ x: dayToX(i), y: tempToY(t.high) }));
    const lowPoints = temps.map((t, i) => ({ x: dayToX(i), y: tempToY(t.low) }));
    
    // Draw curves
    drawSmoothCurve(highPoints, '#ef4444');
    drawSmoothCurve(lowPoints, '#3b82f6');
    
    // Draw dots on curves
    function drawDots(points, color) {
        ctx.fillStyle = color;
        points.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            // Add white inner circle for better visibility
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = color;
        });
    }
    
    drawDots(highPoints, '#ef4444');
    drawDots(lowPoints, '#3b82f6');
}

// Export for debugging
if (typeof window !== 'undefined') {
    window.WeatherApp = {
        parseWeatherHTML,
        weatherIcons,
        weatherDescMap
    };
}