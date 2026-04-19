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

class MaxGCore:
    def __init__(self):
        self.totp_token = os.getenv("GROWW_TOTP_TOKEN")
        self.totp_secret = os.getenv("GROWW_TOTP_SECRET")
        self.access_token = None
        
        # Automated Zero-Discretion Login
        self.authenticate()
            
        self.groww = GrowwAPI(self.access_token)
        self.instruments = None
        self.load_instrument_master()
        
        self.monitor = PersistenceMonitor()
        self.dashboard = MaxGDashboard()
        self.sentinel = NtfySentinel(topic=os.getenv("NTFY_TOPIC", "maxg_v31_signals"))
        self.gatekeeper = GeminiGatekeeper(os.getenv("GOOGLE_API_KEY"))
        self.persistor = GitHubPersistor()
        
        self.market_data = {"spot": 0, "change": 0}
        self.metrics = {"gex_adj": 0, "v_norm": 0, "regime": "INITIALIZING", "gfz": "N/A", "persistence": 0}
        self.signals = []
        self.stop_event = threading.Event()

    def load_instrument_master(self):
        """Loads and caches the Groww Instrument Master for dynamic mapping"""
        try:
            with console.status("[bold green]Syncing Global Instrument Master..."):
                self.instruments = self.groww.get_all_instruments() # Handled by SDK internally
                console.print(f"[bold green]SYNCED:[/bold green] {len(self.instruments)} Tradable Assets Indexed.")
        except Exception as e:
            console.print(f"[bold red]Instrument Sync Failed:[/bold red] {e}")

    def authenticate(self):
        """
        Implementation of the 'No-Expiry' TOTP Flow.
        Exchanges TOTP+Secret for a fresh Session Token.
        """
        if not self.totp_token or not self.totp_secret:
            console.print("[bold red]ERROR: GROWW_TOTP_TOKEN or GROWW_TOTP_SECRET missing in .env[/bold red]")
            exit(1)

        try:
            with console.status("[bold cyan]Calibrating Structural Access (TOTP Flow)..."):
                # 1. Roll the 6-digit Passcode
                clean_secret = self.totp_secret.replace(" ", "").strip()
                totp_gen = pyotp.TOTP(clean_secret)
                passcode = totp_gen.now()
                
                # 2. Authenticate Session
                self.access_token = GrowwAPI.get_access_token(
                    api_key=self.totp_token, 
                    totp=passcode
                )
                
                console.print(f"[bold green]AUTHENTICATED:[/bold green] Zero-Discretion Session Established.")
                
        except Exception as e:
            console.print(f"[bold red]CRITICAL AUTH FAILURE:[/bold red] {str(e)}")
            exit(1)

    def fetch_market_snapshot(self):
        """Periodic background task to fetch Nifty Option Chain and Native Greeks"""
        while not self.stop_event.is_set():
            try:
                with console.status("[bold blue]Polling Native Greeks from Groww Chain..."):
                    # Get complete option chain including native Greeks
                    chain = self.groww.get_option_chain(
                        exchange=self.groww.EXCHANGE_NSE,
                        underlying="NIFTY",
                        expiry_date="2026-04-23" # Auto-adjust to nearest expiry in production
                    )
                    
                    self.market_data['spot'] = chain.get('underlying_ltp', 0)
                    strikes = chain.get('strikes', {})
                    
                    # Calculate structural GEX by summing across all regular strikes
                    total_gex = 0
                    for strike_price, data in strikes.items():
                        for opt_type in ['CE', 'PE']:
                            opt_data = data.get(opt_type, {})
                            greeks = opt_data.get('greeks', {})
                            
                            gamma = greeks.get('gamma', 0)
                            oi = opt_data.get('open_interest', 0)
                            
                            # Standard Adjusted GEX summation
                            strike_gex = calculate_gex_adj(oi, gamma, self.market_data['spot'])
                            total_gex += strike_gex
                    
                    self.metrics['gex_adj'] = total_gex
                    # Update monitor for V_norm calculations
                    # ... add logic for previous snapshot comparison ...
                    
                time.sleep(10)
            except Exception as e:
                console.print(f"[dim red]Snapshot error: {e}[/dim red]")
                time.sleep(5)

    def on_tick(self, data):
        """WebSocket Callback"""
        # Update spot, v_norm history, liquidity gate
        # self.market_data['spot'] = data['ltp']
        self.monitor.update_ticks()
        pass

    def run(self):
        console.print("[bold green]MaxG v3.1 Sentinel Online[/bold green]")
        
        # Start background threads for data ingest
        # feed = GrowwFeed(self.access_token)
        # feed.subscribe(["NIFTY_INDEX_TOKEN"], self.on_tick)
        
        if args.headless:
            while not self.stop_event.is_set():
                # Headless logic (no live dashboard)
                # ... fetch and process ...
                time.sleep(1)
        else:
            with Live(self.dashboard.layout, refresh_per_second=4, screen=True) as live:
                while not self.stop_event.is_set():
                    # Simulation update for demonstration purposes if no live API
                    self.market_data['spot'] = 22500 + (time.time() % 100)
                    self.market_data['change'] = 0.45
                    
                    # Update Dashboard
                    live.update(self.dashboard.update(self.market_data, self.metrics, self.signals))
                    time.sleep(0.25)

if __name__ == "__main__":
    core = MaxGCore()
    core.run()
