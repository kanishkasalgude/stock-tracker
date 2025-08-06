
        // Auto-toggle between Top Gainers and Top Losers
        let isGainers = true;
        const toggleIndicator = document.getElementById('toggle-indicator');
        const marketToggle = document.getElementById('market-toggle');

        function toggleMarketStatus() {
            if (isGainers) {
                toggleIndicator.textContent = 'TOP LOSERS';
                marketToggle.className = 'market-toggle losers';
            } else {
                toggleIndicator.textContent = 'TOP GAINERS';
                marketToggle.className = 'market-toggle gainers';
            }
            isGainers = !isGainers;
        }

        // Toggle every 5 seconds
        setInterval(toggleMarketStatus, 5000);

        // Enhanced interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Search bar interactions
            const searchBar = document.querySelector('.search-bar');
            const searchBtn = document.querySelector('.search-btn');
            
            searchBar.addEventListener('focus', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            searchBar.addEventListener('blur', function() {
                this.style.transform = 'translateY(0)';
            });

            // Search button functionality
            searchBtn.addEventListener('click', function() {
                const searchTerm = searchBar.value.trim();
                if (searchTerm) {
                    console.log('Searching for:', searchTerm);
                    // Add your search logic here
                    
                    // Visual feedback
                    this.style.transform = 'translateY(-3px)';
                    setTimeout(() => {
                        this.style.transform = 'translateY(0)';
                    }, 150);
                } else {
                    // Focus search bar if empty
                    searchBar.focus();
                }
            });

            // Enter key search
            searchBar.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    searchBtn.click();
                }
            });

            // Stock category button interactions
            const categoryButtons = document.querySelectorAll('.stock-category-btn');
            categoryButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    console.log('Selected category:', this.textContent);
                    // Add your redirect/filter logic here
                    
                    // Visual feedback
                    this.style.transform = 'translateY(-3px)';
                    setTimeout(() => {
                        this.style.transform = 'translateY(0)';
                    }, 150);
                });
            });

            // Smooth scroll and enhanced UX
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        });
