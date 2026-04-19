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
  Gem,
  Cpu
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
    <main className="min-h-screen text-white font-sans selection:bg-purple-500/30 overflow-x-hidden relative" style={{ backgroundColor: '#020205' }}>
      
      {/* MANUAL NEBULA MESH - INLINE CSS FOR FIDELITY */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-[-10%] right-[-10%] w-[100%] h-[100%] opacity-40 animate-pulse"
          style={{ 
            background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.4) 0%, rgba(30, 58, 138, 0.2) 40%, transparent 70%)',
            filter: 'blur(120px)'
          }}
        />
        <div 
          className="absolute bottom-[-10%] left-[-10%] w-[80%] h-[80%] opacity-30"
          style={{ 
            background: 'radial-gradient(circle at center, rgba(30, 64, 175, 0.4) 0%, rgba(17, 24, 39, 0.1) 60%, transparent 80%)',
            filter: 'blur(140px)'
          }}
        />
        <div 
          className="absolute top-[20%] left-[20%] w-[400px] h-[400px] opacity-20"
          style={{ 
            background: 'radial-gradient(circle at center, rgba(56, 189, 248, 0.3) 0%, transparent 70%)',
            filter: 'blur(100px)'
          }}
        />
      </div>

      {/* FLOATING ART OBJECTS */}
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <div className="absolute top-[10%] right-[15%] w-32 h-32 bg-white/5 rounded-full backdrop-blur-3xl border border-white/10 animate-bounce" style={{ animationDuration: '10s' }} />
        <div className="absolute bottom-[30%] left-[10%] w-48 h-48 bg-purple-500/5 rounded-full backdrop-blur-3xl border border-white/5" />
      </div>

      <nav className="h-28 flex items-center justify-between px-20 relative z-[100]">
        <div className="flex items-center gap-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              <Shield className="w-7 h-7 text-black font-black" />
            </div>
            <span className="text-3xl font-black tracking-tighter uppercase italic leading-none">MaxG<span className="text-zinc-500">_SENTINEL</span></span>
          </div>
          <div className="hidden lg:flex items-center gap-10 text-[10px] font-black uppercase tracking-[0.5em] text-zinc-500">
            <span className="text-white hover:text-purple-400 cursor-pointer transition-all">Intelligence</span>
            <span className="hover:text-white transition-all cursor-pointer">The Vault</span>
            <span className="hover:text-white transition-all cursor-pointer">Protocol</span>
          </div>
        </div>
        
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="w-16 h-16 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all shadow-xl"
        >
          <Settings className="w-6 h-6 text-zinc-400" />
        </button>
      </nav>

      <div className="relative z-10 max-w-[1600px] mx-auto px-20 py-20 pb-40">
        <div className="grid grid-cols-12 gap-24 items-start">
          
          {/* HERO SECTION - REPLICATING "POWERFUL. COLORFUL. WONDERFUL." */}
          <div className="col-span-12 lg:col-span-7 space-y-16">
            <div className="space-y-6">
               <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-purple-500/10 rounded-full border border-purple-500/30">
                  <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Tactical Core Synced</span>
               </div>
               <h1 className="text-[11rem] font-black leading-[0.85] tracking-tight uppercase" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.05)' }}>
                  Heavy.<br />
                  <span className="italic" style={{ background: 'linear-gradient(135deg, #fff 30%, #a855f7 60%, #3b82f6 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Capture.
                  </span>
               </h1>
               <p className="text-zinc-500 text-3xl font-medium max-w-2xl leading-normal">
                 Institutional alpha capture platform engineered for asymmetric multi-regime monitoring.
               </p>
            </div>

            <div className="flex gap-10 pt-4">
               <button className="group flex items-center h-24 bg-white text-black px-12 rounded-[2.5rem] font-black uppercase tracking-[.2em] text-sm hover:scale-105 transition-all shadow-[0_30px_60px_-15px_rgba(255,255,255,0.3)]">
                 Regime Hub <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform" />
               </button>
               <button className="h-24 px-12 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-3xl font-black uppercase tracking-[.2em] text-sm hover:bg-white/10 transition-all">
                 System.Vault
               </button>
            </div>

            <div className="grid grid-cols-3 gap-16 pt-20 border-t border-white/5">
               <StatNode icon={<TrendingUp className="text-purple-400" />} label="Alpha Gain" value="+₹24,423" />
               <StatNode icon={<Activity className="text-blue-400" />} label="Confidence" value="89.4%" />
               <StatNode icon={<Cpu className="text-teal-400" />} label="Latency" value="9ms" />
            </div>
          </div>

          {/* FLOATING GLASS MATRIX */}
          <div className="col-span-12 lg:col-span-5 relative group">
              <div className="absolute -inset-20 bg-purple-500/20 blur-[120px] rounded-full opacity-50 animate-pulse pointer-events-none" />
              <div className="relative bg-white/[0.04] border border-white/10 backdrop-blur-[80px] rounded-[5rem] p-16 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-t-white/30 overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none" />
                  
                  <div className="flex items-center justify-between mb-16">
                     <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[.4em] text-zinc-500 mb-2 italic">Active Feed</h3>
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Operational <br /> Matrix.</h2>
                     </div>
                     <RefreshCw onClick={fetchSignals} className="w-6 h-6 text-zinc-500 hover:text-white transition-all cursor-pointer" />
                  </div>

                  <div className="space-y-4">
                     {signals.slice(0, 5).map((sig, i) => (
                       <div key={i} className="flex items-center justify-between p-8 bg-black/20 border border-white/5 rounded-[3rem] hover:bg-white/10 transition-all cursor-pointer group/row">
                          <div className="flex items-center gap-8">
                             <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center transform group-hover/row:scale-110 transition-all shadow-xl">
                                <Zap className="w-6 h-6 text-purple-400" />
                             </div>
                             <div>
                                <div className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{sig.Time || sig.Timestamp}</div>
                                <div className="text-2xl font-black italic tracking-tighter uppercase text-white tracking-widest leading-none">{sig.Strike}</div>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className="text-[10px] font-black uppercase text-zinc-600 mb-1">Vector</div>
                             <div className="text-3xl font-black italic text-zinc-100">{sig.LTP || sig.Entry_LTP}</div>
                          </div>
                       </div>
                     ))}
                     {signals.length === 0 && (
                       <div className="py-24 text-center space-y-4 opacity-30 italic">
                          <RefreshCw className="w-8 h-8 mx-auto animate-spin" />
                          <p className="text-xs font-black uppercase tracking-[.3em]">Scanning Multiverse...</p>
                       </div>
                     )}
                  </div>
              </div>
          </div>
        </div>
      </div>

      {/* MANUAL OVERRIDE SECURITY MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-[100px] flex items-center justify-center z-[200] p-12 overflow-y-auto">
          <div className="bg-[#050510] border border-white/20 p-24 w-full max-w-5xl rounded-[6rem] shadow-[0_0_120px_rgba(139,92,246,0.3)] relative text-center">
             <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full" />
             <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full" />
             
             <div className="w-32 h-32 bg-white rounded-[3rem] flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-12 mx-auto">
                <Lock className="w-12 h-12 text-black" />
             </div>
             
             <h2 className="text-7xl font-black tracking-tighter uppercase italic mb-4">Security Headquarters</h2>
             <p className="text-zinc-500 font-black uppercase tracking-[.6em] text-xs mb-20">Credential Matrix Synchronization</p>

             <div className="grid grid-cols-2 gap-x-12 gap-y-12 w-full text-left mb-20 px-8">
               <ApexInput label="GitHub Master" value={gitToken} setter={setGitToken} colSpan={2} />
               <ApexInput label="Groww Secret" value={growwSecret} setter={setGrowwSecret} />
               <ApexInput label="Groww Token" value={growwToken} setter={setGrowwToken} />
               <ApexInput label="Gemini AI Manifest" value={geminiKey} setter={setGeminiKey} colSpan={2} />
             </div>

             <div className="flex gap-10 justify-center">
                <button 
                  onClick={saveSettings}
                  className="h-28 bg-white text-black px-24 rounded-[3rem] font-black uppercase text-sm tracking-widest hover:scale-105 transition-all shadow-2xl"
                >
                  Authorize Sync
                </button>
                <button onClick={() => setIsSettingsOpen(false)} className="px-12 py-6 text-xs font-black uppercase text-zinc-500 hover:text-white transition-all">Dismiss</button>
             </div>
          </div>
        </div>
      )}
    </main>
  );
}

function StatNode({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="space-y-6 group cursor-default">
       <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl flex items-center justify-center shadow-lg group-hover:bg-white/10 transition-all">
          {React.cloneElement(icon as React.ReactElement, { className: "w-8 h-8" })}
       </div>
       <div className="space-y-1">
         <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[.4em] leading-none mb-2">{label}</h4>
         <div className="text-5xl font-black italic tracking-tighter text-white group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-purple-500 transition-all">
          {value}
         </div>
       </div>
    </div>
  )
}

function ApexInput({ label, value, setter, colSpan = 1 }: { label: string, value: string, setter: (v: string) => void, colSpan?: number }) {
  return (
    <div className={`${colSpan === 2 ? 'col-span-2' : 'col-span-1'} space-y-4`}>
       <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[.6em] pl-10 italic">{label}</label>
       <input 
         type="password"
         value={value}
         onChange={(e) => setter(e.target.value)}
         className="w-full bg-white/5 border border-white/10 p-10 rounded-[3.5rem] text-purple-400 font-mono text-lg focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all"
         placeholder="••••••••••••"
       />
    </div>
  )
}
