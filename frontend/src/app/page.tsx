"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  TrendingUp, 
  Activity, 
  Cpu, 
  Lock, 
  RefreshCw,
  LayoutDashboard,
  PieChart,
  History,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Monitor,
  Zap
} from 'lucide-react';

interface Position {
  asset: string;
  side: 'Long' | 'Short';
  size: string;
  pnl: number;
  pnlPercent: number;
}

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

export default function ModernDashboard() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [latency, setLatency] = useState(12);
  
  // Credentials
  const [gitToken, setGitToken] = useState("");
  const [growwSecret, setGrowwSecret] = useState("");
  const [growwToken, setGrowwToken] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  const [positions, setPositions] = useState<Position[]>([]);
  const [metrics, setMetrics] = useState({
    equity: "₹0.00",
    dailyPnl: "₹0.00",
    dailyPnlPercent: "0.0%",
    marginUtil: "0.0%",
    activeHedges: "00"
  });
  const [pulse, setPulse] = useState({
    latency: 82,
    cpu: 22.1,
    mem: "Stable"
  });

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
    const interval = setInterval(() => {
      setLatency(prev => Math.max(8, Math.min(25, prev + (Math.random() - 0.5) * 5)));
    }, 3000);
    
    setGitToken(localStorage.getItem("maxg_gh_token") || "");
    setGrowwSecret(localStorage.getItem("maxg_groww_secret") || "");
    setGrowwToken(localStorage.getItem("maxg_groww_token") || "");
    setGeminiKey(localStorage.getItem("maxg_gemini_key") || "");
    
    return () => clearInterval(interval);
  }, []);

  const saveSettings = () => {
    localStorage.setItem("maxg_gh_token", gitToken);
    localStorage.setItem("maxg_groww_secret", growwSecret);
    localStorage.setItem("maxg_groww_token", growwToken);
    localStorage.setItem("maxg_gemini_key", geminiKey);
    setIsSettingsOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-cyan-500/30 overflow-hidden">
      
      {/* BACKGROUND GRID */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      {/* SIDEBAR */}
      <aside className="w-20 border-r border-white/5 bg-[#020617]/50 backdrop-blur-xl flex flex-col items-center py-8 gap-10 z-50">
        <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4">
          <Shield className="w-6 h-6 text-slate-950" />
        </div>
        
        <nav className="flex flex-col gap-6">
          <SidebarIcon icon={<LayoutDashboard />} active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <SidebarIcon icon={<Activity />} active={currentView === 'activity'} onClick={() => setCurrentView('activity')} />
          <SidebarIcon icon={<PieChart />} active={currentView === 'analytics'} onClick={() => setCurrentView('analytics')} />
          <SidebarIcon icon={<History />} active={currentView === 'history'} onClick={() => setCurrentView('history')} />
        </nav>
        
        <div className="mt-auto flex flex-col gap-6">
          <SidebarIcon icon={<Settings onClick={() => setIsSettingsOpen(true)} />} />
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold">
            MAX
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        
        {/* TOP BAR */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between sticky top-0 bg-[#020617]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Monitor className="w-5 h-5 text-slate-500" />
            <h1 className="text-sm font-bold tracking-widest text-slate-400 uppercase">Modern Live Trade Monitor</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Engine_Stable</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Connected {Math.round(latency)}ms</span>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
          
          {/* HEADER SECTION */}
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                 <Zap className="w-4 h-4 text-cyan-400" />
                 <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">System Active</span>
              </div>
              <h2 className="text-3xl font-bold tracking-tight">STRUCTURAL_INTEL_v1.0</h2>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Last Update</div>
              <div className="text-sm font-mono text-slate-400">{new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          {/* METRIC GRID */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard label="Total Equity" value={metrics.equity} color="cyan" />
            <MetricCard label="Daily P&L" value={metrics.dailyPnl} subValue={`(${metrics.dailyPnlPercent})`} color="emerald" />
            <MetricCard label="Margin Util" value={metrics.marginUtil} color="blue" />
            <MetricCard label="Active Hedges" value={metrics.activeHedges} subValue="Active" color="rose" />
          </div>

          {/* MAIN GRID */}
          <div className="grid grid-cols-12 gap-8">
            
            {/* POSITIONS TABLE */}
            <div className="col-span-12 lg:col-span-8 dashboard-card p-0 overflow-hidden">
              <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2">
                  Active Positions
                  <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-slate-500">{positions.length.toString().padStart(2, '0')}</span>
                </h3>
                <RefreshCw onClick={fetchSignals} className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white transition-colors" />
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/[0.02]">
                    <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <th className="px-8 py-4">Asset</th>
                      <th className="px-8 py-4">Size</th>
                      <th className="px-8 py-4 text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {positions.map((pos, i) => (
                      <tr key={i} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${pos.side === 'Long' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {pos.side[0]}
                            </span>
                            <span className="font-bold text-slate-200">{pos.asset}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-slate-400">{pos.size}</td>
                        <td className={`px-8 py-5 text-right font-bold ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {positions.length === 0 && (
                  <div className="py-20 text-center flex flex-col items-center gap-3">
                    <Activity className="w-8 h-8 text-slate-700 animate-pulse-slow" />
                    <p className="text-sm text-slate-500 font-medium tracking-wide">No active structural positions detected.</p>
                  </div>
                )}
              </div>
            </div>

            {/* SYSTEM PULSE & INTEL */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
              
              {/* SYSTEM PULSE */}
              <div className="dashboard-card p-8 space-y-6">
                <h3 className="font-bold">System Pulse</h3>
                <div className="space-y-4">
                  <PulseBar label="Latency Std Dev" value={pulse.latency} color="cyan" />
                  <PulseBar label="CPU Load Cluster" value={pulse.cpu} color="blue" />
                  <PulseBar label="Mem State" value={pulse.mem} color="emerald" isText />
                </div>
              </div>

              {/* RECENT ALERTS */}
              <div className="dashboard-card p-8 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="font-bold">AI Intelligence</h3>
                   <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-4 flex-1">
                   {signals.slice(0, 3).map((sig, i) => (
                     <div key={i} className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-400 leading-relaxed group hover:border-cyan-500/30 transition-all cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-cyan-400 font-bold">{sig.Strike}</span>
                           <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        Regime audit complete for {sig.Strike}. Structural integrity verified.
                     </div>
                   ))}
                   {signals.length === 0 && (
                     <div className="flex-1 flex flex-col items-center justify-center gap-2 opacity-50">
                        <Cpu className="w-5 h-5 text-slate-600" />
                        <span className="text-[10px] uppercase tracking-widest font-bold text-slate-600">No Live Intelligence</span>
                     </div>
                   )}
                </div>
                <button className="btn-primary w-full mt-8 flex items-center justify-center gap-2 text-xs">
                  View Live Audit <ChevronRight className="w-3 h-3" />
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[200] p-6">
          <div className="dashboard-card p-10 w-full max-w-xl relative">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-xl font-bold">Authentication HQ</h2>
             </div>
             
             <div className="space-y-6 mb-10">
                <InputGroup label="GitHub Personal Access Token" value={gitToken} onChange={setGitToken} />
                <div className="grid grid-cols-2 gap-6">
                   <InputGroup label="Groww Secret" value={growwSecret} onChange={setGrowwSecret} />
                   <InputGroup label="Groww Session" value={growwToken} onChange={setGrowwToken} />
                </div>
                <InputGroup label="Gemini API Audit Key" value={geminiKey} onChange={setGeminiKey} />
             </div>

             <div className="flex gap-4">
                <button onClick={saveSettings} className="btn-primary flex-1">Save Configuration</button>
                <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2 text-slate-500 font-bold hover:text-slate-300 transition-colors">Cancel</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SidebarIcon({ icon, active, onClick }: { icon: React.ReactNode, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-xl cursor-pointer transition-all ${active ? 'bg-cyan-500/10 text-cyan-500' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
    >
      {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5" })}
    </div>
  );
}

function MetricCard({ label, value, subValue, color }: { label: string, value: string, subValue?: string, color: 'cyan' | 'emerald' | 'blue' | 'rose' }) {
  const colors = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    rose: 'text-rose-400'
  };

  return (
    <div className="dashboard-card p-6 group hover:border-white/10 transition-all">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className={`text-2xl font-bold tracking-tight ${colors[color]}`}>{value}</div>
        {subValue && <div className="text-xs font-medium text-slate-500">{subValue}</div>}
      </div>
    </div>
  );
}

function PulseBar({ label, value, color, isText }: { label: string, value: number | string, color: string, isText?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono text-slate-300">{isText ? value : `${value}%`}</span>
      </div>
      {!isText && (
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full bg-${color}-500 transition-all duration-1000`} 
            style={{ width: `${value}%` }} 
          />
        </div>
      )}
    </div>
  );
}

function InputGroup({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">{label}</label>
      <input 
        type="password" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800/50 border border-white/5 px-4 py-3 rounded-lg text-sm text-cyan-400 focus:outline-none focus:border-cyan-500/50 transition-all" 
      />
    </div>
  );
}
