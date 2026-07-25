'use client';

import Image from 'next/image';
import { useState } from 'react';
import SearchForm from '@/components/SearchForm';
import MarketDashboard from '@/components/MarketDashboard';

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
        <header className="flex items-center space-x-3.5 border-b border-slate-800/80 pb-5 w-full">
          {/* Logo container */}
          <div className="relative h-10 w-10 flex items-center justify-center shrink-0">
            <Image
              src="/logo.svg"
              alt="MarketLoom Logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
              MarketLoom
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Autonomous Multi-Agent Market & Equity Intelligence Terminal
            </p>
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