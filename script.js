// =========================================================================
// ==  GLOBAL VARIABLES & CONFIG  ===========================================
// =========================================================================
let stockChart;
let currentSymbol = 'AAPL';
let currentTimeRange = '1D';
let portfolioData = [];
let moreMenuTimeout;

// --------------------
// API CONFIGURATION
// --------------------
const API_CONFIG = {
    twelveData: {
        key: '2783d065d79f49e587d6b01bf15245e6',
        baseUrl: 'https://api.twelvedata.com',
        enabled: true
    }
};

// --------------------
// STATIC DATA (used for features and as a fallback)
// --------------------
const stockSuggestions = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX', 'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'ADBE', 'CRM', 'NFLX', 'CMCSA', 'PEP', 'ABT', 'COST', 'TMO', 'AVGO', 'ACN', 'TCS', 'RELIANCE', 'HDFCBANK', 'INFY'];
const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 150.00, change: 2.5, sector: 'Technology', exchange: 'nse', marketCap: 2400 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 2800.00, change: -1.2, sector: 'Technology', exchange: 'nse', marketCap: 1800 },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 300.00, change: 1.8, sector: 'Technology', exchange: 'nse', marketCap: 2200 },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 800.00, change: 3.2, sector: 'Automobile', exchange: 'nse', marketCap: 800 },
    { symbol: 'TCS', name: 'Tata Consultancy', price: 3200.00, change: -0.5, sector: 'Technology', exchange: 'bse', marketCap: 150 },
    { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2500.00, change: 2.1, sector: 'Conglomerate', exchange: 'bse', marketCap: 200 },
    { symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1500.00, change: 4.5, sector: 'Finance', exchange: 'nse', marketCap: 100 },
    { symbol: 'INFY', name: 'Infosys', price: 1400.00, change: -2.3, sector: 'Technology', exchange: 'bse', marketCap: 80 }
];

// =========================================================================
// ==  API & DATA FETCHING (Restored) =======================================
// =========================================================================

/**
 * Fetches real-time quote data for a given stock symbol.
 * @param {string} symbol The stock symbol (e.g., AAPL).
 * @returns {Promise<object>} A promise that resolves to the stock data object.
 */
async function fetchStockData(symbol) {
    if (!API_CONFIG.twelveData.enabled || API_CONFIG.twelveData.key === '2783d065d79f49e587d6b01bf15245e6') {
        throw new Error('API not configured. Please add your API key.');
    }
    const url = `${API_CONFIG.twelveData.baseUrl}/quote?symbol=${symbol}&apikey=${API_CONFIG.twelveData.key}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    const data = await response.json();
    if (data.status === 'error') throw new Error(data.message);
    return {
        price: parseFloat(data.close),
        change: parseFloat(data.percent_change),
        volume: parseInt(data.volume),
        high: parseFloat(data.high),
        low: parseFloat(data.low),
    };
}

/**
 * Fetches historical time series data for a given stock symbol and range.
 * @param {string} symbol The stock symbol.
 * @param {string} timeRange The time range ('1D', '1W', '1M', '1Y').
 * @returns {Promise<Array>} A promise that resolves to an array of historical data points.
 */
async function fetchHistoricalData(symbol, timeRange) {


    if (!API_CONFIG.twelveData.enabled || API_CONFIG.twelveData.key === '2783d065d79f49e587d6b01bf15245e6') {
        // Return mock data when API is not configured
        return generateMockHistoricalData(timeRange); // <-- Pass the timeRange parameter here
    }
    
    const intervalMap = { 
        '1D': '5min', 
        '1W': '30min', 
        '1M': '1day', 
        '1Y': '1week' 
    };
    
    const outputSizeMap = {
        '1D': '78',    // 5-min intervals for 1 day
        '1W': '112',   // 30-min intervals for 1 week
        '1M': '30',    // Daily intervals for 1 month
        '1Y': '52'     // Weekly intervals for 1 year
    };
    
    const url = `${API_CONFIG.twelveData.baseUrl}/time_series?symbol=${symbol}&interval=${intervalMap[timeRange]}&outputsize=${outputSizeMap[timeRange]}&apikey=${API_CONFIG.twelveData.key}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
        const data = await response.json();
        if (data.status === 'error' || !data.values) throw new Error(data.message || 'No historical data available.');
        return data.values.reverse().map(item => ({
            time: item.datetime,
            price: parseFloat(item.close)
        }));
    } catch (error) {
        console.warn('API call failed, using mock data:', error);
        return generateMockHistoricalData(timeRange); // <-- And here as fallback
    }
    
}

