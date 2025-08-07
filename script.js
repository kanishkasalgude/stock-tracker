// =========================================================================
// ==  GLOBAL VARIABLES  ====================================================
// =========================================================================
let stockChart;
let currentSymbol = 'AAPL';
let currentTheme = 'dark';
let isMarketOpen = true;
let refreshInterval;
let priceData = [];
let timeLabels = [];
let apiCallCount = 0;
let lastApiCall = 0;

// =========================================================================
// ==  API CONFIGURATION  ===================================================
// =========================================================================

// 🔑 ENTER YOUR TWELVE DATA API KEY HERE 🔑
const API_CONFIG = {
    // Twelve Data API (Free tier: 800 calls/day)
    twelveData: {
        key: '2783d065d79f49e587d6b01bf15245e6', // Get from: https://twelvedata.com/
        baseUrl: 'https://api.twelvedata.com',
        enabled: true
    }
};

// =========================================================================
// ==  STATIC DATA  =========================================================
// =========================================================================
const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 150.00, change: 2.5 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2800.00, change: -1.2 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 300.00, change: 1.8 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 800.00, change: 3.2 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 3200.00, change: -0.5 },
    { symbol: 'META', name: 'Meta Platforms', price: 200.00, change: 2.1 },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 450.00, change: 4.5 },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: 400.00, change: -2.3 }
];

const stockSuggestions = [
    'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX',
    'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'ADBE',
    'CRM', 'NFLX', 'CMCSA', 'PEP', 'ABT', 'COST', 'TMO', 'AVGO', 'ACN'
];

// =========================================================================
// ==  API FUNCTIONS  =======================================================
// =========================================================================

// Rate limiting function
function canMakeApiCall() {
    const now = Date.now();
    const timeSinceLastCall = now - lastApiCall;
    const minInterval = 1000; // 1 second minimum between calls
    
    if (timeSinceLastCall < minInterval) {
        return false;
    }
    
    lastApiCall = now;
    apiCallCount++;
    return true;
}

// Global variable for current time range
let currentTimeRange = '1D';

