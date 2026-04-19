"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  Zap, 
  Activity, 
  Lock, 
  ArrowUpRight, 
  ChevronRight,
  Database,
  RefreshCw,
  Bell,
  TrendingUp,
  Radar,
  ArrowRight
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
    <main className="min-h-screen bg-[#09090B] text-zinc-100 font-sans antialiased">
      
      {/* Institutional Top Bar */}
      <nav className="h-16 border-b border-zinc-800/50 bg-[#09090B] flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">MaxG <span className="text-zinc-500 font-normal">Sentinel</span></span>
          </div>
          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-500">
            <span className="hover:text-zinc-100 cursor-pointer transition-colors">Overview</span>
            <span className="hover:text-zinc-100 cursor-pointer transition-colors">Tactical Loop</span>
            <span className="hover:text-zinc-100 cursor-pointer transition-colors">Analytics</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Engine</span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-all"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-8 space-y-8">
        
        {/* Bento Stat Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Total Portfolio Gain" value="+₹24,423" trend="+12.4%" icon={<Zap className="text-amber-400" />} />
          <StatCard label="Institutional Accuracy" value="60.2%" trend="Stable" icon={<Radar className="text-indigo-400" />} />
          <StatCard label="Signal Persistence" value="Critical" trend="6/6 Ready" icon={<Database className="text-blue-400" />} />
          <StatCard label="Market Position" value="Balanced" trend="CE Bias" icon={<Activity className="text-emerald-400" />} />
        </div>

        <div className="grid grid-cols-12 gap-8">
          
          {/* Main Workspace */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-bold text-xl">Operational Matrix</h2>
                <button 
                  onClick={fetchSignals}
                  className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-800/20 text-xs font-bold uppercase tracking-wider text-zinc-500">
                      <th className="px-8 py-4">Timestamp</th>
                      <th className="px-8 py-4">Asset ID</th>
                      <th className="px-8 py-4">Capture LTP</th>
                      <th className="px-8 py-4">Stop Loss</th>
                      <th className="px-8 py-4 text-right">Targets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {signals.map((sig, i) => (
                      <tr key={i} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-8 py-5 text-sm font-mono text-zinc-500">{sig.Time || sig.Timestamp}</td>
                        <td className="px-8 py-5">
                          <span className="px-2 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded text-xs font-bold italic">
                            {sig.Strike}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-zinc-100">{sig.LTP || sig.Entry_LTP}</td>
                        <td className="px-8 py-5 text-sm font-bold text-red-500/80">{sig.SL}</td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 text-sm">
                            <span className="text-emerald-500 font-bold">{sig.T1}</span>
                            <span className="text-zinc-700">/</span>
                            <span className="text-indigo-400 font-bold">{sig.T2}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {signals.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-32 text-center text-zinc-600 italic">
                          No active signals in matrix. Waiting for trend confirmation.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 mb-6 flex items-center gap-2">
                <Bell className="w-4 h-4" /> Intel Feed
              </h3>
              <div className="space-y-4">
                {signals.slice(0, 3).map((sig, i) => (
                  <div key={i} className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-indigo-400">{sig.Strike}</span>
                      <ArrowUpRight className="w-3 h-3 text-zinc-600" />
                    </div>
                    <p className="text-xs text-zinc-500">Structural 9-EMA pullback detected on {sig.Strike}. Alignment is confirmed.</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-600 rounded-2xl p-6 text-white overflow-hidden relative group cursor-pointer hover:bg-indigo-500 transition-colors">
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative">
                <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-2">Weekly Summary</h3>
                <div className="text-3xl font-bold">+₹24.4k</div>
                <div className="mt-4 flex items-center gap-1 text-xs font-bold">
                  View full report <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-zinc-900 border border-zinc-800 p-8 w-full max-w-xl rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <Lock className="w-6 h-6 text-indigo-500" />
              <h2 className="text-2xl font-bold">Management HQ</h2>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6 font-medium text-sm">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 tracking-wider">GitHub Secret</label>
                  <input type="password" value={gitToken} onChange={(e) => setGitToken(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-xl focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 tracking-wider">Groww Secret</label>
                  <input type="password" value={growwSecret} onChange={(e) => setGrowwSecret(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-xl focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 tracking-wider">Groww Token</label>
                  <input type="password" value={growwToken} onChange={(e) => setGrowwToken(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-xl focus:outline-none focus:border-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-2 tracking-wider">Gemini Key</label>
                  <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 p-3 rounded-xl focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={saveSettings}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all"
              >
                Save Protocol
              </button>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-8 py-4 text-zinc-500 font-bold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ icon, label, value, trend, iconBg = "bg-zinc-800" }: { icon: React.ReactNode, label: string, value: string, trend: string, iconBg?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${iconBg} group-hover:bg-zinc-700 transition-colors`}>{icon}</div>
        <span className="text-xs font-bold text-emerald-500">{trend}</span>
      </div>
      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">{label}</h3>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}