/**
 * Main function to update all stock information on the page.
 */
async function updatePageData() {
    console.log('updatePageData called for:', currentSymbol, currentTimeRange); // Debug line
    
    try {
        // For now, just get historical data and skip the quote API
        const history = await fetchHistoricalData(currentSymbol, currentTimeRange);
        
        // Update chart first
        updateChartDisplay(history);
        
        // Update other UI elements with static data
        const stock = popularStocks.find(s => s.symbol === currentSymbol) || popularStocks[0];
        document.getElementById('current-price').textContent = `$${stock.price.toFixed(2)}`;
        const priceChangeEl = document.getElementById('price-change');
        priceChangeEl.textContent = `${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%`;
        priceChangeEl.className = `price-change ${stock.change >= 0 ? 'positive' : 'negative'}`;
        
        document.getElementById('volume').textContent = `${(Math.random() * 50).toFixed(1)}M`;
        document.getElementById('high-low').textContent = `$${(stock.price + 5).toFixed(0)}/$${(stock.price - 5).toFixed(0)}`;
        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
        document.getElementById('chart-title').textContent = `${currentSymbol} - ${stock.name}`;

    } catch (error) {
        console.error("Failed to update page data:", error);
        showToast(error.message, 'error');
    }
}


// =========================================================================
// ==  CHARTING & UI  =======================================================
// =========================================================================

/**
 * Checks if the market is currently open based on US market hours (NYSE/NASDAQ)
 * Market hours: 9:30 AM - 4:00 PM ET, Monday-Friday
 * @returns {boolean} True if market is open, false if closed
 */
function isMarketOpen() {
    const now = new Date();
    
    // Convert to ET (Eastern Time)
    const etTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    // Check if it's a weekday (0 = Sunday, 6 = Saturday)
    const dayOfWeek = etTime.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return false;
    }
    
    // Check if it's within market hours (9:30 AM - 4:00 PM ET)
    const hours = etTime.getHours();
    const minutes = etTime.getMinutes();
    const currentTime = hours * 60 + minutes; // Convert to minutes
    
    const marketOpen = 9 * 60 + 30; // 9:30 AM in minutes
    const marketClose = 16 * 60;    // 4:00 PM in minutes
    
    return currentTime >= marketOpen && currentTime <= marketClose;
}

/**
 * Updates the market status display in the navigation bar
 */
function updateMarketStatus() {
    const statusText = document.getElementById('market-status-text');
    const statusDot = document.querySelector('.status-dot');
    
    if (isMarketOpen()) {
        statusText.textContent = 'Market Open';
        statusDot.style.backgroundColor = 'var(--success)';
        statusDot.style.animation = 'pulse 2s infinite';
    } else {
        statusText.textContent = 'Market Closed';
        statusDot.style.backgroundColor = 'var(--danger)';
        statusDot.style.animation = 'none';
    }
}

/**
 * Updates the market time display
 */
function updateMarketTime() {
    const marketTimeEl = document.getElementById('market-time');
    const etTime = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    marketTimeEl.textContent = `ET ${etTime}`;
}


/**
 * Initializes the Chart.js instance.
 */
