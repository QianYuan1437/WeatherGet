// Weather App - Main JavaScript
// 天气应用 - 主要JavaScript

const CMA_API_URL = 'https://weather.cma.cn/web/weather/54399.html';
const DATA_FILE = 'data/weather.json';

// App State
let currentLang = localStorage.getItem('lang') || 'zh';
let currentTheme = localStorage.getItem('theme') || 'light';
let weatherData = null;

// DOM Elements
const elements = {
    themeToggle: document.getElementById('themeToggle'),
    langToggle: document.getElementById('langToggle'),
    updateTimeValue: document.getElementById('updateTimeValue'),
    temp: document.getElementById('temp'),
    weatherIcon: document.getElementById('weatherIcon'),
    weatherDesc: document.getElementById('weatherDesc'),
    feelsLike: document.getElementById('feelsLike'),
    humidity: document.getElementById('humidity'),
    windSpeed: document.getElementById('windSpeed'),
    pressure: document.getElementById('pressure'),
    visibility: document.getElementById('visibility'),
    hourlyForecast: document.getElementById('hourlyForecast'),
    dailyForecast: document.getElementById('dailyForecast')
};

// Weather icon mapping
const weatherIcons = {
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
    '晴夜': '🌙', 'Clear Night': '🌙',
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
    console.log('Theme initialized:', currentTheme);
}

function updateThemeIcon() {
    if (!elements.themeToggle) {
        console.error('Theme toggle button not found');
        return;
    }
    const icon = elements.themeToggle.querySelector('.theme-icon');
    if (icon) {
        icon.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    }
}

function toggleTheme() {
    console.log('Toggle theme clicked, current:', currentTheme);
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
    console.log('Theme changed to:', currentTheme);
}

// Language Functions
function initLanguage() {
    updateLanguageUI();
    console.log('Language initialized:', currentLang);
}

function updateLanguageUI() {
    const allElements = document.querySelectorAll('[data-zh]');
    console.log('Found', allElements.length, 'elements with data-zh attribute');
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

    // Update document language
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';
}

function toggleLanguage() {
    console.log('Toggle language clicked, current:', currentLang);
    currentLang = currentLang === 'zh' ? 'en' : 'zh';
    localStorage.setItem('lang', currentLang);
    updateLanguageUI();
    if (weatherData) {
        updateWeatherDisplay(weatherData);
    }
    console.log('Language changed to:', currentLang);
}

// Event Listeners
function initEventListeners() {
    console.log('Initializing event listeners...');
    console.log('themeToggle element:', elements.themeToggle);
    console.log('langToggle element:', elements.langToggle);
    
    if (elements.themeToggle) {
        elements.themeToggle.addEventListener('click', toggleTheme);
        console.log('Theme toggle listener added');
    } else {
        console.error('themeToggle not found in DOM');
    }
    
    if (elements.langToggle) {
        elements.langToggle.addEventListener('click', toggleLanguage);
        console.log('Language toggle listener added');
    } else {
        console.error('langToggle not found in DOM');
    }
}

// Load Weather Data
async function loadWeatherData() {
    try {
        // Try to fetch from local JSON file first (generated by GitHub Action)
        const response = await fetch(DATA_FILE + '?t=' + Date.now());
        if (response.ok) {
            weatherData = await response.json();
            updateWeatherDisplay(weatherData);
        } else {
            // Fallback: fetch directly from CMA website
            await fetchWeatherFromCMA();
        }
    } catch (error) {
        console.warn('Failed to load local data, trying CMA website...');
        await fetchWeatherFromCMA();
    }
}

// Fetch Weather Data from CMA Website
async function fetchWeatherFromCMA() {
    try {
        const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(CMA_API_URL);
        const response = await fetch(proxyUrl);
        const html = await response.text();

        // Parse HTML to extract weather data
        weatherData = parseWeatherHTML(html);
        if (weatherData) {
            updateWeatherDisplay(weatherData);
        }
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        showError();
    }
}

// Parse Weather HTML
function parseWeatherHTML(html) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract data from page
        const scriptTags = doc.querySelectorAll('script');
        let weatherData = null;

        for (const script of scriptTags) {
            const content = script.textContent;
            if (content.includes('dayJson') || content.includes('hourJson')) {
                try {
                    // Try to extract JSON data from script
                    const jsonMatch = content.match(/= (\{[\s\S]*?\});/);
                    if (jsonMatch) {
                        weatherData = JSON.parse(jsonMatch[1]);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
        }

        // Alternative: scrape from page elements
        if (!weatherData) {
            weatherData = scrapeFromElements(doc);
        }

        return weatherData;
    } catch (error) {
        console.error('Failed to parse weather HTML:', error);
        return null;
    }
}

// Scrape weather data from HTML elements
function scrapeFromElements(doc) {
    // This is a fallback method - the actual implementation would depend on CMA website structure
    const data = {
        updateTime: new Date().toISOString(),
        location: '北京海淀区',
        current: {
            temp: doc.querySelector('.temperature')?.textContent?.replace(/[^\d.-]/g, '') || '0',
            feelsLike: doc.querySelector('.fl')?.textContent?.replace(/[^\d.-]/g, '') || '0',
            weather: doc.querySelector('.weather')?.textContent || '晴',
            humidity: doc.querySelector('.humidity')?.textContent?.replace(/[^\d]/g, '') || '0',
            windSpeed: doc.querySelector('.wind-speed')?.textContent?.replace(/[^\d.]/g, '') || '0',
            pressure: doc.querySelector('.pressure')?.textContent?.replace(/[^\d]/g, '') || '0',
            visibility: doc.querySelector('.visibility')?.textContent?.replace(/[^\d.]/g, '') || '0'
        },
        hourly: [],
        daily: []
    };

    // Scrape hourly forecast
    const hourlyItems = doc.querySelectorAll('.hourly-item, .forecast-hourly li');
    hourlyItems.forEach((item, index) => {
        if (index < 24) {
            data.hourly.push({
                time: item.querySelector('.time, .hour')?.textContent || `${index}:00`,
                temp: item.querySelector('.temp, .temperature')?.textContent?.replace(/[^\d]/g, '') || '0',
                icon: getWeatherIcon(item.querySelector('.icon, img')?.getAttribute('src') || '')
            });
        }
    });

    // Scrape daily forecast
    const dailyItems = doc.querySelectorAll('.daily-item, .forecast-daily li');
    dailyItems.forEach(item => {
        data.daily.push({
            date: item.querySelector('.date')?.textContent || '',
            high: item.querySelector('.high')?.textContent?.replace(/[^\d]/g, '') || '0',
            low: item.querySelector('.low')?.textContent?.replace(/[^\d]/g, '') || '0',
            weather: item.querySelector('.weather')?.textContent || '晴',
            icon: getWeatherIcon(item.querySelector('.icon, img')?.getAttribute('src') || '')
        });
    });

    return data;
}

// Get weather icon from image URL or text
function getWeatherIcon(iconRef) {
    if (!iconRef) return weatherIcons['default'];

    // Map icon URLs to emoji
    const iconMap = {
        'sunny': '☀️',
        'cloudy': '⛅',
        'overcast': '☁️',
        'rain': '🌧️',
        'snow': '❄️',
        'thunder': '⛈️',
        'fog': '🌫️'
    };

    const lowerRef = iconRef.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
        if (lowerRef.includes(key)) {
            return icon;
        }
    }

    return weatherIcons['default'];
}

