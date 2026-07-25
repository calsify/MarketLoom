'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, TrendingUp, TrendingDown, Newspaper, DollarSign, 
  Activity, Users, Award, BarChart2, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip
} from 'recharts';

interface HistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketDashboardProps {
  data: {
    financials: {
      ticker: string;
      displayTicker?: string;
      companyName: string;
      price: number;
      currency: string;
      changePercent: number;
      niftyChangePercent: number;
      relativeToNifty: number;
      fiftyTwoWeekHigh: number;
      fiftyTwoWeekLow: number;
      history: HistoryPoint[];
    };
    news: Array<{
      title: string;
      snippet: string;
      source: string;
    }>;
    analysis: {
      sentiment: {
        bullishPercent: number;
        bearishPercent: number;
        neutralPercent: number;
        overallSentiment: string;
      };
      peerAnalysis: {
        sector: string;
        keyPeers: string[];
        sectorPerformanceSummary: string;
      };
      bullCase: string[];
      bearCase: string[];
      riskRating: 'Low' | 'Medium' | 'High';
      sebiCautionFlag: string;
      summary: string;
    };
  };
}

// Custom TradingView Dark Hover Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-950/95 border border-slate-700/90 p-3 rounded-lg shadow-2xl backdrop-blur text-xs space-y-1 z-50">
        <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1 flex justify-between gap-4">
          <span>{data.date}</span>
          <span className="text-slate-400">NSE Spot</span>
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px]">
          <div><span className="text-slate-500">Close: </span><span className="font-mono text-emerald-400 font-bold">₹{data.close}</span></div>
          <div><span className="text-slate-500">Open: </span><span className="font-mono text-slate-300">₹{data.open}</span></div>
          <div><span className="text-slate-500">High: </span><span className="font-mono text-emerald-300">₹{data.high}</span></div>
          <div><span className="text-slate-500">Low: </span><span className="font-mono text-rose-300">₹{data.low}</span></div>
          <div className="col-span-2 pt-1 border-t border-slate-800 text-slate-400 flex justify-between">
            <span>Volume:</span>
            <span className="font-mono text-slate-300">{(data.volume / 1000).toFixed(0)}K</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function MarketDashboard({ data }: MarketDashboardProps) {
  const { financials, news, analysis } = data;
  const [timeframe, setTimeframe] = useState<'30D' | '60D' | '90D'>('90D');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getFilteredHistory = () => {
    if (!financials.history || financials.history.length === 0) return [];
    if (timeframe === '30D') return financials.history.slice(-30);
    if (timeframe === '60D') return financials.history.slice(-60);
    return financials.history;
  };

  const filteredData = getFilteredHistory();
  const isPositiveTrend = financials.changePercent >= 0;
  const strokeColor = isPositiveTrend ? '#10b981' : '#f43f5e';

  const getRiskBadge = (risk: string) => {
    if (risk === 'Low') return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
    if (risk === 'Medium') return 'bg-amber-950/80 text-amber-400 border-amber-500/40';
    return 'bg-rose-950/80 text-rose-400 border-rose-500/40';
  };

  // Pre-calculate SVG path coordinates as fallback for guaranteed chart rendering
  const renderFallbackSvg = () => {
    if (!filteredData || filteredData.length < 2) return null;
    const prices = filteredData.map(d => d.close);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const width = 800;
    const height = 300;

    const points = filteredData.map((d, i) => {
      const x = (i / (filteredData.length - 1)) * width;
      const y = height - ((d.close - min) / range) * (height - 40) - 20;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="3"
          points={points}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* 1. Header Financial Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 w-full">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <DollarSign className="h-4 w-4 text-emerald-400" /> Spot Price
          </span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-1">
            ₹{financials.price?.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400 truncate block mt-0.5">{financials.companyName}</span>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${isPositiveTrend ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Activity className="h-4 w-4 text-sky-400" /> 24h Return
          </span>
          <p className={`text-xl sm:text-2xl font-bold font-mono mt-1 ${isPositiveTrend ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositiveTrend ? '+' : ''}{financials.changePercent}%
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">NSE Spot</span>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Award className="h-4 w-4 text-sky-400" /> NIFTY 50 Alpha
          </span>
          <p className={`text-xl sm:text-2xl font-bold font-mono mt-1 ${financials.relativeToNifty >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {financials.relativeToNifty >= 0 ? '+' : ''}{financials.relativeToNifty}%
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">NIFTY 24h: {financials.niftyChangePercent}%</span>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <ShieldAlert className="h-4 w-4 text-amber-400" /> Risk Level
          </span>
          <div className="mt-2">
            <span className={`px-3 py-1 border text-xs font-semibold rounded-full ${getRiskBadge(analysis.riskRating)}`}>
              {analysis.riskRating} Risk
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Chart */}
      <div className="p-4 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-200 text-sm md:text-base">
              Daily Price History ({timeframe})
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
            {(['30D', '60D', '90D'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  timeframe === tf 
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Guaranteed Dual-Renderer Chart Area */}
        <div className="w-full h-[320px] sm:h-[380px] bg-slate-950/60 p-2 sm:p-4 rounded-xl border border-slate-800/80 relative">
          {mounted && filteredData && filteredData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#64748b" 
                  fontSize={10} 
                  minTickGap={25}
                />
                <YAxis 
                  domain={['dataMin - 1', 'dataMax + 1']} 
                  tickLine={false} 
                  axisLine={false} 
                  stroke="#64748b" 
                  fontSize={10} 
                  orientation="right"
                  tickFormatter={(v) => `₹${Math.round(v)}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke={strokeColor} 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  connectNulls={true}
                  dot={false}
                  activeDot={{ r: 5, fill: strokeColor, stroke: '#020617', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {renderFallbackSvg()}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
          <span>52W Low: <strong className="text-slate-300">₹{financials.fiftyTwoWeekLow}</strong></span>
          <span className="hidden sm:inline text-slate-400">TradingView Interactive Area Chart</span>
          <span>52W High: <strong className="text-slate-300">₹{financials.fiftyTwoWeekHigh}</strong></span>
        </div>
      </div>

      {/* 3. Market Sentiment & Sector Peer Analysis */}
      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-400" /> Market Sentiment Barometer
            </h4>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-800/40">
              {analysis.sentiment.overallSentiment}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
            <div style={{ width: `${analysis.sentiment.bullishPercent}%` }} className="bg-emerald-500 h-full rounded-l-full transition-all" />
            <div style={{ width: `${analysis.sentiment.neutralPercent}%` }} className="bg-slate-500 h-full transition-all" />
            <div style={{ width: `${analysis.sentiment.bearishPercent}%` }} className="bg-rose-500 h-full rounded-r-full transition-all" />
          </div>

          <div className="flex justify-between text-xs text-slate-400 pt-1">
            <span className="text-emerald-400 font-medium">🟢 {analysis.sentiment.bullishPercent}% Bullish</span>
            <span className="text-slate-400">⚪ {analysis.sentiment.neutralPercent}% Neutral</span>
            <span className="text-rose-400 font-medium">🔴 {analysis.sentiment.bearishPercent}% Bearish</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-400" /> Sector & Peer Benchmarking
          </h4>
          <div className="text-xs text-slate-300 space-y-1.5 pt-1">
            <p><strong className="text-slate-400">Sector:</strong> {analysis.peerAnalysis.sector}</p>
            <p><strong className="text-slate-400">Primary Peers:</strong> {analysis.peerAnalysis.keyPeers.join(', ')}</p>
            <p className="text-slate-400 text-[11px] leading-relaxed pt-2 border-t border-slate-800">
              {analysis.peerAnalysis.sectorPerformanceSummary}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Agent Intelligence Briefing */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 w-full">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-semibold text-slate-200 text-sm">Executive Agent Intelligence Briefing</h3>
          {analysis.sebiCautionFlag !== 'None Identified' && (
            <span className="text-[11px] bg-amber-950/80 text-amber-300 border border-amber-800/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {analysis.sebiCautionFlag}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* 5. Bull vs. Bear Case Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="p-6 bg-slate-900/40 border border-emerald-900/30 rounded-2xl space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
            <TrendingUp className="h-5 w-5" /> Bull Case Growth Catalysts
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {analysis.bullCase.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 bg-slate-900/40 border border-rose-900/30 rounded-2xl space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-rose-400 text-sm">
            <TrendingDown className="h-5 w-5" /> Bear Case Downside Risks
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {analysis.bearCase.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 6. Scraped News Signals Feed */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-4 w-full">
        <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-sky-400" /> Scraped Market Signals & News
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {news.map((item, i) => (
            <div key={i} className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl space-y-1.5 hover:border-slate-700 transition-colors">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">{item.source}</span>
              <h5 className="text-xs font-semibold text-slate-200 line-clamp-2">{item.title}</h5>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.snippet}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}