import requests
import os

def send_tactical_alert(signal_type, strike, entry, target, sl, confidence, reason="Structural Momentum Confirmation"):
    """
    Sends a high-priority tactical alert to ntfy.sh/MaxG_Alerts_v1
    """
    topic = "MaxG_Alerts_v1"
    url = f"https://ntfy.sh/{topic}"
    
    # Palantir-style military formatting
    headers = {
        "Title": f"⚠️ TACTICAL SIGNAL: {signal_type} @ {strike}",
        "Priority": "high",
        "Tags": "rocket,warning,shield"
    }
    
    payload = f"""
[TACTICAL DATA OVERLAY]
ACTION: BUY {signal_type}
STRIKE: {strike}
ENTRY: {entry}
TARGET (T1): {target}
STOP LOSS: {sl}

[ANALYSIS SUMMARY]
CONFIDENCE: {confidence}%
INTEL: {reason}

--- COMMAND CENTER MAXG v3.1 ---
    """
    
    try:
        response = requests.post(url, data=payload.encode('utf-8'), headers=headers)
        if response.status_code == 200:
            print(f"TACTICAL ALERT DEPLOYED: {strike}")
        else:
            print(f"ALERT FAILURE: {response.status_code}")
    except Exception as e:
        print(f"NETWORK FAILURE: {e}")

# Example Integration for Live Testing
if __name__ == "__main__":
    send_tactical_alert("CE", "NIFTY-21Apr26-24500-CE", 107.5, 139.5, 86.0, 92)
