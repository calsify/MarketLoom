async function resolveTickerSymbol(query: string): Promise<string> {
  const cleaned = query.trim();
  
  if (cleaned.toUpperCase() === 'NIFTY' || cleaned.toUpperCase() === 'NIFTY 50' || cleaned === '^NSEI') {
    return '^NSEI';
  }

  if (cleaned.toUpperCase().endsWith('.NS') || cleaned.toUpperCase().endsWith('.BO')) {
    return cleaned.toUpperCase();
  }

  try {
    const searchRes = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(cleaned)}&quotesCount=5&newsCount=0`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, cache: 'no-store' }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const quotes = searchData.quotes || [];

      const indianQuote = quotes.find(
        (q: any) => q.symbol && (q.symbol.endsWith('.NS') || q.symbol.endsWith('.BO'))
      );

      if (indianQuote) return indianQuote.symbol;
      if (quotes.length > 0 && quotes[0].symbol) return quotes[0].symbol;
    }
  } catch (err) {
    console.error('Ticker search lookup error:', err);
  }

  return `${cleaned.toUpperCase()}.NS`;
}

export async function fetchStockData(rawInput: string) {
  const symbol = await resolveTickerSymbol(rawInput);

  try {
    const [stockRes, niftyRes] = await Promise.all([
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=3m&interval=1d&includePrePost=false`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        cache: 'no-store'
      }),
      fetch(`https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=1d&interval=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        cache: 'no-store'
      })
    ]);

    if (!stockRes.ok) throw new Error(`Could not find market data for "${rawInput}"`);

    const stockData = await stockRes.json();
    const result = stockData.chart?.result?.[0];

    if (!result) throw new Error(`Invalid market data returned for ${symbol}`);

    const meta = result.meta;
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const closes = quote.close || [];
    const opens = quote.open || [];
    const highs = quote.high || [];
    const lows = quote.low || [];
    const volumes = quote.volume || [];

    const history: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }> = [];

    for (let i = 0; i < timestamps.length; i++) {
      const c = closes[i];
      if (typeof c === 'number' && !isNaN(c) && isFinite(c) && c > 0) {
        const dateObj = new Date(timestamps[i] * 1000);
        const dateStr = `${dateObj.getDate()} ${dateObj.toLocaleString('en-IN', { month: 'short' })}`;

        history.push({
          date: dateStr,
          open: Number((opens[i] || c).toFixed(2)),
          high: Number((highs[i] || c).toFixed(2)),
          low: Number((lows[i] || c).toFixed(2)),
          close: Number(c.toFixed(2)),
          volume: Number(volumes[i] || 0),
        });
      }
    }

    const price = Number((meta.regularMarketPrice || (history.length > 0 ? history[history.length - 1].close : 0)).toFixed(2));
    const prevClose = Number((meta.chartPreviousClose || meta.previousClose || price).toFixed(2));
    const changePercent = Number((((price - prevClose) / prevClose) * 100).toFixed(2));

    let niftyChangePercent = 0;
    if (niftyRes.ok) {
      const niftyData = await niftyRes.json();
      const niftyMeta = niftyData.chart?.result?.[0]?.meta;
      if (niftyMeta) {
        niftyChangePercent = Number(
          (((niftyMeta.regularMarketPrice - niftyMeta.chartPreviousClose) / niftyMeta.chartPreviousClose) * 100).toFixed(2)
        );
      }
    }

    const relativeToNifty = Number((changePercent - niftyChangePercent).toFixed(2));

    return {
      ticker: symbol,
      displayTicker: symbol.replace('.NS', '').replace('^', ''),
      companyName: meta.shortName || meta.longName || meta.symbol,
      price,
      currency: meta.currency || 'INR',
      changePercent,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || price,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || price,
      exchange: meta.exchangeName || 'NSE',
      niftyChangePercent,
      relativeToNifty,
      history,
    };
  } catch (error: any) {
    console.error('Error in fetchStockData:', error);
    throw new Error(error.message || `Could not fetch live market data for "${rawInput}"`);
  }
}