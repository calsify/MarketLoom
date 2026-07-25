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

    // Return cached result immediately if under 10 minutes old (0 tokens used!)
    if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL) {
      return Response.json(cachedEntry.data);
    }

    // Parallel execution for minimum latency
    const [financials, news] = await Promise.all([
      fetchStockData(ticker),
      fetchCompanyNews(`${ticker} NSE stock news India`),
    ]);

    // Token Optimization: Send concise headlines
    const conciseNewsStr = news
      .slice(0, 3)
      .map((n) => `- ${n.title}: ${n.snippet.slice(0, 100)}`)
      .join('\n');

    // Prompt instruct Gemini to provide brief bullet points
    const prompt = `
      Equity: ${financials.companyName} (${financials.ticker})
      Price: ₹${financials.price} (${financials.changePercent}% 24h) | NIFTY 24h: ${financials.niftyChangePercent}% | Alpha: ${financials.relativeToNifty}%
      52W High/Low: ₹${financials.fiftyTwoWeekHigh} / ₹${financials.fiftyTwoWeekLow}
      News:
      ${conciseNewsStr}

      Task: Provide a concise market evaluation including sentiment breakdown (bullish/bearish/neutral percentages summing to 100%), key sector peers, risk level, SEBI caution flags, and 3 brief bull/bear points. Keep sentences short.
    `;

    const { object } = await generateObject({
      model: google('gemini-3.5-flash'),
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

    const responsePayload = {
      financials,
      news,
      analysis: object,
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