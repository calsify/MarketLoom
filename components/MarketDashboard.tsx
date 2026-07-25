'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, TrendingUp, TrendingDown, Newspaper, DollarSign, 
  Activity, Users, Award, BarChart2, CheckCircle2, AlertTriangle,
  Download, Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, Area, XAxis, YAxis, Tooltip, Bar, ComposedChart, Cell
} from 'recharts';
import html2canvas from 'html2canvas-pro';
import jsPDF from 'jspdf';

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

interface SanitizedPoint {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

const toFiniteOrNull = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) && cleaned !== '' ? num : null;
  }
  return null;
};

const sanitizeHistory = (history: HistoryPoint[] | undefined | null): SanitizedPoint[] => {
  if (!Array.isArray(history)) return [];
  return history.map((point: any) => ({
    date: point?.date || point?.Date || point?.time || '',
    open: toFiniteOrNull(point?.open ?? point?.Open),
    high: toFiniteOrNull(point?.high ?? point?.High),
    low: toFiniteOrNull(point?.low ?? point?.Low),
    close: toFiniteOrNull(point?.close ?? point?.Close ?? point?.c),
    volume: toFiniteOrNull(point?.volume ?? point?.Volume ?? point?.v),
  }));
};

const fmtCurrency = (value: number | null): string =>
  value === null ? '—' : `₹${value.toLocaleString('en-IN')}`;

const fmtVolume = (value: number | null): string => {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
};