function initializeChart() {
    const ctx = document.getElementById('stock-chart').getContext('2d');

    // Get initial colors from CSS variables
    const initialTickColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();
    const initialGridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();

    stockChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ data: [] }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', // Dark background
                    titleColor: '#f9fafb', // Light title text
                    bodyColor: '#d1d5db', // Light body text
                    borderColor: '#374151', // Dark border
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return `Price: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: initialGridColor },
                    ticks: { color: initialTickColor }
                },
                y: {
                    grid: { color: initialGridColor },
                    ticks: { color: initialTickColor, callback: value => '$' + value.toFixed(2) }
                }
            }
        }
    });
}

/**
 * Updates the chart with new data.
 * @param {Array} history Array of historical data points {time, price}.
 */
function updateChartDisplay(history) {
    if (!stockChart || !history || history.length === 0) return;

    // FIX: Ensure axes rescale automatically by removing any fixed min/max
    delete stockChart.options.scales.y.min;
    delete stockChart.options.scales.y.max;

    // Format labels based on current time range
    const labels = history.map(d => {
        const date = new Date(d.time);
        switch (currentTimeRange) {
            case '1D':
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            case '1W':
                return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
            case '1M':
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
            case '1Y':
                return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
            default:
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
    });

    const dataPoints = history.map(d => d.price);
    const isPositive = dataPoints.length > 1 ? dataPoints[dataPoints.length - 1] >= dataPoints[0] : true;

    stockChart.data.labels = labels;
    stockChart.data.datasets[0] = {
        data: dataPoints,
        borderColor: isPositive ? 'var(--success)' : 'var(--danger)',
        backgroundColor: isPositive ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: isPositive ? 'var(--success)' : 'var(--danger)',
        pointHoverBorderColor: 'var(--secondary-bg)'
    };

     console.log('Chart updated with', dataPoints.length, 'points');
    
    // Use 'active' animation for smoother transitions
    stockChart.update('active');
}

/**
 * Generates mock historical data for different time ranges
 * @param {string} timeRange The time range ('1D', '1W', '1M', '1Y').
 * @returns {Array} Array of mock historical data points.
 */
function generateMockHistoricalData(timeRange) {
    console.log('Generating mock data for:', timeRange); // Debug line
    
    const basePrice = 150;
    const dataPoints = [];
    const now = new Date();
    
    let intervalMinutes, dataCount;
    
    switch (timeRange) {
        case '1D':
            intervalMinutes = 5;
            dataCount = 78;
            break;
        case '1W':
            intervalMinutes = 30;
            dataCount = 112;
            break;
        case '1M':
            intervalMinutes = 1440;
            dataCount = 30;
            break;
        case '1Y':
            intervalMinutes = 10080;
            dataCount = 52;
            break;
        default:
            intervalMinutes = 5;
            dataCount = 78;
    }
    
    for (let i = dataCount - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * intervalMinutes * 60000));
        const randomChange = (Math.random() - 0.5) * 4;
        const price = basePrice + (Math.sin(i * 0.1) * 10) + randomChange;
        
        dataPoints.push({
            time: time.toISOString(),
            price: Math.max(price, 100)
        });
    }
    
    console.log('Generated', dataPoints.length, 'data points'); // Debug line
    return dataPoints;
}


/**
 * Displays a temporary notification message.
 * @param {string} message The message to display.
 * @param {string} type The type of message ('success', 'error', 'info').
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.4s ease-out forwards';
        setTimeout(() => { if (container.contains(toast)) { container.removeChild(toast) } }, 400);
    }, 4000);
}

// =========================================================================
// ==  FEATURE LOGIC  =======================================================
// =========================================================================
/**
 * Handles the search input to show live suggestions.
 */
function handleSearchInput() {
    const query = document.getElementById('stock-search').value.toLowerCase();
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (query.length > 0) {
        const filtered = stockSuggestions.filter(s => s.toLowerCase().startsWith(query)).slice(0, 5);
        if (filtered.length > 0) {
            suggestionsContainer.innerHTML = filtered.map(stock => `<div class="suggestion-item" onclick="selectStock('${stock}')">${stock}</div>`).join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    } else {
        suggestionsContainer.style.display = 'none';
    }
}

/**
 * Executes the search when the button is clicked.
 */
function handleSearch() {
    const symbol = document.getElementById('stock-search').value.trim().toUpperCase();
    if (symbol) {
        selectStock(symbol);
    }
}

/**
 * Executes the search when the Enter key is pressed.
 */
function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        handleSearch();
    }
}


/**
 * Sets the current stock and triggers a data refresh.
 */
function selectStock(symbol) {
    currentSymbol = symbol.toUpperCase();
    document.getElementById('stock-search').value = currentSymbol;
    document.getElementById('search-suggestions').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updatePageData();
}

/**
 * Handles the logic for switching the color theme.
 */
function handleThemeToggle(e) {
    e.preventDefault();
    const link = document.getElementById('theme-toggle-link');
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    link.textContent = newTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode';

    // FIX: Update chart axis/grid colors after theme change
    if (stockChart) {
        const newTickColor = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim();
        const newGridColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color').trim();

        stockChart.options.scales.x.ticks.color = newTickColor;
        stockChart.options.scales.y.ticks.color = newTickColor;
        stockChart.options.scales.x.grid.color = newGridColor;
        stockChart.options.scales.y.grid.color = newGridColor;

        stockChart.update();
    }
}

/**
 * Updates the market banner with the top 6 performing stocks.
 */
function updateTopMovers() {
    const moversGrid = document.getElementById('top-movers-grid');
    // Default to showing top 6 gainers
    const sortedStocks = [...popularStocks].sort((a, b) => b.change - a.change);
    moversGrid.innerHTML = sortedStocks.slice(0, 6).map(stock => `
        <div class="mover-card">
            <div class="mover-symbol">${stock.symbol}</div>
            <div class="mover-change positive">${stock.change.toFixed(2)}%</div>
        </div>
    `).join('');
}

/**
 * Exports the currently visible portfolio data to a CSV file.
 */
function exportPortfolioToCSV() {
    const table = document.getElementById('portfolio-table');
    const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText).join(',');
    const rows = Array.from(table.querySelectorAll('tbody tr:not([style*="display: none"])'))
        .map(row => Array.from(row.querySelectorAll('td')).map(td => `"${td.innerText.replace(/"/g, '""')}"`).join(','));

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", "arthanetra_portfolio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Portfolio exported successfully!', 'success');
}

