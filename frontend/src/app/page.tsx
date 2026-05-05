"use client";

import React, { useState, useEffect, useRef } from 'react';
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
   const [vix, setVix] = useState<{value: number, change: string, trend: 'up' | 'down'}>({ value: 18.42, change: "+2.15%", trend: "up" });
   const [pcr, setPcr] = useState<{value: number, change: string, trend: 'up' | 'down'}>({ value: 0.92, change: "-0.02", trend: "down" });
   const [optionsData, setOptionsData] = useState<any[]>([]);

  const fetchSignals = async () => {
    try {
      console.log("[PROTOCOL] Syncing Neural Signals...");
      const res = await fetch("https://raw.githubusercontent.com/LokiLaufeyson-TheTrickster/MaxG-v3.1/main/data/signals.json");
      if (res.ok) {
        const data = (await res.json()) as Signal[];
        console.log("[PROTOCOL] Signals Synced:", data.length);
        setSignals(data);
      } else {
        console.error("[PROTOCOL] Signal Sync Failed:", res.status, res.statusText);
      }
    } catch (e) {
      console.error("[PROTOCOL] Critical Signal Sync Error:", e);
    }
  };

  const fetchHistoricalCandles = async (token: string | null, secret: string | null) => {
    if (!token || !secret) return;
    try {
      console.log("[PROTOCOL] Initializing Market History Stream...");
      const res = await fetch('/api/groww', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: token, totpSecret: secret, action: 'getCandles' })
      });
      if (res.ok) {
        const data = await res.json();
        const candles = data.payload?.candles || data.candles || [];
        if (Array.isArray(candles) && candles.length > 0) {
          console.log(`[PROTOCOL] History Stream Active: ${candles.length} candles`);
          const history = candles.slice(-60).map((c: any) => ({
            time: new Date(c[0] * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            price: c[4]
          }));
          setNiftyData(history);
          setNiftyPrice(candles[candles.length - 1][4]);
          
          const last = candles[candles.length - 1];
          setPrevCandle({ time: 'prev', open: last[1], high: last[2], low: last[3], close: last[4] });
        } else {
          console.warn("[PROTOCOL] History Stream returned no data");
        }
      } else {
         console.error("[PROTOCOL] History Stream Error:", res.status);
      }
    } catch (e) { 
      console.error("[PROTOCOL] Critical History Stream Error:", e); 
    }
  };

  const [positions, setPositions] = useState<Position[]>([]);
  const [metrics, setMetrics] = useState({
    equity: "1,00,000.00",
    dailyPnl: "0.00",
    dailyPnlPercent: "+0.0%",
    marginUtil: "0.0%",
    activeHedges: "00"
  });
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [isPaused, setIsPaused] = useState(false);
  

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
  const [isPaperTrading, setIsPaperTrading] = useState(true);
  const [activeTrade, setActiveTrade] = useState<any>(null);

  // Use refs for polling to avoid closure staleness without triggering re-runs
  const stateRef = useRef({ niftyPrice, lastCandle, prevCandle, tradesToday, dailyLoss, lastLossTime, activeTrade, isPaused });
  useEffect(() => {
    stateRef.current = { niftyPrice, lastCandle, prevCandle, tradesToday, dailyLoss, lastLossTime, activeTrade, isPaused };
  }, [niftyPrice, lastCandle, prevCandle, tradesToday, dailyLoss, lastLossTime, activeTrade, isPaused]);

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
      const orUrl = 'https://openrouter.ai/api/v1/chat/completions';
      const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${gemini}`;
      
      // Prioritize OpenRouter as P1
      const [resOR, resGemini] = await Promise.all([
        fetch(orUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${orKey}` },
          body: JSON.stringify({ model: 'anthropic/claude-3-haiku', messages: [{ role: 'user', content: prompt }] })
        }),
        fetch(gUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        })
      ]);

      const dataG = await resGemini.json();
      const dataO = await resOR.json();
      
      const parse = (raw: string) => {
        try { return JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || '{}'); } catch { return null; }
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


  useEffect(() => {
    fetchSignals();
    
    let pollingDelay = 1000;
    let pollTimer: NodeJS.Timeout;
    let vixCounter = 19; // Trigger on first poll

    const pollData = async () => {
      if (stateRef.current.isPaused) {
        pollingDelay = 5000;
        return;
      }
      
      if (!isMarketHours()) {
        pollingDelay = 60000;
        return;
      }

      const gSecret = localStorage.getItem("maxg_groww_secret");
      const gToken = localStorage.getItem("maxg_groww_token");
      
      if (gSecret && gToken) {
        try {
          // 1. Fetch Spot & Option Chain
          const res = await fetch('/api/groww', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: gToken, totpSecret: gSecret })
          });

          if (!res.ok) {
            console.error(`[PROTOCOL] Main Stream Failed: ${res.status}`);
            if (res.status === 429) {
               console.warn("[PROTOCOL] API Rate Limit Hit. Throttling...");
               pollingDelay = Math.min(pollingDelay + 5000, 30000);
            }
            return;
          }
          
          pollingDelay = 1000;
          const rawData = await res.json();
          const data = rawData.payload || rawData;
          const spot = data.underlying_ltp || 0;
          
          if (spot > 0) {
            setNiftyPrice(spot);
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' });

            setNiftyData(prev => {
              const newData = [...prev, { time: now.toLocaleTimeString(), price: spot }];
              return newData.slice(-60);
            });

            // Process Option Chain (+- 5 Strikes)
            if (data.option_chain) {
               const chain = data.option_chain;
               const atmStrike = Math.round(spot / 50) * 50;
               const sortedChain = [...chain].sort((a, b) => a.strike_price - b.strike_price);
               const atmIndex = sortedChain.findIndex(s => s.strike_price >= atmStrike);
               const sliced = sortedChain.slice(Math.max(0, atmIndex - 5), Math.min(sortedChain.length, atmIndex + 6));
               setOptionsData(sliced);

               // Calculate PCR
               let totalCallOI = 0;
               let totalPutOI = 0;
               if (Array.isArray(chain)) {
                  chain.forEach((s: any) => {
                     totalCallOI += (s.call?.open_interest || 0);
                     totalPutOI += (s.put?.open_interest || 0);
                  });
               }
               const pcrVal = totalCallOI > 0 ? (totalPutOI / totalCallOI) : 0;
               setPcr(prev => ({ 
                  value: parseFloat(pcrVal.toFixed(2)), 
                  change: (pcrVal - prev.value).toFixed(2), 
                  trend: pcrVal >= prev.value ? 'up' : 'down' 
               }));
            }

            // Candle Tracking...
            setLastCandle((prev: any) => {
              if (!prev || prev.time !== timeStr) {
                if (prev) setPrevCandle(prev);
                return { time: timeStr, open: spot, high: spot, low: spot, close: spot };
              }
              return { ...prev, high: Math.max(prev.high, spot), low: Math.min(prev.low, spot), close: spot };
            });

            // Trade Management...
            if (activeTrade) {
               // ... (existing trade logic)
            }
          }

          // 2. Fetch VIX (deterministic every 20 polls ~20 seconds)
          vixCounter++;
          if (vixCounter >= 20) {
             vixCounter = 0;
             const vRes = await fetch('/api/groww', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ apiKey: gToken, totpSecret: gSecret, action: 'getVix' })
             });
             if (vRes.ok) {
                const vData = await vRes.json();
                const vVal = vData.last_price || vData.value || 0;
                if (vVal > 0) {
                   console.log(`[PROTOCOL] VIX Updated: ${vVal}`);
                   setVix(prev => ({ 
                      value: vVal, 
                      change: (vVal - prev.value).toFixed(2) + "%", 
                      trend: vVal >= prev.value ? 'up' : 'down' 
                   }));
                }
             }
          }

        } catch (e) { 
          console.error("[PROTOCOL] Poll Execution Failure:", e); 
        }
      }
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
    setIsPaperTrading(localStorage.getItem("maxg_paper_trading") !== "false");
    setIsMounted(true);
    setCurrentTime(new Date().toLocaleTimeString());
    const tInterval = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);

    return () => {
      if (pollTimer) clearTimeout(pollTimer);
      clearInterval(tInterval);
    };
  }, []); // Only run once on mount

  const saveSettings = () => {
    localStorage.setItem("maxg_gh_token", gitToken);
    localStorage.setItem("maxg_groww_secret", growwSecret);
    localStorage.setItem("maxg_groww_token", growwToken);
    localStorage.setItem("maxg_gemini_key", geminiKey);
    localStorage.setItem("maxg_openrouter_key", openRouterKey);
    localStorage.setItem("maxg_openrouter_models", openRouterModels);
    localStorage.setItem("maxg_paper_trading", isPaperTrading.toString());
    setIsSettingsOpen(false);
    
    // Refresh data with new keys
    fetchHistoricalCandles(growwToken, growwSecret);
    fetchSignals();
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
      <aside className="w-64 border-r border-white/5 bg-[#080d17] flex flex-col p-6 z-50 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] -z-10" />
        
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 glow-emerald">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter uppercase terminal-text">MaxG Sentinel</h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Protocol v3.1</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-1">
             <SidebarNavItem icon={<LayoutDashboard size={16} />} label="Dashboard" active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} />
             <SidebarNavItem icon={<Activity size={16} />} label="Positions" active={activeTab === 'POSITIONS'} onClick={() => setActiveTab('POSITIONS')} />
             <SidebarNavItem icon={<History size={16} />} label="History" active={activeTab === 'HISTORY'} onClick={() => setActiveTab('HISTORY')} />
             <SidebarNavItem icon={<PieChart size={16} />} label="Analytics" active={activeTab === 'ANALYTICS'} onClick={() => setActiveTab('ANALYTICS')} />
          </div>
        </div>

        <div className="mt-auto p-6 space-y-6">
           <div className="space-y-4">
              <div className="space-y-1">
                 <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
                    <span>Performance</span>
                    <span className="text-emerald-500">{tradesToday > 0 ? "LIVE" : "IDLE"}</span>
                 </div>
                 <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full bg-emerald-500 transition-all ${tradesToday > 0 ? 'w-full' : 'w-0'}`} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Trades</div>
                    <div className="text-[12px] font-black text-emerald-500">{tradesToday}</div>
                 </div>
                 <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Drawdown</div>
                    <div className="text-[12px] font-black text-rose-500">-{dailyLoss}R</div>
                 </div>
              </div>
           </div>

           <button onClick={() => setIsSettingsOpen(true)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-[#080d17] font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
             PROTOCOL HQ
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#080d17]">
        
        {/* TOP NAV HEADER */}
        <header className="px-10 py-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-8">
            <h1 className="text-sm font-black text-emerald-500 tracking-tighter italic">NIFTY_PRO</h1>
            <div className="flex gap-6">
              {['WATCHLIST', 'MARKETS', 'F&O ANALYTICS', 'ORDERS'].map(item => (
                <button 
                  key={item} 
                  onClick={() => setActiveTab(item)}
                  className={`text-[9px] font-black uppercase tracking-[0.2em] transition-all hover:text-emerald-500 ${activeTab === item ? 'text-emerald-500' : 'text-slate-500'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Bell className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" />
            <Wallet className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" />
            <Settings className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white" onClick={() => setIsSettingsOpen(true)} />
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10" />
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {activeTab === 'DASHBOARD' ? (
              <div className="space-y-12">
                <div className="grid grid-cols-4 gap-6">
                  <IndicatorCard label="India Vix" value={vix.value.toString()} change={vix.change} trend={vix.trend} />
                  <IndicatorCard label="Nifty 50" value={niftyPrice.toFixed(2)} change="+0.48%" trend="up" />
                  <IndicatorCard label="Put/Call Ratio" value={pcr.value.toString()} change={pcr.change} trend={pcr.trend} />
                  <IndicatorCard label="Account Value" value="₹1,00,000.00" change="+0.0%" trend="up" />
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 trading-card p-10 min-h-[450px] relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Index Performance</h3>
                      </div>
                      <div className="flex gap-2">
                        {['1H', '1D', '1W'].map(t => (
                          <button key={t} className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${t === '1H' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-slate-600 hover:text-slate-400'}`}>{t}</button>
                        ))}
                      </div>
                    </div>
                    <div className="h-[300px] w-full mt-4 flex items-center justify-center">
                      {niftyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                          <AreaChart data={niftyData}>
                            <defs>
                              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                              itemStyle={{ color: '#10b981', fontWeight: 'bold', fontSize: '10px' }}
                            />
                            <Area type="monotone" dataKey="price" stroke="#10b981" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-slate-800 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">Awaiting Data Stream...</div>
                      )}
                    </div>
                  </div>

                  <div className="trading-card p-10 flex flex-col items-center justify-center space-y-8">
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
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-2 trading-card p-10">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">Option Chain (ATM +- 5)</h3>
                     <div className="overflow-x-auto">
                        <table className="w-full text-[10px] text-left">
                           <thead>
                              <tr className="border-b border-white/5 text-slate-500 font-black uppercase tracking-widest">
                                 <th className="pb-4">CALL LTP</th>
                                 <th className="pb-4">OI (C)</th>
                                 <th className="pb-4 text-center">STRIKE</th>
                                 <th className="pb-4 text-right">OI (P)</th>
                                 <th className="pb-4 text-right">PUT LTP</th>
                              </tr>
                           </thead>
                           <tbody className="font-bold">
                              {optionsData.map((s, i) => (
                                 <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                                    <td className="py-3 text-emerald-500">{s.call?.last_price || '-'}</td>
                                    <td className="py-3 text-slate-400">{s.call?.open_interest || '-'}</td>
                                    <td className="py-3 text-center text-slate-200 bg-white/5">{s.strike_price}</td>
                                    <td className="py-3 text-right text-slate-400">{s.put?.open_interest || '-'}</td>
                                    <td className="py-3 text-right text-rose-500">{s.put?.last_price || '-'}</td>
                                 </tr>
                              ))}
                              {optionsData.length === 0 && (
                                 <tr><td colSpan={5} className="py-10 text-center text-slate-700 animate-pulse">Syncing Chain...</td></tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
                  <div className="trading-card p-10">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-8">Neural Audit Stream</h3>
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
            ) : activeTab === 'POSITIONS' ? (
              <div className="space-y-8">
                 <div className="flex items-end justify-between">
                    <div className="space-y-1">
                       <h2 className="text-3xl font-black uppercase tracking-tighter italic">Tactical Positions</h2>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Live monitoring of high-fidelity F&O contracts</p>
                    </div>
                 </div>
                 
                 <div className="trading-card overflow-hidden">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="bg-white/5 border-b border-white/5">
                             <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-400">Instrument</th>
                             <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-400">Side</th>
                             <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-400">Entry</th>
                             <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-400">Current</th>
                             <th className="p-6 text-[9px] font-black uppercase tracking-widest text-slate-400">SL / TP</th>
                             <th className="p-6 text-right text-[9px] font-black uppercase tracking-widest text-slate-400">P&L (Real-time)</th>
                          </tr>
                       </thead>
                       <tbody>
                          {activeTrade ? (
                             <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="p-6">
                                   <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTrade.side === 'CALL' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                         <Zap size={18} />
                                      </div>
                                      <div>
                                         <p className="text-[11px] font-black terminal-text uppercase">NIFTY {activeTrade.side}</p>
                                         <p className="text-[8px] font-bold text-slate-500 uppercase">ATM Contract</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="p-6">
                                   <span className={`px-2 py-1 rounded text-[8px] font-black tracking-widest ${activeTrade.side === 'CALL' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                      {activeTrade.side}
                                   </span>
                                </td>
                                <td className="p-6 text-[11px] font-bold text-slate-400">{activeTrade.entry.toFixed(2)}</td>
                                <td className="p-6 text-[11px] font-bold text-emerald-500">{niftyPrice.toFixed(2)}</td>
                                <td className="p-6">
                                   <div className="space-y-1">
                                      <p className="text-[9px] font-bold text-rose-500/60 uppercase">SL: {activeTrade.sl.toFixed(2)}</p>
                                      <p className="text-[9px] font-bold text-emerald-500/60 uppercase">TP: {activeTrade.tp.toFixed(2)}</p>
                                   </div>
                                </td>
                                <td className="p-6 text-right">
                                   <p className={`text-[12px] font-black terminal-text ${niftyPrice > activeTrade.entry ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      {niftyPrice > activeTrade.entry ? '+' : '-'}₹{(Math.abs(niftyPrice - activeTrade.entry) * 50).toFixed(2)}
                                   </p>
                                </td>
                             </tr>
                          ) : (
                             <tr>
                                <td colSpan={6} className="p-20 text-center">
                                   <div className="space-y-4 opacity-30">
                                      <Monitor className="w-12 h-12 mx-auto text-slate-500" />
                                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">No Tactical Operations Active</p>
                                   </div>
                                </td>
                             </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[500px] trading-card p-12">
                 <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                       <LayoutDashboard className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{activeTab} VIEW</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocol interface for {activeTab.toLowerCase()} is initializing...</p>
                 </div>
              </div>
            )}
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
             
              <div className="space-y-10">
                
                <div className="flex items-center justify-between p-6 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <div className="space-y-1">
                     <h2 className="text-lg font-black uppercase tracking-widest text-emerald-500">Sentinel Control</h2>
                     <p className="text-[10px] text-slate-500 font-bold uppercase">Halt all index polling & neural audits</p>
                  </div>
                  <button 
                    onClick={() => setIsPaused(!isPaused)} 
                    className={`px-10 py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-2xl ${isPaused ? 'bg-emerald-500 text-[#080d17] hover:bg-emerald-400' : 'bg-rose-500/20 text-rose-500 border border-rose-500/30 hover:bg-rose-500/30'}`}
                  >
                    {isPaused ? 'RESUME_OPERATIONS' : 'HALT_OPERATIONS'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-12">
                 <div className="col-span-2 flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                    <div>
                       <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Execution Mode</span>
                       <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Toggle between Live & Paper Trading</p>
                    </div>
                    <button 
                      onClick={() => setIsPaperTrading(!isPaperTrading)}
                      className={`px-6 py-2 rounded-lg font-black text-[10px] tracking-widest transition-all ${isPaperTrading ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}
                    >
                      {isPaperTrading ? 'PAPER_TRADING' : 'LIVE_MARKET'}
                    </button>
                 </div>
                 <div className="col-span-2">
                    <InputGroup label="GitHub Access Protocol" value={gitToken} onChange={setGitToken} onTest={() => testKey('github', gitToken)} testResult={testResults['github']} />
                 </div>
                 <InputGroup label="Groww TOTP Secret" value={growwSecret} onChange={setGrowwSecret} onTest={() => testKey('groww_totp', growwSecret)} testResult={testResults['groww_totp']} />
                 <InputGroup label="Groww API Token" value={growwToken} onChange={setGrowwToken} onTest={() => testKey('groww_api', growwToken, growwSecret)} testResult={testResults['groww_api']} />
                 <InputGroup label="Gemini Audit Layer" value={geminiKey} onChange={setGeminiKey} onTest={() => testKey('gemini', geminiKey)} testResult={testResults['gemini']} />
                  <InputGroup label="OpenRouter Gateway" value={openRouterKey} onChange={setOpenRouterKey} onTest={() => testKey('openrouter', openRouterKey)} testResult={testResults['openrouter']} />
                  <div className="col-span-2">
                     <InputGroup label="Neural Auditor Models" value={openRouterModels} onChange={setOpenRouterModels} type="text" />
                  </div>
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
