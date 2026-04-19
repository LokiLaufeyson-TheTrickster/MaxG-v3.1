"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  ArrowUpRight, 
  RefreshCw,
  Lock,
  ArrowRight,
  TrendingUp,
  Zap,
  Activity,
  Box,
  Circle,
  Gem
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
    <main className="min-h-screen bg-[#020205] text-white font-sans selection:bg-purple-500/30 overflow-x-hidden relative">
      
      {/* DYNAMIC MESH BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[80%] bg-gradient-to-br from-indigo-900 via-purple-900 to-transparent blur-[160px] animate-pulse rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-gradient-to-tr from-blue-900 via-teal-900 to-transparent blur-[160px] rounded-full" />
        <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-sky-500/10 blur-[100px] rounded-full" />
      </div>

      {/* FLOATING 3D-ISH LUMENS */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        <div className="absolute top-[15%] right-[10%] w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[20%] left-[5%] w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* MINIMALIST AURA NAV */}
      <nav className="h-28 flex items-center justify-between px-20 relative z-[100]">
        <div className="flex items-center gap-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tightest uppercase bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40">MaxG Sentinel.</span>
          </div>
          <div className="hidden lg:flex items-center gap-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
             <span className="text-white relative cursor-pointer group">
               Intelligence
               <span className="absolute -bottom-2 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500 to-blue-500" />
             </span>
             <span className="hover:text-white transition-all cursor-pointer">The Vault</span>
             <span className="hover:text-white transition-all cursor-pointer">Protocol</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
           <button 
             onClick={() => setIsSettingsOpen(true)}
             className="w-14 h-14 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-90"
           >
             <Settings className="w-6 h-6 text-white/60" />
           </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-[1600px] mx-auto px-20 py-12 space-y-24">
        
        {/* HERO SECTION: POWERFUL. COLORFUL. WONDERFUL. */}
        <div className="grid grid-cols-12 gap-20 items-center">
            <div className="col-span-12 lg:col-span-7 space-y-12">
               <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full border border-purple-500/20">
                     <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" />
                     <span className="text-[10px] uppercase font-black tracking-widest text-purple-400">Secure Live Node</span>
                  </div>
                  <h1 className="text-[10rem] font-black leading-[0.8] tracking-tighter uppercase mb-2">
                    Alpha. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-400 via-blue-400 to-emerald-400">Captured.</span>
                  </h1>
                  <p className="text-white/40 text-2xl font-medium max-w-xl leading-relaxed">
                    Institutional structural intelligence scaled through asymmetric multi-regime monitoring.
                  </p>
               </div>

               <div className="flex gap-6">
                  <button className="h-20 bg-white text-black px-12 rounded-[2rem] font-black flex items-center gap-4 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/10 uppercase tracking-widest text-xs">
                    Regime Insight <ArrowRight className="w-6 h-6" />
                  </button>
                  <button className="h-20 bg-white/5 border border-white/10 backdrop-blur-xl px-12 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all">
                    System Hub
                  </button>
               </div>

               <div className="grid grid-cols-3 gap-12 pt-16 border-t border-white/5">
                  <StatBlock icon={<TrendingUp className="text-purple-400" />} label="Alpha PnL" value="+₹24,423" />
                  <StatBlock icon={<Activity className="text-blue-400" />} label="Confidence" value="89.4%" />
                  <StatBlock icon={<Zap className="text-emerald-400" />} label="Execution" value="9ms" />
               </div>
            </div>

            {/* FLOATING HYPER-GLASS CARD */}
            <div className="col-span-12 lg:col-span-5 relative group">
                <div className="absolute -inset-20 bg-gradient-to-br from-purple-500/30 via-blue-500/20 to-emerald-500/10 blur-[120px] rounded-full opacity-60 animate-pulse" />
                <div className="relative bg-white/5 border border-white/10 backdrop-blur-[60px] rounded-[4rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.5)] border-t-white/30 border-l-white/20">
                    <div className="flex items-center justify-between mb-12">
                       <div>
                          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white/30 mb-2">Tactical Loop</h3>
                          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Operational Matrix</h2>
                       </div>
                       <div onClick={fetchSignals} className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 cursor-pointer hover:rotate-180 transition-all duration-700">
                         <RefreshCw className="w-5 h-5 text-white/60" />
                       </div>
                    </div>

                    <div className="space-y-6">
                       {signals.slice(0, 5).map((sig, i) => (
                         <div key={i} className="flex items-center justify-between p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all cursor-pointer group/row">
                            <div className="flex items-center gap-6">
                               <div className="w-14 h-14 bg-gradient-to-br from-white/10 to-transparent rounded-2xl flex items-center justify-center border border-white/10 group-hover/row:scale-110 transition-transform">
                                  <Box className="w-6 h-6 text-purple-400" />
                               </div>
                               <div>
                                  <div className="text-[10px] font-black uppercase text-white/40 tracking-widest">{sig.Time || sig.Timestamp}</div>
                                  <div className="text-xl font-black italic tracking-tighter uppercase group-hover/row:text-purple-400 transition-colors">{sig.Strike}</div>
                               </div>
                            </div>
                            <div className="text-right">
                               <div className="text-xs font-black uppercase text-white/40 mb-1">Capture</div>
                               <div className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">{sig.LTP || sig.Entry_LTP}</div>
                            </div>
                         </div>
                       ))}
                       {signals.length === 0 && (
                         <div className="py-24 text-center space-y-4 opacity-30">
                            <Gem className="w-12 h-12 mx-auto animate-bounce" />
                            <p className="text-xs font-black uppercase tracking-[.4em]">Searching Market Regimes...</p>
                         </div>
                       )}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* AURA CONFIG MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center z-[200] p-12">
          <div className="bg-[#05050A] border border-white/10 p-20 w-full max-w-4xl rounded-[5rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
             <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full" />
             <div className="absolute bottom-[-20%] left-[-20%] w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full" />
             
             <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-[2.5rem] flex items-center justify-center shadow-xl shadow-purple-500/40 mb-10">
                <Lock className="w-10 h-10 text-white" />
             </div>
             
             <h2 className="text-6xl font-black tracking-tighter uppercase mb-4 italic">Security HQ</h2>
             <p className="text-white/30 font-bold uppercase tracking-[0.5em] text-xs mb-16 underline decoration-purple-500 underline-offset-8">Multi-Vector Authorization</p>

             <div className="grid grid-cols-2 gap-x-12 gap-y-10 w-full text-left mb-16">
               <AuraInput label="GitHub Master" value={gitToken} setter={setGitToken} colSpan={2} />
               <AuraInput label="Groww Secret" value={growwSecret} setter={setGrowwSecret} />
               <AuraInput label="Groww Token" value={growwToken} setter={setGrowwToken} />
               <AuraInput label="Gemini Master" value={geminiKey} setter={setGeminiKey} colSpan={2} />
             </div>

             <div className="flex gap-10">
                <button 
                  onClick={saveSettings}
                  className="h-24 bg-white text-black px-20 rounded-[2.5rem] font-black uppercase text-sm tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/10"
                >
                  Confirm Synch
                </button>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-14 py-6 text-xs font-black uppercase tracking-widest text-white/30 hover:text-white transition-all"
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

function StatBlock({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-4 group cursor-default">
       <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-[1.5rem] flex items-center justify-center group-hover:bg-white/10 transition-all">
          {icon}
       </div>
       <div>
         <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">{label}</h4>
         <div className="text-4xl font-black italic tracking-tighter text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/40 transition-all">
          {value}
         </div>
       </div>
    </div>
  )
}

function AuraInput({ label, value, setter, colSpan = 1 }: { label: string, value: string, setter: (v: string) => void, colSpan?: number }) {
  return (
    <div className={`${colSpan === 2 ? 'col-span-2' : 'col-span-1'} space-y-4`}>
       <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] pl-6 italic">{label}</label>
       <input 
         type="password"
         value={value}
         onChange={(e) => setter(e.target.value)}
         className="w-full bg-white/5 border border-white/5 p-8 rounded-[2.5rem] text-purple-400 font-mono text-sm focus:outline-none focus:border-purple-500/40 focus:bg-white/10 transition-all"
         placeholder="••••••••••••"
       />
    </div>
  )
}
