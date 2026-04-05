// Determine Base URL depending on environment
// On local, it connects to standard FastAPI port. 
// On Vercel or deployed, it uses relative path to take advantage of Serverless routing.
const isLocal = window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost" || window.location.protocol === "file:";
const API_BASE = isLocal ? "http://127.0.0.1:8000" : "";

let demandChart = null;

// Initialize Chart.js configuration
function initChart() {
    const ctx = document.getElementById('demandChart').getContext('2d');
    
    // Set global defaults for dark theme
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Inter', sans-serif";

    demandChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Simulated Demand',
                data: [],
                borderColor: '#2dd4bf',
                backgroundColor: 'rgba(45, 212, 191, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#2dd4bf',
                pointHoverBackgroundColor: '#2dd4bf',
                pointHoverBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Soft curve
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 17, 21, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#2dd4bf',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Demand: ' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Log Price',
                        color: '#94a3b8'
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    title: {
                        display: true,
                        text: 'Expected Demand',
                        color: '#94a3b8'
                    }
                }
            }
        }
    });
}

// Fetch helper
async function fetchAPI(endpoint, data) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Fetch Error:", error);
        throw error;
    }
}

// Handle form submission
document.getElementById('simulation-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // UI Loading State
    const btn = e.target.querySelector('button');
    const btnText = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner');
    const statusCard = document.getElementById('card-status').querySelector('.metric-value');
    
    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';
    statusCard.textContent = "Processing...";
    statusCard.style.color = "#fbbf24";

    try {
        // Build Base Features Vector
        const features = {
            log_price: parseFloat(document.getElementById('log_price').value),
            lag_1: parseFloat(document.getElementById('lag_1').value),
            lag_7: parseFloat(document.getElementById('lag_7').value),
            Promo: parseInt(document.getElementById('Promo').value),
            volatility_7: parseFloat(document.getElementById('volatility_7').value),
            trend_7: parseFloat(document.getElementById('trend_7').value),
            regime: document.getElementById('regime').value
        };

        const simulationRange = {
            ...features,
            log_price_min: parseFloat(document.getElementById('log_price_min').value),
            log_price_max: parseFloat(document.getElementById('log_price_max').value),
            steps: 20
        };

        // Run Parallel API calls
        const [elasticityRes, forecastRes, simulationRes] = await Promise.all([
            fetchAPI('/elasticity', features),
            fetchAPI('/forecast', { ...features, periods: 1 }),
            fetchAPI('/simulate', simulationRange)
        ]);

        // Update UI: Metrics
        document.getElementById('card-elasticity').querySelector('.metric-value').textContent = 
            parseFloat(elasticityRes.elasticity).toFixed(3);
        
        document.getElementById('card-forecast').querySelector('.metric-value').textContent = 
            parseFloat(forecastRes.forecast[0]).toFixed(2);

        statusCard.textContent = "Success";
        statusCard.style.color = "#2dd4bf"; // success color

        // Update UI: Chart
        if (simulationRes.log_prices && simulationRes.demands) {
            demandChart.data.labels = simulationRes.log_prices.map(p => p.toFixed(2));
            demandChart.data.datasets[0].data = simulationRes.demands;
            demandChart.update();
        }

    } catch (error) {
        statusCard.textContent = "Error";
        statusCard.style.color = "#ef4444"; // error red
        alert("Failed to connect to the backend. Please make sure the API is running.");
    } finally {
        // Reset UI State
        btn.disabled = false;
        btnText.style.display = 'block';
        spinner.style.display = 'none';
    }
});

// Initialize on App Load
window.addEventListener('DOMContentLoaded', () => {
    initChart();
});
