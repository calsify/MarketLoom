'use client';

import { useState } from 'react';
import SearchForm from '@/components/SearchForm';
import MarketDashboard from '@/components/MarketDashboard';
import { TrendingUp } from 'lucide-react';

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (ticker: string) => {
    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/market-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      });

      if (!res.ok) throw new Error('Failed to fetch market analysis');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center space-x-3 border-b border-slate-800 pb-6">
        <TrendingUp className="h-8 w-8 text-emerald-400"/>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Autonomous Market Intelligence Agent</h1>
          <p className="text-sm text-slate-400">Multi-Agent Quantitative & Qualitative Competitor Analysis</p>
        </div>
      </header>

      <SearchForm isLoading={loading} onSearch={handleSearch}/>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-500/50 text-red-200 rounded-lg">
          {error}
        </div>
      )}

      {data && <MarketDashboard data={data}/>}
    </main>
  );
}