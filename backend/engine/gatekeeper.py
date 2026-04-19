import os
from google import genai
from dotenv import load_dotenv
import json
import time
from datetime import datetime

load_dotenv()

class GeminiGatekeeper:
    def __init__(self, api_key: str):
        # Using 3.1 Flash-Lite for 15 RPM
        self.client = genai.Client(api_key=api_key)
        self.model_id = 'gemini-flash-latest'

    def batch_audit_trades(self, signals: list, daily_context: dict = None) -> list:
        """
        Processes signals with enriched daily market context in chunks to avoid output limits.
        """
        if not signals: return []
        
        all_results = []
        chunk_size = 20
        
        print(f"DEBUG: Auditing {len(signals)} signals in chunks of {chunk_size}...")
        
        for i in range(0, len(signals), chunk_size):
            chunk = signals[i : i + chunk_size]
            prompt = f"""
            Role: MASTER DERIVATIVES STRATEGIST (Zero-Tolerance for Traps).
            
            Market Regime: 
            {json.dumps(daily_context, indent=2) if daily_context else "Standard Volatility"}
            
            Task: Analyze {len(chunk)} tactical signals for structural integrity.
            Specifically look for "False Breaks" near Day High/Low boundaries.
            
            Signal Matrix (Chunk {i//chunk_size + 1}):
            {json.dumps(chunk, indent=2)}
            
            Respond ONLY as a JSON array of results for these specific {len(chunk)} signals:
            [
                {{"confidence": float, "reason": "str", "safe": bool}},
                ...
            ]
            """
            try:
                response = self.client.models.generate_content(model=self.model_id, contents=prompt)
                text = response.text.strip()
                if "```json" in text:
                    text = text.split("```json")[1].split("```")[0].strip()
                chunk_results = json.loads(text)
                all_results.extend(chunk_results)
                time.sleep(4) # High-delay for free tier quota
            except Exception as e:
                print(f"DEBUG: Chunk AI Failure at index {i}: {e}")
                all_results.extend([{"confidence": 0.5, "reason": "Audit Failed", "safe": True}] * len(chunk))
        
        return all_results

    def analyze_market_veto(self, news_summary: str, vix: float, fii_flow: float) -> dict:
        prompt = f"VIX:{vix}, FII:{fii_flow}. Veto? Reply JSON: {{\"veto\":bool, \"reason\":str}}"
        try:
            response = self.client.models.generate_content(model=self.model_id, contents=prompt)
            return json.loads(response.text.strip())
        except:
            return {"veto": False, "reason": "Bypassed"}
