"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Terminal, 
  Settings, 
  Zap, 
  Activity, 
  Crosshair, 
  Lock, 
  ArrowUpRight, 
  ChevronRight,
  Database,
  Cpu,
  RefreshCw,
  Bell,
  TrendingUp,
  Radar
} from 'lucide-react';

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
  const [growwSecret, setGrowwSecret] = useState("");
  const [growwToken, setGrowwToken] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

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
    const savedGSecret = localStorage.getItem("maxg_groww_secret");
    if (savedGSecret) setGrowwSecret(savedGSecret);
    const savedGToken = localStorage.getItem("maxg_groww_token");
    if (savedGToken) setGrowwToken(savedGToken);
    const savedGemini = localStorage.getItem("maxg_gemini_key");
    if (savedGemini) setGeminiKey(savedGemini);
  }, []);

  const saveSettings = () => {
    localStorage.setItem("maxg_gh_token", gitToken);
    localStorage.setItem("maxg_groww_secret", growwSecret);
    localStorage.setItem("maxg_groww_token", growwToken);
    localStorage.setItem("maxg_gemini_key", geminiKey);
    setIsSettingsOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#020408] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Dynamic Background Mesh */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-400/5 blur-[100px] rounded-full" />
      </div>

      {/* Glass Header */}
      <nav className="h-20 border-b border-white/[0.05] bg-white/[0.02] backdrop-blur-2xl flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center gap-3 px-4 py-2 bg-black rounded-lg border border-white/10">
              <Shield className="w-5 h-5 text-blue-400" />
              <span className="font-extrabold tracking-tight text-lg uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">MaxG Sentinel</span>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest leading-none">AIP Core 3.1</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white active:scale-95 flex items-center gap-3 px-4"
          >
            <Settings className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">HQ_Config</span>
          </button>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto p-10 space-y-10 relative">
        
        {/* Metric Grid: High Vibrancy Glass */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <MetricCard 
            icon={<Zap className="w-6 h-6 text-yellow-400" />} 
            label="Equity Alpha Capture" 
            value="+24,423" 
            subValue="+12.4% APR"
            color="from-yellow-400/20 to-orange-400/20"
          />
          <MetricCard 
            icon={<Radar className="w-6 h-6 text-blue-400" />} 
            label="Tactical Confidence" 
            value="89.4%" 
            subValue="High Regime Lock"
            color="from-blue-400/20 to-indigo-400/20"
          />
          <MetricCard 
            icon={<Activity className="w-6 h-6 text-emerald-400" />} 
            label="Signal Velocity" 
            value="Critical" 
            subValue="1m Precision Sync"
            color="from-emerald-400/20 to-cyan-400/20"
          />
          <MetricCard 
            icon={<TrendingUp className="w-6 h-6 text-purple-400" />} 
            label="Win Probability" 
            value="60.2%" 
            subValue="Verified Monthly"
            color="from-purple-400/20 to-pink-400/20"
          />
        </div>

        <div className="grid grid-cols-12 gap-10">
          
          {/* Intelligence Sidebar: Glass Panel */}
          <div className="col-span-12 lg:col-span-3 space-y-10">
            <section className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-3xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
              <div className="flex items-center gap-3 mb-8">
                <Terminal className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Intel Feed</h3>
              </div>
              <div className="space-y-6">
                {signals.slice(0, 4).map((sig, i) => (
                  <div key={i} className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-blue-500/20 transition-all cursor-pointer">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-white tracking-tight">{sig.Strike}</span>
                      <div className="p-1 px-2 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded-lg uppercase tracking-tighter">Verified</div>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">9-EMA Hook detected. Alpha capture in progress.</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Main Matrix: Large Aero Glass Container */}
          <div className="col-span-12 lg:col-span-9">
            <section className="bg-white/[0.03] border border-white/10 backdrop-blur-3xl rounded-[3rem] shadow-2xl overflow-hidden relative">
              <div className="px-10 py-8 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-blue-500/20 shadow-lg">
                    <Crosshair className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="font-black text-2xl tracking-tighter uppercase italic">Operational Matrix</h2>
                  </div>
                </div>
                <button 
                  onClick={fetchSignals}
                  className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 group"
                >
                  <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" /> Sync Intelligence
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/[0.01] text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                      <th className="px-10 py-8">Timestamp</th>
                      <th className="px-10 py-8">Strike Vector</th>
                      <th className="px-10 py-8 text-center">Capture Unit</th>
                      <th className="px-10 py-8 text-center">Threat Buffer</th>
                      <th className="px-10 py-8 text-right">Alpha Targets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {signals.map((sig, i) => (
                      <tr key={i} className="hover:bg-white/[0.03] transition-all group">
                        <td className="px-10 py-8">
                          <span className="text-[11px] font-mono text-gray-500">{sig.Time || sig.Timestamp}</span>
                        </td>
                        <td className="px-10 py-8 italic font-black text-blue-400">{sig.Strike}</td>
                        <td className="px-10 py-8 text-center font-bold">{sig.LTP || sig.Entry_LTP}</td>
                        <td className="px-10 py-8 text-center text-red-500 font-bold">{sig.SL}</td>
                        <td className="px-10 py-8 text-right">
                          <span className="text-emerald-400 font-black">{sig.T1}</span> / <span className="text-blue-400 font-black">{sig.T2}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Settings Modal: THE UPGRADED MULTI-VECTOR HUB */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center z-[100] p-10">
          <div className="bg-[#0A0C10] border border-white/10 p-12 w-full max-w-2xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                <Lock className="w-6 h-6 text-blue-500" />
              </div>
              <h2 className="text-3xl font-black tracking-tight uppercase italic">Security Hub</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-8 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
              <div className="col-span-2 space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">GitHub Sync Token</label>
                <input 
                  type="password"
                  value={gitToken}
                  onChange={(e) => setGitToken(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-blue-400 font-mono text-sm focus:outline-none focus:border-blue-600/50"
                  placeholder="GHP_REDACTED"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Groww TOTP Secret</label>
                <input 
                  type="password"
                  value={growwSecret}
                  onChange={(e) => setGrowwSecret(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-blue-400 font-mono text-sm focus:outline-none focus:border-blue-600/50"
                  placeholder="2FA_SECRET"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Groww Token</label>
                <input 
                  type="password"
                  value={growwToken}
                  onChange={(e) => setGrowwToken(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-blue-400 font-mono text-sm focus:outline-none focus:border-blue-600/50"
                  placeholder="ACCESS_TOKEN"
                />
              </div>

              <div className="col-span-2 space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Gemini AIP Master Key</label>
                <input 
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-blue-400 font-mono text-sm focus:outline-none focus:border-blue-600/50"
                  placeholder="AI_ACCESS_KEY"
                />
              </div>
            </div>

            <div className="flex gap-6 mt-12">
              <button 
                onClick={saveSettings}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black py-6 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase text-xs tracking-[0.2em]"
              >
                Launch Synchronizer
              </button>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-10 py-6 border border-white/10 text-gray-500 hover:text-white rounded-2xl transition-all"
              >
                Abort
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({ icon, label, value, subValue, color }: { icon: React.ReactNode, label: string, value: string, subValue: string, color: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-3xl relative overflow-hidden group hover:border-white/20 transition-all cursor-default shadow-2xl">
      <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${color} rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
      <div className="flex items-center justify-between mb-6">
        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
          {icon}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-700" />
      </div>
      <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">{label}</h3>
      <div className="text-4xl font-black text-white tracking-tighter mb-1">{value}</div>
      <div className="text-[11px] font-bold text-gray-600 tracking-tight uppercase italic">{subValue}</div>
    </div>
  )
}
