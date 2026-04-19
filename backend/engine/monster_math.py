import numpy as np

def calculate_cpr(high, low, close):
    pivot = (high + low + close) / 3
    bc = (high + low) / 2
    tc = (pivot - bc) + pivot
    return pivot, bc, tc

def calculate_ema(prices, period=9):
    ema = np.zeros_like(prices)
    ema[0] = prices[0]
    alpha = 2 / (period + 1)
    for i in range(1, len(prices)):
        ema[i] = (prices[i] - ema[i-1]) * alpha + ema[i-1]
    return ema
