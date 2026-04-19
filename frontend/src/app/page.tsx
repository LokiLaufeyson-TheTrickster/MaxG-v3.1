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
  Bell
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
  }, []);

  const saveSettings = () => {
    localStorage.setItem("maxg_gh_token", gitToken);
    setIsSettingsOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#08090A] text-[#E4E4E7] font-sans selection:bg-blue-500/30">
      
      {/* Top Navigation Bar: Minimalist Palantir Style */}
      <nav className="h-14 border-b border-white/[0.08] bg-[#0C0D0E]/80 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-sm uppercase">MaxG</span>
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">Sentinel_AIP v3.1</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Live Connection</span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div className="p-6 grid grid-cols-12 gap-6">
        
        {/* Metric Overview: Sophisticated Foundary Cards */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard 
            icon={<Zap className="w-4 h-4 text-blue-400" />} 
            label="Total Alpha Capture" 
            value="+24,423" 
            trend="+12% vs last session"
          />
          <MetricCard 
            icon={<Activity className="w-4 h-4 text-purple-400" />} 
            label="Regime Confidence" 
            value="89.4%" 
            trend="Strong Trend Lock"
          />
          <MetricCard 
            icon={<Database className="w-4 h-4 text-emerald-400" />} 
            label="Signal Persistence" 
            value="Critical 6/6" 
            trend="Monitored 1m Interval"
          />
          <MetricCard 
            icon={<Bell className="w-4 h-4 text-amber-400" />} 
            label="Active Alerts" 
            value="Enabled" 
            trend="ntfy: MaxG_Alerts_v1"
          />
        </div>

        {/* Left column: Data Logs & Intel */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-[#0C0D0E] border border-white/[0.08] rounded-xl overflow-hidden p-4">
            <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-2">
              <Terminal className="w-4 h-4 text-blue-500" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">AIP Intel Stream</h3>
            </div>
            <div className="space-y-3">
              {signals.slice(0, 5).map((sig, i) => (
                <div key={i} className="group p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-white tracking-tight">{sig.Strike}</span>
                    <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">Verified structural 9-EMA pullback confirmation. Market regime aligned for expansion.</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Main: Tactical Workspace */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="bg-[#0C0D0E] border border-white/[0.08] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crosshair className="w-5 h-5 text-blue-500" />
                <h2 className="font-bold text-lg tracking-tight">Active Operation Matrix</h2>
              </div>
              <button 
                onClick={fetchSignals}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> Sync Intelligence
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01]">
                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Coordinate (Time)</th>
                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Asset Vector</th>
                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">LTP Capture</th>
                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Threat (SL)</th>
                    <th className="px-6 py-4 text-[10px] font-semibold uppercase tracking-widest text-zinc-500 text-right">Targets (T1/T2)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {signals.map((sig, i) => (
                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-5">
                        <span className="text-xs font-mono text-zinc-400">{sig.Time || sig.Timestamp}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">{sig.Strike}</span>
                          <span className="text-[10px] font-bold bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-tighter">Verified</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-mono text-zinc-300">
                        {sig.LTP || sig.Entry_LTP}
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-red-500/80">{sig.SL}</span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-400">{sig.T1}</div>
                            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">Initial</div>
                          </div>
                          <div className="h-6 w-[1px] bg-white/10" />
                          <div className="text-right">
                            <div className="text-xs font-bold text-blue-400">{sig.T2}</div>
                            <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">Major</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {signals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center gap-3 opacity-20">
                          <Cpu className="w-10 h-10" />
                          <p className="text-sm italic">Scanning market structural regimes. Zero assets confirmed.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal: AIP Styled */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-[#08090A]/95 backdrop-blur-md flex items-center justify-center z-[100] p-6">
          <div className="bg-[#0C0D0E] border border-white/10 p-10 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600" />
            <div className="flex items-center gap-3 mb-8">
              <Lock className="w-5 h-5 text-blue-500" />
              <h2 className="text-2xl font-bold tracking-tight">Access Control HQ</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2 tracking-widest">GitHub Authentication Token</label>
                <div className="relative">
                  <input 
                    type="password"
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                    className="w-full bg-white/[0.02] border border-white/10 p-4 rounded-xl text-blue-400 font-mono text-sm focus:outline-none focus:border-blue-600 transition-all"
                    placeholder="ghp_security_manifest_token"
                  />
                </div>
                <p className="text-[10px] text-zinc-600 mt-2 italic">Requires 'repo' scope permissions for structural data sync.</p>
              </div>
            </div>
            <div className="flex gap-4 mt-12">
              <button 
                onClick={saveSettings}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all uppercase text-xs tracking-widest"
              >
                Synchronize Platform
              </button>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-8 py-4 border border-white/10 text-zinc-400 hover:text-white rounded-xl uppercase text-[10px] font-bold tracking-widest transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function MetricCard({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) {
  return (
    <div className="bg-[#0C0D0E] border border-white/[0.08] p-5 rounded-xl hover:border-white/20 transition-all cursor-default group">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white/[0.02] rounded-lg border border-white/5 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all">
          {icon}
        </div>
        <ChevronRight className="w-3 h-3 text-zinc-700" />
      </div>
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</h3>
      <div className="text-2xl font-black text-white tracking-tight mb-2">{value}</div>
      <div className="text-[10px] font-bold text-zinc-600 tracking-tight">{trend}</div>
    </div>
  )
}
