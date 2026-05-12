// Weather App - Main JavaScript
// 天气应用 - 主要JavaScript

const CMA_API_URL = 'https://weather.cma.cn/web/weather/54399.html';
const DATA_FILE = 'data/weather.json';

// App State
let currentLang = localStorage.getItem('lang') || 'zh';
let currentTheme = localStorage.getItem('theme') || 'light';
let weatherData = null;
let selectedDayIndex = 0;

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

// Weather icon mapping (CMA uses w0, w1, w2, etc.)
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
        updateWeatherDisplay(weatherData);
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
            updateWeatherDisplay(weatherData);
        }
    } catch (error) {
        console.error('Failed to fetch weather data:', error);
        showError();
    }
}

// Parse Weather HTML from CMA
function parseWeatherHTML(html) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const data = {
            updateTime: '',
            location: '北京海淀区',
            current: {
                temp: '',
                weather: '',
                wind: '',
                pressure: '',
                humidity: '',
                precipitation: ''
            },
            daily: [],
            hourly: []
        };

        // Extract update time
        const pubtime = doc.querySelector('#pubtime');
        if (pubtime) {
            const timeMatch = pubtime.textContent.match(/(\d{4}\/\d{2}\/\d{2}\s+\d{2}:\d{2})/);
            if (timeMatch) {
                data.updateTime = timeMatch[1];
            }
        }

        // Extract current temperature
        const tempEl = doc.querySelector('#temperature');
        if (tempEl) {
            data.current.temp = tempEl.textContent.replace(/[^\d.]/g, '');
        }

        // Extract weather description
        const weatherEl = doc.querySelector('.real_item');
        if (weatherEl) {
            const weatherText = weatherEl.textContent;
            // Parse weather from the real_item list
            const pressureMatch = weatherText.match(/(\d+)hPa/);
            const humidityMatch = weatherText.match(/(\d+)%/);
            const precipMatch = weatherText.match(/(\d+(?:\.\d+)?)mm/);
            const windMatch = weatherText.match(/([^0-9]+)\s+([^\d]+)/);
            
            if (pressureMatch) data.current.pressure = pressureMatch[1];
            if (humidityMatch) data.current.humidity = humidityMatch[1];
            if (precipMatch) data.current.precipitation = precipMatch[1];
            if (windMatch) data.current.wind = windMatch[0].trim();
        }

        // Try to get weather from dayList first day
        const firstDayWeather = doc.querySelector('.day.actived .day-item');
        if (firstDayWeather) {
            data.current.weather = firstDayWeather.textContent.trim();
        }

        // Extract wind info
        const windEl = doc.querySelector('#wind');
        if (windEl) {
            data.current.wind = windEl.textContent.replace('风速:', '').trim();
        }

        // Extract 7-day forecast
        const dayItems = doc.querySelectorAll('.day');
        dayItems.forEach((day, index) => {
            const dayData = {
                date: '',
                weekday: '',
                dayWeather: '',
                dayWeatherIcon: '',
                dayWind: '',
                dayWindLevel: '',
                high: '',
                low: '',
                nightWeather: '',
                nightWeatherIcon: '',
                nightWind: '',
                nightWindLevel: ''
            };

            const items = day.querySelectorAll('.day-item');
            if (items.length >= 9) {
                // Parse date info
                const dateText = items[0].textContent.replace(/\s+/g, ' ').trim();
                dayData.date = dateText;
                
                // Get weekday from date
                const dateMatch = dateText.match(/(\d{2}\/\d{2})/);
                if (dateMatch) {
                    const [month, dayNum] = dateMatch[1].split('/').map(Number);
                    const year = new Date().getFullYear();
                    const date = new Date(year, month - 1, dayNum);
                    dayData.weekday = weekdayNames[currentLang][date.getDay()];
                }

                // Day weather icon (img src)
                const dayIconImg = items[1].querySelector('img');
                if (dayIconImg) {
                    const src = dayIconImg.getAttribute('src');
                    const iconMatch = src.match(/w(\d+)\.png/);
                    if (iconMatch) {
                        dayData.dayWeatherIcon = 'w' + iconMatch[1];
                    }
                }
                
                dayData.dayWeather = items[2].textContent.trim();
                dayData.dayWind = items[3].textContent.trim();
                dayData.dayWindLevel = items[4].textContent.trim();
                
                // Temperature
                const tempItems = items[5].querySelectorAll('.high, .low');
                if (tempItems.length >= 2) {
                    dayData.high = tempItems[0].textContent.replace(/[^\d]/g, '');
                    dayData.low = tempItems[1].textContent.replace(/[^\d]/g, '');
                } else {
                    const barDiv = items[5].querySelector('.bar');
                    if (barDiv) {
                        const highEl = barDiv.querySelector('.high');
                        const lowEl = barDiv.querySelector('.low');
                        if (highEl) dayData.high = highEl.textContent.replace(/[^\d]/g, '');
                        if (lowEl) dayData.low = lowEl.textContent.replace(/[^\d]/g, '');
                    }
                }

                // Night weather
                const nightIconImg = items[6].querySelector('img');
                if (nightIconImg) {
                    const src = nightIconImg.getAttribute('src');
                    const iconMatch = src.match(/w(\d+)\.png/);
                    if (iconMatch) {
                        dayData.nightWeatherIcon = 'w' + iconMatch[1];
                    }
                }
                dayData.nightWeather = items[7].textContent.trim();
                dayData.nightWind = items[8].textContent.trim();
                dayData.nightWindLevel = items[9] ? items[9].textContent.trim() : '';
            }

            data.daily.push(dayData);
        });

        // Extract hourly data for each day
        const hourTables = doc.querySelectorAll('.hour-table');
        hourTables.forEach((table, dayIndex) => {
            const dayHourly = {
                dayIndex: dayIndex,
                hours: []
            };

            const rows = table.querySelectorAll('tbody tr');
            if (rows.length >= 8) {
                const times = rows[0].querySelectorAll('td:not(:first-child)');
                const icons = rows[1].querySelectorAll('td:not(:first-child) img');
                const temps = rows[2].querySelectorAll('td:not(:first-child)');
                const precips = rows[3].querySelectorAll('td:not(:first-child)');
                const winds = rows[4].querySelectorAll('td:not(:first-child)');
                const windDirs = rows[5].querySelectorAll('td:not(:first-child)');
                const pressures = rows[6].querySelectorAll('td:not(:first-child)');
                const humidities = rows[7].querySelectorAll('td:not(:first-child)');

                times.forEach((time, hourIndex) => {
                    const hourData = {
                        time: time.textContent.trim(),
                        icon: '',
                        temp: '',
                        precip: '',
                        wind: '',
                        windDir: '',
                        pressure: '',
                        humidity: ''
                    };

                    if (icons[hourIndex]) {
                        const src = icons[hourIndex].getAttribute('src');
                        const iconMatch = src.match(/w(\d+)\.png/);
                        if (iconMatch) {
                            hourData.icon = 'w' + iconMatch[1];
                        }
                    }

                    if (temps[hourIndex]) {
                        hourData.temp = temps[hourIndex].textContent.replace(/[^\d.]/g, '');
                    }
                    if (precips[hourIndex]) {
                        hourData.precip = precips[hourIndex].textContent.replace(/[^\d.]/g, '') || '0';
                    }
                    if (winds[hourIndex]) {
                        hourData.wind = winds[hourIndex].textContent.replace(/[^\d.]/g, '');
                    }
                    if (windDirs[hourIndex]) {
                        hourData.windDir = windDirs[hourIndex].textContent.trim();
                    }
                    if (pressures[hourIndex]) {
                        hourData.pressure = pressures[hourIndex].textContent.replace(/[^\d.]/g, '');
                    }
                    if (humidities[hourIndex]) {
                        hourData.humidity = humidities[hourIndex].textContent.replace(/[^\d]/g, '');
                    }

                    dayHourly.hours.push(hourData);
                });
            }

            data.hourly.push(dayHourly);
        });

        return data;
    } catch (error) {
        console.error('Failed to parse weather HTML:', error);
        return null;
    }
}