// Update Weather Display
function updateWeatherDisplay(data) {
    if (!data) return;

    // Update time
    const updateTime = new Date(data.updateTime || data.generationTime || Date.now());
    elements.updateTimeValue.textContent = formatTime(updateTime);

    // Update current weather
    const current = data.current || data.real || {};
    elements.temp.textContent = current.temp || '--';
    elements.feelsLike.textContent = current.feelsLike || '--';

    // Weather description
    const weatherKey = current.weather || current.weatherText || '晴';
    const weatherInfo = weatherDescMap[weatherKey] || { zh: weatherKey, en: weatherKey };
    elements.weatherDesc.textContent = currentLang === 'zh' ? weatherInfo.zh : weatherInfo.en;
    elements.weatherDesc.dataset.zh = weatherInfo.zh;
    elements.weatherDesc.dataset.en = weatherInfo.en;

    // Weather icon
    elements.weatherIcon.textContent = weatherIcons[weatherKey] || weatherIcons['default'];

    // Other details
    elements.humidity.textContent = (current.humidity || '--') + '%';
    elements.windSpeed.textContent = (current.windSpeed || current.windSpeedKm || '--') + ' m/s';
    elements.pressure.textContent = (current.pressure || '--') + ' hPa';
    elements.visibility.textContent = (current.visibility || '--') + ' km';

    // Update hourly forecast
    updateHourlyForecast(data.hourly || data.hourlyForecast || []);

    // Update daily forecast
    updateDailyForecast(data.daily || data.dailyForecast || []);
}

// Update Hourly Forecast
function updateHourlyForecast(hourlyData) {
    const container = elements.hourlyForecast;
    container.innerHTML = '';

    hourlyData.slice(0, 24).forEach(item => {
        const div = document.createElement('div');
        div.className = 'hourly-item';

        const time = item.time || item.hour || '00:00';
        const temp = item.temp || item.temperature || '--';
        const icon = item.icon || getWeatherIcon(item.weather || '');

        div.innerHTML = `
            <div class="hourly-time">${time}</div>
            <div class="hourly-icon">${icon}</div>
            <div class="hourly-temp">${temp}°</div>
        `;
        container.appendChild(div);
    });
}

// Update Daily Forecast
function updateDailyForecast(dailyData) {
    const container = elements.dailyForecast;
    container.innerHTML = '';

    dailyData.slice(0, 5).forEach(item => {
        const div = document.createElement('div');
        div.className = 'daily-item';

        const date = item.date || item.day || '';
        const high = item.high || item.maxTemp || '--';
        const low = item.low || item.minTemp || '--';
        const weather = item.weather || item.weatherText || '晴';
        const icon = item.icon || getWeatherIcon(weather);

        const weatherInfo = weatherDescMap[weather] || { zh: weather, en: weather };
        const desc = currentLang === 'zh' ? weatherInfo.zh : weatherInfo.en;

        div.innerHTML = `
            <div class="daily-date">${date}</div>
            <div class="daily-icon">${icon}</div>
            <div class="daily-desc">${desc}</div>
            <div class="daily-temps">
                <span class="daily-high">${high}°</span>
                <span class="daily-low"> / ${low}°</span>
            </div>
        `;
        container.appendChild(div);
    });
}

// Format time for display
function formatTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    if (currentLang === 'zh') {
        return `${year}年${month}月${day}日 ${hours}:${minutes}`;
    } else {
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    }
}

// Show Error State
function showError() {
    elements.temp.textContent = '--';
    elements.weatherDesc.textContent = currentLang === 'zh' ? '数据加载失败' : 'Data Load Failed';
    elements.weatherIcon.textContent = '❓';
    elements.updateTimeValue.textContent = currentLang === 'zh' ? '请刷新页面重试' : 'Please refresh to retry';
}

// Export functions for GitHub Action data generation
if (typeof window !== 'undefined') {
    window.WeatherApp = {
        parseWeatherHTML,
        getWeatherIcon,
        weatherIcons,
        weatherDescMap
    };
}