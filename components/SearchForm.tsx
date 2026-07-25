"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchFormProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
}

const POPULAR_TICKERS = ["NVDA", "TSLA", "AAPL", "MSFT", "AMZN"];

const SearchForm = ({ onSearch, isLoading }: SearchFormProps) => {
  const [ticker, setTicker] = useState("");

  const submitTicker = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSearch(trimmed);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitTicker(ticker);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitTicker(ticker);
    }
  };

  const handleChipClick = (symbol: string) => {
    if (isLoading) return;
    setTicker(symbol);
    submitTicker(symbol);
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 p-5 sm:p-6 shadow-lg">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            size={18}
            aria-hidden="true"
          />
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Enter a ticker or company name (e.g. TSLA, Tesla)"
            aria-label="Stock ticker or company name"
            className="w-full rounded-xl bg-zinc-950 border border-zinc-700 pl-10 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !ticker.trim()}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium px-6 py-3 text-sm transition"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={16} aria-hidden="true" />
              <span>Analyzing...</span>
            </>
          ) : (
            <span>Analyze</span>
          )}
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mt-4">
        {POPULAR_TICKERS.map((symbol) => (
          <button
            key={symbol}
            type="button"
            onClick={() => handleChipClick(symbol)}
            disabled={isLoading}
            className="rounded-full border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-300 hover:text-emerald-400 text-xs font-medium px-3 py-1.5 transition"
          >
            {symbol}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchForm;