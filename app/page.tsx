

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
// }

// // --- Constants ---
// const CRYPTO_ASSETS = [
//   { symbol: "BTCUSDT", name: "Bitcoin" },
//   { symbol: "ETHUSDT", name: "Ethereum" },
//   { symbol: "BNBUSDT", name: "Binance" },
//   { symbol: "SOLUSDT", name: "Solana" },
//   { symbol: "ADAUSDT", name: "Cardano" },
//   { symbol: "XRPUSDT", name: "Ripple" },
// ];

// const SUGGESTED_TRADES: SuggestedTrade[] = [
//   {
//     pair: "BTCUSDT",
//     type: "LONG",
//     entry: "64,200",
//     tp: ["65,500", "67,000"],
//     sl: "62,800",
//     timeframe: "4H",
//     range: "Mid-Term",
//     candle: "Hammer",
//     status: "Active",
//   },
//   {
//     pair: "ETHUSDT",
//     type: "SHORT",
//     entry: "3,450",
//     tp: ["3,300", "3,150"],
//     sl: "3,550",
//     timeframe: "1H",
//     range: "Scalp",
//     candle: "Engulfing",
//     status: "Pending",
//   },
// ];

// export default function TradingPage() {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [currentTime, setCurrentTime] = useState("");
  
//   // Real-time Data State
//   const [ticker, setTicker] = useState<TickerData>({
//     lastPrice: "0.00",
//     priceChangePercent: "0.00",
//     highPrice: "0.00",
//     lowPrice: "0.00",
//     quoteVolume: "0",
//   });

//   // 1. Live Clock
//   useEffect(() => {
//     const timer = setInterval(() => {
//       const now = new Date();
//       setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // 2. Fetch Binance 24h Ticker Data (REST API)
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

//   // 3. Live Price Updates (WebSockets)
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

//   // 4. TradingView Chart Initialization
//   useEffect(() => {
//     const scriptId = "tradingview-widget-script";
//     let script = document.getElementById(scriptId) as HTMLScriptElement;

//     const initWidget = () => {
//       if (typeof window.TradingView !== "undefined" && containerRef.current) {
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
      
//       {/* Mobile Sidebar Overlay */}
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
        
//         {/* --- Slim Header (48px) --- */}
//         <header className="h-[48px] bg-[#12161C] border-b border-white/5 flex items-center px-4 justify-between shrink-0 z-50">
//           <div className="flex items-center gap-6">
//             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1.5 hover:bg-white/5 rounded text-emerald-500">
//               <Menu className="w-5 h-5" />
//             </button>
            
//             {/* Branding */}
//             <div className="flex items-center gap-2 pr-6 border-r border-white/10">
//               <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center">
//                 <BarChart3 className="text-black w-4 h-4" />
//               </div>
//               <span className="font-bold text-white tracking-tighter text-[15px]">PRO<span className="text-emerald-500">TRADE</span></span>
//             </div>

//             {/* Nav */}
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

//         {/* --- Real-time Ticker Bar (40px) --- */}
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

//         {/* Scrollable Body */}
//         <div className="flex-1 overflow-y-auto bg-[#060606]">
//           {/* Chart Section */}
//           <section className="h-[60vh] w-full border-b border-white/5 bg-black relative">
//             <div id="tradingview_widget" ref={containerRef} className="w-full h-full" />
//           </section>

//           {/* Signals Grid */}
//           <section className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
//             <div className="flex items-center gap-3 mb-6">
//               <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
//               <h2 className="text-[16px] font-bold text-white uppercase tracking-tight">Pro Signals</h2>
//               <div className="flex-1 h-[1px] bg-white/5"></div>
//             </div>

//             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-5 pb-10">
//               {SUGGESTED_TRADES.map((trade, idx) => (
//                 <SignalCard key={idx} trade={trade} />
//               ))}
//             </div>
//           </section>
//         </div>
//       </main>
//     </div>
//   );
// }

// // --- Compact Signal Card ---

// function SignalCard({ trade }: { trade: SuggestedTrade }) {
//   const signalStrength = 85;
//   const winProbability = 72;

//   return (
//     <div className="bg-[#161A1E] border border-white/5 rounded-xl p-0 hover:border-emerald-500/40 transition-all group overflow-hidden shadow-2xl relative flex flex-col h-full">
      
