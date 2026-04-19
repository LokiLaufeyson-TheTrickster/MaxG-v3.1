import time
from collections import deque

class PersistenceMonitor:
    def __init__(self, fast_window=3, slow_window=6, interval=10):
        self.fast_window = fast_window  # 30s at 10s intervals
        self.slow_window = slow_window  # 60s at 10s intervals
        self.interval = interval
        self.v_norm_history = deque(maxlen=max(fast_window, slow_window))
        self.tick_timestamps = deque(maxlen=100)
        self.ma_20_ticks = 0

    def update_ticks(self):
        self.tick_timestamps.append(time.time())
        if len(self.tick_timestamps) > 1:
            # Simple tick frequency calculation
            duration = self.tick_timestamps[-1] - self.tick_timestamps[0]
            count = len(self.tick_timestamps)
            current_freq = count / duration if duration > 0 else 0
            # Update EMA of frequency for liquidity gate (simplified proxy for MA(20))
            self.ma_20_ticks = 0.9 * self.ma_20_ticks + 0.1 * current_freq

    def liquidity_gate_passed(self) -> bool:
        if len(self.tick_timestamps) < 20: return False
        duration = self.tick_timestamps[-1] - self.tick_timestamps[0]
        current_freq = len(self.tick_timestamps) / duration if duration > 0 else 0
        return current_freq > self.ma_20_ticks

    def add_v_norm(self, v_norm: float):
        self.v_norm_history.append(v_norm)

    def check_fast_flow(self, sigma_threshold: float = 2.5) -> bool:
        """3 consecutive 10s intervals"""
        if len(self.v_norm_history) < self.fast_window: return False
        window = list(self.v_norm_history)[-self.fast_window:]
        return all(abs(v) > sigma_threshold for v in window)

    def check_slow_flow(self, sigma_threshold: float = 2.5) -> bool:
        """6 consecutive 10s intervals"""
        if len(self.v_norm_history) < self.slow_window: return False
        window = list(self.v_norm_history)[-self.slow_window:]
        return all(abs(v) > sigma_threshold for v in window)

    def check_regime_persistence(self, spot: float, gfz: tuple) -> str:
        """Confirmed regime shift outside GFZ boundary for 60s"""
        # (This would need historical price data, usually managed in the main loop)
        pass
