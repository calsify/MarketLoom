import { ShieldAlert, TrendingUp, TrendingDown, Newspaper, DollarSign } from 'lucide-react';

interface MarketDashboardProps {
  data: {
    financials: {
      ticker: string;
      price: number;
      currency: string;
      changePercent: number;
      peRatio?: number;
      high52?: number;
      low52?: number;
    };
    news: Array<{
      title: string;
      snippet: string;
      source: string;
    }>;
    analysis: {
      bullCase: string[];
      bearCase: string[];
      riskRating: 'Low' | 'Medium' | 'High';
      summary: string;
    };
  };
}

export default function MarketDashboard({ data }: MarketDashboardProps) {
  const { financials, news, analysis } = data;

  const getRiskBadge = (risk: string) => {
    if (risk === 'Low') return 'bg-emerald-950 text-emerald-400 border-emerald-500/30';
    if (risk === 'Medium') return 'bg-yellow-950 text-yellow-400 border-yellow-500/30';
    return 'bg-red-950 text-red-400 border-red-500/30';
  };

  return (
    <div className="space-y-6">
      {/* 1. Quantitative Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Current Price
          </span>
          <p className="text-xl font-bold text-slate-100">
            ${financials.price} <span className="text-xs font-normal text-slate-400">{financials.currency}</span>
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400">24h Performance</span>
          <p className={`text-xl font-bold ${financials.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {financials.changePercent >= 0 ? '+' : ''}{financials.changePercent}%
          </p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400">P/E Ratio</span>
          <p className="text-xl font-bold text-slate-100">{financials.peRatio || 'N/A'}</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> Risk Level
          </span>
          <span className={`inline-block mt-1 px-3 py-0.5 border text-xs font-semibold rounded-full ${getRiskBadge(analysis.riskRating)}`}>
            {analysis.riskRating} Risk
          </span>
        </div>
      </div>

      {/* 2. Executive Briefing Card */}
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
        <h3 className="font-semibold text-slate-200">Executive Agent Synthesis</h3>
        <p className="text-sm text-slate-300 leading-relaxed">{analysis.summary}</p>
      </div>

      {/* 3. Bull vs. Bear Side-by-Side Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 bg-slate-900/40 border border-emerald-900/30 rounded-xl space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-emerald-400">
            <TrendingUp className="h-5 w-5" /> Bull Case Potential
          </h4>
          <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
            {analysis.bullCase.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="p-6 bg-slate-900/40 border border-red-900/30 rounded-xl space-y-3">
          <h4 className="flex items-center gap-2 font-semibold text-red-400">
            <TrendingDown className="h-5 w-5" /> Bear Case Risks
          </h4>
          <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
            {analysis.bearCase.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 4. Qualitative News Timeline Feed */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-sky-400" /> Scraped Market Intelligence Signals
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {news.map((item, i) => (
            <div key={i} className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{item.source}</span>
              <h5 className="text-xs font-semibold text-slate-200 line-clamp-1">{item.title}</h5>
              <p className="text-xs text-slate-400 line-clamp-2">{item.snippet}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}