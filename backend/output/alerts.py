import requests
import json

class NtfySentinel:
    def __init__(self, url: str = "https://ntfy.sh", topic: str = "maxg_v31"):
        self.url = f"{url}/{topic}"

    def send_signal(self, payload: dict):
        """
        payload: [Regime | Instrument | LTP | T1 | T2 | T3 | SL | Conf %]
        """
        message = (
            f"[{payload['regime']} | {payload['instrument']} | LTP: {payload['ltp']} | "
            f"T1: {payload['t1']:.1f} | T2: {payload['t2']:.1f} | T3: {payload['t3']:.1f} | "
            f"SL: {payload['sl']:.1f} | Conf: {payload['confidence']}%]"
        )
        
        try:
            requests.post(self.url,
                data=message.encode('utf-8'),
                headers={
                    "Title": f"MaxG v3.1: {payload['instrument']} Signal",
                    "Priority": "high",
                    "Tags": "chart_with_upwards_trend,moneybag"
                }
            )
        except Exception as e:
            print(f"Failed to send alert: {e}")
