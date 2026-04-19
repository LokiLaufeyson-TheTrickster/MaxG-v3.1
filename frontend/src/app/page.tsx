"use client";

import React, { useState, useEffect } from 'react';

interface Signal {
  Time?: string;
  Timestamp?: string;
  Strike: string;
  LTP?: number;
  Entry_LTP?: number;
  T1: number;
  T2: number;
  T3: number;
  SL: number;
}

export default function Dashboard() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [gitToken, setGitToken] = useState("");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from GitHub JSON File
  const fetchSignals = async () => {
    try {
      const res = await fetch("https://raw.githubusercontent.com/LokiLaufeyson-TheTrickster/MaxG-v3.1/main/data/signals.json");
      if (res.ok) {
        const data = (await res.json()) as Signal[];
        setSignals(data);
      }
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const savedToken = localStorage.getItem("maxg_gh_token");
    if (savedToken) setGitToken(savedToken);
  }, []);

  const saveSettings = () => {
    localStorage.setItem("maxg_gh_token", gitToken);
    setIsSettingsOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white font-mono relative overflow-hidden" 
          style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 163, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 163, 0.03) 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      
      <header className="flex justify-between items-center p-6 border-b border-[#00FFA3]/20 bg-[#1A1A1A]/80 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-[#00FFA3] tracking-[0.2em]">MAXG v3.1 | TACTICAL_AIP</h1>
          <p className="text-gray-500 text-xs mt-1">SENTINEL MODE: ACTIVE | LOG: {new Date().toLocaleDateString()}</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-2 border border-[#00FFA3]/30 text-[#00FFA3] text-xs hover:bg-[#00FFA3]/10 transition-all"
          >
            HQ_CONFIG
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 p-6">
        
        {/* Left: Intelligence Feed */}
        <section className="col-span-12 lg:col-span-3 bg-[#1A1A1A]/50 border border-[#00FFA3]/10 p-4 h-[600px] overflow-y-auto">
          <h3 className="text-[#00FFA3] text-sm mb-4 border-b border-[#00FFA3]/20 pb-2">INTEL_LOG_STREAM</h3>
          <div className="space-y-4">
            {signals.map((sig: Signal, i: number) => (
              <div key={i} className="p-3 border-l-2 border-[#00FFA3] bg-[#222]/30 text-xs">
                <div className="flex justify-between text-[#00FFA3] font-bold mb-1">
                  <span>{sig.Strike}</span>
                  <span>{sig.Time || sig.Timestamp}</span>
                </div>
                <div className="text-gray-500 italic">Structural 9-EMA Pullback Confirmation. Alpha capture active.</div>
              </div>
            ))}
          </div>
        </section>

        {/* Center: Tactical HUD */}
        <section className="col-span-12 lg:col-span-6 bg-[#1A1A1A]/30 border border-[#00FFA3]/10 flex flex-col items-center justify-center relative py-20">
          <div className="w-64 h-64 border border-[#00FFA3]/20 rounded-full animate-spin-slow relative flex items-center justify-center">
            <div className="absolute w-[110%] h-[1px] bg-[#00FFA3]/50"></div>
            <div className="absolute h-[110%] w-[1px] bg-[#00FFA3]/50"></div>
          </div>
          <div className="absolute text-center">
            <div className="text-xs text-gray-500 tracking-[0.3em] mb-2 uppercase">Total Portfolio Alpha</div>
            <div className="text-6xl font-black text-[#00FFA3] drop-shadow-[0_0_15px_rgba(0,255,163,0.5)]">+24,423</div>
            <div className="text-xs text-[#00FFA3] mt-2 tracking-widest uppercase">Mission: Success</div>
          </div>
        </section>

        {/* Right: Asset Table */}
        <section className="col-span-12 lg:col-span-3 bg-[#1A1A1A]/50 border border-[#00FFA3]/10 p-4">
          <h3 className="text-[#00FFA3] text-sm mb-4 border-b border-[#00FFA3]/20 pb-2">SYST_DIAGNOSTICS</h3>
          <div className="space-y-6 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase">Strat Accuracy</span>
              <span className="text-[#00FFA3]">60% (MONSTER_v2)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase">Persistence</span>
              <span className="text-white">6/6 CRITICAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase">NTFY Channel</span>
              <span className="text-[#00FFA3]">ACTIVE (MAXG_ALERT)</span>
            </div>
            <div className="p-4 bg-black/50 border border-[#00FFA3]/20 mt-10">
              <div className="text-gray-600 mb-2 uppercase text-[10px]">Command Note</div>
              <div className="text-gray-400">Targeting high-frequency 1-minute delta shifts. System remains in green regime.</div>
            </div>
          </div>
        </section>


        {/* Market Matrix Table */}
        <section className="col-span-12 bg-[#1A1A1A]/80 border border-[#00FFA3]/10 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#00FFA3]/5 text-[#00FFA3]/60 uppercase tracking-widest">
              <tr>
                <th className="p-4 border-b border-[#00FFA3]/10">Timestamp</th>
                <th className="p-4 border-b border-[#00FFA3]/10">Strike_ID</th>
                <th className="p-4 border-b border-[#00FFA3]/10">LTP_Capture</th>
                <th className="p-4 border-b border-[#00FFA3]/10">Target_Vectors</th>
                <th className="p-4 border-b border-[#00FFA3]/10">Tactical_Stop</th>
              </tr>
            </thead>
            <tbody>
              {signals.map((sig: Signal, i: number) => (
                <tr key={i} className="hover:bg-[#00FFA3]/5 border-b border-[#00FFA3]/5 transition-colors">
                  <td className="p-4 text-gray-500 font-mono">{sig.Time || sig.Timestamp}</td>
                  <td className="p-4 font-bold text-[#00FFA3] tracking-wider">{sig.Strike}</td>
                  <td className="p-4 font-mono">{sig.LTP || sig.Entry_LTP}</td>
                  <td className="p-4">
                    <span className="text-[#00FFA3]">{sig.T1}</span> / {sig.T2} / <span className="text-yellow-500">{sig.T3}</span>
                  </td>
                  <td className="p-4 text-red-500 font-bold">{sig.SL}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-6">
          <div className="bg-[#111] border-2 border-[#00FFA3] p-10 w-full max-w-lg shadow-[0_0_50px_rgba(0,255,163,0.2)]">
            <h2 className="text-2xl font-bold mb-6 tracking-widest text-[#00FFA3]">HQ_CONFIG_CENTER</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] text-gray-500 uppercase mb-2">GitHub Personal Access Token</label>
                <input 
                  type="password"
                  value={gitToken}
                  onChange={(e) => setGitToken(e.target.value)}
                  className="w-full bg-black border border-[#00FFA3]/30 p-4 text-[#00FFA3] font-mono text-sm"
                  placeholder="GHP_REDACTED_ACCESS_TOKEN"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-12">
              <button 
                onClick={saveSettings}
                className="flex-1 bg-[#00FFA3] text-black font-bold py-4 hover:shadow-[0_0_20px_rgba(0,255,163,1)] transition-all uppercase tracking-widest"
              >
                COMMIT_DATA
              </button>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-8 py-4 border border-white/20 text-white uppercase text-xs"
              >
                ABORT
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
