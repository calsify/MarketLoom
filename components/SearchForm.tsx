'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, Trash2, TrendingUp } from 'lucide-react';

interface SearchFormProps {
  isLoading: boolean;
  onSearch: (ticker: string) => void;
}

const POPULAR_NIFTY = [
  { label: 'Reliance', symbol: 'RELIANCE' },
  { label: 'Tata Motors', symbol: 'Tata Motors' },
  { label: 'TCS', symbol: 'TCS' },
  { label: 'Infosys', symbol: 'Infosys' },
  { label: 'State Bank', symbol: 'State Bank' },
];

export default function SearchForm({ isLoading, onSearch }: SearchFormProps) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('marketloom_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent searches');
      }
    }
  }, []);

  // Save new search to recent searches array
  const saveToRecent = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 5); // Keep top 5 recent searches
      localStorage.setItem('marketloom_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveToRecent(query);
      onSearch(query.trim());
    }
  };

  const handleSelectQuery = (searchTerm: string) => {
    setQuery(searchTerm);
    saveToRecent(searchTerm);
    onSearch(searchTerm);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('marketloom_recent_searches');
  };

  return (
    <div className="space-y-4">
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbol or company (e.g. Tata Motors, Reliance, INFY, SBIN)..."
            className="w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500/80 focus:ring-1 focus:ring-emerald-500/50 text-sm transition-all shadow-inner"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-950/40 shrink-0"
        >
          {isLoading ? 'Analyzing...' : 'Analyze Market'}
        </button>
      </form>

      {/* Recent Searches Row */}
      {recentSearches.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
          <span className="flex items-center gap-1 font-medium text-slate-400">
            <Clock className="h-3.5 w-3.5 text-sky-400" /> Recent:
          </span>
          <div className="flex gap-1.5 flex-wrap flex-1 items-center">
            {recentSearches.map((term, i) => (
              <button
                key={i}
                onClick={() => handleSelectQuery(term)}
                className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg transition-colors text-xs font-mono"
              >
                {term}
              </button>
            ))}
            <button
              onClick={clearRecent}
              title="Clear recent searches"
              className="p-1 text-slate-600 hover:text-rose-400 transition-colors ml-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* NIFTY Quick Suggestions */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="flex items-center gap-1 font-medium text-slate-400">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Popular:
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {POPULAR_NIFTY.map((item) => (
            <button
              key={item.symbol}
              onClick={() => handleSelectQuery(item.symbol)}
              className="px-2.5 py-1 bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-slate-300 rounded-lg transition-colors text-xs"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}