// Update Weather Display
function updateWeatherDisplay(data) {
    if (!data) return;

    // Store reference to weatherData
    weatherData = data;

    // Update time
    if (elements.updateTimeValue) {
        elements.updateTimeValue.textContent = data.updateTime || '--';
    }

    // Update current weather - only update if element exists and has content
    const current = data.current || {};
    if (elements.temperature) {
        elements.temperature.textContent = current.temp || '--';
    }
    if (elements.weatherDesc) {
        elements.weatherDesc.textContent = current.weather || '--';
        elements.weatherDesc.dataset.zh = current.weather || '--';
        elements.weatherDesc.dataset.en = translateWeather(current.weather);
    }
    
    // Weather icon
    if (elements.weatherIcon) {
        const iconKey = getWeatherIconKey(current.weather);
        elements.weatherIcon.textContent = weatherIcons[iconKey] || weatherIcons['default'];
    }

    // Wind
    if (elements.windText) {
        elements.windText.textContent = current.wind || '--';
    }

    // Other details
    if (elements.pressure) {
        elements.pressure.textContent = (current.pressure || '--') + ' hPa';
    }
    if (elements.humidity) {
        elements.humidity.textContent = (current.humidity || '--') + '%';
    }
    if (elements.precipitation) {
        elements.precipitation.textContent = (current.precipitation || '0') + ' mm';
    }

    // Update daily forecast
    if (elements.dayList) {
        updateDailyForecast(data.daily || []);
    }

    // Update hourly forecast
    if (elements.dayTabs) {
        updateHourlyTabs(data.daily || []);
    }
    if (elements.hourlyTableBody && data.hourly && data.hourly.length > 0) {
        updateHourlyTable(data.hourly[selectedDayIndex] || data.hourly[0]);
    }
}

