'use client';

import { useState } from 'react';
import SearchForm from '@/components/SearchForm';
import MarketDashboard from '@/components/MarketDashboard';
import { TrendingUp } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (searchTerm: string) => {
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/market-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: searchTerm }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch market analysis');
      }

      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      <main className="w-full flex-1 px-4 sm:px-8 lg:px-12 py-6 space-y-8">
        <header className="flex items-center space-x-3 border-b border-slate-800/80 pb-5 w-full">
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/30 rounded-xl">
            <TrendingUp className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">MarketLoom</h1>
            <p className="text-xs md:text-sm text-slate-400">Autonomous Multi-Agent Market & Equity Intelligence Terminal</p>
          </div>
        </header>

        <SearchForm isLoading={loading} onSearch={handleSearch} />

        {error && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {data && <MarketDashboard data={data} />}
      </main>
    </div>
  );
}