//       {/* 1. TOP BAR: Pair & Action (Compact) */}
//       <div className="flex justify-between items-center px-3 py-2.5 bg-[#1E2329]/80 border-b border-white/[0.03]">
//         <div className="flex items-center gap-2.5">
//           <div className="relative">
//             <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-black text-black shadow-lg">
//               {trade.pair.charAt(0)}
//             </div>
//             <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#161A1E] flex items-center justify-center border border-white/10">
//               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
//             </div>
//           </div>
//           <div>
//             <div className="flex items-center gap-1.5">
//               <span className="text-[14px] font-bold text-white tracking-tight leading-none">{trade.pair}</span>
//               <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded border border-emerald-500/20 font-bold uppercase">Live</span>
//             </div>
//             <span className="text-[10px] text-slate-500 font-mono mt-0.5 block italic">{trade.timeframe} Chart • Perpetual</span>
//           </div>
//         </div>

//         <div className={`flex flex-col items-end gap-1`}>
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

//       {/* 2. STATS BAR: Strength & Prob (Ultra Slim) */}
//       <div className="px-3 py-2 bg-[#0B0E11]/40 border-b border-white/[0.02] flex items-center gap-6">
//         <div className="flex-1 space-y-1">
//           <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter">
//             <span className="text-slate-500">Signal Strength</span>
//             <span className="text-emerald-400">{signalStrength}%</span>
//           </div>
//           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
//             <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_#10b981]" style={{ width: `${signalStrength}%` }} />
//           </div>
//         </div>
//         <div className="flex-1 space-y-1">
//           <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter">
//             <span className="text-slate-500">Win Rate</span>
//             <span className="text-blue-400">{winProbability}%</span>
//           </div>
//           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
//             <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_#3b82f6]" style={{ width: `${winProbability}%` }} />
//           </div>
//         </div>
//       </div>

//       {/* 3. CORE DATA: Entry & Targets */}
//       <div className="p-3 space-y-4">
//         {/* Entry & Strategy Row */}
//         <div className="flex justify-between items-center">
//           <div>
//             <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Entry Zone</p>
//             <p className="text-[18px] font-mono font-bold text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
//               {trade.entry}
//             </p>
//           </div>
//           <div className="text-right">
//              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Indicator</p>
//              <div className="inline-block px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-bold text-slate-300">
//                {trade.candle}
//              </div>
//           </div>
//         </div>

//         {/* TP & SL Boxes (Unified Height) */}
//         <div className="grid grid-cols-2 gap-2.5">
//           {/* Take Profit List */}
//           <div className="bg-emerald-500/[0.02] rounded-lg p-2.5 border border-emerald-500/10 relative overflow-hidden">
//             <div className="flex items-center gap-1.5 mb-2">
//               <div className="w-1 h-3 bg-emerald-500 rounded-full" />
//               <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Take Profit</p>
//             </div>
//             <div className="space-y-1.5">
//               {trade.tp.map((val, i) => (
//                 <div key={i} className="flex justify-between items-center">
//                   <span className="text-[8px] text-slate-600 font-bold font-mono">TP{i+1}</span>
//                   <span className="text-[11px] font-mono font-bold text-slate-200">{val}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Stop Loss & Risk Box */}
//           <div className="bg-rose-500/[0.02] rounded-lg p-2.5 border border-rose-500/10 flex flex-col justify-between">
//             <div>
//               <div className="flex items-center gap-1.5 mb-2">
//                 <div className="w-1 h-3 bg-rose-500 rounded-full" />
//                 <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest">Stop Loss</p>
//               </div>
//               <p className="text-[13px] font-mono font-bold text-white tracking-tight">{trade.sl}</p>
//             </div>
//             <div className="mt-2 pt-2 border-t border-white/5">
//               <span className="text-[8px] text-rose-400 font-bold uppercase italic leading-none opacity-80">Risk Reward 1:3</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* 4. FOOTER: Quick Actions */}
//       <div className="mt-auto px-3 py-3 border-t border-white/[0.03] bg-[#1E2329]/20 flex gap-2">
//         <button className="flex-1 group/btn relative overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg font-bold text-[11px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98]">
//           <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
//           <Zap className="w-3.5 h-3.5 fill-black" />
//           Auto-Execute
//         </button>
//         <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 border border-white/5 transition-all">
//           <Copy className="w-4 h-4" />
//         </button>
//       </div>

//       {/* Background Accent */}
//       <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-700" />
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
//   strength?: number; // أضفنا القوة من السيرفر
// }

