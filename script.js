document.addEventListener('DOMContentLoaded', function() {
    // --- Global Variables & Chart Initialization ---
    let currentSymbol = 'AAPL'; // Default stock symbol
    const searchBar = document.querySelector('.search-bar');
    const searchBtn = document.querySelector('.search-btn');
    const chartTitle = document.getElementById('chart-title');
    const toggleIndicator = document.getElementById('toggle-indicator');
    const marketToggle = document.getElementById('market-toggle');
    let isGainers = true;
    let chartUpdateInterval;

    // Initialize Chart.js
    const ctx = document.getElementById('stockChart').getContext('2d');
    const stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Stock Price',
                data: [],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#cbd5e1' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                y: { ticks: { color: '#cbd5e1', callback: (value) => '$' + value.toFixed(2) }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
            }
        }
    });

    // --- API Function ---
    async function fetchStockPrice(symbol) {
        // ↓↓↓ REPLACE THIS WITH YOUR SECRET FINNHUB API KEY ↓↓↓
        const apiKey = 'd29jpspr01qhoencm0bgd29jpspr01qhoencm0c0';
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`API request failed: ${response.status}`);
            const data = await response.json();
            if (data.c === 0 && data.h === 0) throw new Error(`Invalid symbol or no data: ${symbol}`);
            return data;
        } catch (error) {
            console.error("Finnhub API Error:", error);
            alert(`Could not fetch data for "${symbol}". Please check the symbol.`);
            return null;
        }
    }

    // --- Chart & UI Logic ---
    async function updateData() {
        const data = await fetchStockPrice(currentSymbol);
        if (data !== null) {
            const newPrice = data.c;
            const change = data.d; // Change from previous close
            const changePercent = data.dp; // Percent change

            // Update chart color based on performance
            const chartColor = (change >= 0) ? '#10B981' : '#EF4444';
            stockChart.data.datasets[0].borderColor = chartColor;
            stockChart.data.datasets[0].backgroundColor = (change >= 0) ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            
            // Update chart title and price info
            chartTitle.textContent = `${currentSymbol} - $${newPrice.toFixed(2)}`;
            chartTitle.innerHTML += ` <span style="color: ${chartColor}; font-size: 18px;">(${changePercent.toFixed(2)}%)</span>`;

            // Add new data point to the chart
            stockChart.data.labels.push(new Date().toLocaleTimeString());
            stockChart.data.datasets[0].data.push(newPrice);

            // Keep the chart from getting too crowded
            if (stockChart.data.labels.length > 30) {
                stockChart.data.labels.shift();
                stockChart.data.datasets[0].data.shift();
            }
            stockChart.update('none');
        }
    }
    
    // --- Event Listeners ---
    function searchForStock() {
        const symbol = searchBar.value.trim().toUpperCase();
        if (symbol && symbol !== currentSymbol) {
            currentSymbol = symbol;
            // Clear old chart data and stop the previous interval
            stockChart.data.labels = [];
            stockChart.data.datasets[0].data = [];
            stockChart.update();
            if (chartUpdateInterval) clearInterval(chartUpdateInterval);
            
            // Immediately fetch data and start the new interval
            updateData();
            chartUpdateInterval = setInterval(updateData, 5000);
        }
    }

    searchBtn.addEventListener('click', searchForStock);
    searchBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchForStock();
    });

    // --- Initial Execution ---
    function toggleMarketStatus() {
        isGainers = !isGainers;
        toggleIndicator.textContent = isGainers ? 'TOP GAINERS' : 'TOP LOSERS';
        marketToggle.className = isGainers ? 'market-toggle gainers' : 'market-toggle losers';
    }
    
    updateData(); // Initial data fetch
    chartUpdateInterval = setInterval(updateData, 5000); // Refresh chart every 5 seconds
    setInterval(toggleMarketStatus, 5000); // Toggle banner
});