// Twelve Data API call for current price
async function fetchFromTwelveData(symbol) {
    if (!API_CONFIG.twelveData.enabled || !API_CONFIG.twelveData.key || API_CONFIG.twelveData.key === 'YOUR_TWELVE_DATA_API_KEY_HERE') {
        throw new Error('Twelve Data API not configured');
    }
    
    const url = `${API_CONFIG.twelveData.baseUrl}/quote?symbol=${symbol}&apikey=${API_CONFIG.twelveData.key}`;
    console.log('Making API call to:', url);
    
    try {
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Response Error:', errorText);
            throw new Error(`Twelve Data API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('API Response data:', data);
        
        if (data.status === 'error') {
            throw new Error(data.message || 'Twelve Data API error');
        }
        
        // Handle different response formats
        let price, close, high, low, volume, open;
        
        // Check for different possible field names
        price = data.price || data.close || data.current_price;
        close = data.close || data.previous_close || data.prev_close;
        high = data.high || data.day_high;
        low = data.low || data.day_low;
        volume = data.volume || data.vol;
        open = data.open || data.day_open;
        
        if (!price) {
            console.error('Available fields in response:', Object.keys(data));
            throw new Error('No price data available for this symbol');
        }
        
        // Calculate change percentage
        const currentPrice = parseFloat(price);
        const previousClose = parseFloat(close || price);
        const changePercent = previousClose ? ((currentPrice - previousClose) / previousClose) * 100 : 0;
        
        return {
            price: currentPrice,
            high: parseFloat(high || currentPrice),
            low: parseFloat(low || currentPrice),
            change: changePercent,
            changeAmount: currentPrice - previousClose,
            volume: parseInt(volume || 0),
            previousClose: previousClose,
            open: parseFloat(open || currentPrice)
        };
    } catch (error) {
        console.error('Fetch error details:', error);
        throw error;
    }
}

// Fetch historical data for different time ranges
async function fetchHistoricalData(symbol, timeRange) {
    if (!API_CONFIG.twelveData.enabled || !API_CONFIG.twelveData.key || API_CONFIG.twelveData.key === 'YOUR_TWELVE_DATA_API_KEY_HERE') {
        throw new Error('Twelve Data API not configured');
    }
    
    // Map time ranges to intervals (using correct Twelve Data API format)
    const intervalMap = {
        '1D': '15min',  // 15-minute intervals for better 1D view
        '1W': '1h', 
        '1M': '1day',
        '1Y': '1week'
    };
    
    const interval = intervalMap[timeRange] || '5min';
    const url = `${API_CONFIG.twelveData.baseUrl}/time_series?symbol=${symbol}&interval=${interval}&apikey=${API_CONFIG.twelveData.key}`;
    
    console.log(`Fetching historical data for ${timeRange}:`, url);
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Historical data API error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Historical data response:', data);
        
        if (data.status === 'error') {
            throw new Error(data.message || 'Historical data API error');
        }
        
        if (!data.values || !Array.isArray(data.values)) {
            throw new Error('No historical data available');
        }
        
        // Process historical data
        const historicalData = data.values.map(item => ({
            time: item.datetime,
            price: parseFloat(item.close),
            volume: parseInt(item.volume || 0)
        }));
        
        return historicalData;
        
    } catch (error) {
        console.error('Historical data fetch error:', error);
        throw error;
    }
}

// Main API function
async function fetchStockData(symbol) {
    if (!canMakeApiCall()) {
        showToast('Rate limit reached. Please wait a moment.', 'warning');
        return null;
    }
    
    try {
        console.log('Fetching data from Twelve Data API...');
        const data = await fetchFromTwelveData(symbol);
        console.log('Successfully fetched data from Twelve Data API');
        return data;
    } catch (error) {
        console.error('Twelve Data API failed:', error.message);
        
        // Provide specific error messages for common issues
        if (error.message.includes('401')) {
            throw new Error('Invalid API key. Please check your Twelve Data API key.');
        } else if (error.message.includes('429')) {
            throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
        } else if (error.message.includes('404')) {
            throw new Error(`Symbol '${symbol}' not found. Please check the stock symbol.`);
        } else if (error.message.includes('No data available')) {
            throw new Error(`No data available for '${symbol}'. Try a different stock symbol.`);
        } else {
            throw new Error(`API Error: ${error.message}`);
        }
    }
}

// Test API function for debugging
async function testAPI() {
    console.log('=== API TESTING ===');
    console.log('API Key:', API_CONFIG.twelveData.key);
    console.log('API Enabled:', API_CONFIG.twelveData.enabled);
    
    try {
        // Try multiple symbols to test
        const testSymbols = ['AAPL', 'MSFT', 'GOOGL'];
        
        for (const symbol of testSymbols) {
            try {
                console.log(`Testing with symbol: ${symbol}`);
                const data = await fetchFromTwelveData(symbol);
                console.log(`✅ API Test Successful for ${symbol}:`, data);
                showToast(`API connection successful with ${symbol}!`, 'success');
                return; // Success, exit
            } catch (error) {
                console.log(`❌ Failed with ${symbol}:`, error.message);
                continue; // Try next symbol
            }
        }
        
        // If all symbols fail
        showToast('All test symbols failed. Check API key.', 'error');
        
    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        showToast(`API test failed: ${error.message}`, 'error');
    }
}

// Enhanced stock data update function
async function updateStockData() {
    try {
        showToast('Fetching data...', 'info');
        
        if (currentTimeRange === '1D') {
            // For 1D, also use historical data for consistency
            const historicalData = await fetchHistoricalData(currentSymbol, currentTimeRange);
            
            // Clear existing data
            priceData = [];
            timeLabels = [];
            
            // Process historical data for 1D
            historicalData.forEach(item => {
                priceData.push(item.price);
                
                // Format time for 1D view (show time)
                const timeString = new Date(item.time).toLocaleTimeString('en-US', { 
                    hour12: false, 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
                
                timeLabels.push(timeString);
            });
            
            // Update UI with latest data
            const latestData = historicalData[historicalData.length - 1];
            const firstData = historicalData[0];
            const changePercent = ((latestData.price - firstData.price) / firstData.price) * 100;
            
            const displayData = {
                price: latestData.price,
                change: changePercent,
                changeAmount: latestData.price - firstData.price,
                volume: latestData.volume,
                high: Math.max(...historicalData.map(d => d.price)),
                low: Math.min(...historicalData.map(d => d.price)),
                previousClose: firstData.price,
                open: firstData.price
            };
            
            updatePriceDisplay(displayData);
            updateChartStats(displayData);
            
        } else {
            // For other time ranges, fetch historical data
            const historicalData = await fetchHistoricalData(currentSymbol, currentTimeRange);
            
            // Clear existing data
            priceData = [];
            timeLabels = [];
            
            // Process historical data
            historicalData.forEach(item => {
                priceData.push(item.price);
                
                // Format time based on time range
                let timeString;
                if (currentTimeRange === '1W') {
                    timeString = new Date(item.time).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                    });
                } else if (currentTimeRange === '1M') {
                    timeString = new Date(item.time).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                    });
                } else if (currentTimeRange === '1Y') {
                    timeString = new Date(item.time).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                    });
                } else {
                    timeString = new Date(item.time).toLocaleTimeString('en-US', { 
                        hour12: false, 
                        hour: '2-digit', 
                        minute: '2-digit' 
                    });
                }
                
                timeLabels.push(timeString);
            });
            
            // Update UI with latest data
            const latestData = historicalData[historicalData.length - 1];
            const firstData = historicalData[0];
            const changePercent = ((latestData.price - firstData.price) / firstData.price) * 100;
            
            const displayData = {
                price: latestData.price,
                change: changePercent,
                changeAmount: latestData.price - firstData.price,
                volume: latestData.volume,
                high: Math.max(...historicalData.map(d => d.price)),
                low: Math.min(...historicalData.map(d => d.price)),
                previousClose: firstData.price,
                open: firstData.price
            };
            
            updatePriceDisplay(displayData);
            updateChartStats(displayData);
        }
        
        // Update chart colors based on trend
        const latestPrice = priceData[priceData.length - 1];
        const firstPrice = priceData[0];
        const isPositive = latestPrice >= firstPrice;
        const color = isPositive ? '#10b981' : '#ef4444';
        const bgColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        
        if (stockChart && stockChart.data && stockChart.data.datasets && stockChart.data.datasets[0]) {
            stockChart.data.labels = timeLabels;
            stockChart.data.datasets[0].data = priceData;
            stockChart.data.datasets[0].borderColor = color;
            stockChart.data.datasets[0].backgroundColor = bgColor;
            stockChart.data.datasets[0].pointBackgroundColor = color;
            
            // Update chart
            stockChart.update('none');
            console.log('Chart updated with historical data');
        } else {
            console.error('Chart not properly initialized');
        }
        
        showToast(`${currentTimeRange} data loaded successfully`, 'success');
        
    } catch (error) {
        console.error("Failed to fetch stock data:", error);
        showToast(`Error: ${error.message}`, 'error');
        
        // Fallback to simulated data if API fails
        showToast('Using simulated data as fallback', 'warning');
        generateSimulatedData();
    }
}

// Fallback simulated data function
function generateSimulatedData() {
    const basePrice = {
        'AAPL': 150, 'GOOGL': 2800, 'MSFT': 300, 'TSLA': 800,
        'AMZN': 3200, 'META': 200, 'NVDA': 450, 'NFLX': 400
    }[currentSymbol] || 100;
    
    const lastPrice = priceData.length > 0 ? priceData[priceData.length - 1] : basePrice;
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * 2 * volatility * lastPrice;
    const newPrice = Math.max(lastPrice + change, basePrice * 0.5);
    
    const simulatedData = {
        price: newPrice,
        volume: Math.floor(Math.random() * 5000000) + 1000000,
        high: newPrice + Math.random() * 10,
        low: newPrice - Math.random() * 10,
        change: ((newPrice - basePrice) / basePrice * 100),
        changeAmount: newPrice - basePrice
    };
    
    updatePriceDisplay(simulatedData);
    updateChartStats(simulatedData);
}

// =========================================================================
// ==  UTILITY & HELPER FUNCTIONS  ==========================================
// =========================================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

function getCompanyName(symbol) {
    const companies = {
        'AAPL': 'Apple Inc.',
        'GOOGL': 'Alphabet Inc.',
        'MSFT': 'Microsoft Corp.',
        'TSLA': 'Tesla Inc.',
        'AMZN': 'Amazon.com Inc.',
        'META': 'Meta Platforms',
        'NVDA': 'NVIDIA Corp.',
        'NFLX': 'Netflix Inc.'
    };
    return companies[symbol] || 'Unknown Company';
}

function formatVolume(volume) {
    if (volume >= 1000000) {
        return (volume / 1000000).toFixed(1) + 'M';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(1) + 'K';
    }
    return volume.toString();
}

function animateRefreshButton() {
    const refreshBtn = document.getElementById('refresh-chart');
    refreshBtn.style.transform = 'rotate(360deg)';
    setTimeout(() => {
        refreshBtn.style.transform = 'rotate(0deg)';
    }, 500);
}

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const mobileBtn = document.getElementById('mobile-menu');
    
    navLinks.classList.toggle('mobile-active');
    mobileBtn.classList.toggle('active');
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =========================================================================
// ==  CORE APPLICATION LOGIC  ==============================================
// =========================================================================

function initializeChart() {
    const ctx = document.getElementById('stock-chart');
    if (!ctx) {
        console.error('Chart canvas not found!');
        return;
    }
    
    const context = ctx.getContext('2d');
    if (!context) {
        console.error('Could not get 2D context!');
        return;
    }
    
    console.log('Initializing chart with data:', { timeLabels, priceData });
    
    stockChart = new Chart(context, {
        type: 'line',
        data: {
            labels: timeLabels,
            datasets: [{
                label: 'Stock Price',
                data: priceData,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#6366f1',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#6366f1',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: { 
                    grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false }, 
                    ticks: { color: 'rgba(255, 255, 255, 0.7)', maxTicksLimit: 8 } 
                },
                y: { 
                    grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false }, 
                    ticks: { 
                        color: 'rgba(255, 255, 255, 0.7)', 
                        callback: function(value) { 
                            return '$' + value.toFixed(2); 
                        } 
                    } 
                }
            },
            interaction: { intersect: false, mode: 'index' },
            animation: { duration: 750, easing: 'easeInOutQuart' }
        }
    });
    
    console.log('Chart initialized successfully');
}

function updatePriceDisplay(data) {
    document.getElementById('chart-title').textContent = `${currentSymbol} - ${getCompanyName(currentSymbol)}`;
    document.getElementById('current-price').textContent = `$${data.price.toFixed(2)}`;
    const changeElement = document.getElementById('price-change');
    changeElement.textContent = `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%`;
    changeElement.className = `price-change ${data.change >= 0 ? 'positive' : 'negative'}`;
}

function updateChartStats(data) {
    document.getElementById('volume').textContent = formatVolume(data.volume);
    document.getElementById('high-low').textContent = `$${data.high.toFixed(0)}/$${data.low.toFixed(0)}`;
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
}

function selectStock(symbol) {
    currentSymbol = symbol;
    document.getElementById('stock-search').value = symbol;
    document.getElementById('search-suggestions').style.display = 'none';
    priceData = [];
    timeLabels = [];
    document.getElementById('chart-title').textContent = `${symbol} - Loading...`;
    updateStockData();
    showToast(`Switched to ${symbol}`, 'success');
}

function handleSearchInput(e) {
    const query = e.target.value.toLowerCase();
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (query.length > 0) {
        const filteredSuggestions = stockSuggestions.filter(stock => stock.toLowerCase().includes(query)).slice(0, 5);
        if (filteredSuggestions.length > 0) {
            suggestionsContainer.innerHTML = filteredSuggestions.map(stock => `<div class="suggestion-item" onclick="selectStock('${stock}')">${stock}</div>`).join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    } else {
        suggestionsContainer.style.display = 'none';
    }
}

function handleSearchKeypress(e) {
    if (e.key === 'Enter') handleSearch();
}

function handleSearch() {
    const searchInput = document.getElementById('stock-search');
    const symbol = searchInput.value.trim().toUpperCase();
    if (symbol && symbol !== currentSymbol) selectStock(symbol);
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.querySelector('.theme-icon').textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    showToast(`Switched to ${currentTheme} theme`, 'success');
}

function toggleMarketStatus() {
    isMarketOpen = !isMarketOpen;
    const banner = document.getElementById('market-banner');
    const toggleText = document.getElementById('toggle-text');
    if (isMarketOpen) {
        banner.classList.remove('losers');
        toggleText.textContent = 'TOP GAINERS';
    } else {
        banner.classList.add('losers');
        toggleText.textContent = 'TOP LOSERS';
    }
}

function addToWatchlist(symbol) {
    showToast(`${symbol} added to watchlist`, 'success');
}

function shareStock(symbol) {
    if (navigator.share) {
        navigator.share({ 
            title: `${symbol} Stock Data`, 
            text: `Check out ${symbol} on ARTHANETRA - Professional Stock Tracker`, 
            url: window.location.href 
        });
    } else {
        navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard', 'success');
    }
}

function setAlert(symbol) {
    showToast(`Price alert set for ${symbol}`, 'success');
}

function handleFabAction(action) {
    document.getElementById('fab-menu').classList.remove('active');
    switch (action) {
        case 'add-stock': addToWatchlist(currentSymbol); break;
        case 'share': shareStock(currentSymbol); break;
        case 'alert': setAlert(currentSymbol); break;
    }
}

function loadPopularStocks() {
    const container = document.getElementById('popular-stocks-grid');
    container.innerHTML = popularStocks.map(stock => `
       <div class="stock-card ${stock.change >= 0 ? 'positive-change' : 'negative-change'}" onclick="selectStock('${stock.symbol}')" data-aos="fade-up">
        <div class="stock-header">
            <div><div class="stock-symbol">${stock.symbol}</div><div class="stock-name">${stock.name}</div></div>
            <div class="stock-price">$${stock.price.toFixed(2)}</div>
        </div>
        <div class="stock-change ${stock.change >= 0 ? 'positive' : 'negative'}">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%</div>
    </div>`).join('');
}

function loadPortfolioData() {
    const tbody = document.getElementById('portfolio-tbody');
    const portfolioData = [
        { symbol: 'AAPL', company: 'Apple Inc.', price: 150.00, change: 2.5, marketCap: '2.4T', volume: '45.2M' },
        { symbol: 'GOOGL', company: 'Alphabet Inc.', price: 2800.00, change: -1.2, marketCap: '1.8T', volume: '23.1M' },
        { symbol: 'MSFT', company: 'Microsoft Corp.', price: 300.00, change: 1.8, marketCap: '2.2T', volume: '32.5M' },
        { symbol: 'TSLA', company: 'Tesla Inc.', price: 800.00, change: 3.2, marketCap: '800B', volume: '28.9M' }
    ];
    tbody.innerHTML = portfolioData.map(stock => `
        <tr onclick="selectStock('${stock.symbol}')" style="cursor: pointer;">
            <td><div><div style="font-weight: 600; color: var(--text-primary);">${stock.company}</div><div style="font-size: 0.9rem; color: var(--text-muted);">${stock.symbol}</div></div></td>
            <td style="font-weight: 600; color: var(--text-primary);">${stock.symbol}</td>
            <td style="font-weight: 600; font-family: 'Space Grotesk', monospace;">$${stock.price.toFixed(2)}</td>
            <td><span class="price-change ${stock.change >= 0 ? 'positive' : 'negative'}">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%</span></td>
            <td style="font-weight: 500;">${stock.marketCap}</td>
            <td style="color: var(--text-muted);">${stock.volume}</td>
            <td><button class="category-btn" onclick="event.stopPropagation(); addToWatchlist('${stock.symbol}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">⭐ Watch</button></td>
        </tr>`).join('');
}

function initializeMarketTime() {
    function updateMarketTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            timeZone: 'America/New_York', 
            hour12: true, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        document.getElementById('market-time').textContent = `NYSE: ${timeString}`;
    }
    updateMarketTime();
    setInterval(updateMarketTime, 1000);
}

function startRealTimeUpdates() {
    refreshInterval = setInterval(() => { 
        updateStockData(); 
    }, 30000); // Update every 30 seconds to respect API limits
    setInterval(toggleMarketStatus, 10000);
}

// Force chart redraw
function redrawChart() {
    if (stockChart) {
        stockChart.resize();
        stockChart.render();
        console.log('Chart redrawn');
    }
}

// Check chart visibility
function checkChartVisibility() {
    const chartContainer = document.querySelector('.chart-wrapper');
    const chartCanvas = document.getElementById('stock-chart');
    
    if (chartContainer) {
        console.log('Chart container dimensions:', {
            width: chartContainer.offsetWidth,
            height: chartContainer.offsetHeight,
            display: window.getComputedStyle(chartContainer).display,
            visibility: window.getComputedStyle(chartContainer).visibility
        });
    }
    
    if (chartCanvas) {
        console.log('Chart canvas dimensions:', {
            width: chartCanvas.offsetWidth,
            height: chartCanvas.offsetHeight,
            display: window.getComputedStyle(chartCanvas).display,
            visibility: window.getComputedStyle(chartCanvas).visibility
        });
    }
}

function initializeEventListeners() {
    const debouncedSearch = debounce(handleSearchInput, 300);
    document.getElementById('stock-search').addEventListener('input', debouncedSearch);
    document.getElementById('stock-search').addEventListener('keypress', handleSearchKeypress);
    document.getElementById('search-btn').addEventListener('click', handleSearch);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('market-toggle').addEventListener('click', toggleMarketStatus);
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newTimeRange = e.target.dataset.range;
            
            // Update active button
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update global time range
            currentTimeRange = newTimeRange;
            
            // Fetch new data for the selected time range
            updateStockData();
            
            showToast(`Loading ${newTimeRange} data...`, 'info');
        });
    });
    // Refresh chart button (only add if it exists)
    const refreshBtn = document.getElementById('refresh-chart');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            updateStockData();
            animateRefreshButton();
            showToast('Chart refreshed', 'success');
        });
    }
    // Test API button (only add if it exists)
    const testApiBtn = document.getElementById('test-api');
    if (testApiBtn) {
        testApiBtn.addEventListener('click', () => {
            testAPI();
            showToast('Testing API connection...', 'info');
        });
    }
    
    // Add chart debugging
    document.addEventListener('keydown', (e) => {
        if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            checkChartVisibility();
            redrawChart();
            showToast('Chart debug info logged to console', 'info');
        }
    });
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            showToast(`Filtering by ${category}`, 'success');
        });
    });
    // FAB menu (only add if it exists)
    const mainFab = document.getElementById('main-fab');
    if (mainFab) {
        mainFab.addEventListener('click', () => { 
            const fabMenu = document.getElementById('fab-menu');
            if (fabMenu) fabMenu.classList.toggle('active'); 
        });
    }
    
    // Sub FAB buttons (only add if they exist)
    const subFabs = document.querySelectorAll('.sub-fab');
    if (subFabs.length > 0) {
        subFabs.forEach(fab => {
            fab.addEventListener('click', (e) => {
                const action = e.target.closest('.sub-fab').dataset.action;
                handleFabAction(action);
            });
        });
    }
    
    // Mobile menu (only add if it exists)
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.addEventListener('click', toggleMobileMenu);
    }
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            document.getElementById('search-suggestions').style.display = 'none';
        }
    });
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            document.getElementById('stock-search').focus();
        }
        if (e.key === 'Escape') {
            document.getElementById('search-suggestions').style.display = 'none';
            document.getElementById('stock-search').blur();
        }
        if (e.key === 'r' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            updateStockData();
            animateRefreshButton();
            showToast('Chart refreshed', 'success');
        }
    });
    window.addEventListener('beforeunload', () => { if (refreshInterval) clearInterval(refreshInterval); });
    window.addEventListener('error', (e) => {
        console.error('Application error:', e.error);
        showToast('An error occurred. Please refresh the page.', 'error');
    });
}

// =========================================================================
// ==  APPLICATION INITIALIZATION  ==========================================
// =========================================================================
document.addEventListener('DOMContentLoaded', function() {
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100
    });
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 1500);
    
    // Initialize with a slight delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Initializing application...');
        initializeChart();
        initializeEventListeners();
        initializeMarketTime();
        loadPopularStocks();
        loadPortfolioData();
        startRealTimeUpdates();
        updateStockData();
        
        // Check chart after initialization
        setTimeout(() => {
            checkChartVisibility();
        }, 1000);
    }, 500);
});