/**
 * Applies the selected filters to the portfolio table.
 */
function applyFilters() {
    const exchange = document.querySelector('input[name="exchange"]:checked').value;
    const sector = document.getElementById('sector-filter').value;
    const marketCap = parseInt(document.getElementById('market-cap-filter').value, 10);

    document.querySelectorAll('#portfolio-tbody tr').forEach(row => {
        const rowData = row.dataset;
        const exchangeMatch = (exchange === 'all') || (rowData.exchange === exchange);
        const sectorMatch = (sector === 'all') || (rowData.sector === sector);
        const marketCapMatch = parseInt(rowData.marketCap, 10) <= marketCap;

        row.style.display = (exchangeMatch && sectorMatch && marketCapMatch) ? '' : 'none';
    });

    document.getElementById('filter-modal').style.display = 'none';
    showToast('Filters applied', 'info');
}

/**
 * Populates the popular stocks grid with data.
 */
function loadPopularStocks() {
    const container = document.getElementById('popular-stocks-grid');
    container.innerHTML = popularStocks.map(stock => {
        const changeClass = stock.change >= 0 ? 'positive' : 'negative';
        return `
            <div class="stock-card ${changeClass}-change" onclick="selectStock('${stock.symbol}')" data-aos="fade-up">
                <div class="stock-header">
                    <div>
                        <div class="stock-symbol">${stock.symbol}</div>
                        <div class="stock-name">${stock.name}</div>
                    </div>
                    <div class="stock-price">$${stock.price.toFixed(2)}</div>
                </div>
                <div class="stock-change ${changeClass}">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%</div>
            </div>
        `;
    }).join('');
}

/**
 * Populates the main portfolio table with data.
 */
