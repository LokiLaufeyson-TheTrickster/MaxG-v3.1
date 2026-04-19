import os
import pandas as pd
import pyotp
import requests
import gzip
from growwapi import GrowwAPI
from dotenv import load_dotenv

load_dotenv("backend/.env")

def refresh_master():
    totp_secret = os.getenv("GROWW_TOTP_SECRET")
    totp_token = os.getenv("GROWW_TOTP_TOKEN")
    totp_gen = pyotp.TOTP(totp_secret.replace(" ", "").strip())
    
    session_token = GrowwAPI.get_access_token(api_key=totp_token, totp=totp_gen.now())
    # Note: GrowwAPI standard usage usually involves downloading a large CSV
    # But we can try to find the direct download URL or use the client method.
    
    print("Fetching master contract list from Groww...")
    # Standard Groww master URL (common knowledge for Groww integrations)
    url = "https://groww.in/v1/api/stocks_fo_data/v1/contracts/export"
    resp = requests.get(url)
    
    with open("scratch/full_master.csv.gz", "wb") as f:
        f.write(resp.content)
        
    print("Unzipping and filtering for NIFTY...")
    df = pd.read_csv("scratch/full_master.csv.gz", compression='gzip')
    nifty_df = df[df['underlying_symbol'] == 'NIFTY']
    
    nifty_df.to_csv("scratch/nifty_master.csv", index=False)
    print(f"Refreshed NIFTY Master. New unique expiries:")
    print(nifty_df['expiry_date'].unique())

if __name__ == "__main__":
    refresh_master()
