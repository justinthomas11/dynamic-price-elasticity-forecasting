# Dynamic Price Elasticity and Demand Forecasting

This project explores how customer price sensitivity (elasticity) changes dynamically over time instead of remaining constant. Using the Rossmann retail dataset, the system models regime-dependent demand behavior across promotions, holidays, and competitive environments.

Rather than focusing only on sales prediction, the project introduces dynamic elasticity estimation using rolling features, regime segmentation, and time-aware modeling to capture how demand responds differently under varying market conditions.

The pipeline includes data cleaning, exploratory analysis, feature engineering, rolling trend extraction, regime detection, elasticity modeling, and demand forecasting. The goal is to bridge academic research ideas with practical retail pricing intelligence, making the project suitable both for industry use cases and conference publication.

**Key Objectives:**
- Estimate time-varying price elasticity instead of static coefficients.
- Detect behavioral regimes in retail demand.
- Engineer rolling and lag features for stability and interpretability.
- Forecast demand using regime-aware models.
- Provide actionable insights for pricing and promotion strategies.

---

## Dataset

**Source:** [Rossmann Store Sales — Kaggle](https://www.kaggle.com/competitions/rossmann-store-sales)

The dataset contains historical daily sales data for 1,115 Rossmann drug stores across Germany.

| File | Description |
|---|---|
| `train.csv` | Daily sales records per store (2013–2015) |
| `store.csv` | Store-level metadata (type, competition, promotions) |

**Key features used:**
- `Sales` — daily revenue per store (target variable)
- `Customers` — daily footfall
- `Promo` / `Promo2` — promotional activity flags
- `CompetitionDistance` — distance to nearest competitor
- `StateHoliday` / `SchoolHoliday` — holiday indicators
- `StoreType` / `Assortment` — store category metadata

**Dataset size after preprocessing:** 417,049 records × 27 features

---

## Project Structure

```
├── data/
│   ├── raw/                        # Original Kaggle files
│   └── processed/                  # Cleaned and feature-engineered files
├── notebooks/
│   ├── 01_data_cleaning.ipynb
│   ├── 02_eda.ipynb
│   ├── 03_feature_engineering.ipynb
│   ├── 04_regime_detection.ipynb
│   ├── 05_elasticity_estimation.ipynb
│   ├── 06_price_simulation_and_optimization.ipynb
│   └── 07_forecasting.ipynb
├── outputs/
│   ├── tables/                     # CSV outputs (elasticity, simulation results)
│   └── figures/                    # Saved plots and charts
├── requirements.txt
└── README.md
```

---

## Pipeline Overview

The project follows a 7-stage modular pipeline:

### Module 1 — Data Cleaning
- Merged `train.csv` and `store.csv`
- Handled missing values in `CompetitionDistance`, `Promo2` fields
- Removed closed store days (`Open = 0`) and zero-sales records
- Standardized date features (day, month, year, week of year)

### Module 2 — Exploratory Data Analysis
- Sales distribution analysis across store types and assortments
- Promotion and holiday impact on sales
- Correlation analysis between price proxy, customers, and sales
- Seasonal trend identification

### Module 3 — Feature Engineering
- Created `price_proxy` (Sales / Customers) as a price signal
- Engineered rolling window features (7-day, 14-day, 30-day)
- Added lag features for sales and customers
- Log-transformed sales (`log_sales`) for regression stability

### Module 4 — Regime Detection
- Computed rolling trend slope and demand volatility per store
- Classified each record into one of four regimes:
  - **Growth** — upward trend, low volatility (~25%)
  - **Stable** — flat trend, low volatility (~38%)
  - **Decline** — downward trend, low volatility (~25%)
  - **Volatile** — high volatility regardless of trend (~12%)
- Output: 417,049 records labeled with regime tags

### Module 5 — Elasticity Estimation
- Applied log-log regression per regime to estimate price elasticity (β)

| Regime   | β (Elasticity) | R²    | Observations |
|----------|----------------|-------|--------------|
| Growth   | -0.041573      | 0.533 | 104,262      |
| Stable   | -0.036730      | 0.493 | 159,803      |
| Decline  | -0.067146      | 0.536 | 104,262      |
| Volatile | -0.101426      | 0.603 | 48,722       |

- All regimes show **highly inelastic demand** — Volatile regime is most price-sensitive

### Module 6 — Demand Forecasting
- Trained and compared three models on `log_sales`

| Model              | MAE      | RMSE     | R²       |
|--------------------|----------|----------|----------|
| Linear Regression  | 0.156519 | 0.203382 | 0.727041 |
| Ridge Regression   | 0.156517 | 0.203381 | 0.727042 |
| **Random Forest**  | **0.123932** | **0.165536** | **0.819175** |

- Random Forest outperforms baseline by **20.8% MAE**, **18.6% RMSE**, **12.7% R²**

### Module 7 — Price Simulation & Revenue Optimization
- Simulated demand and revenue across 5 price change scenarios using regime elasticities

| Price Change | Avg Price | Avg Sales | Avg Revenue |
|--------------|-----------|-----------|-------------|
| -10%         | 0.8397    | 6,593.76  | 5,459.61    |
| -5%          | 0.8864    | 6,576.98  | 5,748.31    |
| 0% (baseline)| 0.9330    | 6,560.20  | 6,035.47    |
| +5%          | 0.9797    | 6,543.42  | 6,321.09    |
| **+10%**     | **1.0263**| **6,526.65** | **6,605.17** |

- **Optimal Strategy:** +10% price increase → avg revenue rises from 6,035 → 6,605 **(+9.4% uplift)**
- All regimes show monotonically increasing revenue with price, confirming inelastic demand

---

## Key Results

| Metric | Value |
|---|---|
| Total records processed | 417,049 |
| Regimes detected | 4 (Growth, Stable, Decline, Volatile) |
| Best forecasting model | Random Forest (R² = 0.8192) |
| MAE improvement over baseline | 20.8% |
| Optimal price strategy | +10% increase |
| Revenue uplift from optimization | +9.4% |

---

## How to Run

**1. Clone the repository**
```bash
git clone https://github.com/your-username/dynamic-price-elasticity.git
cd dynamic-price-elasticity
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Download the dataset**

Download from [Kaggle](https://www.kaggle.com/competitions/rossmann-store-sales) and place files in `data/raw/`:
```
data/raw/train.csv
data/raw/store.csv
```

**4. Run notebooks in order**
```
01_data_cleaning.ipynb
02_eda.ipynb
03_feature_engineering.ipynb
04_regime_detection.ipynb
05_elasticity_estimation.ipynb
06_price_simulation_and_optimization.ipynb
07_forecasting.ipynb
```

---

## Dependencies

```
pandas
numpy
matplotlib
seaborn
scikit-learn
scipy
jupyter
```

---

## Research Context

This project is structured for potential conference publication. It addresses a gap in retail analytics literature — the lack of a unified framework that combines:
- Regime detection
- Regime-conditioned elasticity estimation
- Regime-aware demand forecasting
- Counterfactual revenue optimization

The dual-factor regime structure (trend × volatility) is a novel contribution not commonly found in existing retail forecasting pipelines.