function loadPortfolioData() {
    const tbody = document.getElementById('portfolio-tbody');
    portfolioData = popularStocks.map(stock => ({ ...stock, volume: `${(Math.random() * 50).toFixed(1)}M` }));

    tbody.innerHTML = portfolioData.map(stock => `
        <tr data-symbol="${stock.symbol}" data-exchange="${stock.exchange}" data-sector="${stock.sector}" data-market-cap="${stock.marketCap}" onclick="selectStock('${stock.symbol}')" style="cursor:pointer;">
            <td><div><div style="font-weight: 600;">${stock.name}</div><div style="font-size: 0.9rem; color: var(--text-muted);">${stock.symbol}</div></div></td>
            <td>${stock.symbol}</td>
            <td style="font-family: 'Space Grotesk', monospace;">$${stock.price.toFixed(2)}</td>
            <td><span class="price-change ${stock.change >= 0 ? 'positive' : 'negative'}">${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%</span></td>
            <td>$${stock.marketCap}B</td>
            <td>${stock.volume}</td>
        </tr>
    `).join('');
}

/**
 * Sets the current stock and triggers a data refresh.
 * @param {string} symbol The stock symbol to display.
 */
function selectStock(symbol) {
    currentSymbol = symbol;
    document.getElementById('stock-search').value = symbol;
    document.getElementById('search-suggestions').style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    updatePageData();
}

// =========================================================================
// ==  INITIALIZATION  =====================================================
// =========================================================================

/**
 * Sets up all the initial event listeners for the page.
 */
function initializeEventListeners() {
    // Search Bar Logic
    document.getElementById('stock-search').addEventListener('input', handleSearchInput);
    document.getElementById('stock-search').addEventListener('keypress', handleSearchKeypress);
    document.getElementById('search-btn').addEventListener('click', handleSearch);

    // Hide suggestions when clicking outside the search container
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            document.getElementById('search-suggestions').style.display = 'none';
        }
    });

    // "More" Menu Logic
    const moreMenuContainer = document.querySelector('.more-menu-container');
    const moreMenuDropdown = document.getElementById('more-menu-dropdown');
    moreMenuContainer.addEventListener('mouseenter', () => {
        clearTimeout(moreMenuTimeout);
        moreMenuDropdown.style.display = 'block';
    });
    moreMenuContainer.addEventListener('mouseleave', () => {
        moreMenuTimeout = setTimeout(() => {
            moreMenuDropdown.style.display = 'none';
        }, 5000);
    });

    // Theme and other listeners
    document.getElementById('theme-toggle-link').addEventListener('click', handleThemeToggle);
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelector('.time-btn.active').classList.remove('active');
            e.target.classList.add('active');
            currentTimeRange = e.target.dataset.range;
            updatePageData();
        });
    });
    document.getElementById('refresh-chart').addEventListener('click', () => { updatePageData(); });
    document.getElementById('export-btn').addEventListener('click', exportPortfolioToCSV);
    const modal = document.getElementById('filter-modal');
    document.getElementById('filter-btn').addEventListener('click', () => modal.style.display = 'flex');
    document.getElementById('close-modal-btn').addEventListener('click', () => modal.style.display = 'none');
    document.getElementById('apply-filters-btn').addEventListener('click', applyFilters);
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    document.getElementById('market-cap-filter').addEventListener('input', (e) => {
        document.getElementById('market-cap-value').textContent = `$${e.target.value}B or less`;
    });

}

/* Entry point when the DOM is fully loaded.*/

document.addEventListener('DOMContentLoaded', () => {
    AOS.init({ duration: 800, easing: 'ease-in-out', once: true, offset: 50 });
    setTimeout(() => document.getElementById('loading-screen').classList.add('hidden'), 1000);

    setTimeout(() => {
        initializeChart();
        initializeEventListeners();
        loadPortfolioData();
        loadPopularStocks();
        updateTopMovers();
        updatePageData();
        updateMarketStatus();
        updateMarketTime();
        }, 500);
        // Update market time every second, market status every 30 seconds
setInterval(updateMarketTime, 1000);
setInterval(updateMarketStatus, 30000);
});