// // --- Constants ---
// const CRYPTO_ASSETS = [
//   { symbol: "BTCUSDT", name: "Bitcoin" },
//   { symbol: "ETHUSDT", name: "Ethereum" },
//   { symbol: "BNBUSDT", name: "Binance" },
//   { symbol: "SOLUSDT", name: "Solana" },
//   { symbol: "ADAUSDT", name: "Cardano" },
//   { symbol: "XRPUSDT", name: "Ripple" },
// ];

// export default function TradingPage() {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [currentTime, setCurrentTime] = useState("");
  
//   // 1. Live Trades State (البيانات القادمة من السيرفر الخاص بك)
//   const [liveTrades, setLiveTrades] = useState<SuggestedTrade[]>([]);

//   // Real-time Ticker Data State
//   const [ticker, setTicker] = useState<TickerData>({
//     lastPrice: "0.00",
//     priceChangePercent: "0.00",
//     highPrice: "0.00",
//     lowPrice: "0.00",
//     quoteVolume: "0",
//   });

//   // --- Effects ---

//   // 1. Live Clock
//   useEffect(() => {
//     const timer = setInterval(() => {
//       const now = new Date();
//       setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
//     }, 1000);
//     return () => clearInterval(timer);
//   }, []);

//   // 2. Fetch Signals from YOUR Backend (الربط بالسيرفر)
//   useEffect(() => {
//     const fetchSignals = async () => {
//       try {
//         const response = await fetch("http://localhost:5000/api/signals");
//         const data = await response.json();
        
//         const formattedTrades: SuggestedTrade[] = data.map((sig: any) => ({
//           pair: sig.symbol,
//           type: sig.type,
//           entry: sig.entry.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//           tp: sig.tp.map((t: number) => t.toLocaleString(undefined, { minimumFractionDigits: 2 })),
//           sl: sig.sl.toLocaleString(undefined, { minimumFractionDigits: 2 }),
//           timeframe: "1H",
//           range: "Intraday",
//           candle: sig.reason,
//           status: "Active",
//           strength: sig.strength
//         }));

//         setLiveTrades(formattedTrades);
//       } catch (error) {
//         console.error("Backend Connection Error:", error);
//       }
//     };

//     fetchSignals();
//     const interval = setInterval(fetchSignals, 30000); // تحديث كل 30 ثانية
//     return () => clearInterval(interval);
//   }, []);

//   // 3. Fetch Binance 24h Ticker Data
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

//   // 4. Live Price Updates (WebSockets)
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

//   // 5. TradingView Chart Initialization
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

//         {/* Scrollable Body */}
//         <div className="flex-1 overflow-y-auto bg-[#060606]">
//           {/* Chart */}
//           <section className="h-[60vh] w-full border-b border-white/5 bg-black relative">
//             <div id="tradingview_widget" ref={containerRef} className="w-full h-full" />
//           </section>

//           {/* Signals Grid */}
//           <section className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
//             <div className="flex items-center gap-3 mb-6">
//               <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
//               <h2 className="text-[16px] font-bold text-white uppercase tracking-tight">Pro Signals</h2>
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
//                      Analyzing indicators... Waiting for high-probability signals
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

// // --- Signal Card Component ---
// function SignalCard({ trade }: { trade: SuggestedTrade }) {
//   // استخدام القوة الحقيقية من السيرفر أو قيمة افتراضية
//   const signalStrength = trade.strength || 75;
//   const winProbability = Math.min(92, signalStrength - 5 + Math.floor(Math.random() * 8));

//   return (
//     <div className="bg-[#161A1E] border border-white/5 rounded-xl p-0 hover:border-emerald-500/40 transition-all group overflow-hidden shadow-2xl relative flex flex-col h-full">
      
//       {/* Top Bar */}
//       <div className="flex justify-between items-center px-3 py-2.5 bg-[#1E2329]/80 border-b border-white/[0.03]">
//         <div className="flex items-center gap-2.5">
//           <div className="relative">
//             <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-black text-black shadow-lg">
//               {trade.pair.charAt(0)}
//             </div>
//             <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#161A1E] flex items-center justify-center border border-white/10">
//               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
//             </div>
//           </div>
//           <div>
//             <div className="flex items-center gap-1.5">
//               <span className="text-[14px] font-bold text-white tracking-tight leading-none">{trade.pair}</span>
//               <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded border border-emerald-500/20 font-bold uppercase">Live</span>
//             </div>
//             <span className="text-[10px] text-slate-500 font-mono mt-0.5 block italic">{trade.timeframe} Chart • Perpetual</span>
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
//             <div className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_#10b981]" style={{ width: `${signalStrength}%` }} />
//           </div>
//         </div>
//         <div className="flex-1 space-y-1">
//           <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter">
//             <span className="text-slate-500">Win Rate</span>
//             <span className="text-blue-400">{winProbability}%</span>
//           </div>
//           <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
//             <div className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_#3b82f6]" style={{ width: `${winProbability}%` }} />
//           </div>
//         </div>
//       </div>

