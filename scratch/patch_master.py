import os
import pandas as pd
import pyotp
from growwapi import GrowwAPI
from dotenv import load_dotenv
import json

load_dotenv("backend/.env")

def patch_master():
    totp_secret = os.getenv("GROWW_TOTP_SECRET")
    totp_token = os.getenv("GROWW_TOTP_TOKEN")
    totp_gen = pyotp.TOTP(totp_secret.replace(" ", "").strip())
    
    session_token = GrowwAPI.get_access_token(api_key=totp_token, totp=totp_gen.now())
    groww = GrowwAPI(session_token)
    
    # Target the missing expiry
    target_date = "2026-04-14"
    print(f"Fetching contracts for {target_date}...")
    
    try:
        # Note: In untruncated part I saw get_contracts signature
        res = groww.get_contracts(exchange="NSE", underlying_symbol="NIFTY", expiry_date=target_date)
        contracts = res.get('contracts', [])
        print(f"Found {len(contracts)} contracts.")
        
        if not contracts:
            print("No contracts found. Maybe expired and removed from API?")
            return
            
        # Convert to DataFrame format matching nifty_master.csv
        # exchange,exchange_token,trading_symbol,groww_symbol,name,instrument_type,segment,series,isin,underlying_symbol,underlying_exchange_token,expiry_date,strike_price,lot_size,tick_size,freeze_quantity,is_reserved,buy_allowed,sell_allowed,internal_trading_symbol,is_intraday
        new_rows = []
        for c in contracts:
            new_rows.append({
                "exchange": "NSE",
                "groww_symbol": c.get('groww_symbol'),
                "instrument_type": c.get('option_type'), # Verify key name later
                "expiry_date": target_date,
                "strike_price": c.get('strike_price'),
                "underlying_symbol": "NIFTY"
            })
            
        df_new = pd.DataFrame(new_rows)
        # Load existing
        df_old = pd.read_csv("scratch/nifty_master.csv")
        df_combined = pd.concat([df_old, df_new]).drop_duplicates(subset=['groww_symbol'])
        
        df_combined.to_csv("scratch/nifty_master.csv", index=False)
        print(f"Successfully patched {target_date} into nifty_master.csv.")
        
    except Exception as e:
        print(f"Error fetching contracts: {e}")

if __name__ == "__main__":
    patch_master()
