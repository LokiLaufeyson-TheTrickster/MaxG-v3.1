import numpy as np
import polars as pl

def calculate_gex_adj(oi: float, gamma: float, spot: float, weight: float = 1.0) -> float:
    """
    Adjusted Gamma Exposure (GEX_adj)
    GEX_i^adj = (OI_i * Gamma_i * 100) * S^2 * 0.01 * w_i
    """
    return (oi * gamma * 100) * (spot ** 2) * 0.01 * weight

def calculate_v_norm(delta_gex: float, time_delta: float, gross_gex_strike: float) -> float:
    """Exposure Velocity"""
    if gross_gex_strike == 0: return 0.0
    return ((delta_gex / time_delta) / gross_gex_strike) * 100

def calculate_price_velocity(current_price: float, prev_price: float, time_delta: float = 1.0) -> float:
    """Price Action Velocity (Structural fallback)"""
    if prev_price == 0: return 0.0
    return ((current_price - prev_price) / time_delta) / prev_price * 1000

def get_gamma_flip_zone(g_zero: float, spot: float) -> tuple:
    """
    GFZ = G_zero ± (0.15% * S)
    """
    buffer = 0.0015 * spot
    return (g_zero - buffer, g_zero + buffer)

def check_persistence(v_norm_history: list, threshold: float, periods: int) -> bool:
    """
    Checks if v_norm has been above threshold for consecutive periods
    """
    if len(v_norm_history) < periods:
        return False
    return all(abs(v) > threshold for v in v_norm_history[-periods:])

def calculate_confidence(lag: float, stability: float, distance: float, time_penalty: float) -> float:
    """
    C_final = 100 - (lambda_lag + lambda_stab + lambda_dist + lambda_time)
    """
    # Simplified version for implementation
    score = 100 - (lag + stability + distance + time_penalty)
    return max(0, min(100, score))

def get_w_i(oi_change: float, volume: float) -> float:
    """
    Positioning weight (w_i)
    w_i = 1.0 (Dealer) or 0.5 (Retail/Noisy)
    Based on high volume, low OI change indicator.
    """
    # Heuristic: High volume + Low OI change = Noise (Retail)
    # If OI change / volume ratio is low, it's likely high frequency churn (noisy)
    if volume == 0: return 1.0
    ratio = abs(oi_change) / volume
    return 1.0 if ratio > 0.05 else 0.5

def select_optimal_strike(option_chain: list, spot: float, direction: str, min_prem: float = 60, max_prem: float = 110) -> dict:
    """
    Selects a little OTM strike with premium in [60, 110]
    option_chain: list of dicts {strike_price: float, call_ltp: float, put_ltp: float, ...}
    """
    candidates = []
    for strike in option_chain:
        # Filter by direction (Call/Put) and OTM status
        if direction == 'LONG' and strike['strike_price'] > spot:
            premium = strike['call_ltp']
            if min_prem <= premium <= max_prem:
                strike['selected_premium'] = premium
                strike['type'] = 'CE'
                candidates.append(strike)
        elif direction == 'SHORT' and strike['strike_price'] < spot:
            premium = strike['put_ltp']
            if min_prem <= premium <= max_prem:
                strike['selected_premium'] = premium
                strike['type'] = 'PE'
                candidates.append(strike)
    
    # Return the one closest to middle of range (85)
    if not candidates: return None
    return min(candidates, key=lambda x: abs(x['selected_premium'] - 85))

def calculate_trade_milestones(entry_price: float) -> dict:
    """
    Calculates T1, T2, T3 and initial SL
    """
    return {
        "entry": entry_price,
        "t1": entry_price * 1.25, # 25% Target 1
        "t2": entry_price * 1.50, # 50% Target 2
        "t3": entry_price * 2.00, # 100% Target 3
        "sl": entry_price * 0.85  # 15% Stop Loss
    }