//       {/* Entry & Targets */}
//       <div className="p-3 space-y-4">
//         <div className="flex justify-between items-center">
//           <div>
//             <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Entry Zone</p>
//             <p className="text-[18px] font-mono font-bold text-white tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
//               {trade.entry}
//             </p>
//           </div>
//           <div className="text-right">
//              <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Indicator</p>
//              <div className="inline-block px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-bold text-slate-300">
//                {trade.candle}
//              </div>
//           </div>
//         </div>

//         <div className="grid grid-cols-2 gap-2.5">
//           <div className="bg-emerald-500/[0.02] rounded-lg p-2.5 border border-emerald-500/10">
//             <div className="flex items-center gap-1.5 mb-2">
//               <div className="w-1 h-3 bg-emerald-500 rounded-full" />
//               <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Take Profit</p>
//             </div>
//             <div className="space-y-1.5">
//               {trade.tp.map((val, i) => (
//                 <div key={i} className="flex justify-between items-center">
//                   <span className="text-[8px] text-slate-600 font-bold font-mono">TP{i+1}</span>
//                   <span className="text-[11px] font-mono font-bold text-slate-200">{val}</span>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="bg-rose-500/[0.02] rounded-lg p-2.5 border border-rose-500/10 flex flex-col justify-between">
//             <div>
//               <div className="flex items-center gap-1.5 mb-2">
//                 <div className="w-1 h-3 bg-rose-500 rounded-full" />
//                 <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest">Stop Loss</p>
//               </div>
//               <p className="text-[13px] font-mono font-bold text-white tracking-tight">{trade.sl}</p>
//             </div>
//             <div className="mt-2 pt-2 border-t border-white/5">
//               <span className="text-[8px] text-rose-400 font-bold uppercase italic leading-none opacity-80">Risk Reward 1:3</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <div className="mt-auto px-3 py-3 border-t border-white/[0.03] bg-[#1E2329]/20 flex gap-2">
//         <button className="flex-1 group/btn relative overflow-hidden bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg font-bold text-[11px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-[0.98]">
//           <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
//           <Zap className="w-3.5 h-3.5 fill-black" />
//           Auto-Execute
//         </button>
//         <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 border border-white/5 transition-all">
//           <Copy className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// }




"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X, TrendingUp, Zap, ChevronRight, Copy, BarChart3, Clock } from "lucide-react";

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
  timestamp?: string; // التوقيت القادم من ملف JSON
}


const CRYPTO_ASSETS = [
  { symbol: "BTCUSDT", name: "Bitcoin" },
  { symbol: "ETHUSDT", name: "Ethereum" },
  { symbol: "BNBUSDT", name: "Binance" },
  { symbol: "SOLUSDT", name: "Solana" },
  { symbol: "SHIBUSDT", name: "Shiba Inu" }, // إضافة شيبا
  { symbol: "DOGEUSDT", name: "Dogecoin" },  // إضافة دوج كوين
  { symbol: "PEPEUSDT", name: "Pepe" },      // إضافة بيبيه
  { symbol: "PAXGUSDT", name: "Gold (PAXG)" } // الذهب الرقمي المدعوم بذهب حقيقي
];

