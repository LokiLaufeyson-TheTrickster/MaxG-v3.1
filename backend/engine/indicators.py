import numpy as np

def calculate_rsi(prices, period=14):
    deltas = np.diff(prices)
    seed = deltas[:period+1]
    up = seed[seed >= 0].sum() / period
    down = -seed[seed < 0].sum() / period
    rs = up / down if down != 0 else 0
    rsi = np.zeros_like(prices)
    rsi[:period] = 100. - 100. / (1. + rs)

    for i in range(period, len(prices)):
        delta = deltas[i - 1]
        if delta > 0:
            upval = delta
            downval = 0.
        else:
            upval = 0.
            downval = -delta

        up = (up * (period - 1) + upval) / period
        down = (down * (period - 1) + downval) / period
        rs = up / down if down != 0 else 0
        rsi[i] = 100. - 100. / (1. + rs)
    return rsi

def calculate_vwap(candles):
    """
    VWAP = Sum(Typical Price * Volume) / Sum(Volume)
    Typical Price = (H + L + C) / 3
    """
    tp_sum = 0
    vol_sum = 0
    vwaps = []
    
    # In Index backtest, we don't have real volume, so we use a proxy (Constant or based on OHLC range)
    # Realistically for Nifty backtest we use a synthetic volume or fetch it.
    # We will use (High - Low) as a proxy for 'Volume-like' intensity if real volume is missing.
    for c in candles:
        tp = (c[2] + c[3] + c[4]) / 3
        vol = max(1, abs(c[2] - c[3])) 
        tp_sum += (tp * vol)
        vol_sum += vol
        vwaps.append(tp_sum / vol_sum)
    return np.array(vwaps)

def calculate_adx(high, low, close, period=14):
    plus_dm = np.where((high[1:] - high[:-1]) > (low[:-1] - low[1:]), np.maximum(high[1:] - high[:-1], 0), 0)
    minus_dm = np.where((low[:-1] - low[1:]) > (high[1:] - high[:-1]), np.maximum(low[:-1] - low[1:], 0), 0)
    
    tr = np.maximum(high[1:] - low[1:], 
                    np.maximum(abs(high[1:] - close[:-1]), abs(low[1:] - close[:-1])))
    
    def smooth(arr):
        res = np.zeros_like(arr)
        res[period-1] = arr[:period].sum()
        for i in range(period, len(arr)):
            res[i] = (res[i-1] * (period-1) + arr[i]) / period
        return res

    str_res = smooth(tr)
    plus_di = 100 * smooth(plus_dm) / np.where(str_res == 0, 1, str_res)
    minus_di = 100 * smooth(minus_dm) / np.where(str_res == 0, 1, str_res)
    
    dx = 100 * abs(plus_di - minus_di) / np.where((plus_di + minus_di) == 0, 1, (plus_di + minus_di))
    adx = smooth(dx)
    return np.pad(adx, (1, 0), 'constant')
