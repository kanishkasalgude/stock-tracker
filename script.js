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
                x: { grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false }, ticks: { color: 'rgba(255, 255, 255, 0.7)', maxTicksLimit: 8 } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false }, ticks: { color: 'rgba(255, 255, 255, 0.7)', callback: function(value) { return '$' + value.toFixed(2); } } }
            },
            interaction: { intersect: false, mode: 'index' },
            animation: { duration: 750, easing: 'easeInOutQuart' }
        }
    });
}

async function updateStockData() {
    const apiKey = 'd2abah1r01qoad6p0je0d2abah1r01qoad6p0jeg';
    if (apiKey === 'd2abah1r01qoad6p0je0d2abah1r01qoad6p0jeg') {
        showToast('API Key is missing!', 'error');
        console.error("Please add your Finnhub API key to the updateStockData function in script.js");
        return;
    }
    const url = `https://finnhub.io/api/v1/quote?symbol=${currentSymbol}&token=${apiKey}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not successful.');
        const data = await response.json();
        if (data.c === 0 && data.h === 0) {
            showToast(`No data found for symbol: ${currentSymbol}`, 'warning');
            return;
        }
        const realData = {
            price: data.c,
            high: data.h,
            low: data.l,
            change: data.dp,
            changeAmount: data.d,
            volume: data.c * (Math.random() * 10000)
        };
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        priceData.push(realData.price);
        timeLabels.push(timeString);
        if (priceData.length > 30) {
            priceData.shift();
            timeLabels.shift();
        }
        const isPositive = realData.change >= 0;
        const color = isPositive ? '#10b981' : '#ef4444';
        const bgColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        stockChart.data.datasets[0].borderColor = color;
        stockChart.data.datasets[0].backgroundColor = bgColor;
        stockChart.data.datasets[0].pointBackgroundColor = color;
        stockChart.update('none');
        updatePriceDisplay(realData);
        updateChartStats(realData);
    } catch (error) {
        console.error("Failed to fetch real stock data:", error);
        showToast('Error fetching live data. Check console.', 'error');
    }
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
        navigator.share({ title: `${symbol} Stock Data`, text: `Check out ${symbol} on ARTHANETRA - Professional Stock Tracker`, url: window.location.href });
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
        const timeString = now.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        document.getElementById('market-time').textContent = `NYSE: ${timeString}`;
    }
    updateMarketTime();
    setInterval(updateMarketTime, 1000);
}

function startRealTimeUpdates() {
    refreshInterval = setInterval(() => { updateStockData(); }, 3000);
    setInterval(toggleMarketStatus, 10000);
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
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            showToast('Time range updated to ' + e.target.dataset.range, 'success');
        });
    });
    document.getElementById('refresh-chart').addEventListener('click', () => {
        updateStockData();
        animateRefreshButton();
        showToast('Chart refreshed', 'success');
    });
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.target.dataset.category;
            showToast(`Filtering by ${category}`, 'success');
        });
    });
    const mainFab = document.getElementById('main-fab');
    mainFab.addEventListener('click', () => { document.getElementById('fab-menu').classList.toggle('active'); });
    document.querySelectorAll('.sub-fab').forEach(fab => {
        fab.addEventListener('click', (e) => {
            const action = e.target.closest('.sub-fab').dataset.action;
            handleFabAction(action);
        });
    });
    document.getElementById('mobile-menu').addEventListener('click', toggleMobileMenu);
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
    
    initializeChart();
    initializeEventListeners();
    initializeMarketTime();
    loadPopularStocks();
    loadPortfolioData();
    startRealTimeUpdates();
    updateStockData();
});
