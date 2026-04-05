"""
main.py — Rossmann Price Sensitivity & Demand Forecasting API

Run:  uvicorn main:app --reload
Docs: http://127.0.0.1:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal
from models import get_elasticity, get_forecast, run_simulation

app = FastAPI(title="Rossmann Demand API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────────────────────────────

class Features(BaseModel):
    log_price:    float
    lag_1:        float
    lag_7:        float
    Promo:        int   = Field(..., ge=0, le=1)
    volatility_7: float
    trend_7:      float
    regime: Literal["stable", "growth", "decline", "volatile"]

class ForecastRequest(Features):
    periods: int = Field(1, ge=1, le=90)

class SimulationRequest(Features):
    log_price_min: float
    log_price_max: float
    steps: int = Field(20, ge=2, le=100)


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/elasticity")
def elasticity(req: Features):
    return get_elasticity(req.dict())

@app.post("/forecast")
def forecast(req: ForecastRequest):
    return get_forecast(req.dict())

@app.post("/simulate")
def simulate(req: SimulationRequest):
    return run_simulation(req.dict())