// Get weather icon key from weather text or icon code
function getWeatherIconKey(weather) {
    if (!weather) return 'default';
    
    // Check for w0, w1, etc. format
    if (weather.startsWith('w')) {
        return weather;
    }
    
    // Map Chinese weather text to icon
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
    
    // Store current active index to restore after re-render
    const prevActiveIndex = selectedDayIndex;
    container.innerHTML = '';

    dailyData.slice(0, 7).forEach((day, index) => {
        const div = document.createElement('div');
        div.className = 'day-item' + (index === prevActiveIndex ? ' actived' : '');
        
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
            // Only update if clicking a different day
            if (selectedDayIndex !== index) {
                selectedDayIndex = index;
                // Update active states without re-rendering entire list
                document.querySelectorAll('.day-item').forEach(d => d.classList.remove('actived'));
                div.classList.add('actived');
                // Update hourly table
                if (weatherData && weatherData.hourly && weatherData.hourly[index]) {
                    updateHourlyTable(weatherData.hourly[index]);
                }
                // Update day tabs to sync
                updateDayTabs();
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
    
    // Store current scroll position
    const scrollLeft = container.scrollLeft;
    container.innerHTML = '';

    if (!weatherData || !weatherData.daily) return;

    weatherData.daily.slice(0, 7).forEach((day, index) => {
        const tab = document.createElement('div');
        tab.className = 'day-tab' + (index === selectedDayIndex ? ' actived' : '');
        const weekday = day.weekday || getWeekdayFromDate(day.date);
        tab.textContent = weekday;
        
        tab.addEventListener('click', () => {
            // Only update if clicking a different tab
            if (selectedDayIndex !== index) {
                selectedDayIndex = index;
                // Update active states
                document.querySelectorAll('.day-tab').forEach(t => t.classList.remove('actived'));
                tab.classList.add('actived');
                // Sync day-list active state
                document.querySelectorAll('.day-item').forEach((d, i) => {
                    d.classList.toggle('actived', i === index);
                });
                // Update hourly table
                if (weatherData && weatherData.hourly && weatherData.hourly[index]) {
                    updateHourlyTable(weatherData.hourly[index]);
                }
            }
        });
        
        container.appendChild(tab);
    });
    
    // Restore scroll position
    container.scrollLeft = scrollLeft;
}

// Update Hourly Table
function updateHourlyTable(dayHourly) {
    const tbody = elements.hourlyTableBody;
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
            <td>${hour.cloud || '--'}%</td>
        `;
        tbody.appendChild(tr);
    });
}

// Show Error State
function showError() {
    elements.temperature.textContent = '--';
    elements.weatherDesc.textContent = currentLang === 'zh' ? '数据加载失败' : 'Data Load Failed';
    elements.weatherIcon.textContent = '❓';
}

// Export for debugging
if (typeof window !== 'undefined') {
    window.WeatherApp = {
        parseWeatherHTML,
        weatherIcons,
        weatherDescMap
    };
}