"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Settings, 
  Zap, 
  Activity, 
  Lock, 
  ArrowUpRight, 
  Database,
  RefreshCw,
  Bell,
  Cpu,
  MousePointer2
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
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Credentials State
  const [gitToken, setGitToken] = useState("");
  const [growwSecret, setGrowwSecret] = useState("");
  const [growwToken, setGrowwToken] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

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
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    
    // Load local settings
    setGitToken(localStorage.getItem("maxg_gh_token") || "");
    setGrowwSecret(localStorage.getItem("maxg_groww_secret") || "");
    setGrowwToken(localStorage.getItem("maxg_groww_token") || "");
    setGeminiKey(localStorage.getItem("maxg_gemini_key") || "");

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const saveSettings = () => {
    localStorage.setItem("maxg_gh_token", gitToken);
    localStorage.setItem("maxg_groww_secret", growwSecret);
    localStorage.setItem("maxg_groww_token", growwToken);
    localStorage.setItem("maxg_gemini_key", geminiKey);
    setIsSettingsOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#030303] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
      
      {/* Interactive Background Particles & Orbs */}
      <div className="fixed inset-0 z-0">
        <div 
          className="absolute w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[160px] transition-transform duration-1000 ease-out pointer-events-none"
          style={{ transform: `translate(${mousePos.x / 10}px, ${mousePos.y / 10}px)` }}
        />
        <div 
          className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"
        />
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`, backgroundSize: '40px 40px' }} />
      </div>

      <nav className="h-20 border-b border-white/5 bg-white/[0.01] backdrop-blur-xl flex items-center justify-between px-12 sticky top-0 z-[100]">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative w-10 h-10 bg-black rounded-full flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic">MAX-G <span className="text-blue-500">ETH_V1</span></span>
        </div>
        
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="group flex items-center gap-3 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all active:scale-95"
          >
            <Settings className="w-4 h-4 text-zinc-400 group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-[10px] uppercase font-bold tracking-[.2em]">HQ_CONFIG</span>
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-[1400px] mx-auto p-12 space-y-12">
        
        {/* Stat Stream: Fluid Floating Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <StatPanel icon={<Zap />} label="Portfolio Alpha" value="+₹24,423" sub="V1 ENGINE CONFIRMED" />
          <StatPanel icon={<Activity />} label="Trend Persistence" value="Critical" sub="6/6 PERSISTENCE" />
          <StatPanel icon={<Cpu />} label="AIP Audit" value="Active" sub="GEMINI FLASH 2.0" />
          <StatPanel icon={<RefreshCw />} label="Live Sync" value="9ms" sub="REAL-TIME POLLING" />
        </div>

        <div className="grid grid-cols-12 gap-12">
          
          {/* Principal Data Matrix: Deep Glassmorphism */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-white/[0.02] border border-white/10 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)]">
              <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                    <MousePointer2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter">Tactical Stream</h2>
                </div>
                <button onClick={fetchSignals} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                   <RefreshCw className="w-4 h-4 text-zinc-500" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[.3em] text-zinc-500">
                      <th className="px-10 py-8">Timestamp</th>
                      <th className="px-10 py-8">Asset Matrix</th>
                      <th className="px-10 py-8">LTP Vector</th>
                      <th className="px-10 py-8 text-right">Targets / SL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {signals.map((sig, i) => (
                      <tr key={i} className="hover:bg-white/[0.03] transition-all group relative">
                        <td className="px-10 py-8 text-xs font-mono text-zinc-500">{sig.Time || sig.Timestamp}</td>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-black text-blue-400 italic tracking-tighter">{sig.Strike}</span>
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" />
                          </div>
                        </td>
                        <td className="px-10 py-8 font-black text-lg">{sig.LTP || sig.Entry_LTP}</td>
                        <td className="px-10 py-8 text-right">
                          <div className="space-y-1">
                            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{sig.T1} <span className="text-zinc-700 mx-1">/</span> {sig.T2}</div>
                            <div className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">Threat: {sig.SL}</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Intel Sidebar: Floating Glass Cards */}
          <div className="col-span-12 lg:col-span-3 space-y-8">
            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 backdrop-blur-2xl p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
               <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
               <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 flex items-center gap-2">
                 <Bell className="w-4 h-4" /> Global Intel
               </h3>
               <div className="space-y-6">
                 {signals.slice(0, 3).map((sig, i) => (
                   <div key={i} className="space-y-2 border-l-2 border-blue-500/30 pl-4 py-1">
                      <div className="text-[10px] font-black text-blue-400 uppercase">{sig.Strike}</div>
                      <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">Structural confirmation lock. Delta expansion imminent.</p>
                   </div>
                 ))}
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* HQ Command Modal: Fluid Glass */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-3xl flex items-center justify-center z-[200] p-12 overflow-y-auto">
          <div className="bg-white/[0.02] border border-white/20 p-12 w-full max-w-2xl rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            <div className="flex items-center gap-4 mb-12">
              <Lock className="w-8 h-8 text-blue-500" />
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Security Protocol</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-8 mb-12">
               <InputBlock label="GitHub Sync" value={gitToken} setter={setGitToken} colSpan={2} />
               <InputBlock label="Groww Secret" value={growwSecret} setter={setGrowwSecret} />
               <InputBlock label="Groww Token" value={growwToken} setter={setGrowwToken} />
               <InputBlock label="Gemini Key" value={geminiKey} setter={setGeminiKey} colSpan={2} />
            </div>

            <div className="flex gap-6">
              <button 
                onClick={saveSettings}
                className="flex-1 bg-white text-black font-black py-6 rounded-3xl hover:bg-blue-500 hover:text-white transition-all uppercase tracking-[.2em] text-xs shadow-xl shadow-white/5 active:scale-95"
              >
                Launch Protocol
              </button>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-10 py-6 border border-white/10 rounded-3xl text-zinc-500 font-black hover:text-white transition-colors"
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

function StatPanel({ icon, label, value, sub }: { icon: React.ReactNode, label: string, value: string, sub: string }) {
  return (
    <div className="group relative bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-white/20 backdrop-blur-3xl p-8 rounded-[2rem] transition-all cursor-default overflow-hidden">
      <div className="absolute bottom-[-10px] right-[-10px] opacity-10 group-hover:opacity-40 transition-opacity transform group-hover:scale-150 duration-700">
         {React.cloneElement(icon as React.ReactElement, { className: "w-16 h-16" })}
      </div>
      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[.3em] mb-3">{label}</h3>
      <div className="text-3xl font-black italic tracking-tighter mb-2">{value}</div>
      <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{sub}</div>
    </div>
  )
}

function InputBlock({ label, value, setter, colSpan = 1 }: { label: string, value: string, setter: (v: string) => void, colSpan?: number }) {
  return (
    <div className={`${colSpan === 2 ? 'col-span-2' : 'col-span-1'} space-y-3`}>
      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2">{label}</label>
      <input 
        type="password"
        value={value}
        onChange={(e) => setter(e.target.value)}
        className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-blue-400 font-mono text-sm focus:outline-none focus:border-blue-600/50 transition-all placeholder:text-zinc-800"
        placeholder="••••••••••••"
      />
    </div>
  )
}
