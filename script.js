// Global Variables
let stockChart;
let currentSymbol = 'AAPL';
let currentTheme = 'dark';
let isMarketOpen = true;
let refreshInterval;
let priceData = [];
let timeLabels = [];

// Popular stocks data
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

// Stock suggestions for search
const stockSuggestions = [
    'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX',
    'JPM', 'JNJ', 'V', 'PG', 'UNH', 'HD', 'MA', 'DIS', 'PYPL', 'ADBE',
    'CRM', 'NFLX', 'CMCSA', 'PEP', 'ABT', 'COST', 'TMO', 'AVGO', 'ACN'
];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS animations
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true,
        offset: 100
    });

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 2000);

    // Initialize components
    initializeChart();
    initializeEventListeners();
    initializeMarketTime();
    loadPopularStocks();
    loadPortfolioData();
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Initial data load
    updateStockData();
});

// Chart Initialization
function initializeChart() {
    const ctx = document.getElementById('stock-chart').getContext('2d');
    
    stockChart = new Chart(ctx, {
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
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        maxTicksLimit: 8
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        callback: function(value) {
                            return '$' + value.toFixed(2);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            animation: {
                duration: 750,
                easing: 'easeInOutQuart'
            }
        }
    });
}

// Event Listeners
function initializeEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('stock-search');
    const searchBtn = document.getElementById('search-btn');
    const suggestionsContainer = document.getElementById('search-suggestions');

    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keypress', handleSearchKeypress);
    searchBtn.addEventListener('click', handleSearch);

    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Market toggle
    document.getElementById('market-toggle').addEventListener('click', toggleMarketStatus);

    // Time range buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            // Here you would typically load different time range data
            showToast('Time range updated to ' + e.target.dataset.range, 'success');
        });
    });

    // Refresh button
    document.getElementById('refresh-chart').addEventListener('click', () => {
        updateStockData();
        animateRefreshButton();
        showToast('Chart refreshed', 'success');
    });

    // Category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            showToast(`Filtering by ${category}`, 'success');
            // Here you would filter stocks by category
        });
    });

    // FAB menu
    const mainFab = document.getElementById('main-fab');
    const fabMenu = document.getElementById('fab-menu');
    
    mainFab.addEventListener('click', () => {
        fabMenu.classList.toggle('active');
    });

    // Sub FAB actions
    document.querySelectorAll('.sub-fab').forEach(fab => {
        fab.addEventListener('click', (e) => {
            const action = e.target.closest('.sub-fab').dataset.action;
            handleFabAction(action);
        });
    });

    // Mobile menu
    document.getElementById('mobile-menu').addEventListener('click', toggleMobileMenu);

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

// Search Functionality
function handleSearchInput(e) {
    const query = e.target.value.toLowerCase();
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (query.length > 0) {
        const filteredSuggestions = stockSuggestions.filter(stock => 
            stock.toLowerCase().includes(query)
        ).slice(0, 5);
        
        if (filteredSuggestions.length > 0) {
            suggestionsContainer.innerHTML = filteredSuggestions
                .map(stock => `<div class="suggestion-item" onclick="selectStock('${stock}')">${stock}</div>`)
                .join('');
            suggestionsContainer.style.display = 'block';
        } else {
            suggestionsContainer.style.display = 'none';
        }
    } else {
        suggestionsContainer.style.display = 'none';
    }
}

function handleSearchKeypress(e) {
    if (e.key === 'Enter') {
        handleSearch();
    }
}

function handleSearch() {
    const searchInput = document.getElementById('stock-search');
    const symbol = searchInput.value.trim().toUpperCase();
    
    if (symbol && symbol !== currentSymbol) {
        selectStock(symbol);
    }
}

function selectStock(symbol) {
    currentSymbol = symbol;
    document.getElementById('stock-search').value = symbol;
    document.getElementById('search-suggestions').style.display = 'none';
    
    // Reset chart data
    priceData = [];
    timeLabels = [];
    
    // Update chart title
    document.getElementById('chart-title').textContent = `${symbol} - Loading...`;
    
    // Update data
    updateStockData();
    
    showToast(`Switched to ${symbol}`, 'success');
}

// =========================================================================
// ==  REALTIME STOCK DATA CODE USING FINNHUB API ==========================
// =========================================================================

