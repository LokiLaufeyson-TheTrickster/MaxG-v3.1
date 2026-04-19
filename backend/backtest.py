import os
import pandas as pd
import pyotp
import numpy as np
from datetime import datetime, timedelta
from dotenv import load_dotenv
from growwapi import GrowwAPI
from engine.indicators import calculate_vwap, calculate_rsi, calculate_adx
from engine.monster_math import calculate_ema

load_dotenv()

def get_milestones(entry_price):
    return {"entry": entry_price, "t1": entry_price * 1.30, "t2": entry_price * 1.60, "t3": entry_price * 2.20, "sl": entry_price * 0.85}

class FullFidelityMonsterScalper:
    def __init__(self):
        totp_gen = pyotp.TOTP(os.getenv("GROWW_TOTP_SECRET").replace(" ", "").strip())
        self.session_token = GrowwAPI.get_access_token(api_key=os.getenv("GROWW_TOTP_TOKEN"), totp=totp_gen.now())
        self.groww = GrowwAPI(self.session_token)
        from engine.gatekeeper import GeminiGatekeeper
        self.gatekeeper = GeminiGatekeeper(os.getenv("GOOGLE_API_KEY"))
        self.master_df = pd.read_csv("scratch/nifty_master.csv")
        self.results = []

    def run(self):
        print("--- FULL-FIDELITY MONSTER++ SCALPER: 68-SIGNAL RECONSTRUCTION ---")
        end_date = datetime.now()
        start_date = end_date - timedelta(days=20)
        
        c_res = self.groww.get_historical_candles(exchange="NSE", segment="CASH", groww_symbol="NSE-NIFTY", start_time=start_date.strftime("%Y-%m-%d %H:%M:%S"), end_time=end_date.strftime("%Y-%m-%d %H:%M:%S"), candle_interval="1minute")
        candles = c_res.get('candles', [])
        if not candles: return

        closes = np.array([c[4] for c in candles]); highs = np.array([c[2] for c in candles]); lows = np.array([c[3] for c in candles])
        ema9 = calculate_ema(closes, 9); ema21 = calculate_ema(closes, 21); vwaps = calculate_vwap(candles); adxs = calculate_adx(highs, lows, closes)
        
        signals = []
        last_sig_time = None
        for i in range(25, len(closes)):
            ts = candles[i][0]; dt = datetime.fromisoformat(ts.replace('Z', ''))
            if dt.hour < 9 or (dt.hour == 9 and dt.minute < 45) or dt.hour >= 15: continue
            if last_sig_time and (dt - last_sig_time).total_seconds() < 1200: continue

            id_curr = "CE" if ema9[i] > ema21[i] and closes[i] > vwaps[i] and adxs[i] > 20 else ("PE" if ema9[i] < ema21[i] and closes[i] < vwaps[i] and adxs[i] > 20 else None)
            if id_curr:
                # Dail Filter: Did we touch EMA9 in last 3 mins and are we confirming?
                if id_curr == "CE":
                    if any(lows[j] <= ema9[j] for j in range(i-3, i)) and closes[i] > candles[i][1] and closes[i] > ema9[i]:
                        signals.append({"timestamp": ts, "price": closes[i], "direction": "CE", "idx": i, "code_conf": round(min(1.0, adxs[i]/40)*100, 1)})
                        last_sig_time = dt
                else: # PE
                    if any(highs[j] >= ema9[j] for j in range(i-3, i)) and closes[i] < candles[i][1] and closes[i] < ema9[i]:
                        signals.append({"timestamp": ts, "price": closes[i], "direction": "PE", "idx": i, "code_conf": round(min(1.0, adxs[i]/40)*100, 1)})
                        last_sig_time = dt

        print(f"Auditing and Simulating {len(signals)} signals...")
        ai_data = self.gatekeeper.batch_audit_trades(signals)
        candle_cache = {}
        for idx, sig in enumerate(signals):
            ai_audit = ai_data[idx] if idx < len(ai_data) else {"confidence": 0, "reason": "N/A"}
            entry_dt = datetime.fromisoformat(sig['timestamp'].replace('Z', ''))
            expiries = sorted([e for e in self.master_df['expiry_date'].unique() if isinstance(e, str) and e >= entry_dt.strftime("%Y-%m-%d")])
            opt_candles = []
            final_symbol, entry_price = None, 0
            for exp_dt in expiries[:2]:
                base = round(sig['price'] / 50) * 50
                step = 100 if sig['direction'] == "CE" else -100
                candidates = []
                for o in range(-2, 10): 
                    s_val = base + (o * step)
                    sym_m = self.master_df[(self.master_df['strike_price'].astype(float) == float(s_val)) & (self.master_df['expiry_date'] == exp_dt) & (self.master_df['instrument_type'] == sig['direction'])]
                    if sym_m.empty: continue
                    symbol = sym_m.iloc[0]['groww_symbol']
                    if symbol not in candle_cache:
                        res = self.groww.get_historical_candles(exchange="NSE", segment="FNO", groww_symbol=symbol, start_time=start_date.strftime("%Y-%m-%d %H:%M:%S"), end_time=end_date.strftime("%Y-%m-%d %H:%M:%S"), candle_interval="1minute")
                        candle_cache[symbol] = res.get('candles', [])
                    e_c = next((c for c in candle_cache[symbol] if c[0] == sig['timestamp']), None)
                    if e_c and 40 <= e_c[4] <= 250: candidates.append({"symbol": symbol, "ltp": e_c[4], "candles": candle_cache[symbol]})
                if candidates:
                    win = min(candidates, key=lambda x: abs(x['ltp'] - 107))
                    entry_price, final_symbol, opt_candles = win['ltp'], win['symbol'], win['candles']; break
            if not opt_candles: continue
            qty = max(65, int(8000 / (65 * entry_price)) * 65)
            m = get_milestones(entry_price)
            outcome, final_ltp, floor, exit_ts, tag = "SL HIT", m['sl'], m['sl'], sig['timestamp'], "NONE"
            for j in range(sig['idx'] + 1, len(closes)):
                oc = next((c for c in opt_candles if c[0] == candles[j][0]), None)
                if not oc: continue
                if oc[2] >= m['t3']: outcome = "T3 JACKPOT"; final_ltp = m['t3']; exit_ts = candles[j][0]; break
                elif oc[2] >= m['t2']: 
                    if floor < m['t2']: floor = m['t2']; tag = "T2"
                elif oc[2] >= m['t1']:
                    if floor < m['t1']: 
                        floor = m['t1']; tag = "T1"
                        if entry_price > floor: floor = entry_price
                if oc[3] <= floor: outcome = f"EXIT @ {tag}" if tag != "NONE" else "SL HIT"; final_ltp = floor; exit_ts = candles[j][0]; break
                if "15:20" in candles[j][0]: outcome = "EOD EXIT"; final_ltp = oc[4]; exit_ts = candles[j][0]; break
            
            pnl = round((final_ltp - entry_price) * qty, 2)
            exit_dt = datetime.fromisoformat(exit_ts.replace('Z', ''))
            duration_mins = max(0, (exit_dt - entry_dt).total_seconds() / 60)
            self.results.append({
                "DATE": entry_dt.strftime("%Y-%m-%d"), "Timestamp": sig['timestamp'], "Exit_Time": exit_ts,
                "Duration_Open": entry_dt.strftime("%H:%M:%S"), "Duration_Close": exit_dt.strftime("%H:%M:%S"),
                "Indicator": sig['direction'], "Strike": final_symbol, 
                "TradeLen": f"{int(duration_mins // 60):02d}:{int(duration_mins % 60):02d}",
                "Underlying_LTP": round(sig['price'], 2), "LTP_Entry": round(entry_price, 2), "Exit_LTP": round(final_ltp, 2),
                "SL": round(m['sl'], 2), "T1": round(m['t1'], 2), "T2": round(m['t2'], 2), "T3": round(m['t3'], 2),
                "PnL": pnl, "Outcome": "WIN" if pnl > 200 else "LOSS",
                "AI_Conf": ai_audit.get('confidence', 0), "AI_Summary": ai_audit.get('reason', 'N/A'),
                "Code_Confidence": sig['code_conf']
            })

        pd.DataFrame(self.results).to_csv("backtest_monster_final_journal.csv", index=False)
        print(f"SUCCESS: Full Fidelity Monster Journal generated ({len(self.results)} trades).")

if __name__ == "__main__":
    FullFidelityMonsterScalper().run()