// Custom TradingView Dark Hover Tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const point: SanitizedPoint = payload[0].payload;
    const isUpDay = (point.close ?? 0) >= (point.open ?? 0);

    return (
      <div className="bg-slate-950/95 border border-slate-700/90 p-3 rounded-lg shadow-2xl backdrop-blur text-xs space-y-1 z-50">
        <p className="font-semibold text-slate-300 border-b border-slate-800 pb-1 flex justify-between gap-4">
          <span>{point.date}</span>
          <span className="text-slate-400">NSE Spot</span>
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-[11px]">
          <div><span className="text-slate-500">Close: </span><span className={`font-mono font-bold ${isUpDay ? 'text-emerald-400' : 'text-rose-400'}`}>{fmtCurrency(point.close)}</span></div>
          <div><span className="text-slate-500">Open: </span><span className="font-mono text-slate-300">{fmtCurrency(point.open)}</span></div>
          <div><span className="text-slate-500">High: </span><span className="font-mono text-emerald-300">{fmtCurrency(point.high)}</span></div>
          <div><span className="text-slate-500">Low: </span><span className="font-mono text-rose-300">{fmtCurrency(point.low)}</span></div>
          <div className="col-span-2 pt-1 border-t border-slate-800 text-slate-400 flex justify-between">
            <span>Traded Volume:</span>
            <span className="font-mono text-slate-200 font-medium">{fmtVolume(point.volume)}</span>
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
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExportPDF = async () => {
    const dashboardElement = document.getElementById('market-dashboard-report');
    if (!dashboardElement) return;

    try {
      setIsExporting(true);

      const canvas = await html2canvas(dashboardElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#020617',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${financials?.displayTicker || financials?.ticker || 'MarketLoom'}_Report.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const sanitizedHistory = useMemo(
    () => sanitizeHistory(financials?.history),
    [financials?.history]
  );

  const filteredData = useMemo(() => {
    if (sanitizedHistory.length === 0) return [];
    if (timeframe === '30D') return sanitizedHistory.slice(-30);
    if (timeframe === '60D') return sanitizedHistory.slice(-60);
    return sanitizedHistory;
  }, [sanitizedHistory, timeframe]);

  const hasEnoughValidData = useMemo(
    () => filteredData.filter((d) => d.close !== null).length > 1,
    [filteredData]
  );

  // Compute maximum volume for Y-Axis scaling so bars take up lower 25% of chart
  const maxVolume = useMemo(() => {
    const vols = filteredData.map((d) => d.volume || 0);
    return Math.max(...vols, 1) * 3.5;
  }, [filteredData]);

  const isPositiveTrend = financials?.changePercent >= 0;
  const strokeColor = isPositiveTrend ? '#10b981' : '#f43f5e';

  const getRiskBadge = (risk: string) => {
    if (risk === 'Low') return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
    if (risk === 'Medium') return 'bg-amber-950/80 text-amber-400 border-amber-500/40';
    return 'bg-rose-950/80 text-rose-400 border-rose-500/40';
  };

  return (
    <div id="market-dashboard-report" className="space-y-6 w-full p-2 sm:p-4 bg-slate-950 rounded-2xl">
      {/* 0. Top Bar Action Header with PDF Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>{financials?.companyName}</span>
            <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700 font-mono">
              {financials?.displayTicker || financials?.ticker}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Executive Equity & Competitor Intelligence Briefing
          </p>
        </div>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/50 self-end sm:self-auto"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export PDF Report</span>
            </>
          )}
        </button>
      </div>

      {/* 1. Header Financial Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 w-full">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <DollarSign className="h-4 w-4 text-emerald-400" /> Spot Price
          </span>
          <p className="text-xl sm:text-2xl font-bold font-mono text-slate-100 mt-1">
            ₹{financials?.price?.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-400 truncate block mt-0.5">{financials?.companyName}</span>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1 h-full ${isPositiveTrend ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Activity className="h-4 w-4 text-sky-400" /> 24h Return
          </span>
          <p className={`text-xl sm:text-2xl font-bold font-mono mt-1 ${isPositiveTrend ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositiveTrend ? '+' : ''}{financials?.changePercent}%
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">NSE Spot</span>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Award className="h-4 w-4 text-sky-400" /> NIFTY 50 Alpha
          </span>
          <p className={`text-xl sm:text-2xl font-bold font-mono mt-1 ${financials?.relativeToNifty >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {financials?.relativeToNifty >= 0 ? '+' : ''}{financials?.relativeToNifty}%
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">NIFTY 24h: {financials?.niftyChangePercent}%</span>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <ShieldAlert className="h-4 w-4 text-amber-400" /> Risk Level
          </span>
          <div className="mt-2">
            <span className={`px-3 py-1 border text-xs font-semibold rounded-full ${getRiskBadge(analysis?.riskRating)}`}>
              {analysis?.riskRating} Risk
            </span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Price + Volume Chart */}
      <div className="p-4 sm:p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold text-slate-200 text-sm md:text-base">
              Daily Price History & Volume ({timeframe})
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

        <div className="relative w-full h-[clamp(280px,32vw,540px)] bg-slate-950/60 rounded-xl border border-slate-800/80">
          <div className="absolute inset-0 p-2 sm:p-4">
            {mounted && hasEnoughValidData ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260} debounce={50}>
                <ComposedChart data={filteredData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
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

                  {/* Right Axis: Stock Price (₹) */}
                  <YAxis 
                    yAxisId="priceAxis"
                    domain={['dataMin - 1', 'dataMax + 1']} 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="#64748b" 
                    fontSize={10} 
                    orientation="right"
                    tickFormatter={(v) => `₹${Math.round(v)}`}
                  />

                  {/* Left Axis: Traded Volume */}
                  <YAxis 
                    yAxisId="volumeAxis"
                    domain={[0, maxVolume]} 
                    tickLine={false} 
                    axisLine={false} 
                    stroke="#475569" 
                    fontSize={9} 
                    orientation="left"
                    tickFormatter={(v) => fmtVolume(v)}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  {/* Volume Bar Chart Layer */}
                  <Bar 
                    yAxisId="volumeAxis" 
                    dataKey="volume" 
                    radius={[2, 2, 0, 0]}
                    maxBarSize={12}
                  >
                    {filteredData.map((entry, index) => {
                      const isUpDay = (entry.close ?? 0) >= (entry.open ?? 0);
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={isUpDay ? '#10b98133' : '#f43f5e33'} 
                          stroke={isUpDay ? '#10b981' : '#f43f5e'}
                          strokeWidth={0.5}
                        />
                      );
                    })}
                  </Bar>

                  {/* Price Area Line Layer */}
                  <Area 
                    yAxisId="priceAxis"
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
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500">
                <AlertTriangle className="h-5 w-5 text-slate-600" />
                <span className="text-xs">No valid price data available for this range.</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
          <span>52W Low: <strong className="text-slate-300">₹{financials?.fiftyTwoWeekLow}</strong></span>
          <span className="hidden sm:inline text-slate-400">Interactive Price Line & Volume Bars</span>
          <span>52W High: <strong className="text-slate-300">₹{financials?.fiftyTwoWeekHigh}</strong></span>
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
              {analysis?.sentiment?.overallSentiment}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex p-0.5 border border-slate-800">
            <div style={{ width: `${analysis?.sentiment?.bullishPercent}%` }} className="bg-emerald-500 h-full rounded-l-full transition-all" />
            <div style={{ width: `${analysis?.sentiment?.neutralPercent}%` }} className="bg-slate-500 h-full transition-all" />
            <div style={{ width: `${analysis?.sentiment?.bearishPercent}%` }} className="bg-rose-500 h-full rounded-r-full transition-all" />
          </div>

          <div className="flex justify-between text-xs text-slate-400 pt-1">
            <span className="text-emerald-400 font-medium">🟢 {analysis?.sentiment?.bullishPercent}% Bullish</span>
            <span className="text-slate-400">⚪ {analysis?.sentiment?.neutralPercent}% Neutral</span>
            <span className="text-rose-400 font-medium">🔴 {analysis?.sentiment?.bearishPercent}% Bearish</span>
          </div>
        </div>

        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-2">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Users className="h-4 w-4 text-sky-400" /> Sector & Peer Benchmarking
          </h4>
          <div className="text-xs text-slate-300 space-y-1.5 pt-1">
            <p><strong className="text-slate-400">Sector:</strong> {analysis?.peerAnalysis?.sector}</p>
            <p><strong className="text-slate-400">Primary Peers:</strong> {analysis?.peerAnalysis?.keyPeers?.join(', ')}</p>
            <p className="text-slate-400 text-[11px] leading-relaxed pt-2 border-t border-slate-800">
              {analysis?.peerAnalysis?.sectorPerformanceSummary}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Agent Intelligence Briefing */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3 w-full">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="font-semibold text-slate-200 text-sm">Executive Agent Intelligence Briefing</h3>
          {analysis?.sebiCautionFlag && analysis.sebiCautionFlag !== 'None Identified' && (
            <span className="text-[11px] bg-amber-950/80 text-amber-300 border border-amber-800/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> {analysis.sebiCautionFlag}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">{analysis?.summary}</p>
      </div>

      {/* 5. Bull vs. Bear Case Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6 w-full">
        <div className="p-6 bg-slate-900/40 border border-emerald-900/30 rounded-2xl space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-emerald-400 text-sm">
            <TrendingUp className="h-5 w-5" /> Bull Case Growth Catalysts
          </h4>
          <ul className="space-y-2.5 text-xs text-slate-300">
            {analysis?.bullCase?.map((item, i) => (
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
            {analysis?.bearCase?.map((item, i) => (
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
          {news?.map((item, i) => (
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