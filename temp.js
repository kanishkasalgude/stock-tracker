let chart;
        let currentSymbol = 'AAPL';
        let priceData = [];
        let timeLabels = [];
        let refreshInterval;

        // Initialize Chart
        function initChart() {
            const ctx = document.getElementById('stockChart').getContext('2d');
            chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: timeLabels,
                    datasets: [{
                        label: 'Stock Price',
                        data: priceData,
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#10B981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.8)',
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    }
                }
            });
        }

        // Simulate stock data (since we can't use real APIs in this environment)
        function generateStockData(symbol) {
            const basePrice = {
                'AAPL': 150,
                'GOOGL': 2800,
                'MSFT': 300,
                'TSLA': 800,
                'AMZN': 3200,
                'META': 200,
                'NVDA': 450,
                'NFLX': 400
            }[symbol] || 100;

            // Generate realistic price movement
            const lastPrice = priceData.length > 0 ? priceData[priceData.length - 1] : basePrice;
            const change = (Math.random() - 0.5) * 2; // Random change between -1 and 1
            const newPrice = Math.max(lastPrice + change, basePrice * 0.8); // Prevent price from going too low

            return {
                price: newPrice,
                volume: Math.floor(Math.random() * 2000000) + 500000,
                high: newPrice + Math.random() * 5,
                low: newPrice - Math.random() * 5,
                change: ((newPrice - basePrice) / basePrice * 100)
            };
        }

        // Update stock data
        function updateStockData() {
            const data = generateStockData(currentSymbol);
            const now = new Date();
            const timeString = now.toLocaleTimeString();

            // Add new data point
            priceData.push(data.price);
            timeLabels.push(timeString);

            // Keep only last 20 data points
            if (priceData.length > 20) {
                priceData.shift();
                timeLabels.shift();
            }

            // Update chart
            chart.update('none');

            // Update UI elements
            document.getElementById('currentPrice').textContent = '$' + data.price.toFixed(2);
            document.getElementById('changePercent').textContent = (data.change >= 0 ? '+' : '') + data.change.toFixed(2) + '%';
            document.getElementById('changePercent').className = data.change >= 0 ? 'text-2xl font-bold text-green-400' : 'text-2xl font-bold text-red-400';
            document.getElementById('volume').textContent = (data.volume / 1000000).toFixed(1) + 'M';
            document.getElementById('highLow').textContent = '$' + data.high.toFixed(0) + '/$' + data.low.toFixed(0);
            document.getElementById('lastUpdate').textContent = now.toLocaleTimeString();

            // Animate refresh icon
            const refreshIcon = document.getElementById('refreshIcon');
            refreshIcon.style.transform = 'rotate(360deg)';
            refreshIcon.style.transition = 'transform 0.5s ease';
            setTimeout(() => {
                refreshIcon.style.transform = 'rotate(0deg)';
            }, 500);
        }

        // Search for new stock
        function searchStock() {
            const input = document.getElementById('stockSymbol');
            const symbol = input.value.trim().toUpperCase();
            
            if (symbol && symbol !== currentSymbol) {
                currentSymbol = symbol;
                document.getElementById('chartTitle').textContent = symbol;
                
                // Reset data for new stock
                priceData = [];
                timeLabels = [];
                
                // Update immediately
                updateStockData();
                
                // Show success feedback
                input.style.borderColor = '#10B981';
                setTimeout(() => {
                    input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }, 1000);
            }
        }

        // Handle Enter key in search input
        document.getElementById('stockSymbol').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchStock();
            }
        });

        // Initialize everything
        document.addEventListener('DOMContentLoaded', function() {
            initChart();
            updateStockData(); // Initial data load
            
            // Set up auto-refresh every 5 seconds
            refreshInterval = setInterval(updateStockData, 5000);
        });

        // Popular stock symbols for quick access
        const popularStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'META', 'NVDA', 'NFLX'];
        
        // Add quick stock buttons (optional enhancement)
        function addQuickStockButtons() {
            const container = document.querySelector('.glass-effect');
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'flex flex-wrap gap-2 mt-4';
            
            popularStocks.forEach(stock => {
                const button = document.createElement('button');
                button.textContent = stock;
                button.className = 'px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded border border-white/20 transition-all duration-200';
                button.onclick = () => {
                    document.getElementById('stockSymbol').value = stock;
                    searchStock();
                };
                buttonContainer.appendChild(button);
            });
            
            container.appendChild(buttonContainer);
        }

        // Add popular stock buttons after DOM loads
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(addQuickStockButtons, 100);
        });
    </script>
<script>(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'969fc33cb04c47d4',t:'MTc1NDMyODQxNy4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();</script>
