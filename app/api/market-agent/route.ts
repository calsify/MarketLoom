import { NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { fetchStockData } from '@/lib/tools/finance-tool';
import { fetchCompanyNews } from '@/lib/tools/news-tool';

// --- Validation schemas -----------------------------------------------

const requestSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1, 'Ticker is required')
    .max(10, 'Ticker looks too long')
    .transform((v) => v.toUpperCase()),
});

const analysisSchema = z.object({
  bullCase: z.array(z.string()).min(1),
  bearCase: z.array(z.string()).min(1),
  riskRating: z.enum(['Low', 'Medium', 'High']),
  summary: z.string(),
});

// --- Route handler -------------------------------------------------------

export async function POST(req: Request) {
  // Step 0: Validate input
  let ticker: string;
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'A valid ticker symbol is required (1-10 characters).' },
        { status: 400 }
      );
    }
    ticker = parsed.data.ticker;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Step 1: Run both sub-agent tools in parallel.
  // allSettled (not all) so one tool failing doesn't kill the whole request.
  // finance-tool.ts / news-tool.ts already return mock fallbacks internally,
  // but this guards against an unexpected throw too.
  const [financialsResult, newsResult] = await Promise.allSettled([
    fetchStockData(ticker),
    fetchCompanyNews(ticker),
  ]);

  if (financialsResult.status === 'rejected') {
    console.error('[market-agent] finance tool failed:', financialsResult.reason);
    return NextResponse.json(
      { error: 'Could not retrieve financial data for this ticker.' },
      { status: 502 }
    );
  }

  const financials = financialsResult.value;
  const news = newsResult.status === 'fulfilled' ? newsResult.value : [];

  // Step 2: Master synthesis agent combines quantitative + qualitative data.
  // generateObject + a zod schema (vs generateText + manual JSON.parse) means
  // the SDK enforces the output shape — no stripping ```json fences and
  // hoping the model returned valid, correctly-keyed JSON.
  try {
    const { object: analysis } = await generateObject({
      model: google('gemini-3.5-flash'),
      schema: analysisSchema,
      system: `You are a Senior Wall Street Market Analyst and Competitor Intelligence Agent.
Synthesize the quantitative financial numbers and qualitative news snippets into a
concise, well-reasoned report. Base every claim on the data provided — do not invent
figures or events that aren't supported by the inputs.`,
      prompt: `
        TICKER: ${ticker}
        FINANCIAL DATA: ${JSON.stringify(financials)}
        NEWS HEADLINES: ${JSON.stringify(news)}
      `,
    });

    return NextResponse.json({ financials, news, analysis });
  } catch (error) {
    console.error('[market-agent] synthesis failed:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize market analysis. Please try again.' },
      { status: 500 }
    );
  }
}
