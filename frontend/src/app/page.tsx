"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  ArrowUpRight, 
  ChevronRight,
  RefreshCw,
  Lock,
  ArrowRight,
  TrendingUp,
  Zap,
  Activity,
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
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

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
    setGitToken(localStorage.getItem("maxg_gh_token") || "");
    setGrowwSecret(localStorage.getItem("maxg_groww_secret") || "");
    setGrowwToken(localStorage.getItem("maxg_groww_token") || "");
    setGeminiKey(localStorage.getItem("maxg_gemini_key") || "");
  }, []);

  const saveSettings = () => {
    localStorage.setItem("maxg_gh_token", gitToken);
    localStorage.setItem("maxg_groww_secret", growwSecret);
    localStorage.setItem("maxg_groww_token", growwToken);
    localStorage.setItem("maxg_gemini_key", geminiKey);
    setIsSettingsOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#050510] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
      
      {/* BACKGROUND NEBULA/BLOB EFFECTS */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[80%] bg-blue-600/10 blur-[180px] rounded-full" />
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* MINIMALIST NAV BAR */}
      <nav className="h-24 flex items-center justify-between px-16 relative z-[100]">
        <div className="flex items-center gap-12">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tighter uppercase italic">MAXG.<span className="text-zinc-500">SENTINEL</span></span>
          </div>
          <div className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            <span className="text-white border-b-2 border-purple-500 pb-1 cursor-pointer">Intelligence</span>
            <span className="hover:text-white transition-colors cursor-pointer">Vault</span>
            <span className="hover:text-white transition-colors cursor-pointer">Regime</span>
            <span className="hover:text-white transition-colors cursor-pointer">AIP_Core</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all"
           >
             <Settings className="w-5 h-5 text-zinc-400" />
           </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-[1500px] mx-auto px-16 py-12">
        <div className="grid grid-cols-12 gap-16 items-start">
          
          {/* LEFT: HERO TEXT & ALPHA METRIC */}
          <div className="col-span-12 lg:col-span-6 space-y-12">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 bg-purple-500 rounded-full animate-ping" />
                 <span className="text-[10px] uppercase font-black tracking-[0.4em] text-purple-500">Operation Sentinel Active</span>
               </div>
               <h1 className="text-8xl font-black tracking-tighter italic leading-[0.9] uppercase bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-zinc-700">
                 Structural <br /> 
                 Wizardry <br />
                 & Capture.
               </h1>
               <p className="text-zinc-500 text-lg max-w-md font-medium leading-relaxed">
                 Giving institutional precision an asymmetric edge through continuous Gaussian multi-regime monitoring.
               </p>
            </div>

            <div className="flex gap-4">
               <button className="flex items-center">
                 <span className="bg-[#0A0A1A] border border-white/10 px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white/5 transition-all">Regime Analysis</span>
                 <span className="bg-white text-black px-6 py-4 border border-white/10">
                   <ArrowRight className="w-5 h-5" />
                 </span>
               </button>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-12 border-t border-white/5">
                <MetricBlock icon={<TrendingUp className="text-purple-400" />} label="Alpha Gain" value="+₹24,423" />
                <MetricBlock icon={<Activity className="text-blue-400" />} label="Persistence" value="6/6 CRITICAL" />
            </div>
          </div>

          {/* RIGHT: FLOATING GLASS CARD (TACTICAL MATRIX) */}
          <div className="col-span-12 lg:col-span-6 relative group">
            <div className="absolute -inset-10 bg-gradient-to-br from-purple-500/20 to-blue-500/10 blur-[80px] opacity-30 group-hover:opacity-60 transition duration-1000" />
            
            <div className="relative bg-white/[0.03] border border-white/10 backdrop-blur-[40px] rounded-[3rem] shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
              <div className="px-10 py-10 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Intelligence Flow</h3>
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase">Tactical Matrix</h2>
                </div>
                <RefreshCw onClick={fetchSignals} className="w-5 h-5 text-zinc-600 cursor-pointer hover:rotate-180 transition-transform duration-700" />
              </div>

              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">
                      <th className="px-10 py-8">Coordinate</th>
                      <th className="px-10 py-8">Asset</th>
                      <th className="px-10 py-8 text-right">LTP Capture</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {signals.map((sig, i) => (
                      <tr key={i} className="hover:bg-white/[0.04] transition-all group">
                         <td className="px-10 py-10 text-xs font-mono text-zinc-500 italic">{sig.Time || sig.Timestamp}</td>
                         <td className="px-10 py-10 font-black italic uppercase text-lg group-hover:text-purple-400 transition-colors">{sig.Strike}</td>
                         <td className="px-10 py-10 text-right font-black text-xl text-zinc-100">{sig.LTP || sig.Entry_LTP}</td>
                      </tr>
                    ))}
                    {signals.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-10 py-40 text-center">
                          <div className="flex flex-col items-center gap-4 opacity-20 italic">
                             <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 animate-pulse">
                                <Zap />
                             </div>
                             <p className="text-sm">Scanning market regimes for wizardry entry points...</p>
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
      </div>

      {/* WIZARDRY CONFIG MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[200] p-12">
          <div className="bg-[#050510] border border-white/10 p-16 w-full max-w-3xl rounded-[4rem] shadow-[0_0_100px_rgba(118,60,255,0.2)] relative overflow-hidden text-center">
             <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
             
             <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-4">Access Control</h2>
             <p className="text-zinc-500 font-medium mb-12 uppercase tracking-widest text-[10px]">Credential Authorization Required</p>

             <div className="grid grid-cols-2 gap-10 text-left mb-16">
               <WizardryInput label="GitHub Master Token" value={gitToken} setter={setGitToken} colSpan={2} />
               <WizardryInput label="Groww Secret" value={growwSecret} setter={setGrowwSecret} />
               <WizardryInput label="Groww Token" value={growwToken} setter={setGrowwToken} />
               <WizardryInput label="Gemini AIP Master" value={geminiKey} setter={setGeminiKey} colSpan={2} />
             </div>

             <div className="flex gap-8 justify-center">
               <button 
                 onClick={saveSettings}
                 className="bg-white text-black px-12 py-6 text-xs font-black uppercase tracking-[0.3em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
               >
                 Launch Platform
               </button>
               <button 
                 onClick={() => setIsSettingsOpen(false)}
                 className="px-12 py-6 text-xs font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors"
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

function MetricBlock({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-4">
      <div className="w-12 h-12 bg-white/[0.02] border border-white/10 rounded-2xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{label}</h4>
        <div className="text-3xl font-black italic tracking-tighter">{value}</div>
      </div>
    </div>
  )
}

function WizardryInput({ label, value, setter, colSpan = 1 }: { label: string, value: string, setter: (v: string) => void, colSpan?: number }) {
  return (
    <div className={`${colSpan === 2 ? 'col-span-2' : 'col-span-1'} space-y-4`}>
       <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest pl-4">{label}</label>
       <input 
         type="password"
         value={value}
         onChange={(e) => setter(e.target.value)}
         className="w-full bg-white/[0.02] border border-white/5 p-6 rounded-3xl text-purple-400 font-mono text-sm focus:outline-none focus:border-purple-500/50 transition-all"
         placeholder="••••••••••••"
       />
    </div>
  )
}