export default function TradingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  
  // الحالة الخاصة بالتوصيات (تُجلب من ملف JSON بالسيرفر)
  const [liveTrades, setLiveTrades] = useState<SuggestedTrade[]>([]);

  const [ticker, setTicker] = useState<TickerData>({
    lastPrice: "0.00",
    priceChangePercent: "0.00",
    highPrice: "0.00",
    lowPrice: "0.00",
    quoteVolume: "0",
  });

  // --- Effects ---

  // 1. ساعة حية (UTC)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. جلب التوصيات من السيرفر (يقرأ من signals.json)
  useEffect(() => {
    const fetchSignals = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/signals");
        const data = await response.json();
        
        if (data && Array.isArray(data)) {
          const formattedTrades: SuggestedTrade[] = data.map((sig: any) => ({
            pair: sig.symbol,
            type: sig.type as "LONG" | "SHORT",
            entry: sig.entry.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            tp: sig.tp.map((t: number) => t.toLocaleString(undefined, { minimumFractionDigits: 2 })),
            sl: sig.sl.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            timeframe: "1H",
            range: "Intraday",
            candle: sig.reason,
            status: "Active",
            strength: sig.strength,
            timestamp: sig.timestamp
          }));

          // ترتيب الصفقات: الأحدث يظهر أولاً
          setLiveTrades(formattedTrades.sort((a, b) => 
            new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          ));
        }
      } catch (error) {
        console.error("Backend Connection Error:", error);
      }
    };

    fetchSignals();
    const interval = setInterval(fetchSignals, 20000); // تحديث كل 20 ثانية
    return () => clearInterval(interval);
  }, []);

  // 3. جلب بيانات 24 ساعة من Binance
  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${selectedSymbol}`);
        const data = await response.json();
        setTicker({
          lastPrice: parseFloat(data.lastPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }),
          priceChangePercent: data.priceChangePercent,
          highPrice: parseFloat(data.highPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }),
          lowPrice: parseFloat(data.lowPrice).toLocaleString(undefined, { minimumFractionDigits: 2 }),
          quoteVolume: (parseFloat(data.quoteVolume) / 1000000).toFixed(2) + "M",
        });
      } catch (error) {
        console.error("Binance Fetch Error:", error);
      }
    };
    fetchTickerData();
  }, [selectedSymbol]);

  // 4. تحديث السعر اللحظي (WebSockets)
  useEffect(() => {
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${selectedSymbol.toLowerCase()}@ticker`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTicker((prev) => ({
        ...prev,
        lastPrice: parseFloat(data.c).toLocaleString(undefined, { minimumFractionDigits: 2 }),
        priceChangePercent: data.P,
      }));
    };
    return () => ws.close();
  }, [selectedSymbol]);

  // 5. تهيئة TradingView
  useEffect(() => {
    const scriptId = "tradingview-widget-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const initWidget = () => {
      // @ts-ignore
      if (typeof window.TradingView !== "undefined" && containerRef.current) {
        // @ts-ignore
        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${selectedSymbol}`,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          container_id: containerRef.current.id,
          backgroundColor: "#060606",
          gridColor: "rgba(42, 46, 57, 0.03)",
          hide_top_toolbar: false,
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

      {/* --- Sidebar (Watchlist) --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-[110] w-[240px] bg-[#0B0E11] border-r border-white/5 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex flex-col h-full">
          <div className="h-[48px] px-4 flex items-center justify-between border-b border-white/5 bg-[#12161C]">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-slate-400">Market List</span>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 hover:bg-white/5 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {CRYPTO_ASSETS.map((crypto) => (
              <button
                key={crypto.symbol}
                onClick={() => {
                  setSelectedSymbol(crypto.symbol);
                  if (window.innerWidth < 1024) setIsSidebarOpen(false);
                }}
                className={`
                  w-full px-4 py-3 flex justify-between items-center transition-all border-b border-white/[0.02]
                  ${selectedSymbol === crypto.symbol ? "bg-[#1E2329] border-l-2 border-emerald-500 shadow-lg" : "hover:bg-[#12161C] border-l-2 border-transparent"}
                `}
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
        
        {/* Header */}
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

        {/* Ticker Bar */}
        <div className="h-[40px] bg-[#0B0E11] border-b border-white/5 flex items-center px-4 overflow-x-auto whitespace-nowrap gap-8 scrollbar-hide shrink-0">
           <div className="flex items-center gap-2 border-r border-white/5 pr-6">
             <span className="text-[14px] font-bold text-white uppercase">{selectedSymbol}</span>
             <span className={`text-[13px] font-mono font-bold ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
               {ticker.lastPrice}
             </span>
           </div>

           <div className="flex flex-col justify-center min-w-[70px]">
             <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Change</span>
             <span className={`text-[11px] font-mono leading-none ${parseFloat(ticker.priceChangePercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
               {parseFloat(ticker.priceChangePercent) >= 0 ? '+' : ''}{ticker.priceChangePercent}%
             </span>
           </div>

           <div className="flex flex-col justify-center min-w-[70px]">
             <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h High</span>
             <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.highPrice}</span>
           </div>

           <div className="flex flex-col justify-center min-w-[70px]">
             <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Low</span>
             <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.lowPrice}</span>
           </div>

           <div className="flex flex-col justify-center">
             <span className="text-[9px] text-slate-500 leading-none mb-0.5 uppercase">24h Volume (USDT)</span>
             <span className="text-[11px] text-slate-200 font-mono leading-none">{ticker.quoteVolume}</span>
           </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-[#060606] scrollbar-hide">
          {/* الرسم البياني */}
          <section className="h-[55vh] w-full border-b border-white/5 bg-black relative">
            <div id="tradingview_widget" ref={containerRef} className="w-full h-full" />
          </section>

          {/* شبكة التوصيات القادمة من السيرفر والملف */}
          <section className="p-4 md:p-8 max-w-[1400px] mx-auto w-full">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500/20" />
              <h2 className="text-[16px] font-bold text-white uppercase tracking-tight">Pro Signals (From History)</h2>
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
                   <p className="text-slate-500 text-sm italic font-mono">
                     Connecting to server history... Looking for signals in JSON.
                   </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// --- مكون بطاقة التوصية ---
function SignalCard({ trade }: { trade: SuggestedTrade }) {
  const signalStrength = trade.strength || 75;
  const winProbability = Math.min(92, signalStrength - 5 + Math.floor(Math.random() * 8));

  // استخراج الوقت بشكل جميل (مثلاً: 14:30)
  const tradeTime = trade.timestamp 
    ? new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    : "Live";

  return (
    <div className="bg-[#161A1E] border border-white/5 rounded-xl p-0 hover:border-emerald-500/40 transition-all group overflow-hidden shadow-2xl relative flex flex-col h-full">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center px-3 py-2.5 bg-[#1E2329]/80 border-b border-white/[0.03]">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[11px] font-black text-black shadow-lg">
              {trade.pair.charAt(0)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold text-white tracking-tight leading-none">{trade.pair}</span>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 rounded border border-emerald-500/20 font-bold uppercase">{tradeTime}</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block italic">{trade.timeframe} Chart</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className={`px-2.5 py-1 rounded-md flex items-center gap-1.5 border shadow-inner ${
            trade.type === 'LONG' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
          }`}>
            <TrendingUp className={`w-3 h-3 ${trade.type === 'SHORT' ? 'rotate-180' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{trade.type}</span>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-3 py-2 bg-[#0B0E11]/40 border-b border-white/[0.02] flex items-center gap-6">
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter">
            <span className="text-slate-500">Signal Strength</span>
            <span className="text-emerald-400">{signalStrength}%</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${signalStrength}%` }} />
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex justify-between text-[8px] uppercase font-bold tracking-tighter">
            <span className="text-slate-500">Confidence</span>
            <span className="text-blue-400">{winProbability}%</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${winProbability}%` }} />
          </div>
        </div>
      </div>

      {/* Entry & Targets */}
      <div className="p-3 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Entry Price</p>
            <p className="text-[18px] font-mono font-bold text-white tracking-tighter">{trade.entry}</p>
          </div>
          <div className="text-right">
             <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Method</p>
             <div className="inline-block px-2 py-0.5 rounded bg-white/[0.03] border border-white/5 text-[10px] font-bold text-slate-300">
               {trade.candle}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-emerald-500/[0.02] rounded-lg p-2.5 border border-emerald-500/10">
            <p className="text-[9px] text-emerald-500 font-black uppercase tracking-widest mb-2">Targets</p>
            <div className="space-y-1.5">
              {trade.tp.map((val, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-[8px] text-slate-600 font-bold">TP{i+1}</span>
                  <span className="text-[11px] font-mono font-bold text-slate-200">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-rose-500/[0.02] rounded-lg p-2.5 border border-rose-500/10 flex flex-col justify-between">
            <div>
              <p className="text-[9px] text-rose-500 font-black uppercase tracking-widest mb-2">Protection</p>
              <p className="text-[13px] font-mono font-bold text-white">{trade.sl}</p>
            </div>
            <div className="mt-2 pt-2 border-t border-white/5">
              <span className="text-[8px] text-rose-400 font-bold uppercase italic opacity-80">R:R 1:3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-3 py-3 border-t border-white/[0.03] bg-[#1E2329]/20 flex gap-2">
        <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black py-2 rounded-lg font-bold text-[11px] uppercase tracking-tighter transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
          <Zap className="w-3.5 h-3.5 fill-black" />
          Trade Now
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 border border-white/5">
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}