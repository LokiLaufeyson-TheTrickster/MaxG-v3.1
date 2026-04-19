import os
import requests
import base64
import json

class GitHubPersistor:
    def __init__(self):
        self.token = os.getenv("GITHUB_TOKEN")
        self.repo = os.getenv("GITHUB_REPO") # e.g. "LokiLaufeyson-TheTrickster/MaxG-v3.1"
        self.file_path = "data/signals.json"

    def save_signal(self, sig_data: dict):
        if not self.token or not self.repo: return
        
        url = f"https://api.github.com/repos/{self.repo}/contents/{self.file_path}"
        headers = {"Authorization": f"token {self.token}", "Accept": "application/vnd.github.v3+json"}
        
        try:
            # 1. Get current file (needed for SHA)
            res = requests.get(url, headers=headers)
            current_data = []
            sha = None
            
            if res.status_code == 200:
                content = res.json()
                sha = content['sha']
                current_data = json.loads(base64.b64decode(content['content']).decode('utf-8'))
            
            # 2. Append new signal
            current_data.append(sig_data)
            
            # 3. Push update
            payload = {
                "message": "Update Signal Stream [automated]",
                "content": base64.b64encode(json.dumps(current_data, indent=2).encode('utf-8')).decode('utf-8'),
                "sha": sha
            }
            requests.put(url, headers=headers, json=payload)
            print(f"Cloud Persist: Signal synced to GitHub '{self.file_path}'")
        except Exception as e:
            print(f"GitHub Sync Error: {e}")
