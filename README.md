<div align="center">

<pre>
   ███╗   ███╗ █████╗ ██████╗ ██╗  ██╗███████╗████████╗     ██╗      ██████╗  ██████╗ ███╗   ███╗
   ████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝██╔════╝╚══██╔══╝     ██║     ██╔═══██╗██╔═══██╗████╗ ████║
   ██╔████╔██║███████║██████╔╝█████╔╝ █████╗     ██║        ██║     ██║   ██║██║   ██║██╔████╔██║
   ██║╚██╔╝██║██╔══██║██╔══██╗██╔═██╗ ██╔══╝     ██║        ██║     ██║   ██║██║   ██║██║╚██╔╝██║
   ██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██╗███████╗   ██║        ███████╗╚██████╔╝╚██████╔╝██║ ╚═╝ ██║
   ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝        ╚══════╝ ╚═════╝  ╚═════╝ ╚═╝     ╚═╝
</pre>

### One Search. Complete Market Intelligence.

MarketLoom is an autonomous **Market & Competitor Intelligence Agent** that weaves live
quantitative financial data together with real-time qualitative news sentiment, then has
an LLM synthesize both into a single, structured Bull vs. Bear market briefing in seconds.

[![Demo](https://img.shields.io/badge/Demo-market--loom.vercel.app-33C853?style=for-the-badge&logo=vercel&logoColor=white)](https://market-loom.vercel.app/)
[![License](https://img.shields.io/badge/License-MIT-007ACC?style=for-the-badge)](./LICENSE)
[![Built For](https://img.shields.io/badge/Built%20For-IBM%20SkillsBuild-FF4B4B?style=for-the-badge&logo=ibm&logoColor=white)](https://skillsbuild.org)

[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=next.js&logoColor=white)](#-tech-stack)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#-tech-stack)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](#-tech-stack)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-000000?style=for-the-badge&logo=vercel&logoColor=white)](#-tech-stack)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)](#-tech-stack)
[![Recharts](https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge&logo=recharts&logoColor=white)](#-tech-stack)

[Overview](#overview) ·
[Features](#features) ·
[How It Works](#how-it-works) ·
[Architecture](#architecture) ·
[Team](#team) ·

</div>

---

## Overview

Researching a stock today means bouncing between a finance site for fundamentals and a
news feed for sentiment, then manually deciding whether the two stories agree. **MarketLoom
closes that gap.** Type a ticker or company name, and two specialist agents go to work in
parallel - one pulling quantitative fundamentals and historical OHLCV data, the other pulling qualitative news - before
an LLM orchestrator fuses both into one structured briefing: key metrics, interactive trend/volume charts, sector benchmarking, a risk rating, and
a side-by-side Bull Case vs. Bear Case.

No dashboards to piece together yourself. One search, one synthesized answer.

---

## Features

- **Ticker or Company Search** - Search using a stock ticker (`TCS.NS`, `RELIANCE`) or company name (`Tata Consultancy Services`).
- **Financial Agent** - Retrieves live spot price, 24h return, 52-week high/low, NIFTY 50 Alpha, and 90-day daily OHLCV historical price & volume data.
- **News Agent** - Fetches recent news headlines and extracts sentiment signals from live market sources.
- **Interactive Price & Volume Chart** - Features an interactive Recharts area chart paired with custom-styled volume bar charts, custom dark tooltips, and dynamic 30D / 60D / 90D timeframe toggles.
- **NIFTY 50 Benchmarking** - Calculates relative performance against the NIFTY 50 index.
- **Market Sentiment Barometer** - Displays a visual distribution breakdown of Bullish, Neutral, and Bearish sentiment percentages.
- **LLM Synthesis Layer** - Combines outputs from both agents into a structured market briefing via `@ai-sdk/google` (Google Gemini) and `generateObject` with Zod validation schemas.
- **Bull vs. Bear Analysis** - Presents balanced growth catalysts and downside risks for every search.
- **Risk Rating & Regulatory Flags** - Highlights Low, Medium, or High risk levels along with SEBI caution flags where applicable.
- **Sector & Peer Benchmarking** - Automatically identifies industry sectors and compares performance against primary market peers.
- **Performance Caching** - Includes a server-side memory cache (10-minute TTL) to minimize latency and token expenditure.
- **Responsive Terminal UI** - Modern, dark-themed trading dashboard built with Tailwind CSS and Lucide React icons.

---

## How It Works

```mermaid
flowchart TD
    U["User types a ticker\n(e.g. TCS)"] --> SF[SearchForm]
    SF --> API["/api/market-agent"]
    API --> FA["Financial Agent\nfetchStockData()"]
    API --> NA["News Agent\nfetchCompanyNews()"]
    FA --> LLM["LLM Orchestrator\n(generateObject + Gemini)"]
    NA --> LLM
    LLM --> DB[MarketDashboard]
    DB --> R["
    · Spot Price & NIFTY Alpha
    · Interactive Price & Volume Chart
    · Sentiment Barometer
    · Peer Benchmarking
    · Bull vs. Bear Case
    · Risk Rating & SEBI Flags"]

```

The Financial and News agents run concurrently, and their combined output is handed to an
LLM that returns a single structured JSON payload the dashboard renders directly.

---

## Architecture

MarketLoom is a **stateless, serverless 2-agent pipeline** - no database, deployed entirely
on Vercel's edge network.

```

┌───────────────────────────┐
│        SearchForm         │
│     (components/)         │
│  • Ticker input           │
│  • Popular ticker chips   │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│    Agent Orchestrator     │
│  (app/api/market-agent/)  │
│  • Calls both agent tools │
│  • Cache validation layer │
│  • Synthesizes via Gemini │
└──────┬───────────────┬────┘
       │               │
       ▼               ▼
┌──────────────┐  ┌──────────────┐
│ Finance Tool │  │  News Tool   │
│(lib/tools/)  │  │(lib/tools/)  │
│ Stock spot,  │  │  Headlines & │
│ NIFTY alpha, │  │  sentiment   │
│ 90D OHLCV    │  │  signals     │
└──────────────┘  └──────────────┘
              │
              ▼
┌───────────────────────────┐
│      MarketDashboard      │
│     (components/)         │
│  • Metrics grid           │
│  • Price & Volume Chart   │
│  • Sentiment Barometer    │
│  • Bull vs. Bear cards    │
│  • Risk badge & news feed │
└───────────────────────────┘


```

- **SearchForm owns input** - capturing what the user wants analyzed
- **Agent Orchestrator owns reasoning** - running both tools, managing caching, and synthesizing the result via Google Gemini
- **Finance & News tools own data** - each is an isolated, independently testable fetcher
- **MarketDashboard owns output** - rendering the synthesized briefing, interactive Recharts graphs, and market signals

---

## Tech Stack

| Layer                | Technology                                                      |
| -------------------- | --------------------------------------------------------------- |
| **Framework**        | Next.js 14 (App Router)                                         |
| **Language**         | TypeScript                                                      |
| **Styling**          | Tailwind CSS, lucide-react                                      |
| **Charting**         | Recharts (ComposedChart, Area, Bar)                             |
| **AI Orchestration** | Vercel AI SDK (`generateObject`, Zod schemas)                   |
| **LLM Provider**     | Google Gemini (`@ai-sdk/google`)                                |
| **Data Sources**     | Yahoo Finance (spot, NIFTY 50, 90D OHLCV), live web/news search |
| **Deployment**       | Vercel (serverless, edge-first)                                 |

---

## Project Structure

```
MarketLoom/
├── app/
│   ├── layout.tsx                # Metadata, custom fonts, favicon logo setup
│   ├── page.tsx                  # Main layout, search + dashboard state
│   └── api/
│       └── market-agent/
│           └── route.ts          # Agent orchestrator & cache (finance + news → Gemini synthesis)
├── components/
│   ├── SearchForm.tsx            # Ticker input, shortcuts, loading state
│   └── MarketDashboard.tsx       # Metrics grid, Recharts Price + Volume chart, Sentiment barometer, Bull/Bear cards, risk badge, news feed
├── lib/
│   └── tools/
│       ├── finance-tool.ts       # fetchStockData() - spot price, NIFTY alpha, 90-day OHLCV history
│       └── news-tool.ts          # fetchCompanyNews() - headlines & sentiment signals
├── public/
│   └── logo.svg                  # MarketLoom logo mark
├── .env.local                    # GOOGLE_GENERATIVE_AI_API_KEY (not committed)
└── README.md

```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- A **Google Gemini API Key** (`GOOGLE_GENERATIVE_AI_API_KEY`)
- **Git**

### Clone the repo

```bash
git clone [https://github.com/calsify/MarketLoom.git](https://github.com/calsify/MarketLoom.git)
cd MarketLoom

```

### Install & configure

```bash
npm install

```

Create a `.env.local` file at the project root:

```
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key-here

```

### Run locally

```bash
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) to see MarketLoom running.

---

## Usage

1. Type a ticker (`TCS.NS`, `RELIANCE`) or company name (`Tata Consultancy Services`) into the search bar - or click one of
   the popular ticker shortcuts
2. Hit **Analyze** (or press Enter)
3. The Financial Agent and News Agent fetch data in parallel
4. The LLM synthesizes both into one structured briefing
5. Read the metrics grid, toggle between 30D/60D/90D on the interactive price and volume chart, review market sentiment distribution, Bull vs. Bear cases, and recent news signals

---

## Contributing / Git Workflow

To keep merges conflict-free, each module lives in its own file and branch no one edits outside their assigned path.

|     | Branch                                | File Owned                       |
| --- | ------------------------------------- | -------------------------------- |
| 1   | `feature/member-1-core`               | `app/page.tsx`                   |
| 2   | `feature/member-2-finance-tool`       | `lib/tools/finance-tool.ts`      |
| 3   | `feature/member-3-news-tool`          | `lib/tools/news-tool.ts`         |
| 4   | `feature/member-4-agent-orchestrator` | `app/api/market-agent/route.ts`  |
| 5   | `feature/member-5-search-ui`          | `components/SearchForm.tsx`      |
| 6   | `feature/member-6-dashboard-ui`       | `components/MarketDashboard.tsx` |

---

## Roadmap

- [x] Interactive price & volume charting (30D / 60D / 90D timeframes)
- [x] NIFTY 50 Alpha & sentiment distribution barometer
- [ ] Real-time price streaming
- [ ] Portfolio-level multi-ticker analysis
- [ ] Historical sentiment trend charts
- [ ] Export briefing as PDF
- [ ] Watchlists & saved searches

---

## Team

| Module | Team Member | GitHub | LinkedIn | Responsibilities |
|--------|-------------|--------|----------|------------------|
| 🧠 Core & Integration | **Avanish** | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](#) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](#) | Repo setup, `app/page.tsx` layout, state management, PR approvals |
| 📊 Financial Agent | **Gyanendra** | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](#) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](#) | `lib/tools/finance-tool.ts` - stock price & valuation ratio fetcher |
| 📰 News Agent | **Akshata** | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/akshatabasankar) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/akshata-basankar/) | `lib/tools/news-tool.ts` - web search & news headline fetcher |
| 🧩 Agent Orchestrator | **Shashwat** | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/shashwat230710) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/shashwat-shukla23/) | `app/api/market-agent/route.ts` - multi-agent API route via Vercel AI SDK |
| 🔍 Search UI | **Mobashshir** | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/Mobasheera) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/mobashshir-ahsan/) | `components/SearchForm.tsx` - search bar, ticker shortcuts, loading states |
| 📈 Dashboard UI | **Nikhil** | [![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/nikzzzzzzzzzz) | [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/nikhilkanojiya/) | `components/MarketDashboard.tsx` - metrics cards, Bull/Bear cards, risk badges |

---

## 📜 License

This project is licensed under the [MIT License](https://www.google.com/search?q=./LICENSE) - free to use for educational, research, and hackathon purposes.

```

```
