"""
models.py — All model logic for the Rossmann Price Sensitivity API.

Regime elasticities (notebook 04 OLS):
  volatile: -0.1014  decline: -0.0671  stable: -0.0367  growth: -0.0416

OLS coefficients (notebook 04 baseline, R²=0.730):
  log_sales = 0.6375 - 0.0528*log_price - 0.0224*lag_1 + 0.0604*lag_7
              + 0.3249*Promo - 0.1127*volatility_7 + 0.8748*trend_7

RandomForest (notebook 05, R²=0.819) loaded from models/forecast_model.pkl if present.
"""

import os
import numpy as np

# ── Constants ────────────────────────────────────────────────────────────────

REGIME_ELASTICITY = {
    "volatile": -0.101426,
    "decline":  -0.067146,
    "stable":   -0.036730,
    "growth":   -0.041573,
}

OLS = {
    "const":        0.6375,
    "log_price":   -0.052809,
    "lag_1":       -0.022400,
    "lag_7":        0.060400,
    "Promo":        0.324900,
    "volatility_7":-0.112700,
    "trend_7":      0.874800,
}

FEATURES = ["log_price", "lag_1", "lag_7", "Promo", "volatility_7", "trend_7"]

# Try to load trained RF model
_rf = None
try:
    import joblib
    _rf = joblib.load(os.path.join("models", "forecast_model.pkl"))
except Exception:
    pass


# ── Helpers ──────────────────────────────────────────────────────────────────

def _ols(d):
    return (OLS["const"] + OLS["log_price"] * d["log_price"]
            + OLS["lag_1"] * d["lag_1"] + OLS["lag_7"] * d["lag_7"]
            + OLS["Promo"] * d["Promo"] + OLS["volatility_7"] * d["volatility_7"]
            + OLS["trend_7"] * d["trend_7"])

def _predict(d):
    if _rf:
        import pandas as pd
        return float(_rf.predict(pd.DataFrame([d])[FEATURES])[0])
    return _ols(d)


# ── Business logic ───────────────────────────────────────────────────────────

def get_elasticity(d):
    elasticity = REGIME_ELASTICITY[d["regime"]]
    log_sales = _ols(d)
    return {
        "elasticity": round(elasticity, 6),
        "predicted_sales": round(float(np.exp(log_sales)), 2),
        "interpretation": (
            f"In the '{d['regime']}' regime, a 1% price increase → "
            f"{abs(elasticity)*100:.2f}% demand decrease."
        ),
    }

def get_forecast(d):
    periods = d["periods"]
    history, log_sales_list, sales_list = [], [], []
    row = {k: d[k] for k in FEATURES}
    for _ in range(periods):
        ls = _predict(row)
        log_sales_list.append(round(ls, 6))
        sales_list.append(round(float(np.exp(ls)), 2))
        history.append(ls)
        row["lag_1"] = ls
        row["lag_7"] = history[-7] if len(history) >= 7 else row["lag_7"]
    return {
        "predicted_log_sales": log_sales_list,
        "predicted_sales": sales_list,
        "model": "RandomForest R²=0.819" if _rf else "OLS fallback R²=0.730",
    }

def run_simulation(d):
    elasticity = REGIME_ELASTICITY[d["regime"]]
    base_sales = float(np.exp(_ols(d)))
    base_price = float(np.exp(d["log_price"]))
    curve, best_rev, best_i = [], -np.inf, 0
    for i, lp in enumerate(np.linspace(d["log_price_min"], d["log_price_max"], d["steps"])):
        price = float(np.exp(lp))
        sales = max(base_sales * (1 + elasticity * (price - base_price) / base_price), 0)
        rev = price * sales
        curve.append({"log_price": round(lp, 4), "price": round(price, 4),
                      "sales": round(sales, 2), "revenue": round(rev, 2)})
        if rev > best_rev:
            best_rev, best_i = rev, i
    opt = curve[best_i]
    return {"optimal_price": opt["price"], "expected_sales": opt["sales"],
            "expected_revenue": opt["revenue"], "curve": curve}