// Function to fetch REAL stock data from Finnhub API
async function updateStockData() {
    // --- IMPORTANT: PASTE YOUR FINNHUB API KEY HERE ---
    const apiKey = 'd2aaqs9r01qoad6ou38gd2aaqs9r01qoad6ou390'; 
    
    if (apiKey === 'd2aaqs9r01qoad6ou38gd2aaqs9r01qoad6ou390') {
        showToast('API Key is missing!', 'error');
        console.error("Please add your Finnhub API key to the updateStockData function in script.js");
        return; // Stop the function if the API key is not set
    }
    
    const url = `https://finnhub.io/api/v1/quote?symbol=${currentSymbol}&token=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Network response was not successful.');
        }

        const data = await response.json();

        // Check if the API returned valid data
        if (data.c === 0 && data.h === 0) {
             showToast(`No data found for symbol: ${currentSymbol}`, 'warning');
             console.warn(`Finnhub API returned no data for the symbol: ${currentSymbol}. It might be an invalid ticker.`);
             return;
        }

        // --- Data extracted from the API response ---
        const realData = {
            price: data.c, // Current price
            high: data.h,  // High price of the day
            low: data.l,   // Low price of the day
            change: data.dp, // Percent change
            changeAmount: data.d, // Change in price
            volume: data.c * (Math.random() * 10000) // Finnhub free plan doesn't include volume, so we simulate it
        };
        
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });

        // Add new data point for the chart
        priceData.push(realData.price);
        timeLabels.push(timeString);

        // Keep only the last 30 data points for a clean chart
        if (priceData.length > 30) {
            priceData.shift();
            timeLabels.shift();
        }
        
        // Update chart colors based on positive or negative change
        const isPositive = realData.change >= 0;
        const color = isPositive ? '#10b981' : '#ef4444';
        const bgColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

        stockChart.data.datasets[0].borderColor = color;
        stockChart.data.datasets[0].backgroundColor = bgColor;
        stockChart.data.datasets[0].pointBackgroundColor = color;

        // Update the chart and other UI elements with real data
        stockChart.update('none'); 
        updatePriceDisplay(realData);
        updateChartStats(realData);

    } catch (error) {
        console.error("Failed to fetch real stock data:", error);
        showToast('Error fetching live data. Check console.', 'error');
    }
}

function updatePriceDisplay(data) {
    const titleElement = document.getElementById('chart-title');
    const priceElement = document.getElementById('current-price');
    const changeElement = document.getElementById('price-change');

    titleElement.textContent = `${currentSymbol} - ${getCompanyName(currentSymbol)}`;
    priceElement.textContent = `$${data.price.toFixed(2)}`;
    
    const changeText = `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%`;
    changeElement.textContent = changeText;
    changeElement.className = `price-change ${data.change >= 0 ? 'positive' : 'negative'}`;
}

function updateChartStats(data) {
    document.getElementById('volume').textContent = formatVolume(data.volume);
    document.getElementById('high-low').textContent = `$${data.high.toFixed(0)}/$${data.low.toFixed(0)}`;
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
}

// Popular Stocks
function loadPopularStocks() {
    const container = document.getElementById('popular-stocks-grid');
    
    container.innerHTML = popularStocks.map(stock => `
       <div class="stock-card ${stock.change >= 0 ? 'positive-change' : 'negative-change'}" onclick="selectStock('${stock.symbol}')" data-aos="fade-up">
        <div class="stock-header">
            <div>
                <div class="stock-symbol">${stock.symbol}</div>
                <div class="stock-name">${stock.name}</div>
            </div>
            <div class="stock-price">$${stock.price.toFixed(2)}</div>
        </div>
        <div class="stock-change ${stock.change >= 0 ? 'positive' : 'negative'}">
            ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
        </div>
    </div>
`).join('');
}

// Portfolio Data
function loadPortfolioData() {
    const tbody = document.getElementById('portfolio-tbody');
    
    // Sample portfolio data
    const portfolioData = [
        { symbol: 'AAPL', company: 'Apple Inc.', price: 150.00, change: 2.5, marketCap: '2.4T', volume: '45.2M' },
        { symbol: 'GOOGL', company: 'Alphabet Inc.', price: 2800.00, change: -1.2, marketCap: '1.8T', volume: '23.1M' },
        { symbol: 'MSFT', company: 'Microsoft Corp.', price: 300.00, change: 1.8, marketCap: '2.2T', volume: '32.5M' },
        { symbol: 'TSLA', company: 'Tesla Inc.', price: 800.00, change: 3.2, marketCap: '800B', volume: '28.9M' }
    ];

    tbody.innerHTML = portfolioData.map(stock => `
        <tr onclick="selectStock('${stock.symbol}')" style="cursor: pointer;">
            <td>
                <div>
                    <div style="font-weight: 600; color: var(--text-primary);">${stock.company}</div>
                    <div style="font-size: 0.9rem; color: var(--text-muted);">${stock.symbol}</div>
                </div>
            </td>
            <td style="font-weight: 600; color: var(--text-primary);">${stock.symbol}</td>
            <td style="font-weight: 600; font-family: 'Space Grotesk', monospace;">$${stock.price.toFixed(2)}</td>
            <td>
                <span class="price-change ${stock.change >= 0 ? 'positive' : 'negative'}">
                    ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
                </span>
            </td>
            <td style="font-weight: 500;">${stock.marketCap}</td>
            <td style="color: var(--text-muted);">${stock.volume}</td>
            <td>
                <button class="category-btn" onclick="event.stopPropagation(); addToWatchlist('${stock.symbol}')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">
                    ⭐ Watch
                </button>
            </td>
        </tr>
    `).join('');
}

// Utility Functions
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

// Theme Toggle
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    const themeIcon = document.querySelector('.theme-icon');
    themeIcon.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    
    showToast(`Switched to ${currentTheme} theme`, 'success');
}

// Market Status
function toggleMarketStatus() {
    const banner = document.getElementById('market-banner');
    const toggleText = document.getElementById('toggle-text');
    
    isMarketOpen = !isMarketOpen;
    
    if (isMarketOpen) {
        banner.classList.remove('losers');
        toggleText.textContent = 'TOP GAINERS';
    } else {
        banner.classList.add('losers');
        toggleText.textContent = 'TOP LOSERS';
    }
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

// Real-Time Updates
function startRealTimeUpdates() {
    // Update stock data every 3 seconds
    refreshInterval = setInterval(() => {
        updateStockData();
    }, 3000);
    
    // Toggle market status every 10 seconds for demo
    setInterval(toggleMarketStatus, 10000);
}

// FAB Actions
function handleFabAction(action) {
    const fabMenu = document.getElementById('fab-menu');
