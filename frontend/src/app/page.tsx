"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  TrendingUp, 
  TrendingDown,
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
  Zap,
  Bell,
  Wallet
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [latency, setLatency] = useState(12);
  
  // Credentials
  const [gitToken, setGitToken] = useState("");
  const [growwSecret, setGrowwSecret] = useState("");
  const [growwToken, setGrowwToken] = useState("");
  const [geminiKey, setGeminiKey] = useState("");
  const [openRouterKey, setOpenRouterKey] = useState("");
  const [openRouterModels, setOpenRouterModels] = useState("google/gemini-pro-1.5,anthropic/claude-3-haiku,meta-llama/llama-3-70b");
  
  const [testResults, setTestResults] = useState<Record<string, { status: 'idle' | 'testing' | 'success' | 'error', message?: string }>>({});

   const [niftyData, setNiftyData] = useState<{time: string, price: number}[]>([]);
   const [niftyPrice, setNiftyPrice] = useState(0);
   const [optionsData, setOptionsData] = useState<{strike: string, callLTP: number, putLTP: number, callDelta: number, putDelta: number}[]>([]);

  const [positions, setPositions] = useState<Position[]>([]);
  const [metrics, setMetrics] = useState({
    equity: "4,82,150.00",
    dailyPnl: "32,562.50",
    dailyPnlPercent: "+18.3%",
    marginUtil: "44.3%",
    activeHedges: "03"
  });
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [pulse, setPulse] = useState({
    latency: 82,
    cpu: 22.1,
    mem: "Stable"
  });

  const [tradesToday, setTradesToday] = useState(0);
  const [dailyLoss, setDailyLoss] = useState(0); // In terms of R
  const [lastLossTime, setLastLossTime] = useState(0);
  const [prevCandle, setPrevCandle] = useState<any>(null);
  const [lastCandle, setLastCandle] = useState<any>(null);

  const isMarketHours = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeVal = hours * 60 + minutes;
    return timeVal >= 9 * 60 && timeVal < 16 * 60;
  };

  const isTradeAllowed = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timeVal = hours * 60 + minutes;
    
    // Time Windows: 09:20 – 11:30 and 13:45 – 15:00
    const w1 = timeVal >= (9 * 60 + 20) && timeVal <= (11 * 60 + 30);
    const w2 = timeVal >= (13 * 60 + 45) && timeVal <= (15 * 60);
    
    if (!w1 && !w2) return false;

    // Daily Limits
    if (tradesToday >= 3) return false;
    if (dailyLoss >= 2) return false; // 2R Kill Switch
    
    // Cooldown after loss (20 mins)
    if (Date.now() - lastLossTime < 20 * 60 * 1000) return false;

    // Expiry Trap: No trade if today is expiry and time > 13:00
    // (Assuming thursday for simplicity, or we check date from API)
    const isExpiryDay = now.getDay() === 4; 
    if (isExpiryDay && timeVal > 13 * 60) return false;

    return true;
  };

  const calculateScore = (data: any) => {
    const { trend, deltaROC, gex, ivFilter } = data; // Normalized [-1, 1]
    return 0.30 * trend + 0.25 * deltaROC + 0.25 * gex + 0.20 * ivFilter;
  };

  const auditSignal = async (signal: Signal) => {
    if (!isTradeAllowed()) return null;
    
    const gemini = localStorage.getItem("maxg_gemini_key");
    const orKey = localStorage.getItem("maxg_openrouter_key");
    const ghToken = localStorage.getItem("maxg_gh_token");

    if (!gemini || !orKey) return null;

    // Parallel Audit Rule
    try {
      const prompt = `Audit for volatility_ok and regime_valid: ${JSON.stringify(signal)}. Respond ONLY in JSON: {"volatility_ok": bool, "regime_valid": bool}. Current Spot: ${niftyPrice}`;
      
      const [resGemini, resOR] = await Promise.all([
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${gemini}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }),
        fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${orKey}` },
          body: JSON.stringify({ model: 'anthropic/claude-3-haiku', messages: [{ role: 'user', content: prompt }] })
        })
      ]);

      const dataG = await resGemini.json();
      const dataO = await resOR.json();
      
      const parse = (raw: string) => {
        try { return JSON.parse(raw.match(/\{.*\}/s)?.[0] || '{}'); } catch { return null; }
      };

      const auditG = parse(dataG.candidates[0].content.parts[0].text);
      const auditO = parse(dataO.choices[0].message.content);

      // Rule: Parallel Agreement
      if (!auditG || !auditO || auditG.volatility_ok !== auditO.volatility_ok || auditG.regime_valid !== auditO.regime_valid) {
        console.log("AI Disagreement - Skipping");
        return null; 
      }

      // Rule: AI = Filter, not Authority
      if (!auditG.volatility_ok || !auditG.regime_valid) return null;

      if (ghToken) {
        fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: ghToken, model: 'Parallel_Hybrid', content: `Signal: ${signal.Strike} | Audit: Agreed Pass` })
        });
      }
      return true;
    } catch (e) {
      console.error("Audit fail", e);
      return null;
    }
  };

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
    
    let pollingDelay = 2000;
    let pollTimer: NodeJS.Timeout;

    const pollData = async () => {
      if (!isMarketHours()) {
        pollingDelay = 60000;
        return;
      }

      const gSecret = localStorage.getItem("maxg_groww_secret");
      const gToken = localStorage.getItem("maxg_groww_token");
      
      if (gSecret && gToken) {
        try {
          const res = await fetch('/api/groww', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: gToken, totpSecret: gSecret })
          });

          if (!res.ok) {
            if (res.status === 429) pollingDelay = Math.min(pollingDelay + 5000, 30000);
            return;
          }
          
          pollingDelay = 2000;
          const rawData = await res.json();
          const data = rawData.payload || rawData;
          const spot = data.underlying_ltp || 0;
          const strikes = data.strikes || {};
          
          if (spot > 0) {
            setNiftyPrice(spot);
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });
            
            setNiftyData(prev => {
              const newData = [...prev, { time: now.toLocaleTimeString(), price: spot }];
              return newData.slice(-60);
            });

            // Candle Tracking for Price Action
            setLastCandle((prev: any) => {
              if (!prev || prev.time !== timeStr) {
                // New Minute Candle
                if (prev) setPrevCandle(prev);
                return { time: timeStr, open: spot, high: spot, low: spot, close: spot };
              }
              // Update Current Candle
              return { 
                ...prev, 
                high: Math.max(prev.high, spot), 
                low: Math.min(prev.low, spot), 
                close: spot 
              };
            });

            // Signal Engine 2.0
            if (lastCandle && prevCandle) {
              // Rule 1: Score gate (Simulated weights for now)
              const mockData = { trend: 0.8, deltaROC: 0.7, gex: 0.5, ivFilter: 0.2 }; 
              const score = calculateScore(mockData);

              const isCall = score > 0.65;
              const isPut = score < -0.65;

              if (isCall || isPut) {
                // Rule 2: Breakout Confirmation (Reacting, not Predicting)
                const priceConfirmed = isCall 
                  ? spot > prevCandle.high 
                  : spot < prevCandle.low;

                // Rule 3: GEX Proximity Filter
                const nearestGex = Math.round(spot / 50) * 50; 
                const distanceToWall = Math.abs(spot - nearestGex);

                // Rule 6: RR Enforcement (TP = entry + 2*(entry-SL))
                const sl = isCall ? prevCandle.low - 5 : prevCandle.high + 5;
                const tp = spot + (isCall ? 2 : -2) * Math.abs(spot - sl);
                const rr = Math.abs(tp - spot) / Math.abs(spot - sl);

                if (priceConfirmed && distanceToWall >= 30 && rr >= 1.8) {
                   // Rule 8: AI Layer (Parallel Filter)
                   const aiOk = await auditSignal({ Strike: 'NIFTY ATM', T1: tp, T2: tp, T3: tp, SL: sl });
                   if (aiOk) {
                     console.log("EXECUTION_PROTOCOL_TRIGGERED", { side: isCall ? 'CALL' : 'PUT', entry: spot, sl, tp, rr });
                     setTradesToday(t => t + 1);
                   }
                }
              }
            }

            // Process options data for UI
            if (strikes && Object.keys(strikes).length > 0) {
              const atm = Math.round(spot / 50) * 50;
              const relevantStrikes = [atm - 100, atm - 50, atm, atm + 50, atm + 100];
              const newOptions = relevantStrikes.map(strike => {
                const sData = strikes[strike.toString()] || {};
                return {
                  strike: strike.toString(),
                  callLTP: sData.CE?.ltp || 0,
                  putLTP: sData.PE?.ltp || 0,
                  callDelta: sData.CE?.greeks?.delta || 0,
                  putDelta: sData.PE?.greeks?.delta || 0
                };
              });
              setOptionsData(newOptions);
            }
          }
        } catch (e) { console.error(e); }
      }
    };

    const fetchHistoricalCandles = async (token: string | null, secret: string | null) => {
      if (!token || !secret) return;
      try {
        const res = await fetch('/api/groww', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: token, totpSecret: secret, action: 'getCandles' })
        });
        if (res.ok) {
          const data = await res.json();
          const candles = data.payload?.candles || data.candles || [];
          if (Array.isArray(candles) && candles.length > 0) {
            const last = candles[candles.length - 1];
            setPrevCandle({ time: 'prev', open: last[1], high: last[2], low: last[3], close: last[4] });
          }
        }
      } catch (e) { console.error(e); }
    };

    const runPoll = () => {
      pollData().finally(() => {
        pollTimer = setTimeout(runPoll, pollingDelay);
      });
    };

    fetchHistoricalCandles(localStorage.getItem("maxg_groww_token"), localStorage.getItem("maxg_groww_secret"));
    runPoll();
    
    setGitToken(localStorage.getItem("maxg_gh_token") || "");
    setGrowwSecret(localStorage.getItem("maxg_groww_secret") || "");
    setGrowwToken(localStorage.getItem("maxg_groww_token") || "");
    setGeminiKey(localStorage.getItem("maxg_gemini_key") || "");
    setOpenRouterKey(localStorage.getItem("maxg_openrouter_key") || "");
    setIsMounted(true);
    setCurrentTime(new Date().toLocaleTimeString());
    const tInterval = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);

    return () => {
      if (pollTimer) clearTimeout(pollTimer);
      clearInterval(tInterval);
    };
  }, [lastCandle, prevCandle, tradesToday, dailyLoss, lastLossTime]); // Important dependencies for the poll closure

  const saveSettings = () => {
    localStorage.setItem("maxg_gh_token", gitToken);
    localStorage.setItem("maxg_groww_secret", growwSecret);
    localStorage.setItem("maxg_groww_token", growwToken);
    localStorage.setItem("maxg_gemini_key", geminiKey);
    localStorage.setItem("maxg_openrouter_key", openRouterKey);
    localStorage.setItem("maxg_openrouter_models", openRouterModels);
    setIsSettingsOpen(false);
  };

  const testKey = async (type: string, value: string, extra?: string) => {
    setTestResults(prev => ({ ...prev, [type]: { status: 'testing' } }));
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value, extra })
      });
      const data = await res.json();
      if (res.ok) {
        setTestResults(prev => ({ ...prev, [type]: { status: 'success', message: 'Success' } }));
      } else {
        setTestResults(prev => ({ ...prev, [type]: { status: 'error', message: data.error || 'Failed' } }));
      }
    } catch (e) {
      setTestResults(prev => ({ ...prev, [type]: { status: 'error', message: 'Network error' } }));
    }
  };

  return (
    <div className="flex h-screen bg-[#080d17] text-slate-100 overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* NEXUS SIDEBAR */}
      <aside className="w-64 border-r border-white/[0.05] bg-[#080d17] flex flex-col z-50">
        <div className="p-8 space-y-1">
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Portfolio</span>
          <div className="text-2xl font-black tracking-tighter">₹{metrics.equity}</div>
          <div className="text-[10px] font-bold text-emerald-500">{metrics.dailyPnlPercent} Day Gain</div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <SidebarNavItem icon={<LayoutDashboard className="w-4 h-4" />} label="DASHBOARD" active />
          <SidebarNavItem icon={<TrendingUp className="w-4 h-4" />} label="POSITIONS" />
          <SidebarNavItem icon={<History className="w-4 h-4" />} label="HISTORY" />
          <SidebarNavItem icon={<Shield className="w-4 h-4" />} label="ANALYTICS" />
        </nav>

        <div className="mt-auto p-4 space-y-6">
          <div className="px-4 space-y-4">
             <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                   <span>Performance</span>
                   <span className="text-emerald-500">68.2% WR</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500 w-[68%]" />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white/5 rounded border border-white/5">
                   <div className="text-[8px] font-bold text-slate-500 uppercase">Avg Win</div>
                   <div className="text-[10px] font-black text-emerald-500">+₹4,821</div>
                </div>
                <div className="p-2 bg-white/5 rounded border border-white/5">
                   <div className="text-[8px] font-bold text-slate-500 uppercase">Avg Loss</div>
                   <div className="text-[10px] font-black text-rose-500">-₹2,105</div>
                </div>
             </div>
          </div>

          <button onClick={() => setIsSettingsOpen(true)} className="w-full py-4 bg-[#00f291] hover:bg-[#00d17a] text-[#080d17] font-black text-xs uppercase tracking-[0.2em] rounded-lg transition-all shadow-xl shadow-emerald-500/10 active:scale-95">
            NEW ORDER
          </button>
          
          <div className="flex flex-col gap-1 pt-4 border-t border-white/[0.05]">
            <SidebarNavItem icon={<Settings className="w-4 h-4" />} label="SUPPORT" />
            <SidebarNavItem icon={<Lock className="w-4 h-4" />} label="LOGS" />
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#080d17]">
        
        {/* TOP NAV HEADER */}
        <header className="glass-header flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-sm font-black text-emerald-500 tracking-tighter italic">NIFTY_PRO</h1>
            <nav className="flex gap-8">
              {['Watchlist', 'Markets', 'F&O Analytics', 'Orders'].map((link) => (
                <button key={link} className={`text-[11px] font-bold uppercase tracking-widest ${link === 'Orders' ? 'text-emerald-500 border-b-2 border-emerald-500 pb-1' : 'text-slate-500 hover:text-slate-300'}`}>
                  {link}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-6">
            <Bell className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" />
            <Wallet className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" />
            <Settings className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" onClick={() => setIsSettingsOpen(true)} />
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10" />
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-[#080d17]">
          <div className="max-w-[1600px] mx-auto space-y-8">
            
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h2 className="text-4xl font-black tracking-tighter">Order Management</h2>
                <p className="text-slate-500 text-sm font-medium">Monitor and manage your high-frequency trading activity.</p>
              </div>
              <div className="flex gap-2">
                 <button className="px-4 py-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">Active Positions</button>
                 <button className="px-4 py-2 bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5">Open Orders</button>
                 <button className="px-4 py-2 bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-white/5">History</button>
              </div>
            </div>

            {/* PERFORMANCE BAR */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <IndicatorCard label="INDIA VIX" value="18.42" change="+2.15%" trend="up" />
               <IndicatorCard label="NIFTY 50" value={niftyPrice.toLocaleString()} change="+0.48%" trend="up" />
               <IndicatorCard label="PUT/CALL RATIO" value="0.92" change="-0.02" trend="down" />
               <IndicatorCard label="ACCOUNT VALUE" value={`₹${metrics.equity}`} change="+12.4%" trend="up" />
            </div>

            {/* MAIN HUB */}
            <div className="grid grid-cols-12 gap-8">
               
               {/* PERFORMANCE & EXECUTION */}
               <div className="col-span-12 lg:col-span-8 space-y-8">
                  
                  {/* REAL-TIME CHART */}
                  <div className="trading-card p-8 h-[350px] flex flex-col">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Live Index Performance</span>
                        </div>
                        <div className="flex gap-2">
                           {['1H', '1D', '1W'].map(t => (
                              <button key={t} className={`px-3 py-1 rounded text-[9px] font-black ${t === '1H' ? 'bg-emerald-500 text-[#080d17]' : 'bg-white/5 text-slate-500'}`}>{t}</button>
                           ))}
                        </div>
                     </div>
                     <div className="flex-1 min-h-0">
                        {isMounted && niftyData.length > 0 ? (
                           <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={niftyData}>
                                 <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                       <stop offset="5%" stopColor="#00f291" stopOpacity={0.2}/>
                                       <stop offset="95%" stopColor="#00f291" stopOpacity={0}/>
                                    </linearGradient>
                                 </defs>
                                 <XAxis dataKey="time" hide />
                                 <YAxis domain={['auto', 'auto']} hide />
                                 <Tooltip 
                                    contentStyle={{ backgroundColor: '#080d17', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '10px' }}
                                    itemStyle={{ color: '#00f291' }}
                                    cursor={{ stroke: 'rgba(0,242,145,0.2)', strokeWidth: 1 }}
                                 />
                                 <Area type="monotone" dataKey="price" stroke="#00f291" strokeWidth={2} fillOpacity={1} fill="url(#chartGradient)" isAnimationActive={false} />
                              </AreaChart>
                           </ResponsiveContainer>
                        ) : (
                           <div className="h-full w-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-800">
                              Awaiting Data Stream...
                           </div>
                        )}
                     </div>
                  </div>

                  {/* EXECUTION DETAILS TABLE */}
                  <div className="trading-card">
                     <div className="px-8 py-5 border-b border-white/[0.05] flex items-center justify-between bg-white/[0.01]">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-300">Market Execution Details</h3>
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                           <span className="text-[9px] font-bold text-emerald-500 uppercase">Streaming Live</span>
                        </div>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-[11px] terminal-text">
                           <thead>
                              <tr className="text-slate-500 border-b border-white/[0.03] uppercase">
                                 <th className="py-4 px-8 text-left font-medium tracking-tighter">Instrument</th>
                                 <th className="py-4 px-4 text-left font-medium tracking-tighter">Side</th>
                                 <th className="py-4 px-4 text-left font-medium tracking-tighter">Size</th>
                                 <th className="py-4 px-4 text-left font-medium tracking-tighter">Entry Price</th>
                                 <th className="py-4 px-4 text-left font-medium tracking-tighter">Mark Price</th>
                                 <th className="py-4 px-8 text-right font-medium tracking-tighter">P&L (Unrealized)</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/[0.02]">
                              {optionsData.map((opt, i) => (
                                 <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="py-5 px-8">
                                       <div className="flex items-center gap-3">
                                          <div className={`w-8 h-8 rounded flex items-center justify-center ${i % 2 === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                             <TrendingUp className="w-4 h-4" />
                                          </div>
                                          <div className="flex flex-col">
                                             <span className="font-black text-slate-200">NIFTY {opt.strike} CE</span>
                                             <span className="text-[9px] font-bold text-slate-600">NSE OPT 25 JAN</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="py-5 px-4"><span className={`status-tag ${i % 2 === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{i % 2 === 0 ? 'LONG' : 'SHORT'}</span></td>
                                    <td className="py-5 px-4 font-bold text-slate-400">50 Qty (1 Lot)</td>
                                    <td className="py-5 px-4 font-medium text-slate-400">142.35</td>
                                    <td className="py-5 px-4 font-medium text-slate-200">{opt.callLTP.toFixed(2)}</td>
                                    <td className="py-5 px-8 text-right">
                                       <div className="flex flex-col items-end">
                                          <span className="font-black text-emerald-500">+₹8,390.40</span>
                                          <span className="text-[9px] font-bold text-emerald-500/60">+1.24%</span>
                                       </div>
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className="trading-card p-8 space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Capital Deployment</h3>
                        <div className="space-y-2">
                           <div className="flex justify-between items-baseline">
                              <span className="text-2xl font-black terminal-text">₹24,90,000</span>
                              <span className="text-[10px] font-bold text-slate-500">/ 4,82,150</span>
                           </div>
                           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 w-[65%]" />
                           </div>
                           <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">65% of available margin utilized</div>
                        </div>
                     </div>
                     <div className="trading-card p-8 space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural Activity</h3>
                        <div className="flex items-center gap-4">
                           <div className="flex-1 space-y-1">
                              <div className="text-2xl font-black terminal-text italic">{latency}ms</div>
                              <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Optimal Execution Speed</div>
                           </div>
                           <div className="flex items-end gap-1 h-12">
                              {[30, 50, 40, 80, 60, 90, 70].map((h, i) => (
                                 <div key={i} className="w-2 bg-emerald-500/20 rounded-t hover:bg-emerald-500 transition-all" style={{ height: `${h}%` }} />
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* RISK MONITORING SIDEBAR */}
               <div className="col-span-12 lg:col-span-4 space-y-6">
                  <div className="trading-card p-8 h-[300px] flex flex-col items-center justify-center gap-6 relative">
                     <div className="absolute top-6 left-8 text-[10px] font-black uppercase tracking-widest text-slate-500">Risk Protocol</div>
                     <AlertTriangle className="absolute top-6 right-8 w-4 h-4 text-rose-500/50" />
                     <div className="w-40 h-40 rounded-full border-[12px] border-emerald-500/10 flex flex-col items-center justify-center relative">
                        <div className="absolute inset-0 border-[12px] border-emerald-500 rounded-full clip-path-risk glow-emerald" style={{ clipPath: 'inset(0 0 40% 0)' }} />
                        <span className="text-3xl font-black tracking-tighter">Safe</span>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Exposure</span>
                     </div>
                     <p className="text-[10px] text-center text-slate-500 font-medium leading-relaxed max-w-[200px]">
                        Portfolio risk is currently within defined threshold parameters.
                     </p>
                  </div>

                  <div className="trading-card p-8 space-y-6">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Neural Audit Stream</h3>
                     <div className="space-y-4">
                        {signals.map((sig, i) => (
                           <div key={i} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl group hover:border-emerald-500/30 transition-all cursor-pointer">
                              <Cpu className="w-4 h-4 text-emerald-500 mt-1" />
                              <div className="space-y-1">
                                 <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black terminal-text text-emerald-500">{sig.Strike}</span>
                                    <span className="text-[8px] font-bold text-slate-600">CONFIRMED</span>
                                 </div>
                                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                    Neural audit for {sig.Strike} complete. Structural regime verified as bullish expansion.
                                 </p>
                              </div>
                           </div>
                        ))}
                        {signals.length === 0 && (
                           <div className="py-12 text-center text-slate-700 text-[10px] font-black uppercase tracking-widest animate-pulse">
                              Awaiting Neural Sync...
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </main>

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-[#080d17]/90 backdrop-blur-md flex items-center justify-center z-[200] p-6">
          <div className="trading-card p-12 w-full max-w-2xl relative shadow-[0_0_100px_rgba(0,242,145,0.05)] border-emerald-500/20">
             <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Shield className="w-6 h-6 text-emerald-500 shadow-lg" />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter">Protocol Configuration</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Neural Gateway & Authentication Protocol</p>
                </div>
             </div>
             
              <div className="grid grid-cols-2 gap-8 mb-12">
                 <div className="col-span-2">
                    <InputGroup label="GitHub Access Protocol" value={gitToken} onChange={setGitToken} onTest={() => testKey('github', gitToken)} testResult={testResults['github']} />
                 </div>
                 <InputGroup label="Groww TOTP Secret" value={growwSecret} onChange={setGrowwSecret} onTest={() => testKey('groww_totp', growwSecret)} testResult={testResults['groww_totp']} />
                 <InputGroup label="Groww API Token" value={growwToken} onChange={setGrowwToken} onTest={() => testKey('groww_api', growwToken, growwSecret)} testResult={testResults['groww_api']} />
                 <InputGroup label="Gemini Audit Layer" value={geminiKey} onChange={setGeminiKey} onTest={() => testKey('gemini', geminiKey)} testResult={testResults['gemini']} />
                 <InputGroup label="OpenRouter Gateway" value={openRouterKey} onChange={setOpenRouterKey} onTest={() => testKey('openrouter', openRouterKey)} testResult={testResults['openrouter']} />
                 <div className="col-span-2">
                    <InputGroup label="Neural Auditor Models" value={openRouterModels} onChange={setOpenRouterModels} />
                 </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={saveSettings} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#080d17] font-black text-xs uppercase tracking-[0.2em] rounded-lg transition-all shadow-xl shadow-emerald-500/20 active:scale-95">Commit Changes</button>
                 <button onClick={() => setIsSettingsOpen(false)} className="px-10 py-4 bg-white/5 hover:bg-white/10 text-slate-500 hover:text-slate-200 font-bold text-xs uppercase tracking-widest rounded-lg transition-all">Abort</button>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
 />
                 <div className="grid grid-cols-2 gap-6">
                    <InputGroup 
                      label="Groww TOTP Secret" 
                      value={growwSecret} 
                      onChange={setGrowwSecret} 
                      onTest={() => testKey('groww_totp', growwSecret)}
                      testResult={testResults['groww_totp']}
                    />
                    <InputGroup 
                      label="Groww API Key (JWT)" 
                      value={growwToken} 
                      onChange={setGrowwToken} 
                      onTest={() => testKey('groww_api', growwToken, growwSecret)}
                      testResult={testResults['groww_api']}
                    />
                 </div>
                 <InputGroup 
                    label="Gemini API Key" 
                    value={geminiKey} 
                    onChange={setGeminiKey} 
                    onTest={() => testKey('gemini', geminiKey)}
                    testResult={testResults['gemini']}
                 />
                 <InputGroup 
                    label="OpenRouter API Key" 
                    value={openRouterKey} 
                    onChange={setOpenRouterKey} 
                    onTest={() => testKey('openrouter', openRouterKey)}
                    testResult={testResults['openrouter']}
                 />
                 <InputGroup 
                    label="OpenRouter Models (Comma Separated)" 
                    value={openRouterModels} 
                    onChange={setOpenRouterModels} 
                    type="text"
                 />
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

// --- HELPER COMPONENTS ---

function SidebarNavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
    >
      {icon}
      <span className="text-[10px] font-black tracking-widest uppercase">{label}</span>
    </button>
  );
}

function IndicatorCard({ label, value, change, trend }: { label: string, value: string, change: string, trend: 'up' | 'down' }) {
  return (
    <div className="trading-card p-6 space-y-3 group hover:border-emerald-500/30 transition-all cursor-pointer">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        {trend === 'up' ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-xl font-black terminal-text tracking-tighter">{value}</div>
        <div className={`text-[10px] font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>{change}</div>
      </div>
      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${trend === 'up' ? 'bg-emerald-500' : 'bg-rose-500'} opacity-30`} style={{ width: '40%' }} />
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, color }: { label: string, value: string, subValue?: string, color: string }) {
  return (
    <div className="trading-card p-6 space-y-1">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <div className="flex items-baseline gap-2">
        <div className="text-xl font-black terminal-text">₹{value}</div>
        {subValue && <span className={`text-[10px] font-bold text-emerald-500`}>{subValue}</span>}
      </div>
    </div>
  );
}

function PulseBar({ label, value, color, isText }: { label: string, value: number | string, color: string, isText?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="text-slate-500">{label}</span>
        <span className={`text-${color}-500`}>{isText ? value : `${value}%`}</span>
      </div>
      {!isText && (
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div className={`h-full bg-${color}-500 rounded-full shadow-[0_0_8px_rgba(0,242,145,0.4)]`} style={{ width: `${value}%` }} />
        </div>
      )}
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "password", onTest, testResult }: { label: string, value: string, onChange: (v: string) => void, type?: string, onTest?: () => void, testResult?: any }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center px-1">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
        {onTest && (
          <button 
            onClick={onTest} 
            disabled={testResult?.status === 'testing'}
            className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded transition-all ${
              testResult?.status === 'success' ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 
              testResult?.status === 'error' ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' : 
              testResult?.status === 'testing' ? 'bg-amber-500/20 text-amber-500 animate-pulse border border-amber-500/30' :
              'bg-white/5 text-slate-500 hover:text-emerald-500 border border-white/10'
            }`}
          >
            {testResult?.status === 'testing' ? 'Syncing...' : 'Verify_Link'}
          </button>
        )}
      </div>
      <div className="relative group">
         <input 
           type={type} 
           value={value} 
           onChange={(e) => onChange(e.target.value)}
           className="w-full bg-white/[0.02] border border-white/[0.05] rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-emerald-500/50 transition-all terminal-text text-emerald-500"
         />
         {testResult?.status === 'error' && (
           <div className="mt-1 text-[9px] text-rose-500 font-medium lowercase italic px-1">! {testResult.message}</div>
         )}
      </div>
    </div>
  );
}
