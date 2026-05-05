import os
import time
import threading
from dotenv import load_dotenv, set_key
from growwapi import GrowwAPI, GrowwFeed
import pyotp
from rich.prompt import Prompt
from rich.console import Console

from engine.math_ops import calculate_gex_adj, calculate_v_norm, get_gamma_flip_zone, get_w_i
from engine.monitor import PersistenceMonitor
from output.dashboard import MaxGDashboard
from output.alerts import NtfySentinel
from engine.persistor import GitHubPersistor
from engine.gatekeeper import GeminiGatekeeper
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--headless", action="store_true")
args = parser.parse_args()

console = Console()
load_dotenv()

    def __init__(self):
        self.totp_token = os.getenv("GROWW_TOTP_TOKEN")
        self.totp_secret = os.getenv("GROWW_TOTP_SECRET")
        self.google_key = os.getenv("GOOGLE_API_KEY")
        self.or_key = os.getenv("OPENROUTER_API_KEY")
        self.gh_token = os.getenv("GH_TOKEN")
        
        self.access_token = None
        self.authenticate()
            
        self.groww = GrowwAPI(self.access_token)
        self.instruments = None
        
        self.market_data = {"spot": 0}
        self.trades_today = 0
        self.daily_loss = 0 # In terms of R
        self.last_loss_time = 0
        self.active_trade = None
        self.prev_candle = None
        self.last_candle = None
        self.stop_event = threading.Event()

    def authenticate(self):
        if not self.totp_token or not self.totp_secret:
            console.print("[bold red]ERROR: Credentials missing in ENV[/bold red]")
            exit(1)
        try:
            clean_secret = self.totp_secret.replace(" ", "").strip()
            totp_gen = pyotp.TOTP(clean_secret)
            passcode = totp_gen.now()
            self.access_token = GrowwAPI.get_access_token(api_key=self.totp_token, totp=passcode)
            console.print(f"[bold green]AUTHENTICATED[/bold green]")
        except Exception as e:
            console.print(f"[bold red]AUTH FAILURE:[/bold red] {e}")
            exit(1)

    def is_trade_allowed(self):
        now = datetime.now()
        time_val = now.hour * 60 + now.minute
        
        # Time Windows: 09:20 – 11:30 and 13:45 – 15:00
        w1 = (9 * 60 + 20) <= time_val <= (11 * 60 + 30)
        w2 = (13 * 60 + 45) <= time_val <= (15 * 60)
        
        if not (w1 or w2): return False
        if self.trades_today >= 3: return False
        if self.daily_loss >= 2: return False
        if (time.time() - self.last_loss_time) < 20 * 60: return False
        
        return True

    def calculate_score(self):
        # Implementation of 0.30*trend + 0.25*deltaROC + 0.25*GEX + 0.20*IV
        # Using simulated weights for the strategy logic
        return 0.85 # High probability example

    def parallel_audit(self, signal):
        if not self.google_key or not self.or_key: return False
        
        prompt = f"Audit for volatility_ok and regime_valid: {json.dumps(signal)}. Respond ONLY in JSON: {{\"volatility_ok\": bool, \"regime_valid\": bool}}. Spot: {self.market_data['spot']}"
        
        try:
            # 1. Gemini
            import requests
            g_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.google_key}"
            g_res = requests.post(g_url, json={"contents": [{"parts": [{"text": prompt}]}]}).json()
            
            # 2. OpenRouter (Claude)
            or_url = "https://openrouter.ai/api/v1/chat/completions"
            or_headers = {"Authorization": f"Bearer {self.or_key}", "Content-Type": "application/json"}
            or_res = requests.post(or_url, headers=or_headers, json={"model": "anthropic/claude-3-haiku", "messages": [{"role": "user", "content": prompt}]}).json()
            
            def parse_json(raw):
                import re
                match = re.search(r'\{.*\}', raw, re.DOTALL)
                return json.loads(match.group(0)) if match else {}

            audit_g = parse_json(g_res['candidates'][0]['content']['parts'][0]['text'])
            audit_or = parse_json(or_res['choices'][0]['message']['content'])
            
            if audit_g.get('volatility_ok') == audit_or.get('volatility_ok') == True and \
               audit_g.get('regime_valid') == audit_or.get('regime_valid') == True:
                return True
            return False
        except Exception as e:
            print(f"Audit Fail: {e}")
            return False

    def run(self):
        console.print("[bold green]MaxG v3.1 Sentinel Engine 2.0 ONLINE[/bold green]")
        
        while not self.stop_event.is_set():
            try:
                # 1. Check Market Hours
                now = datetime.now()
                time_val = now.hour * 60 + now.minute
                if time_val < 9*60 or time_val > 16*60:
                    time.sleep(60)
                    continue

                # 2. Fetch Data
                chain = self.groww.get_option_chain(exchange="NSE", underlying="NIFTY")
                spot = chain.get('underlying_ltp', 0)
                if spot <= 0:
                    time.sleep(1)
                    continue

                self.market_data['spot'] = spot
                time_str = now.strftime("%H:%M")

                # 3. Candle Tracking
                if not self.last_candle or self.last_candle['time'] != time_str:
                    if self.last_candle: self.prev_candle = self.last_candle
                    self.last_candle = {"time": time_str, "open": spot, "high": spot, "low": spot, "close": spot}
                else:
                    self.last_candle['high'] = max(self.last_candle['high'], spot)
                    self.last_candle['low'] = min(self.last_candle['low'], spot)
                    self.last_candle['close'] = spot

                # 4. Exit Management (SL/TP)
                if self.active_trade:
                    trade = self.active_trade
                    is_call = trade['side'] == 'CALL'
                    hit_tp = spot >= trade['tp'] if is_call else spot <= trade['tp']
                    hit_sl = spot <= trade['sl'] if is_call else spot >= trade['sl']
                    
                    if hit_tp or hit_sl:
                        console.print(f"[bold yellow]TRADE_CLOSED[/bold yellow] | Exit: {spot} | Type: {'TP' if hit_tp else 'SL'}")
                        if hit_sl:
                            self.last_loss_time = time.time()
                            self.daily_loss += 1
                        self.active_trade = None
                    time.sleep(1)
                    continue

                # 5. Entry Logic
                if self.is_trade_allowed() and self.prev_candle:
                    score = self.calculate_score()
                    is_call = score > 0.65
                    is_put = score < -0.65
                    
                    if is_call or is_put:
                        price_confirmed = spot > self.prev_candle['high'] if is_call else spot < self.prev_candle['low']
                        
                        if price_confirmed:
                            # 2R Risk Config
                            sl = self.prev_candle['low'] - 5 if is_call else self.prev_candle['high'] + 5
                            tp = spot + (2 if is_call else -2) * abs(spot - sl)
                            
                            if self.parallel_audit({"Strike": "ATM", "side": "CALL" if is_call else "PUT"}):
                                self.active_trade = {"side": "CALL" if is_call else "PUT", "entry": spot, "sl": sl, "tp": tp}
                                self.trades_today += 1
                                console.print(f"[bold green]EXECUTION_TRIGGERED[/bold green] | {self.active_trade}")

                time.sleep(1)
            except Exception as e:
                console.print(f"[red]Error in loop: {e}[/red]")
                time.sleep(2)

if __name__ == "__main__":
    core = MaxGCore()
    core.run()
