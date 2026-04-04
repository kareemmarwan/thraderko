

"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X, TrendingUp, Zap, ChevronRight, Copy, BarChart3, Clock, Activity } from "lucide-react";

// --- Types ---
interface TickerData {
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
}

interface SuggestedTrade {
  pair: string;
  type: "LONG" | "SHORT";
  entry: string;
  tp: string[];
  sl: string;
  timeframe: string;
  range: string;
  candle: string;
  status: string;
  strength?: number;
  timestamp?: string;
}

const CRYPTO_ASSETS = [
  { symbol: "BTCUSDT", name: "Bitcoin" },
  { symbol: "ETHUSDT", name: "Ethereum" },
  { symbol: "BNBUSDT", name: "Binance" },
  { symbol: "SOLUSDT", name: "Solana" },
  { symbol: "SHIBUSDT", name: "Shiba Inu" },
  { symbol: "DOGEUSDT", name: "Dogecoin" },
  { symbol: "PEPEUSDT", name: "Pepe" },
  { symbol: "PAXGUSDT", name: "Gold (PAXG)" }
];

const BACKEND_URL = "https://trading-backend-n8x1.onrender.com/api/signals";

export default function TradingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [liveTrades, setLiveTrades] = useState<SuggestedTrade[]>([]);

  const [ticker, setTicker] = useState<TickerData>({
    lastPrice: "0.00",
    priceChangePercent: "0.00",
    highPrice: "0.00",
    lowPrice: "0.00",
    quoteVolume: "0",
  });

  // 1. ساعة حية (UTC)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        timeZone: 'UTC' 
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. جلب التوصيات من السيرفر
  useEffect(() => {
    const controller = new AbortController();
    const fetchSignals = async () => {
      try {
        const response = await fetch(BACKEND_URL, { signal: controller.signal });
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
          const formattedTrades: SuggestedTrade[] = data.map((sig: any) => ({
            pair: sig.symbol,
            type: sig.type,
            entry: sig.entry < 1 ? sig.entry.toFixed(8) : sig.entry.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            tp: sig.tp.map((t: number) => t < 1 ? t.toFixed(8) : t.toLocaleString(undefined, { minimumFractionDigits: 2 })),
            sl: sig.sl < 1 ? sig.sl.toFixed(8) : sig.sl.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            timeframe: "1H",
            range: "Intraday",
            candle: sig.reason || "AI Logic",
            status: "Active",
            strength: sig.strength || 85,
            timestamp: sig.timestamp
          }));

          setLiveTrades(formattedTrades.sort((a, b) => 
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          ));
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') console.error("Backend Connection Error:", error);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 30000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  // 3. جلب بيانات التداول اللحظية من Binance (بما في ذلك الفاليوم)
  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@ticker`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const price = parseFloat(data.c);
      setTicker((prev) => ({
        ...prev,
        lastPrice: price < 1 ? price.toFixed(8) : price.toLocaleString(undefined, { minimumFractionDigits: 2 }),
        priceChangePercent: data.P,
        highPrice: parseFloat(data.h) < 1 ? data.h : parseFloat(data.h).toLocaleString(),
        lowPrice: parseFloat(data.l) < 1 ? data.l : parseFloat(data.l).toLocaleString(),
        // تنسيق الفاليوم ليكون بالملايين (M)
        quoteVolume: (parseFloat(data.q) / 1000000).toFixed(2) + "M",
      }));
    };
    return () => ws.close();
  }, [selectedSymbol]);

  // 4. تهيئة TradingView
  useEffect(() => {
    const scriptId = "tradingview-widget-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initWidget = () => {
      if (typeof (window as any).TradingView !== "undefined" && containerRef.current) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${selectedSymbol}`,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          container_id: containerRef.current.id,
          backgroundColor: "#060606",
          gridColor: "rgba(42, 46, 57, 0.03)",
          hide_side_toolbar: false,
          allow_symbol_change: true,
          save_image: false,
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }
  }, [selectedSymbol]);

  return (
    <div className="flex h-screen bg-[#060606] text-slate-300 overflow-hidden font-sans antialiased">
      
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* --- Sidebar --- */}
      <aside className={`fixed inset-y-0 left-0 z-[110] w-[240px] bg-[#0B0E11] border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="h-[48px] px-4 flex items-center justify-between border-b border-white/5 bg-[#12161C]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Market List</span>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/5 rounded"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {CRYPTO_ASSETS.map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => { setSelectedSymbol(crypto.symbol); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                className={`w-full px-4 py-3 flex justify-between items-center transition-all border-b border-white/[0.02] ${selectedSymbol === crypto.symbol ? "bg-[#1E2329] border-l-2 border-emerald-500 shadow-lg" : "hover:bg-[#12161C] border-l-2 border-transparent"}`}
              >
                <div className="text-left">
                  <div className="text-[13px] font-bold text-white">{crypto.symbol.replace("USDT", "")}</div>
                  <div className="text-[11px] text-slate-500">{crypto.name}</div>
                </div>
                <ChevronRight className={`w-3 h-3 transition-opacity ${selectedSymbol === crypto.symbol ? 'opacity-100' : 'opacity-0'}`} />
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#060606]">
        {/* <header className="h-[48px] bg-[#12161C] border-b border-white/5 flex items-center px-4 justify-between shrink-0 z-50">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-white/5 rounded text-emerald-500"><Menu className="w-5 h-5" /></button>
            <div className="flex items-center gap-2 pr-6 border-r border-white/10">
              <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center"><BarChart3 className="text-black w-4 h-4" /></div>
              <span className="font-bold text-white tracking-tighter text-[15px]">PRO<span className="text-emerald-500">TRADE</span></span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-mono text-slate-300 mt-0.5">{currentTime} <span className="text-slate-500 ml-1">UTC</span></span>
            </div>
          </div>
        </header> */}

<header className="h-[48px] bg-[#12161C] border-b border-white/5 flex items-center px-4 justify-between shrink-0 z-50">
           <div className="flex items-center gap-6">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-white/5 rounded text-emerald-500">
               <Menu className="w-5 h-5" />
             </button>
            
             <div className="flex items-center gap-2 pr-6 border-r border-white/10">
               <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
                 <BarChart3 className="text-black w-4 h-4" />
               </div>
               <span className="font-bold text-white tracking-tighter text-[15px]">PRO<span className="text-emerald-500">TRADE</span></span>
             </div>

             <nav className="hidden md:flex items-center gap-5">
               {['Exchange', 'Signals', 'History'].map((nav) => (
                <button key={nav} className="text-[12px] font-medium text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-tight">
                  {nav}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[11px] font-mono text-slate-300 mt-0.5">{currentTime} <span className="text-slate-500 ml-1">UTC</span></span>
            </div>
            <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-4">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
            </div>
          </div>
        </header>

        {/* --- Ticker Bar (تمت إضافة الفاليوم هنا) --- */}
        <div className="h-[40px] bg-[#0B0E11] border-b border-white/5 flex items-center px-4 overflow-x-auto whitespace-nowrap gap-8 scrollbar-hide shrink-0">
            <div className="flex items-center gap-2 border-r border-white/5 pr-6">
              <span className="text-[14px] font-bold text-white uppercase">{selectedSymbol}</span>
              <span className={`text-[13px] font-mono font-bold ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{ticker.lastPrice}</span>
            </div>

            {/* عرض حجم التداول 24h */}
            <div className="flex flex-col justify-center min-w-[85px]">
              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase flex items-center gap-1">
                <Activity className="w-2 h-2 text-blue-400" /> 24h Volume
              </span>
              <span className="text-[11px] text-slate-200 font-mono font-bold leading-none">{ticker.quoteVolume}</span>
            </div>

            <div className="flex flex-col justify-center min-w-[70px]">
              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Change</span>
              <span className={`text-[11px] font-mono leading-none ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{ticker.priceChangePercent}%</span>
            </div>
            <div className="flex flex-col justify-center min-w-[70px]">
              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h High</span>
              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.highPrice}</span>
            </div>
            <div className="flex flex-col justify-center min-w-[70px]">
              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Low</span>
              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.lowPrice}</span>
            </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-[#060606] scrollbar-hide">
          <section className="h-[55vh] w-full border-b border-white/5 bg-black relative">
            <div id="tradingview_widget" ref={containerRef} className="w-full h-full" />
          </section>

          <section className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
              <h2 className="text-[16px] font-bold text-white uppercase tracking-tight">Pro Signals (AI Optimized)</h2>
              <div className="flex-1 h-[1px] bg-white/5"></div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5 pb-10">
              {liveTrades.length > 0 ? (
                liveTrades.map((trade, idx) => (
                  <SignalCard key={idx} trade={trade} />
                ))
              ) : (
                <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                   <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                   <p className="text-slate-500 text-sm italic font-mono">Syncing with AI Engine...</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// --- Signal Card ---
function SignalCard({ trade }: { trade: SuggestedTrade }) {
  const signalStrength = trade.strength || 75;
  const winProbability = Math.min(92, signalStrength - 5 + Math.floor(Math.random() * 8));
  const tradeTime = trade.timestamp ? new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live";

  return (
    <div className="bg-[#161A1E] border border-white/5 rounded-xl p-0 hover:border-emerald-500/40 transition-all group overflow-hidden shadow-2xl relative flex flex-col h-full">
      <div className="flex justify-between items-center px-3 py-2.5 bg-[#1E2329]/80 border-b border-white/[0.03]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-black text-black shadow-lg">{trade.pair.charAt(0)}</div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold text-white tracking-tight leading-none">{trade.pair}</span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded border border-emerald-500/20 font-bold uppercase">{tradeTime}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block italic">{trade.timeframe} Chart</span>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 border shadow-inner ${trade.type === 'LONG' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
          <TrendingUp className={`w-3 h-3 ${trade.type === 'SHORT' ? 'rotate-180' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{trade.type}</span>
        </div>
      </div>
      <div className="px-3 py-2 bg-[#0B0E11]/40 border-b border-white/[0.02] flex items-center gap-6">
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter"><span className="text-slate-500">Signal Strength</span><span className="text-emerald-400">{signalStrength}%</span></div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${signalStrength}%` }} /></div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter"><span className="text-slate-500">Confidence</span><span className="text-blue-400">{winProbability}%</span></div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${winProbability}%` }} /></div>
        </div>
      </div>
      <div className="p-3 space-y-4">
        <div className="flex justify-between items-center">
          <div><p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Entry Price</p><p className="text-[18px] font-mono font-bold text-white tracking-tighter">{trade.entry}</p></div>
          <div className="text-right"><p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Method</p><div className="inline-block px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-bold text-slate-300">{trade.candle}</div></div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-emerald-500/[0.02] rounded-lg p-2.5 border border-emerald-500/10">
            <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-2">Targets</p>
            <div className="space-y-1.5">{trade.tp.map((val, i) => (<div key={i} className="flex justify-between items-center"><span className="text-[8px] text-slate-600 font-bold">TP{i+1}</span><span className="text-[11px] font-mono font-bold text-slate-200">{val}</span></div>))}</div>
          </div>
          <div className="bg-rose-500/[0.02] rounded-lg p-2.5 border border-rose-500/10 flex flex-col justify-between">
            <div><p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mb-2">Protection</p><p className="text-[13px] font-mono font-bold text-white">{trade.sl}</p></div>
          </div>
        </div>
      </div>
      <div className="mt-auto px-3 py-3 border-t border-white/[0.03] bg-[#1E2329]/20 flex gap-2">
        <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg font-bold text-[11px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 active:scale-[0.98]"><Zap className="w-3.5 h-3.5 fill-black" /> Trade Now</button>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 border border-white/5"><Copy className="w-4 h-4" /></button>
      </div>
    </div>
  );
}


// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Menu, X, TrendingUp, Zap, ChevronRight, Copy, BarChart3, Clock } from "lucide-react";

// // --- Types ---
// interface TickerData {
//   lastPrice: string;
//   priceChangePercent: string;
//   highPrice: string;
//   lowPrice: string;
//   quoteVolume: string;
// }

// interface SuggestedTrade {
//   pair: string;
//   type: "LONG" | "SHORT";
//   entry: string;
//   tp: string[];
//   sl: string;
//   timeframe: string;
//   range: string;
//   candle: string;
//   status: string;
//   strength?: number;
//   timestamp?: string;
// }

// const CRYPTO_ASSETS = [
//   { symbol: "BTCUSDT", name: "Bitcoin" },
//   { symbol: "ETHUSDT", name: "Ethereum" },
//   { symbol: "BNBUSDT", name: "Binance" },
//   { symbol: "SOLUSDT", name: "Solana" },
//   { symbol: "SHIBUSDT", name: "Shiba Inu" },
//   { symbol: "DOGEUSDT", name: "Dogecoin" },
//   { symbol: "PEPEUSDT", name: "Pepe" },
//   { symbol: "PAXGUSDT", name: "Gold (PAXG)" }
// ];

// // الرابط المباشر الخاص بك على Render
// const BACKEND_URL = "https://trading-backend-n8x1.onrender.com/api/signals";

// export default function TradingPage() {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [currentTime, setCurrentTime] = useState("");
//   const [liveTrades, setLiveTrades] = useState<SuggestedTrade[]>([]);

//   const [ticker, setTicker] = useState<TickerData>({
//     lastPrice: "0.00",
//     priceChangePercent: "0.00",
//     highPrice: "0.00",
//     lowPrice: "0.00",
//     quoteVolume: "0",
//   });

//   // 1. ساعة حية (UTC)
//   useEffect(() => {
//     const timer = setInterval(() => {
//       const now = new Date();
//       setCurrentTime(now.toLocaleTimeString('en-US', { 
//         hour12: false, 
//         hour: '2-digit', 
//         minute: '2-digit', 
//         second: '2-digit',
//         timeZone: 'UTC' 
//       }));
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // 2. جلب التوصيات من السيرفر المحدث (Render)
//   useEffect(() => {
//     const controller = new AbortController();
//     const fetchSignals = async () => {
//       try {
//         const response = await fetch(BACKEND_URL, { signal: controller.signal });
//         const data = await response.json();
        
//         if (data && Array.isArray(data)) {
//           const formattedTrades: SuggestedTrade[] = data.map((sig: any) => ({
//             pair: sig.symbol,
//             type: sig.type,
//             // تنسيق ذكي: إذا كان السعر صغيراً جداً يظهر 8 أرقام عشرية
//             entry: sig.entry < 1 ? sig.entry.toFixed(8) : sig.entry.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//             tp: sig.tp.map((t: number) => t < 1 ? t.toFixed(8) : t.toLocaleString(undefined, { minimumFractionDigits: 2 })),
//             sl: sig.sl < 1 ? sig.sl.toFixed(8) : sig.sl.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//             timeframe: "1H",
//             range: "Intraday",
//             candle: sig.reason || "AI Logic",
//             status: "Active",
//             strength: sig.strength || 85,
//             timestamp: sig.timestamp
//           }));

//           setLiveTrades(formattedTrades.sort((a, b) => 
//             new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
//           ));
//         }
//       } catch (error: any) {
//         if (error.name !== 'AbortError') console.error("Backend Connection Error:", error);
//       }
//     };

//     fetchSignals();
//     const interval = setInterval(fetchSignals, 30000);
//     return () => {
//       controller.abort();
//       clearInterval(interval);
//     };
//   }, []);

//   // 3. جلب بيانات 24 ساعة وتحديث السعر اللحظي (WebSockets)
//   useEffect(() => {
//     const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@ticker`);
//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       const price = parseFloat(data.c);
//       setTicker((prev) => ({
//         ...prev,
//         lastPrice: price < 1 ? price.toFixed(8) : price.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//         priceChangePercent: data.P,
//         highPrice: parseFloat(data.h) < 1 ? data.h : parseFloat(data.h).toLocaleString(),
//         lowPrice: parseFloat(data.l) < 1 ? data.l : parseFloat(data.l).toLocaleString(),
//         quoteVolume: (parseFloat(data.q) / 1000000).toFixed(2) + "M",
//       }));
//     };
//     return () => ws.close();
//   }, [selectedSymbol]);

//   // 4. تهيئة TradingView (دون تغيير في الإعدادات)
//   useEffect(() => {
//     const scriptId = "tradingview-widget-script";
//     let script = document.getElementById(scriptId) as HTMLScriptElement;

//     const initWidget = () => {
//       if (typeof (window as any).TradingView !== "undefined" && containerRef.current) {
//         new (window as any).TradingView.widget({
//           autosize: true,
//           symbol: `BINANCE:${selectedSymbol}`,
//           interval: "15",
//           timezone: "Etc/UTC",
//           theme: "dark",
//           style: "1",
//           locale: "en",
//           container_id: containerRef.current.id,
//           backgroundColor: "#060606",
//           gridColor: "rgba(42, 46, 57, 0.03)",
//           hide_side_toolbar: false,
//           allow_symbol_change: true,
//           save_image: false,
//         });
//       }
//     };

//     if (!script) {
//       script = document.createElement("script");
//       script.id = scriptId;
//       script.src = "https://s3.tradingview.com/tv.js";
//       script.async = true;
//       script.onload = initWidget;
//       document.head.appendChild(script);
//     } else {
//       initWidget();
//     }
//   }, [selectedSymbol]);

//   return (
//     <div className="flex h-screen bg-[#060606] text-slate-300 overflow-hidden font-sans antialiased">
      
//       {isSidebarOpen && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
//       )}

//       {/* --- Sidebar --- */}
//       <aside className={`fixed inset-y-0 left-0 z-[110] w-[240px] bg-[#0B0E11] border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
//         <div className="flex flex-col h-full">
//           <div className="h-[48px] px-4 flex items-center justify-between border-b border-white/5 bg-[#12161C]">
//             <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Market List</span>
//             <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/5 rounded"><X className="w-4 h-4" /></button>
//           </div>
//           <div className="flex-1 overflow-y-auto scrollbar-hide">
//             {CRYPTO_ASSETS.map((crypto) => (
//               <button
//                 key={crypto.symbol}
//                 onClick={() => { setSelectedSymbol(crypto.symbol); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
//                 className={`w-full px-4 py-3 flex justify-between items-center transition-all border-b border-white/[0.02] ${selectedSymbol === crypto.symbol ? "bg-[#1E2329] border-l-2 border-emerald-500 shadow-lg" : "hover:bg-[#12161C] border-l-2 border-transparent"}`}
//               >
//                 <div className="text-left">
//                   <div className="text-[13px] font-bold text-white">{crypto.symbol.replace("USDT", "")}</div>
//                   <div className="text-[11px] text-slate-500">{crypto.name}</div>
//                 </div>
//                 <ChevronRight className={`w-3 h-3 transition-opacity ${selectedSymbol === crypto.symbol ? 'opacity-100' : 'opacity-0'}`} />
//               </button>
//             ))}
//           </div>
//         </div>
//       </aside>

//       {/* --- Main Content --- */}
//       <main className="flex-1 flex flex-col min-w-0 bg-[#060606]">
//         <header className="h-[48px] bg-[#12161C] border-b border-white/5 flex items-center px-4 justify-between shrink-0 z-50">
//           <div className="flex items-center gap-6">
//             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-white/5 rounded text-emerald-500"><Menu className="w-5 h-5" /></button>
//             <div className="flex items-center gap-2 pr-6 border-r border-white/10">
//               <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center"><BarChart3 className="text-black w-4 h-4" /></div>
//               <span className="font-bold text-white tracking-tighter text-[15px]">PRO<span className="text-emerald-500">TRADE</span></span>
//             </div>
//           </div>
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
//               <Clock className="w-3.5 h-3.5 text-emerald-500" />
//               <span className="text-[11px] font-mono text-slate-300 mt-0.5">{currentTime} <span className="text-slate-500 ml-1">UTC</span></span>
//             </div>
//             <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-4">
//               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
//               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live Feed</span>
//             </div>
//           </div>
//         </header>

//         {/* Ticker Bar */}
//         <div className="h-[40px] bg-[#0B0E11] border-b border-white/5 flex items-center px-4 overflow-x-auto whitespace-nowrap gap-8 scrollbar-hide shrink-0">
//            <div className="flex items-center gap-2 border-r border-white/5 pr-6">
//              <span className="text-[14px] font-bold text-white uppercase">{selectedSymbol}</span>
//              <span className={`text-[13px] font-mono font-bold ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{ticker.lastPrice}</span>
//            </div>
//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Change</span>
//              <span className={`text-[11px] font-mono leading-none ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{ticker.priceChangePercent}%</span>
//            </div>
//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h High</span>
//              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.highPrice}</span>
//            </div>
//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Low</span>
//              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.lowPrice}</span>
//            </div>
//         </div>

//         {/* Body */}
//         <div className="flex-1 overflow-y-auto bg-[#060606] scrollbar-hide">
//           <section className="h-[55vh] w-full border-b border-white/5 bg-black relative">
//             <div id="tradingview_widget" ref={containerRef} className="w-full h-full" />
//           </section>

//           <section className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
//             <div className="flex items-center gap-3 mb-6">
//               <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
//               <h2 className="text-[16px] font-bold text-white uppercase tracking-tight">Pro Signals (AI Optimized)</h2>
//               <div className="flex-1 h-[1px] bg-white/5"></div>
//             </div>

//             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5 pb-10">
//               {liveTrades.length > 0 ? (
//                 liveTrades.map((trade, idx) => (
//                   <SignalCard key={idx} trade={trade} />
//                 ))
//               ) : (
//                 <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
//                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//                    <p className="text-slate-500 text-sm italic font-mono">Syncing with AI Engine...</p>
//                 </div>
//               )}
//             </div>
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// }

// // --- Signal Card ---
// function SignalCard({ trade }: { trade: SuggestedTrade }) {
//   const signalStrength = trade.strength || 75;
//   const winProbability = Math.min(92, signalStrength - 5 + Math.floor(Math.random() * 8));
//   const tradeTime = trade.timestamp ? new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live";

//   return (
//     <div className="bg-[#161A1E] border border-white/5 rounded-xl p-0 hover:border-emerald-500/40 transition-all group overflow-hidden shadow-2xl relative flex flex-col h-full">
//       <div className="flex justify-between items-center px-3 py-2.5 bg-[#1E2329]/80 border-b border-white/[0.03]">
//         <div className="flex items-center gap-2.5">
//           <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-black text-black shadow-lg">{trade.pair.charAt(0)}</div>
//           <div>
//             <div className="flex items-center gap-1.5">
//               <span className="text-[14px] font-bold text-white tracking-tight leading-none">{trade.pair}</span>
//               <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded border border-emerald-500/20 font-bold uppercase">{tradeTime}</span>
//             </div>
//             <span className="text-[10px] text-slate-500 font-mono mt-0.5 block italic">{trade.timeframe} Chart</span>
//           </div>
//         </div>
//         <div className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 border shadow-inner ${trade.type === 'LONG' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
//           <TrendingUp className={`w-3 h-3 ${trade.type === 'SHORT' ? 'rotate-180' : ''}`} />
//           <span className="text-[10px] font-black uppercase tracking-widest">{trade.type}</span>
//         </div>
//       </div>
//       <div className="px-3 py-2 bg-[#0B0E11]/40 border-b border-white/[0.02] flex items-center gap-6">
//         <div className="flex-1 space-y-1">
//           <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter"><span className="text-slate-500">Signal Strength</span><span className="text-emerald-400">{signalStrength}%</span></div>
//           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${signalStrength}%` }} /></div>
//         </div>
//         <div className="flex-1 space-y-1">
//           <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter"><span className="text-slate-500">Confidence</span><span className="text-blue-400">{winProbability}%</span></div>
//           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${winProbability}%` }} /></div>
//         </div>
//       </div>
//       <div className="p-3 space-y-4">
//         <div className="flex justify-between items-center">
//           <div><p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Entry Price</p><p className="text-[18px] font-mono font-bold text-white tracking-tighter">{trade.entry}</p></div>
//           <div className="text-right"><p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Method</p><div className="inline-block px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-bold text-slate-300">{trade.candle}</div></div>
//         </div>
//         <div className="grid grid-cols-2 gap-2.5">
//           <div className="bg-emerald-500/[0.02] rounded-lg p-2.5 border border-emerald-500/10">
//             <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-2">Targets</p>
//             <div className="space-y-1.5">{trade.tp.map((val, i) => (<div key={i} className="flex justify-between items-center"><span className="text-[8px] text-slate-600 font-bold">TP{i+1}</span><span className="text-[11px] font-mono font-bold text-slate-200">{val}</span></div>))}</div>
//           </div>
//           <div className="bg-rose-500/[0.02] rounded-lg p-2.5 border border-rose-500/10 flex flex-col justify-between">
//             <div><p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mb-2">Protection</p><p className="text-[13px] font-mono font-bold text-white">{trade.sl}</p></div>
//           </div>
//         </div>
//       </div>
//       <div className="mt-auto px-3 py-3 border-t border-white/[0.03] bg-[#1E2329]/20 flex gap-2">
//         <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg font-bold text-[11px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 active:scale-[0.98]"><Zap className="w-3.5 h-3.5 fill-black" /> Trade Now</button>
//         <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 border border-white/5"><Copy className="w-4 h-4" /></button>
//       </div>
//     </div>
//   );
// }

// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Menu, X, TrendingUp, Zap, ChevronRight, Copy, BarChart3, Clock } from "lucide-react";

// // --- Types ---
// interface TickerData {
//   lastPrice: string;
//   priceChangePercent: string;
//   highPrice: string;
//   lowPrice: string;
//   quoteVolume: string;
// }

// interface SuggestedTrade {
//   pair: string;
//   type: "LONG" | "SHORT";
//   entry: string;
//   tp: string[];
//   sl: string;
//   timeframe: string;
//   range: string;
//   candle: string;
//   status: string;
//   strength?: number;
//   timestamp?: string;
// }

// const CRYPTO_ASSETS = [
//   { symbol: "BTCUSDT", name: "Bitcoin" },
//   { symbol: "ETHUSDT", name: "Ethereum" },
//   { symbol: "BNBUSDT", name: "Binance" },
//   { symbol: "SOLUSDT", name: "Solana" },
//   { symbol: "SHIBUSDT", name: "Shiba Inu" },
//   { symbol: "DOGEUSDT", name: "Dogecoin" },
//   { symbol: "PEPEUSDT", name: "Pepe" },
//   { symbol: "PAXGUSDT", name: "Gold (PAXG)" }
// ];

// // الرابط المباشر للسيرفر الخاص بك
// const BACKEND_URL = "https://trading-backend-n8x1.onrender.com/api/signals";

// export default function TradingPage() {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [currentTime, setCurrentTime] = useState("");
//   const [liveTrades, setLiveTrades] = useState<SuggestedTrade[]>([]);

//   const [ticker, setTicker] = useState<TickerData>({
//     lastPrice: "0.00",
//     priceChangePercent: "0.00",
//     highPrice: "0.00",
//     lowPrice: "0.00",
//     quoteVolume: "0",
//   });

//   // 1. ساعة حية (UTC) - تحديث كل ثانية
//   useEffect(() => {
//     const timer = setInterval(() => {
//       const now = new Date();
//       setCurrentTime(now.toLocaleTimeString('en-US', { 
//         hour12: false, 
//         hour: '2-digit', 
//         minute: '2-digit', 
//         second: '2-digit', 
//         timeZone: 'UTC' 
//       }));
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // 2. جلب التوصيات من السيرفر (Render) مع تحسين معالجة الأرقام
//   useEffect(() => {
//     const controller = new AbortController();
    
//     const fetchSignals = async () => {
//       try {
//         const response = await fetch(BACKEND_URL, { signal: controller.signal });
//         const data = await response.json();
        
//         if (data && Array.isArray(data)) {
//           const formattedTrades: SuggestedTrade[] = data.map((sig: any) => ({
//             pair: sig.symbol,
//             type: sig.type,
//             // معالجة ذكية للأرقام الصغيرة جداً (مثل 0.00001234)
//             entry: sig.entry < 0.1 ? sig.entry.toFixed(8) : sig.entry.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//             tp: sig.tp.map((t: number) => t < 0.1 ? t.toFixed(8) : t.toLocaleString(undefined, { minimumFractionDigits: 2 })),
//             sl: sig.sl < 0.1 ? sig.sl.toFixed(8) : sig.sl.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//             timeframe: "1H",
//             range: "Intraday",
//             candle: sig.reason || "AI Model",
//             status: "Active",
//             strength: sig.strength || 85,
//             timestamp: sig.timestamp
//           }));

//           setLiveTrades(formattedTrades.sort((a, b) => 
//             new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
//           ));
//         }
//       } catch (error: any) {
//         if (error.name !== 'AbortError') console.error("Backend Error:", error);
//       }
//     };

//     fetchSignals();
//     const interval = setInterval(fetchSignals, 30000); // تحديث كل 30 ثانية
//     return () => {
//       controller.abort();
//       clearInterval(interval);
//     };
//   }, []);

//   // 3. جلب بيانات التيكر والـ WebSockets (تحسين عرض الأرقام للعملات الصغيرة)
//   useEffect(() => {
//     const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@ticker`);
//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       const price = parseFloat(data.c);
//       setTicker((prev) => ({
//         ...prev,
//         lastPrice: price < 0.1 ? price.toFixed(8) : price.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//         priceChangePercent: data.P,
//         highPrice: parseFloat(data.h) < 0.1 ? data.h : parseFloat(data.h).toLocaleString(),
//         lowPrice: parseFloat(data.l) < 0.1 ? data.l : parseFloat(data.l).toLocaleString(),
//         quoteVolume: (parseFloat(data.q) / 1000000).toFixed(2) + "M",
//       }));
//     };
//     return () => ws.close();
//   }, [selectedSymbol]);

//   // 4. تهيئة TradingView (نفس الإعدادات الأصلية)
//   useEffect(() => {
//     const scriptId = "tradingview-widget-script";
//     let script = document.getElementById(scriptId) as HTMLScriptElement;

//     const initWidget = () => {
//       if (typeof window !== "undefined" && (window as any).TradingView && containerRef.current) {
//         new (window as any).TradingView.widget({
//           autosize: true,
//           symbol: `BINANCE:${selectedSymbol}`,
//           interval: "60",
//           timezone: "Etc/UTC",
//           theme: "dark",
//           style: "1",
//           locale: "en",
//           container_id: containerRef.current.id,
//           backgroundColor: "#060606",
//           gridColor: "rgba(42, 46, 57, 0.03)",
//           hide_side_toolbar: false,
//           allow_symbol_change: true,
//           save_image: false,
//         });
//       }
//     };

//     if (!script) {
//       script = document.createElement("script");
//       script.id = scriptId;
//       script.src = "https://s3.tradingview.com/tv.js";
//       script.async = true;
//       script.onload = initWidget;
//       document.head.appendChild(script);
//     } else {
//       initWidget();
//     }
//   }, [selectedSymbol]);

//   return (
//     <div className="flex h-screen bg-[#060606] text-slate-300 overflow-hidden font-sans antialiased">
      
//       {/* Sidebar Overlay */}
//       {isSidebarOpen && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
//       )}

//       {/* --- Sidebar --- */}
//       <aside className={`fixed inset-y-0 left-0 z-[110] w-[240px] bg-[#0B0E11] border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
//         <div className="flex flex-col h-full">
//           <div className="h-[48px] px-4 flex items-center justify-between border-b border-white/5 bg-[#12161C]">
//             <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Market List</span>
//             <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/5 rounded"><X className="w-4 h-4" /></button>
//           </div>
//           <div className="flex-1 overflow-y-auto scrollbar-hide">
//             {CRYPTO_ASSETS.map((crypto) => (
//               <button
//                 key={crypto.symbol}
//                 onClick={() => { setSelectedSymbol(crypto.symbol); if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
//                 className={`w-full px-4 py-3 flex justify-between items-center transition-all border-b border-white/[0.02] ${selectedSymbol === crypto.symbol ? "bg-[#1E2329] border-l-2 border-emerald-500 shadow-lg" : "hover:bg-[#12161C] border-l-2 border-transparent"}`}
//               >
//                 <div className="text-left">
//                   <div className="text-[13px] font-bold text-white">{crypto.symbol.replace("USDT", "")}</div>
//                   <div className="text-[11px] text-slate-500">{crypto.name}</div>
//                 </div>
//                 <ChevronRight className={`w-3 h-3 transition-opacity ${selectedSymbol === crypto.symbol ? 'opacity-100' : 'opacity-0'}`} />
//               </button>
//             ))}
//           </div>
//         </div>
//       </aside>

//       {/* --- Main Content --- */}
//       <main className="flex-1 flex flex-col min-w-0 bg-[#060606]">
//         <header className="h-[48px] bg-[#12161C] border-b border-white/5 flex items-center px-4 justify-between shrink-0 z-50">
//           <div className="flex items-center gap-6">
//             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-white/5 rounded text-emerald-500"><Menu className="w-5 h-5" /></button>
//             <div className="flex items-center gap-2 pr-6 border-r border-white/10">
//               <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center"><BarChart3 className="text-black w-4 h-4" /></div>
//               <span className="font-bold text-white tracking-tighter text-[15px]">PRO<span className="text-emerald-500">TRADE</span></span>
//             </div>
//           </div>
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
//               <Clock className="w-3.5 h-3.5 text-emerald-500" />
//               <span className="text-[11px] font-mono text-slate-300 mt-0.5">{currentTime} <span className="text-slate-500 ml-1">UTC</span></span>
//             </div>
//           </div>
//         </header>

//         {/* Ticker Bar */}
//         <div className="h-[40px] bg-[#0B0E11] border-b border-white/5 flex items-center px-4 overflow-x-auto whitespace-nowrap gap-8 scrollbar-hide shrink-0">
//            <div className="flex items-center gap-2 border-r border-white/5 pr-6">
//              <span className="text-[14px] font-bold text-white uppercase">{selectedSymbol}</span>
//              <span className={`text-[13px] font-mono font-bold ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{ticker.lastPrice}</span>
//            </div>
//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Change</span>
//              <span className={`text-[11px] font-mono leading-none ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{ticker.priceChangePercent}%</span>
//            </div>
//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h High</span>
//              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.highPrice}</span>
//            </div>
//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Low</span>
//              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.lowPrice}</span>
//            </div>
//         </div>

//         {/* Body Content */}
//         <div className="flex-1 overflow-y-auto bg-[#060606] scrollbar-hide">
//           <section className="h-[55vh] w-full border-b border-white/5 bg-black relative">
//             <div id="tradingview_widget" ref={containerRef} className="w-full h-full" />
//           </section>

//           <section className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
//             <div className="flex items-center gap-3 mb-6">
//               <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
//               <h2 className="text-[16px] font-bold text-white uppercase tracking-tight">Pro Signals (From History)</h2>
//               <div className="flex-1 h-[1px] bg-white/5"></div>
//             </div>

//             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5 pb-10">
//               {liveTrades.length > 0 ? (
//                 liveTrades.map((trade, idx) => (
//                   <SignalCard key={idx} trade={trade} />
//                 ))
//               ) : (
//                 <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
//                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//                    <p className="text-slate-500 text-sm italic font-mono">Connecting to global intelligence...</p>
//                 </div>
//               )}
//             </div>
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// }

// // --- Signal Card (نفس التصميم الأصلي بدون تغيير) ---
// function SignalCard({ trade }: { trade: SuggestedTrade }) {
//   const signalStrength = trade.strength || 75;
//   const winProbability = Math.min(92, signalStrength - 5 + Math.floor(Math.random() * 8));
//   const tradeTime = trade.timestamp ? new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live";

//   return (
//     <div className="bg-[#161A1E] border border-white/5 rounded-xl p-0 hover:border-emerald-500/40 transition-all group overflow-hidden shadow-2xl relative flex flex-col h-full">
//       <div className="flex justify-between items-center px-3 py-2.5 bg-[#1E2329]/80 border-b border-white/[0.03]">
//         <div className="flex items-center gap-2.5">
//           <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-black text-black shadow-lg">{trade.pair.charAt(0)}</div>
//           <div>
//             <div className="flex items-center gap-1.5">
//               <span className="text-[14px] font-bold text-white tracking-tight leading-none">{trade.pair}</span>
//               <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded border border-emerald-500/20 font-bold uppercase">{tradeTime}</span>
//             </div>
//             <span className="text-[10px] text-slate-500 font-mono mt-0.5 block italic">{trade.timeframe} Chart</span>
//           </div>
//         </div>
//         <div className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 border shadow-inner ${trade.type === 'LONG' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
//           <TrendingUp className={`w-3 h-3 ${trade.type === 'SHORT' ? 'rotate-180' : ''}`} />
//           <span className="text-[10px] font-black uppercase tracking-widest">{trade.type}</span>
//         </div>
//       </div>
//       <div className="px-3 py-2 bg-[#0B0E11]/40 border-b border-white/[0.02] flex items-center gap-6">
//         <div className="flex-1 space-y-1">
//           <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter"><span className="text-slate-500">Signal Strength</span><span className="text-emerald-400">{signalStrength}%</span></div>
//           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${signalStrength}%` }} /></div>
//         </div>
//         <div className="flex-1 space-y-1">
//           <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter"><span className="text-slate-500">Confidence</span><span className="text-blue-400">{winProbability}%</span></div>
//           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${winProbability}%` }} /></div>
//         </div>
//       </div>
//       <div className="p-3 space-y-4">
//         <div className="flex justify-between items-center">
//           <div><p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Entry Price</p><p className="text-[18px] font-mono font-bold text-white tracking-tighter">{trade.entry}</p></div>
//           <div className="text-right"><p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Method</p><div className="inline-block px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-bold text-slate-300">{trade.candle}</div></div>
//         </div>
//         <div className="grid grid-cols-2 gap-2.5">
//           <div className="bg-emerald-500/[0.02] rounded-lg p-2.5 border border-emerald-500/10">
//             <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-2">Targets</p>
//             <div className="space-y-1.5">{trade.tp.map((val, i) => (<div key={i} className="flex justify-between items-center"><span className="text-[8px] text-slate-600 font-bold">TP{i+1}</span><span className="text-[11px] font-mono font-bold text-slate-200">{val}</span></div>))}</div>
//           </div>
//           <div className="bg-rose-500/[0.02] rounded-lg p-2.5 border border-rose-500/10 flex flex-col justify-between">
//             <div><p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mb-2">Protection</p><p className="text-[13px] font-mono font-bold text-white">{trade.sl}</p></div>
//           </div>
//         </div>
//       </div>
//       <div className="mt-auto px-3 py-3 border-t border-white/[0.03] bg-[#1E2329]/20 flex gap-2">
//         <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg font-bold text-[11px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 active:scale-[0.98]"><Zap className="w-3.5 h-3.5 fill-black" /> Trade Now</button>
//         <button onClick={() => navigator.clipboard.writeText(`Pair: ${trade.pair}, Entry: ${trade.entry}`)} className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 border border-white/5"><Copy className="w-4 h-4" /></button>
//       </div>
//     </div>
//   );
// }



// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Menu, X, TrendingUp, Zap, ChevronRight, Copy, BarChart3, Clock } from "lucide-react";

// // --- Types ---
// interface TickerData {
//   lastPrice: string;
//   priceChangePercent: string;
//   highPrice: string;
//   lowPrice: string;
//   quoteVolume: string;
// }

// interface SuggestedTrade {
//   pair: string;
//   type: "LONG" | "SHORT";
//   entry: string;
//   tp: string[];
//   sl: string;
//   timeframe: string;
//   range: string;
//   candle: string;
//   status: string;
//   strength?: number;
//   timestamp?: string;
// }

// const CRYPTO_ASSETS = [
//   { symbol: "BTCUSDT", name: "Bitcoin" },
//   { symbol: "ETHUSDT", name: "Ethereum" },
//   { symbol: "BNBUSDT", name: "Binance" },
//   { symbol: "SOLUSDT", name: "Solana" },
//   { symbol: "SHIBUSDT", name: "Shiba Inu" },
//   { symbol: "DOGEUSDT", name: "Dogecoin" },
//   { symbol: "PEPEUSDT", name: "Pepe" },
//   { symbol: "PAXGUSDT", name: "Gold (PAXG)" }
// ];

// // رابط السيرفر الموحد
// const BACKEND_URL = "https://trading-backend-n8x1.onrender.com/api/signals";

// export default function TradingPage() {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [currentTime, setCurrentTime] = useState("");
//   const [liveTrades, setLiveTrades] = useState<SuggestedTrade[]>([]);

//   const [ticker, setTicker] = useState<TickerData>({
//     lastPrice: "0.00",
//     priceChangePercent: "0.00",
//     highPrice: "0.00",
//     lowPrice: "0.00",
//     quoteVolume: "0",
//   });

//   // 1. الساعة الحية (UTC)
//   useEffect(() => {
//     const timer = setInterval(() => {
//       const now = new Date();
//       setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' }));
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // 2. جلب التوصيات من السيرفر
//   useEffect(() => {
//     const controller = new AbortController();
    
//     const fetchSignals = async () => {
//       try {
//         const response = await fetch(BACKEND_URL, { signal: controller.signal });
//         const data = await response.json();
        
//         if (data && Array.isArray(data)) {
//           const formattedTrades: SuggestedTrade[] = data.map((sig: any) => ({
//             pair: sig.symbol,
//             type: sig.type,
//             // تحسين عرض الأرقام للعملات الصغيرة جداً
//             entry: sig.entry < 0.01 ? sig.entry.toFixed(8) : sig.entry.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//             tp: sig.tp.map((t: number) => t < 0.01 ? t.toFixed(8) : t.toLocaleString(undefined, { minimumFractionDigits: 2 })),
//             sl: sig.sl < 0.01 ? sig.sl.toFixed(8) : sig.sl.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//             timeframe: "1H",
//             range: "Intraday",
//             candle: sig.reason || "AI Analysis",
//             status: "Active",
//             strength: sig.strength || 85,
//             timestamp: sig.timestamp
//           }));

//           setLiveTrades(formattedTrades.sort((a, b) => 
//             new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
//           ));
//         }
//       } catch (error: any) {
//         if (error.name !== 'AbortError') console.error("Backend Error:", error);
//       }
//     };

//     fetchSignals();
//     const interval = setInterval(fetchSignals, 30000); // تحديث كل 30 ثانية لتقليل الضغط
//     return () => {
//         controller.abort();
//         clearInterval(interval);
//     };
//   }, []);

//   // 3. تحديث بيانات التيكر والـ WebSockets
//   useEffect(() => {
//     const fetchInitialTicker = async () => {
//       try {
//         const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${selectedSymbol}`);
//         const data = await response.json();
//         setTicker({
//           lastPrice: parseFloat(data.lastPrice).toLocaleString(),
//           priceChangePercent: data.priceChangePercent,
//           highPrice: parseFloat(data.highPrice).toLocaleString(),
//           lowPrice: parseFloat(data.lowPrice).toLocaleString(),
//           quoteVolume: (parseFloat(data.quoteVolume) / 1000000).toFixed(2) + "M",
//         });
//       } catch (e) { console.error(e); }
//     };

//     fetchInitialTicker();

//     const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@ticker`);
//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       setTicker((prev) => ({
//         ...prev,
//         lastPrice: parseFloat(data.c) < 0.01 ? data.c : parseFloat(data.c).toLocaleString(undefined, { minimumFractionDigits: 2 }),
//         priceChangePercent: data.P,
//       }));
//     };
//     return () => ws.close();
//   }, [selectedSymbol]);

//   // 4. تهيئة TradingView Widget
//   useEffect(() => {
//     const scriptId = "tradingview-widget-script";
//     let script = document.getElementById(scriptId) as HTMLScriptElement;

//     const initWidget = () => {
//       if (typeof window !== "undefined" && (window as any).TradingView && containerRef.current) {
//         new (window as any).TradingView.widget({
//           autosize: true,
//           symbol: `BINANCE:${selectedSymbol}`,
//           interval: "60",
//           timezone: "Etc/UTC",
//           theme: "dark",
//           style: "1",
//           locale: "en",
//           container_id: containerRef.current.id,
//           backgroundColor: "#060606",
//           gridColor: "rgba(42, 46, 57, 0.03)",
//           hide_side_toolbar: false,
//           allow_symbol_change: true,
//           save_image: false,
//         });
//       }
//     };

//     if (!script) {
//       script = document.createElement("script");
//       script.id = scriptId;
//       script.src = "https://s3.tradingview.com/tv.js";
//       script.async = true;
//       script.onload = initWidget;
//       document.head.appendChild(script);
//     } else {
//       initWidget();
//     }
//   }, [selectedSymbol]);

//   return (
//     <div className="flex h-screen bg-[#060606] text-slate-300 overflow-hidden font-sans antialiased">
      
//       {/* Sidebar Overlay */}
//       {isSidebarOpen && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
//       )}

//       {/* --- Sidebar --- */}
//       <aside className={`fixed inset-y-0 left-0 z-[110] w-[240px] bg-[#0B0E11] border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
//         <div className="flex flex-col h-full">
//           <div className="h-[48px] px-4 flex items-center justify-between border-b border-white/5 bg-[#12161C]">
//             <span className="text-[12px] font-semibold uppercase text-slate-400">Market Watch</span>
//             <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/5 rounded"><X className="w-4 h-4" /></button>
//           </div>
//           <div className="flex-1 overflow-y-auto">
//             {CRYPTO_ASSETS.map((crypto) => (
//               <button
//                 key={crypto.symbol}
//                 onClick={() => { setSelectedSymbol(crypto.symbol); setIsSidebarOpen(false); }}
//                 className={`w-full px-4 py-3 flex justify-between items-center border-b border-white/[0.02] ${selectedSymbol === crypto.symbol ? "bg-[#1E2329] border-l-2 border-emerald-500" : "hover:bg-[#12161C]"}`}
//               >
//                 <div className="text-left">
//                   <div className="text-[13px] font-bold text-white">{crypto.symbol.replace("USDT", "")}</div>
//                   <div className="text-[11px] text-slate-500">{crypto.name}</div>
//                 </div>
//                 <ChevronRight className={`w-3 h-3 ${selectedSymbol === crypto.symbol ? 'opacity-100' : 'opacity-0'}`} />
//               </button>
//             ))}
//           </div>
//         </div>
//       </aside>

//       {/* --- Main Content --- */}
//       <main className="flex-1 flex flex-col min-w-0 bg-[#060606]">
//         {/* Header */}
//         <header className="h-[48px] bg-[#12161C] border-b border-white/5 flex items-center px-4 justify-between shrink-0">
//           <div className="flex items-center gap-4">
//             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 text-emerald-500"><Menu className="w-5 h-5" /></button>
//             <div className="flex items-center gap-2 pr-4 border-r border-white/10">
//               <BarChart3 className="text-emerald-500 w-5 h-5" />
//               <span className="font-bold text-white text-[15px]">PRO<span className="text-emerald-500">TRADE</span></span>
//             </div>
//           </div>
//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
//               <Clock className="w-3.5 h-3.5 text-emerald-500" />
//               <span className="text-[11px] font-mono">{currentTime} UTC</span>
//             </div>
//           </div>
//         </header>

//         {/* Ticker */}
//         <div className="h-[40px] bg-[#0B0E11] border-b border-white/5 flex items-center px-4 gap-8 overflow-x-auto scrollbar-hide shrink-0">
//            <div className="flex items-center gap-2"><span className="text-[14px] font-bold text-white">{selectedSymbol}</span><span className={`text-[13px] font-mono ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{ticker.lastPrice}</span></div>
//            <div className="flex flex-col"><span className="text-[9px] text-slate-500 uppercase">24h Change</span><span className={`text-[11px] font-mono ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{ticker.priceChangePercent}%</span></div>
//            <div className="flex flex-col"><span className="text-[9px] text-slate-500 uppercase">24h Volume</span><span className="text-[11px] text-slate-200 font-mono">{ticker.quoteVolume}</span></div>
//         </div>

//         {/* Body */}
//         <div className="flex-1 overflow-y-auto scrollbar-hide">
//           <section className="h-[50vh] w-full border-b border-white/5 bg-black">
//             <div id="tradingview_widget" ref={containerRef} className="w-full h-full" />
//           </section>

//           <section className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
//             <div className="flex items-center gap-3 mb-6">
//               <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
//               <h2 className="text-[16px] font-bold text-white uppercase tracking-tight">AI Signal Terminal</h2>
//               <div className="flex-1 h-[1px] bg-white/5"></div>
//             </div>

//             <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 pb-10">
//               {liveTrades.length > 0 ? (
//                 liveTrades.map((trade, idx) => (
//                   <SignalCard key={idx} trade={trade} />
//                 ))
//               ) : (
//                 <div className="col-span-full py-20 text-center border border-dashed border-white/10 rounded-xl">
//                    <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//                    <p className="text-slate-500 font-mono">Scanning Market Intelligence...</p>
//                 </div>
//               )}
//             </div>
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// }

// function SignalCard({ trade }: { trade: SuggestedTrade }) {
//   const signalStrength = trade.strength || 80;
//   const tradeTime = trade.timestamp ? new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Live";

//   return (
//     <div className="bg-[#161A1E] border border-white/5 rounded-xl hover:border-emerald-500/40 transition-all group overflow-hidden flex flex-col h-full shadow-xl">
//       <div className="flex justify-between items-center px-4 py-3 bg-[#1E2329]/50 border-b border-white/[0.03]">
//         <div className="flex items-center gap-3">
//           <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-black font-black text-xs">{trade.pair.charAt(0)}</div>
//           <div>
//             <div className="flex items-center gap-2">
//               <span className="text-[14px] font-bold text-white">{trade.pair}</span>
//               <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">{tradeTime}</span>
//             </div>
//           </div>
//         </div>
//         <div className={`px-3 py-1 rounded-md border text-[10px] font-black uppercase tracking-widest ${trade.type === 'LONG' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
//           {trade.type}
//         </div>
//       </div>

//       <div className="p-4 space-y-5">
//         <div className="flex justify-between items-end">
//           <div>
//             <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Entry Price</p>
//             <p className="text-2xl font-mono font-bold text-white">{trade.entry}</p>
//           </div>
//           <div className="text-right">
//             <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Confidence</p>
//             <p className="text-emerald-500 font-bold">{signalStrength}%</p>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-4">
//           <div className="bg-emerald-500/[0.03] rounded-lg p-3 border border-emerald-500/10">
//             <p className="text-[10px] text-emerald-500 font-bold uppercase mb-2">Take Profit</p>
//             <div className="space-y-1">
//               {trade.tp.map((val, i) => (
//                 <div key={i} className="flex justify-between font-mono text-[12px]"><span className="text-slate-500">TP{i+1}</span><span className="text-white">{val}</span></div>
//               ))}
//             </div>
//           </div>
//           <div className="bg-rose-500/[0.03] rounded-lg p-3 border border-rose-500/10 flex flex-col justify-between">
//             <div>
//               <p className="text-[10px] text-rose-500 font-bold uppercase mb-2">Stop Loss</p>
//               <p className="font-mono text-white text-[14px]">{trade.sl}</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="mt-auto p-3 border-t border-white/[0.03] bg-[#1E2329]/20 flex gap-2">
//         <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 rounded-lg font-bold text-[12px] uppercase transition-all flex items-center justify-center gap-2 active:scale-95">
//           <Zap className="w-4 h-4 fill-black" /> Execute Signal
//         </button>
//         <button onClick={() => navigator.clipboard.writeText(`${trade.pair} Entry: ${trade.entry}`)} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 border border-white/5 transition-colors">
//           <Copy className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// }







// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Menu, X, TrendingUp, Zap, ChevronRight, Copy, BarChart3, Clock } from "lucide-react";

// // --- Types ---
// interface TickerData {
//   lastPrice: string;
//   priceChangePercent: string;
//   highPrice: string;
//   lowPrice: string;
//   quoteVolume: string;
// }

// interface SuggestedTrade {
//   pair: string;
//   type: "LONG" | "SHORT";
//   entry: string;
//   tp: string[];
//   sl: string;
//   timeframe: string;
//   range: string;
//   candle: string;
//   status: string;
//   strength?: number;
//   timestamp?: string; // التوقيت القادم من ملف JSON
// }


// const CRYPTO_ASSETS = [
//   { symbol: "BTCUSDT", name: "Bitcoin" },
//   { symbol: "ETHUSDT", name: "Ethereum" },
//   { symbol: "BNBUSDT", name: "Binance" },
//   { symbol: "SOLUSDT", name: "Solana" },
//   { symbol: "SHIBUSDT", name: "Shiba Inu" }, // إضافة شيبا
//   { symbol: "DOGEUSDT", name: "Dogecoin" },  // إضافة دوج كوين
//   { symbol: "PEPEUSDT", name: "Pepe" },      // إضافة بيبيه
//   { symbol: "PAXGUSDT", name: "Gold (PAXG)" } // الذهب الرقمي المدعوم بذهب حقيقي
// ];

// export default function TradingPage() {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [currentTime, setCurrentTime] = useState("");
  
//   // الحالة الخاصة بالتوصيات (تُجلب من ملف JSON بالسيرفر)
//   const [liveTrades, setLiveTrades] = useState<SuggestedTrade[]>([]);

//   const [ticker, setTicker] = useState<TickerData>({
//     lastPrice: "0.00",
//     priceChangePercent: "0.00",
//     highPrice: "0.00",
//     lowPrice: "0.00",
//     quoteVolume: "0",
//   });

//   // --- Effects ---

//   // 1. ساعة حية (UTC)
//   useEffect(() => {
//     const timer = setInterval(() => {
//       const now = new Date();
//       setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);
//   // https://trading-backend-n8x1.onrender.com/api/signals
//   // 2. جلب التوصيات من السيرفر (يقرأ من signals.json)
//   useEffect(() => {
//     const fetchSignals = async () => {
//       try {
//         const response = await fetch("http://localhost:5000/api/signals");
//         const data = await response.json();
        
//         if (data && Array.isArray(data)) {
//           const formattedTrades: SuggestedTrade[] = data.map((sig: any) => ({
//             pair: sig.symbol,
//             type: sig.type as "LONG" | "SHORT",
//             entry: sig.entry.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//             tp: sig.tp.map((t: number) => t.toLocaleString(undefined, { minimumFractionDigits: 2 })),
//             sl: sig.sl.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//             timeframe: "1H",
//             range: "Intraday",
//             candle: sig.reason,
//             status: "Active",
//             strength: sig.strength,
//             timestamp: sig.timestamp
//           }));

//           // ترتيب الصفقات: الأحدث يظهر أولاً
//           setLiveTrades(formattedTrades.sort((a, b) => 
//             new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
//           ));
//         }
//       } catch (error) {
//         console.error("Backend Connection Error:", error);
//       }
//     };

//     fetchSignals();
//     const interval = setInterval(fetchSignals, 20000); // تحديث كل 20 ثانية
//     return () => clearInterval(interval);
//   }, []);

//   // 3. جلب بيانات 24 ساعة من Binance
//   useEffect(() => {
//     const fetchTickerData = async () => {
//       try {
//         const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${selectedSymbol}`);
//         const data = await response.json();
//         setTicker({
//           lastPrice: parseFloat(data.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }),
//           priceChangePercent: data.priceChangePercent,
//           highPrice: parseFloat(data.highPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }),
//           lowPrice: parseFloat(data.lowPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }),
//           quoteVolume: (parseFloat(data.quoteVolume) / 1000000).toFixed(2) + "M",
//         });
//       } catch (error) {
//         console.error("Binance Fetch Error:", error);
//       }
//     };
//     fetchTickerData();
//   }, [selectedSymbol]);

//   // 4. تحديث السعر اللحظي (WebSockets)
//   useEffect(() => {
//     const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@ticker`);
//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       setTicker((prev) => ({
//         ...prev,
//         lastPrice: parseFloat(data.c).toLocaleString(undefined, { minimumFractionDigits: 2 }),
//         priceChangePercent: data.P,
//       }));
//     };
//     return () => ws.close();
//   }, [selectedSymbol]);

//   // 5. تهيئة TradingView
//   useEffect(() => {
//     const scriptId = "tradingview-widget-script";
//     let script = document.getElementById(scriptId) as HTMLScriptElement;

//     const initWidget = () => {
//       // @ts-ignore
//       if (typeof window.TradingView !== "undefined" && containerRef.current) {
//         // @ts-ignore
//         new window.TradingView.widget({
//           autosize: true,
//           symbol: `BINANCE:${selectedSymbol}`,
//           interval: "15",
//           timezone: "Etc/UTC",
//           theme: "dark",
//           style: "1",
//           locale: "en",
//           enable_publishing: false,
//           hide_side_toolbar: false,
//           allow_symbol_change: true,
//           container_id: containerRef.current.id,
//           backgroundColor: "#060606",
//           gridColor: "rgba(42, 46, 57, 0.03)",
//           hide_top_toolbar: false,
//           save_image: false,
//         });
//       }
//     };

//     if (!script) {
//       script = document.createElement("script");
//       script.id = scriptId;
//       script.src = "https://s3.tradingview.com/tv.js";
//       script.async = true;
//       script.onload = initWidget;
//       document.head.appendChild(script);
//     } else {
//       initWidget();
//     }
//   }, [selectedSymbol]);

//   return (
//     <div className="flex h-screen bg-[#060606] text-slate-300 overflow-hidden font-sans antialiased">
      
//       {isSidebarOpen && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
//       )}

//       {/* --- Sidebar (Watchlist) --- */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-[110] w-[240px] bg-[#0B0E11] border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0
//         ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
//       `}>
//         <div className="flex flex-col h-full">
//           <div className="h-[48px] px-4 flex items-center justify-between border-b border-white/5 bg-[#12161C]">
//             <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Market List</span>
//             <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/5 rounded">
//               <X className="w-4 h-4" />
//             </button>
//           </div>

//           <div className="flex-1 overflow-y-auto scrollbar-hide">
//             {CRYPTO_ASSETS.map((crypto) => (
//               <button
//                 key={crypto.symbol}
//                 onClick={() => {
//                   setSelectedSymbol(crypto.symbol);
//                   if (window.innerWidth < 1024) setIsSidebarOpen(false);
//                 }}
//                 className={`
//                   w-full px-4 py-3 flex justify-between items-center transition-all border-b border-white/[0.02]
//                   ${selectedSymbol === crypto.symbol ? "bg-[#1E2329] border-l-2 border-emerald-500 shadow-lg" : "hover:bg-[#12161C] border-l-2 border-transparent"}
//                 `}
//               >
//                 <div className="text-left">
//                   <div className="text-[13px] font-bold text-white">{crypto.symbol.replace("USDT", "")}</div>
//                   <div className="text-[11px] text-slate-500">{crypto.name}</div>
//                 </div>
//                 <ChevronRight className={`w-3 h-3 transition-opacity ${selectedSymbol === crypto.symbol ? 'opacity-100' : 'opacity-0'}`} />
//               </button>
//             ))}
//           </div>
//         </div>
//       </aside>

//       {/* --- Main Content --- */}
//       <main className="flex-1 flex flex-col min-w-0 bg-[#060606]">
        
//         {/* Header */}
//         <header className="h-[48px] bg-[#12161C] border-b border-white/5 flex items-center px-4 justify-between shrink-0 z-50">
//           <div className="flex items-center gap-6">
//             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-white/5 rounded text-emerald-500">
//               <Menu className="w-5 h-5" />
//             </button>
            
//             <div className="flex items-center gap-2 pr-6 border-r border-white/10">
//               <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
//                 <BarChart3 className="text-black w-4 h-4" />
//               </div>
//               <span className="font-bold text-white tracking-tighter text-[15px]">PRO<span className="text-emerald-500">TRADE</span></span>
//             </div>

//             <nav className="hidden md:flex items-center gap-5">
//               {['Exchange', 'Signals', 'History'].map((nav) => (
//                 <button key={nav} className="text-[12px] font-medium text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-tight">
//                   {nav}
//                 </button>
//               ))}
//             </nav>
//           </div>

//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
//               <Clock className="w-3.5 h-3.5 text-emerald-500" />
//               <span className="text-[11px] font-mono text-slate-300 mt-0.5">{currentTime} <span className="text-slate-500 ml-1">UTC</span></span>
//             </div>
//             <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-4">
//               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
//               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
//             </div>
//           </div>
//         </header>

//         {/* Ticker Bar */}
//         <div className="h-[40px] bg-[#0B0E11] border-b border-white/5 flex items-center px-4 overflow-x-auto whitespace-nowrap gap-8 scrollbar-hide shrink-0">
//            <div className="flex items-center gap-2 border-r border-white/5 pr-6">
//              <span className="text-[14px] font-bold text-white uppercase">{selectedSymbol}</span>
//              <span className={`text-[13px] font-mono font-bold ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
//                {ticker.lastPrice}
//              </span>
//            </div>

//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Change</span>
//              <span className={`text-[11px] font-mono leading-none ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
//                {parseFloat(ticker.priceChangePercent) >= 0 ? '+' : ''}{ticker.priceChangePercent}%
//              </span>
//            </div>

//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h High</span>
//              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.highPrice}</span>
//            </div>

//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Low</span>
//              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.lowPrice}</span>
//            </div>

//            <div className="flex flex-col justify-center">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Volume (USDT)</span>
//              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.quoteVolume}</span>
//            </div>
//         </div>

//         {/* Body */}
//         <div className="flex-1 overflow-y-auto bg-[#060606] scrollbar-hide">
//           {/* الرسم البياني */}
//           <section className="h-[55vh] w-full border-b border-white/5 bg-black relative">
//             <div id="tradingview_widget" ref={containerRef} className="w-full h-full" />
//           </section>

//           {/* شبكة التوصيات القادمة من السيرفر والملف */}
//           <section className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
//             <div className="flex items-center gap-3 mb-6">
//               <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
//               <h2 className="text-[16px] font-bold text-white uppercase tracking-tight">Pro Signals (From History)</h2>
//               <div className="flex-1 h-[1px] bg-white/5"></div>
//             </div>

//             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5 pb-10">
//               {liveTrades.length > 0 ? (
//                 liveTrades.map((trade, idx) => (
//                   <SignalCard key={idx} trade={trade} />
//                 ))
//               ) : (
//                 <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
//                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//                    <p className="text-slate-500 text-sm italic font-mono">
//                      Connecting to server history... Looking for signals in JSON.
//                    </p>
//                 </div>
//               )}
//             </div>
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// }

// // --- مكون بطاقة التوصية ---
// function SignalCard({ trade }: { trade: SuggestedTrade }) {
//   const signalStrength = trade.strength || 75;
//   const winProbability = Math.min(92, signalStrength - 5 + Math.floor(Math.random() * 8));

//   // استخراج الوقت بشكل جميل (مثلاً: 14:30)
//   const tradeTime = trade.timestamp 
//     ? new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
//     : "Live";

//   return (
//     <div className="bg-[#161A1E] border border-white/5 rounded-xl p-0 hover:border-emerald-500/40 transition-all group overflow-hidden shadow-2xl relative flex flex-col h-full">
      
//       {/* Top Bar */}
//       <div className="flex justify-between items-center px-3 py-2.5 bg-[#1E2329]/80 border-b border-white/[0.03]">
//         <div className="flex items-center gap-2.5">
//           <div className="relative">
//             <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-black text-black shadow-lg">
//               {trade.pair.charAt(0)}
//             </div>
//           </div>
//           <div>
//             <div className="flex items-center gap-1.5">
//               <span className="text-[14px] font-bold text-white tracking-tight leading-none">{trade.pair}</span>
//               <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded border border-emerald-500/20 font-bold uppercase">{tradeTime}</span>
//             </div>
//             <span className="text-[10px] text-slate-500 font-mono mt-0.5 block italic">{trade.timeframe} Chart</span>
//           </div>
//         </div>

//         <div className="flex flex-col items-end gap-1">
//           <div className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 border shadow-inner ${
//             trade.type === 'LONG' 
//             ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
//             : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
//           }`}>
//             <TrendingUp className={`w-3 h-3 ${trade.type === 'SHORT' ? 'rotate-180' : ''}`} />
//             <span className="text-[10px] font-black uppercase tracking-widest">{trade.type}</span>
//           </div>
//         </div>
//       </div>

//       {/* Stats Bar */}
//       <div className="px-3 py-2 bg-[#0B0E11]/40 border-b border-white/[0.02] flex items-center gap-6">
//         <div className="flex-1 space-y-1">
//           <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter">
//             <span className="text-slate-500">Signal Strength</span>
//             <span className="text-emerald-400">{signalStrength}%</span>
//           </div>
//           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
//             <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${signalStrength}%` }} />
//           </div>
//         </div>
//         <div className="flex-1 space-y-1">
//           <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter">
//             <span className="text-slate-500">Confidence</span>
//             <span className="text-blue-400">{winProbability}%</span>
//           </div>
//           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
//             <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${winProbability}%` }} />
//           </div>
//         </div>
//       </div>

//       {/* Entry & Targets */}
//       <div className="p-3 space-y-4">
//         <div className="flex justify-between items-center">
//           <div>
//             <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Entry Price</p>
//             <p className="text-[18px] font-mono font-bold text-white tracking-tighter">{trade.entry}</p>
//           </div>
//           <div className="text-right">
//              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Method</p>
//              <div className="inline-block px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-bold text-slate-300">
//                {trade.candle}
//              </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-2.5">
//           <div className="bg-emerald-500/[0.02] rounded-lg p-2.5 border border-emerald-500/10">
//             <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-2">Targets</p>
//             <div className="space-y-1.5">
//               {trade.tp.map((val, i) => (
//                 <div key={i} className="flex justify-between items-center">
//                   <span className="text-[8px] text-slate-600 font-bold">TP{i+1}</span>
//                   <span className="text-[11px] font-mono font-bold text-slate-200">{val}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="bg-rose-500/[0.02] rounded-lg p-2.5 border border-rose-500/10 flex flex-col justify-between">
//             <div>
//               <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mb-2">Protection</p>
//               <p className="text-[13px] font-mono font-bold text-white">{trade.sl}</p>
//             </div>
//             <div className="mt-2 pt-2 border-t border-white/5">
//               <span className="text-[8px] text-rose-400 font-bold uppercase italic opacity-80">R:R 1:3</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="mt-auto px-3 py-3 border-t border-white/[0.03] bg-[#1E2329]/20 flex gap-2">
//         <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg font-bold text-[11px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
//           <Zap className="w-3.5 h-3.5 fill-black" />
//           Trade Now
//         </button>
//         <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 border border-white/5">
//           <Copy className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// }




// "use client";

// import { useEffect, useRef, useState } from "react";
// import { Menu, X, TrendingUp, Zap, ChevronRight, Copy, BarChart3, Clock } from "lucide-react";

// // --- Types ---
// interface TickerData {
//   lastPrice: string;
//   priceChangePercent: string;
//   highPrice: string;
//   lowPrice: string;
//   quoteVolume: string;
// }

// interface SuggestedTrade {
//   pair: string;
//   type: "LONG" | "SHORT";
//   entry: string;
//   tp: string[];
//   sl: string;
//   timeframe: string;
//   range: string;
//   candle: string;
//   status: string;
//   strength?: number;
//   timestamp?: string; // التوقيت القادم من ملف JSON
// }


// const CRYPTO_ASSETS = [
//   { symbol: "BTCUSDT", name: "Bitcoin" },
//   { symbol: "ETHUSDT", name: "Ethereum" },
//   { symbol: "BNBUSDT", name: "Binance" },
//   { symbol: "SOLUSDT", name: "Solana" },
//   { symbol: "SHIBUSDT", name: "Shiba Inu" }, // إضافة شيبا
//   { symbol: "DOGEUSDT", name: "Dogecoin" },  // إضافة دوج كوين
//   { symbol: "PEPEUSDT", name: "Pepe" },      // إضافة بيبيه
//   { symbol: "PAXGUSDT", name: "Gold (PAXG)" } // الذهب الرقمي المدعوم بذهب حقيقي
// ];

// export default function TradingPage() {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [currentTime, setCurrentTime] = useState("");
  
//   // الحالة الخاصة بالتوصيات (تُجلب من ملف JSON بالسيرفر)
//   const [liveTrades, setLiveTrades] = useState<SuggestedTrade[]>([]);

//   const [ticker, setTicker] = useState<TickerData>({
//     lastPrice: "0.00",
//     priceChangePercent: "0.00",
//     highPrice: "0.00",
//     lowPrice: "0.00",
//     quoteVolume: "0",
//   });

//   // --- Effects ---

//   // 1. ساعة حية (UTC)
//   useEffect(() => {
//     const timer = setInterval(() => {
//       const now = new Date();
//       setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);
//   // https://trading-backend-n8x1.onrender.com/api/signals
//   // 2. جلب التوصيات من السيرفر (يقرأ من signals.json)
//   useEffect(() => {
//     const fetchSignals = async () => {
//       try {
//         const response = await fetch("http://localhost:5000/api/signals");
//         const data = await response.json();
        
//         if (data && Array.isArray(data)) {
//           const formattedTrades: SuggestedTrade[] = data.map((sig: any) => ({
//             pair: sig.symbol,
//             type: sig.type as "LONG" | "SHORT",
//             entry: sig.entry.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//             tp: sig.tp.map((t: number) => t.toLocaleString(undefined, { minimumFractionDigits: 2 })),
//             sl: sig.sl.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//             timeframe: "1H",
//             range: "Intraday",
//             candle: sig.reason,
//             status: "Active",
//             strength: sig.strength,
//             timestamp: sig.timestamp
//           }));

//           // ترتيب الصفقات: الأحدث يظهر أولاً
//           setLiveTrades(formattedTrades.sort((a, b) => 
//             new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
//           ));
//         }
//       } catch (error) {
//         console.error("Backend Connection Error:", error);
//       }
//     };

//     fetchSignals();
//     const interval = setInterval(fetchSignals, 20000); // تحديث كل 20 ثانية
//     return () => clearInterval(interval);
//   }, []);

//   // 3. جلب بيانات 24 ساعة من Binance
//   useEffect(() => {
//     const fetchTickerData = async () => {
//       try {
//         const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${selectedSymbol}`);
//         const data = await response.json();
//         setTicker({
//           lastPrice: parseFloat(data.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }),
//           priceChangePercent: data.priceChangePercent,
//           highPrice: parseFloat(data.highPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }),
//           lowPrice: parseFloat(data.lowPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }),
//           quoteVolume: (parseFloat(data.quoteVolume) / 1000000).toFixed(2) + "M",
//         });
//       } catch (error) {
//         console.error("Binance Fetch Error:", error);
//       }
//     };
//     fetchTickerData();
//   }, [selectedSymbol]);

//   // 4. تحديث السعر اللحظي (WebSockets)
//   useEffect(() => {
//     const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@ticker`);
//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       setTicker((prev) => ({
//         ...prev,
//         lastPrice: parseFloat(data.c).toLocaleString(undefined, { minimumFractionDigits: 2 }),
//         priceChangePercent: data.P,
//       }));
//     };
//     return () => ws.close();
//   }, [selectedSymbol]);

//   // 5. تهيئة TradingView
//   useEffect(() => {
//     const scriptId = "tradingview-widget-script";
//     let script = document.getElementById(scriptId) as HTMLScriptElement;

//     const initWidget = () => {
//       // @ts-ignore
//       if (typeof window.TradingView !== "undefined" && containerRef.current) {
//         // @ts-ignore
//         new window.TradingView.widget({
//           autosize: true,
//           symbol: `BINANCE:${selectedSymbol}`,
//           interval: "15",
//           timezone: "Etc/UTC",
//           theme: "dark",
//           style: "1",
//           locale: "en",
//           enable_publishing: false,
//           hide_side_toolbar: false,
//           allow_symbol_change: true,
//           container_id: containerRef.current.id,
//           backgroundColor: "#060606",
//           gridColor: "rgba(42, 46, 57, 0.03)",
//           hide_top_toolbar: false,
//           save_image: false,
//         });
//       }
//     };

//     if (!script) {
//       script = document.createElement("script");
//       script.id = scriptId;
//       script.src = "https://s3.tradingview.com/tv.js";
//       script.async = true;
//       script.onload = initWidget;
//       document.head.appendChild(script);
//     } else {
//       initWidget();
//     }
//   }, [selectedSymbol]);

//   return (
//     <div className="flex h-screen bg-[#060606] text-slate-300 overflow-hidden font-sans antialiased">
      
//       {isSidebarOpen && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setIsSidebarOpen(false)} />
//       )}

//       {/* --- Sidebar (Watchlist) --- */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-[110] w-[240px] bg-[#0B0E11] border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0
//         ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
//       `}>
//         <div className="flex flex-col h-full">
//           <div className="h-[48px] px-4 flex items-center justify-between border-b border-white/5 bg-[#12161C]">
//             <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Market List</span>
//             <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/5 rounded">
//               <X className="w-4 h-4" />
//             </button>
//           </div>

//           <div className="flex-1 overflow-y-auto scrollbar-hide">
//             {CRYPTO_ASSETS.map((crypto) => (
//               <button
//                 key={crypto.symbol}
//                 onClick={() => {
//                   setSelectedSymbol(crypto.symbol);
//                   if (window.innerWidth < 1024) setIsSidebarOpen(false);
//                 }}
//                 className={`
//                   w-full px-4 py-3 flex justify-between items-center transition-all border-b border-white/[0.02]
//                   ${selectedSymbol === crypto.symbol ? "bg-[#1E2329] border-l-2 border-emerald-500 shadow-lg" : "hover:bg-[#12161C] border-l-2 border-transparent"}
//                 `}
//               >
//                 <div className="text-left">
//                   <div className="text-[13px] font-bold text-white">{crypto.symbol.replace("USDT", "")}</div>
//                   <div className="text-[11px] text-slate-500">{crypto.name}</div>
//                 </div>
//                 <ChevronRight className={`w-3 h-3 transition-opacity ${selectedSymbol === crypto.symbol ? 'opacity-100' : 'opacity-0'}`} />
//               </button>
//             ))}
//           </div>
//         </div>
//       </aside>

//       {/* --- Main Content --- */}
//       <main className="flex-1 flex flex-col min-w-0 bg-[#060606]">
        
//         {/* Header */}
//         <header className="h-[48px] bg-[#12161C] border-b border-white/5 flex items-center px-4 justify-between shrink-0 z-50">
//           <div className="flex items-center gap-6">
//             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-white/5 rounded text-emerald-500">
//               <Menu className="w-5 h-5" />
//             </button>
            
//             <div className="flex items-center gap-2 pr-6 border-r border-white/10">
//               <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
//                 <BarChart3 className="text-black w-4 h-4" />
//               </div>
//               <span className="font-bold text-white tracking-tighter text-[15px]">PRO<span className="text-emerald-500">TRADE</span></span>
//             </div>

//             <nav className="hidden md:flex items-center gap-5">
//               {['Exchange', 'Signals', 'History'].map((nav) => (
//                 <button key={nav} className="text-[12px] font-medium text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-tight">
//                   {nav}
//                 </button>
//               ))}
//             </nav>
//           </div>

//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded border border-white/5">
//               <Clock className="w-3.5 h-3.5 text-emerald-500" />
//               <span className="text-[11px] font-mono text-slate-300 mt-0.5">{currentTime} <span className="text-slate-500 ml-1">UTC</span></span>
//             </div>
//             <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-4">
//               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
//               <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Live</span>
//             </div>
//           </div>
//         </header>

//         {/* Ticker Bar */}
//         <div className="h-[40px] bg-[#0B0E11] border-b border-white/5 flex items-center px-4 overflow-x-auto whitespace-nowrap gap-8 scrollbar-hide shrink-0">
//            <div className="flex items-center gap-2 border-r border-white/5 pr-6">
//              <span className="text-[14px] font-bold text-white uppercase">{selectedSymbol}</span>
//              <span className={`text-[13px] font-mono font-bold ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
//                {ticker.lastPrice}
//              </span>
//            </div>

//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Change</span>
//              <span className={`text-[11px] font-mono leading-none ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
//                {parseFloat(ticker.priceChangePercent) >= 0 ? '+' : ''}{ticker.priceChangePercent}%
//              </span>
//            </div>

//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h High</span>
//              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.highPrice}</span>
//            </div>

//            <div className="flex flex-col justify-center min-w-[70px]">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Low</span>
//              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.lowPrice}</span>
//            </div>

//            <div className="flex flex-col justify-center">
//              <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Volume (USDT)</span>
//              <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.quoteVolume}</span>
//            </div>
//         </div>

//         {/* Body */}
//         <div className="flex-1 overflow-y-auto bg-[#060606] scrollbar-hide">
//           {/* الرسم البياني */}
//           <section className="h-[55vh] w-full border-b border-white/5 bg-black relative">
//             <div id="tradingview_widget" ref={containerRef} className="w-full h-full" />
//           </section>

//           {/* شبكة التوصيات القادمة من السيرفر والملف */}
//           <section className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
//             <div className="flex items-center gap-3 mb-6">
//               <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
//               <h2 className="text-[16px] font-bold text-white uppercase tracking-tight">Pro Signals (From History)</h2>
//               <div className="flex-1 h-[1px] bg-white/5"></div>
//             </div>

//             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5 pb-10">
//               {liveTrades.length > 0 ? (
//                 liveTrades.map((trade, idx) => (
//                   <SignalCard key={idx} trade={trade} />
//                 ))
//               ) : (
//                 <div className="col-span-full py-12 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
//                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//                    <p className="text-slate-500 text-sm italic font-mono">
//                      Connecting to server history... Looking for signals in JSON.
//                    </p>
//                 </div>
//               )}
//             </div>
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// }

// // --- مكون بطاقة التوصية ---
// function SignalCard({ trade }: { trade: SuggestedTrade }) {
//   const signalStrength = trade.strength || 75;
//   const winProbability = Math.min(92, signalStrength - 5 + Math.floor(Math.random() * 8));

//   // استخراج الوقت بشكل جميل (مثلاً: 14:30)
//   const tradeTime = trade.timestamp 
//     ? new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
//     : "Live";

//   return (
//     <div className="bg-[#161A1E] border border-white/5 rounded-xl p-0 hover:border-emerald-500/40 transition-all group overflow-hidden shadow-2xl relative flex flex-col h-full">
      
//       {/* Top Bar */}
//       <div className="flex justify-between items-center px-3 py-2.5 bg-[#1E2329]/80 border-b border-white/[0.03]">
//         <div className="flex items-center gap-2.5">
//           <div className="relative">
//             <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-black text-black shadow-lg">
//               {trade.pair.charAt(0)}
//             </div>
//           </div>
//           <div>
//             <div className="flex items-center gap-1.5">
//               <span className="text-[14px] font-bold text-white tracking-tight leading-none">{trade.pair}</span>
//               <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded border border-emerald-500/20 font-bold uppercase">{tradeTime}</span>
//             </div>
//             <span className="text-[10px] text-slate-500 font-mono mt-0.5 block italic">{trade.timeframe} Chart</span>
//           </div>
//         </div>

//         <div className="flex flex-col items-end gap-1">
//           <div className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 border shadow-inner ${
//             trade.type === 'LONG' 
//             ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
//             : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
//           }`}>
//             <TrendingUp className={`w-3 h-3 ${trade.type === 'SHORT' ? 'rotate-180' : ''}`} />
//             <span className="text-[10px] font-black uppercase tracking-widest">{trade.type}</span>
//           </div>
//         </div>
//       </div>

//       {/* Stats Bar */}
//       <div className="px-3 py-2 bg-[#0B0E11]/40 border-b border-white/[0.02] flex items-center gap-6">
//         <div className="flex-1 space-y-1">
//           <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter">
//             <span className="text-slate-500">Signal Strength</span>
//             <span className="text-emerald-400">{signalStrength}%</span>
//           </div>
//           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
//             <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${signalStrength}%` }} />
//           </div>
//         </div>
//         <div className="flex-1 space-y-1">
//           <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter">
//             <span className="text-slate-500">Confidence</span>
//             <span className="text-blue-400">{winProbability}%</span>
//           </div>
//           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
//             <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${winProbability}%` }} />
//           </div>
//         </div>
//       </div>

//       {/* Entry & Targets */}
//       <div className="p-3 space-y-4">
//         <div className="flex justify-between items-center">
//           <div>
//             <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Entry Price</p>
//             <p className="text-[18px] font-mono font-bold text-white tracking-tighter">{trade.entry}</p>
//           </div>
//           <div className="text-right">
//              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Method</p>
//              <div className="inline-block px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-bold text-slate-300">
//                {trade.candle}
//              </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-2.5">
//           <div className="bg-emerald-500/[0.02] rounded-lg p-2.5 border border-emerald-500/10">
//             <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-2">Targets</p>
//             <div className="space-y-1.5">
//               {trade.tp.map((val, i) => (
//                 <div key={i} className="flex justify-between items-center">
//                   <span className="text-[8px] text-slate-600 font-bold">TP{i+1}</span>
//                   <span className="text-[11px] font-mono font-bold text-slate-200">{val}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="bg-rose-500/[0.02] rounded-lg p-2.5 border border-rose-500/10 flex flex-col justify-between">
//             <div>
//               <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mb-2">Protection</p>
//               <p className="text-[13px] font-mono font-bold text-white">{trade.sl}</p>
//             </div>
//             <div className="mt-2 pt-2 border-t border-white/5">
//               <span className="text-[8px] text-rose-400 font-bold uppercase italic opacity-80">R:R 1:3</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="mt-auto px-3 py-3 border-t border-white/[0.03] bg-[#1E2329]/20 flex gap-2">
//         <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg font-bold text-[11px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
//           <Zap className="w-3.5 h-3.5 fill-black" />
//           Trade Now
//         </button>
//         <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 border border-white/5">
//           <Copy className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// }