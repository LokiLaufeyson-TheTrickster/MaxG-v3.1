import pandas as pd

def inject_14th_april():
    # Load existing master
    df_old = pd.read_csv("scratch/nifty_master.csv")
    
    new_rows = []
    # Nifty strikes usually 22000 to 25500 for the current range
    for s_val in range(22000, 25501, 50):
        for o_type in ["CE", "PE"]:
            new_rows.append({
                "exchange": "NSE",
                "groww_symbol": f"NSE-NIFTY-14Apr26-{s_val}-{o_type}",
                "underlying_symbol": "NIFTY",
                "expiry_date": "2026-04-14",
                "strike_price": s_val,
                "instrument_type": o_type
            })
            
    df_new = pd.DataFrame(new_rows)
    df_combined = pd.concat([df_old, df_new]).drop_duplicates(subset=['groww_symbol'])
    
    df_combined.to_csv("scratch/nifty_master.csv", index=False)
    print(f"Successfully injected 14-Apr-2026 NIFTY strikes into master.")

if __name__ == "__main__":
    inject_14th_april()
