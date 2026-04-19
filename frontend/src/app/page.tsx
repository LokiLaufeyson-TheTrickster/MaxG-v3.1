"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  Settings, 
  TrendingUp, 
  Activity, 
  Cpu, 
  Lock, 
  ArrowRight, 
  RefreshCw,
  Zap,
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

// --- CANVAS PARTICLE ENGINE ---
const ParticleSystem = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: any[] = [];
    const particleCount = 60;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    class Particle {
      x: number; y: number; vx: number; vy: number; size: number;
      constructor(w: number, h: number) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
        ctx.fill();
      }
    }

    const init = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) particles.push(new Particle(canvas.width, canvas.height));
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    init();
    animate();

    return () => window.removeEventListener('resize', resize);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

export default function Dashboard() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Credentials
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
    }
  };

  useEffect(() => {
    fetchSignals();
    const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouse);
    setGitToken(localStorage.getItem("maxg_gh_token") || "");
    setGrowwSecret(localStorage.getItem("maxg_groww_secret") || "");
    setGrowwToken(localStorage.getItem("maxg_groww_token") || "");
    setGeminiKey(localStorage.getItem("maxg_gemini_key") || "");
    return () => window.removeEventListener('mousemove', handleMouse);
  }, []);

  const saveSettings = () => {
    localStorage.setItem("maxg_gh_token", gitToken);
    localStorage.setItem("maxg_groww_secret", growwSecret);
    localStorage.setItem("maxg_groww_token", growwToken);
    localStorage.setItem("maxg_gemini_key", geminiKey);
    setIsSettingsOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#07080B] text-[#E4E4E7] font-sans selection:bg-indigo-500/30 overflow-x-hidden relative">
      
      <ParticleSystem />

      {/* CURSOR SPOTLIGHT */}
      <div 
        className="fixed pointer-events-none z-10 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full transition-opacity duration-500"
        style={{ left: mousePos.x - 300, top: mousePos.y - 300 }}
      />

      <nav className="h-20 flex items-center justify-between px-12 relative z-[100] border-b border-white/5 bg-[#07080B]/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">MAXG <span className="text-zinc-500 font-normal underline decoration-indigo-500 underline-offset-4">SENTINEL</span></span>
        </div>
        
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all text-zinc-400 hover:text-white"
        >
          <Settings className="w-5 h-5" />
        </button>
      </nav>

      <div className="max-w-[1400px] mx-auto p-12 space-y-12 relative z-20">
        
        {/* HERO SECTION */}
        <div className="space-y-4">
           <h1 className="text-8xl font-black tracking-tightest leading-none">
             FLUID <span className="text-indigo-500 italic">ALPHA.</span>
           </h1>
           <p className="text-zinc-500 text-xl max-w-2xl font-medium antialiased text-balance">
             Structural intelligence capture engine. Scaled via asymmetric multi-regime monitoring and Gemini-Flash precision.
           </p>
        </div>

        {/* DATA MODULES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <FluidCard icon={<TrendingUp />} label="Captured Alpha" value="+₹24,423" color="indigo" />
           <FluidCard icon={<Activity />} label="Trend Lock" value="89.4%" color="purple" />
           <FluidCard icon={<Cpu />} label="Engine Latency" value="9ms" color="emerald" />
        </div>

        <div className="grid grid-cols-12 gap-8">
           {/* SIGNAL STREAM */}
           <div className="col-span-12 lg:col-span-8 bg-zinc-900/40 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl group-hover:bg-indigo-500/20 transition-all" />
              <div className="flex items-center justify-between mb-10">
                 <h2 className="text-3xl font-bold tracking-tight italic">Operational <span className="text-indigo-500">Stream.</span></h2>
                 <RefreshCw onClick={fetchSignals} className="w-5 h-5 text-zinc-600 cursor-pointer hover:text-white transition-colors" />
              </div>

              <div className="space-y-4">
                 {signals.map((sig, i) => (
                   <div key={i} className="flex items-center justify-between p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.05] transition-all group/row">
                      <div className="flex items-center gap-6">
                         <div className="text-sm font-mono text-zinc-600">{sig.Time || sig.Timestamp}</div>
                         <div className="text-xl font-bold tracking-tight underline decoration-indigo-500/50 decoration-2 underline-offset-4 uppercase">{sig.Strike}</div>
                      </div>
                      <div className="text-2xl font-bold text-zinc-100 italic tracking-tighter">{sig.LTP || sig.Entry_LTP}</div>
                   </div>
                 ))}
                 {signals.length === 0 && <div className="py-20 text-center text-zinc-600">Scanning market structural regimes...</div>}
              </div>
           </div>

           {/* INTEL FEED */}
           <div className="col-span-12 lg:col-span-4 bg-zinc-900/40 border border-white/5 backdrop-blur-3xl rounded-[2.5rem] p-10 flex flex-col justify-between">
              <div>
                 <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-8">AI Intelligence</h3>
                 <div className="space-y-6">
                    {signals.slice(0, 3).map((sig, i) => (
                      <p key={i} className="text-sm text-zinc-400 leading-relaxed border-l-2 border-indigo-500 pl-4">
                        Structural 9-EMA pullback confirmed on {sig.Strike}. Regime delta is positive.
                      </p>
                    ))}
                 </div>
              </div>
              <button className="mt-12 w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-sm tracking-widest uppercase transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                 View Live Audit
              </button>
           </div>
        </div>
      </div>

      {/* SECURITY HQ MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-3xl flex items-center justify-center z-[200] p-6">
          <div className="bg-zinc-900 border border-zinc-800 p-12 w-full max-w-2xl rounded-[3rem] shadow-2xl relative">
             <div className="flex items-center gap-4 mb-10">
                <Lock className="w-8 h-8 text-indigo-500" />
                <h2 className="text-3xl font-bold tracking-tighter italic">Auth HQ.</h2>
             </div>
             
             <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="col-span-2">
                   <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2 mb-2 block">GitHub Personal Access Token</label>
                   <input type="password" value={gitToken} onChange={(e) => setGitToken(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-indigo-400 font-mono text-sm focus:outline-none focus:border-indigo-600/50" />
                </div>
                <div className="col-span-1">
                   <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2 mb-2 block">Groww Secret</label>
                   <input type="password" value={growwSecret} onChange={(e) => setGrowwSecret(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-indigo-400 font-mono text-sm focus:outline-none focus:border-indigo-600/50" />
                </div>
                <div className="col-span-1">
                   <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2 mb-2 block">Groww Session</label>
                   <input type="password" value={growwToken} onChange={(e) => setGrowwToken(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-indigo-400 font-mono text-sm focus:outline-none focus:border-indigo-600/50" />
                </div>
                <div className="col-span-2">
                   <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2 mb-2 block">Gemini API Audit Key</label>
                   <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-indigo-400 font-mono text-sm focus:outline-none focus:border-indigo-600/50" />
                </div>
             </div>

             <div className="flex gap-4">
                <button onClick={saveSettings} className="flex-1 py-5 bg-indigo-600 rounded-2xl font-bold text-sm tracking-widest uppercase">Save Authentication</button>
                <button onClick={() => setIsSettingsOpen(false)} className="px-10 py-5 text-zinc-500 font-bold">Abort</button>
             </div>
          </div>
        </div>
      )}
    </main>
  );
}

function FluidCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string, color: string }) {
  const colorMap: any = {
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-3xl p-8 rounded-[2rem] hover:border-white/20 transition-all group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${colorMap[color]}`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
      </div>
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{label}</h3>
      <div className="text-3xl font-bold tracking-tighter">{value}</div>
    </div>
  )
}
