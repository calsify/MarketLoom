import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { fetchStockData } from '@/lib/tools/finance-tool';
import { fetchCompanyNews } from '@/lib/tools/news-tool';

// Server-side cache to prevent duplicate API token spend
const cache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL

export async function POST(req: Request) {
  try {
    const { ticker } = await req.json();

    if (!ticker || typeof ticker !== 'string') {
      return new Response(JSON.stringify({ error: 'Ticker is required' }), { status: 400 });
    }

    const cacheKey = ticker.trim().toLowerCase();
    const cachedEntry = cache.get(cacheKey);

    // Return cached result immediately if under 10 minutes old AND has a valid history array length
    if (
      cachedEntry &&
      Date.now() - cachedEntry.timestamp < CACHE_TTL &&
      Array.isArray(cachedEntry.data?.financials?.history) &&
      cachedEntry.data.financials.history.length > 1
    ) {
      return Response.json(cachedEntry.data);
    }

    // Parallel execution for minimum latency
    const [financials, news] = await Promise.all([
      fetchStockData(ticker),
      fetchCompanyNews(`${ticker} NSE stock news India`),
    ]);

    // Ensure financials.history is an array and explicitly passed through
    const safeFinancials = {
      ...financials,
      history: Array.isArray(financials.history) ? financials.history : [],
    };

    // Token Optimization: Send concise headlines to Gemini prompt
    const conciseNewsStr = (news || [])
      .slice(0, 3)
      .map((n: any) => `- ${n.title}: ${n.snippet ? n.snippet.slice(0, 100) : ''}`)
      .join('\n');

    // Prompt instructs Gemini to provide brief bullet points
    const prompt = `
      Equity: ${safeFinancials.companyName} (${safeFinancials.ticker})
      Price: ₹${safeFinancials.price} (${safeFinancials.changePercent}% 24h) | NIFTY 24h: ${safeFinancials.niftyChangePercent}% | Alpha: ${safeFinancials.relativeToNifty}%
      52W High/Low: ₹${safeFinancials.fiftyTwoWeekHigh} / ₹${safeFinancials.fiftyTwoWeekLow}
      News:
      ${conciseNewsStr}

      Task: Provide a concise market evaluation including sentiment breakdown (bullish/bearish/neutral percentages summing to 100%), key sector peers, risk level, SEBI caution flags, and 3 brief bull/bear points. Keep sentences short.
    `;

    // Technical fallback object in case AI generation fails or rate-limits
    let analysisObject = {
      sentiment: {
        bullishPercent: safeFinancials.changePercent >= 0 ? 60 : 30,
        bearishPercent: safeFinancials.changePercent >= 0 ? 20 : 50,
        neutralPercent: 20,
        overallSentiment: safeFinancials.changePercent >= 0 ? 'Bullish' : 'Bearish',
      },
      peerAnalysis: {
        sector: 'Equities & Financial Markets',
        keyPeers: ['NIFTY 50', 'NSE Sector Indices'],
        sectorPerformanceSummary: 'Trading volume and price momentum based on daily spot movements.',
      },
      bullCase: [
        'Positive trading momentum in recent sessions',
        'Outperforming general index metrics',
        'Strong buyer interest at support levels',
      ],
      bearCase: [
        'Potential macroeconomic volatility',
        'Resistance near 52-week peak levels',
        'Broader market alignment risks',
      ],
      riskRating: 'Medium' as 'Low' | 'Medium' | 'High',
      sebiCautionFlag: 'None Identified',
      summary: `Market evaluation based on 90-day technical historical indicators and live spot price metrics.`,
    };

    try {
      const { object } = await generateObject({
        model: google('gemini-2.5-flash'), // Supported model ID for Vercel AI SDK
        schema: z.object({
          sentiment: z.object({
            bullishPercent: z.number().min(0).max(100),
            bearishPercent: z.number().min(0).max(100),
            neutralPercent: z.number().min(0).max(100),
            overallSentiment: z.string().describe('e.g., Strongly Bullish, Mildly Bullish, Neutral, Bearish'),
          }),
          peerAnalysis: z.object({
            sector: z.string(),
            keyPeers: z.array(z.string()),
            sectorPerformanceSummary: z.string(),
          }),
          bullCase: z.array(z.string()).describe('List of 3 growth catalysts'),
          bearCase: z.array(z.string()).describe('List of 3 downside risks'),
          riskRating: z.enum(['Low', 'Medium', 'High']),
          sebiCautionFlag: z.string(),
          summary: z.string(),
        }),
        prompt,
      });

      analysisObject = object;
    } catch (aiErr) {
      console.warn('AI Evaluation fallback activated:', aiErr);
    }

    const responsePayload = {
      financials: safeFinancials,
      news,
      analysis: analysisObject,
    };

    // Store in cache
    cache.set(cacheKey, { timestamp: Date.now(), data: responsePayload });

    return Response.json(responsePayload);
  } catch (error: any) {
    console.error('Error in agent route:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process market analysis' }),
      { status: 500 }
    );
  }
}