# Vantage Terminal — React + Supabase rebuild

The React + Supabase rebuild of Vantage Terminal, built incrementally on top
of a working foundation rather than all at once.

**Done so far**: real accounts, Holdings (with buy price/qty, live P&L,
portfolio-level totals), Watchlist, an Alerts feed (both computed signals
and custom price-target alerts), real ticker validation, live prices,
live P/E & ROE, Technical Analysis, a Fundamentals comparison page, News
(market headlines plus per-company search), and Paper Trade (virtual
trading with a real ₹1,00,000 wallet, live prices, atomic buy/sell) — all
backed by a real database.

**Not yet ported**: Scanner, Day Trade, Settings.

If you get stuck on any step below, copy the exact error message back to
Claude — much easier to fix a specific error than "it doesn't work."

## Keeping this repo in sync (read this once)

Some updates get applied by pasting code directly into Supabase's dashboard
editor (Edge Functions, SQL) rather than through git. **That code doesn't
automatically make it back into this repo** — if you only ever paste into
the dashboard and never copy the same change into your local files and
push, this repo silently drifts out of sync with what's actually running.
This already happened once (the Edge Function and schema files in this repo
were a version behind what was actually deployed) and has been fixed as
part of this update — but worth knowing so it's not a surprise again later.
The rule going forward: any time you paste code into a Supabase dashboard
editor, also save that exact code into the matching file here and push it.

## What's real right now vs. what's a placeholder

- **Real**: accounts, Holdings, Watchlist, Row Level Security, duplicate-
  ticker protection, real ticker validation, live prices, live P/E and ROE,
  a portfolio summary, an Alerts feed combining computed signals with
  custom price-target alerts, a confirmation prompt before deleting
  anything, Technical Analysis, a Fundamentals comparison table, News, and
  Paper Trade (virtual ₹1,00,000 wallet, buy/sell at live market prices,
  average cost-basis tracking, per-position live P&L, trade history).
- **Paper Trade was tested against a real local Postgres instance**, not
  just eyeballed — buy/sell math (including averaging cost basis across
  multiple buys), insufficient-funds rejection, over-sell rejection, and
  that one user genuinely cannot see another user's wallet or positions
  were all verified against actual database transactions before this
  reached you. Buy and sell are single atomic database functions — a
  network blip mid-trade can't leave your cash debited with no matching
  position, or vice versa.
- **No brokerage connection, ever** — prices are real and live, the money
  isn't. There is no path from this feature to a real trade.
- **Caught before shipping**: the verdict logic initially called a textbook
  steady uptrend "Bearish" — RSI-overbought was wrongly allowed to override
  clear trend direction, and floating-point noise near zero was being read
  as a real signal. Both fixed and re-verified against hand-calculated
  reference values before this reached you; worth knowing this class of bug
  exists and was actively checked for, not just assumed away.
- **Honesty note**: the ROE column is genuinely ROE (Return on Equity), not
  ROCE — Yahoo's free data doesn't expose ROCE. The technical verdict is a
  rule-based read of trend direction (moving averages + MACD), not machine
  learning or a prediction.
- **Known fragility**: live ratios depend on an unofficial Yahoo Finance API
  that requires session-cookie authentication, implemented but not testable
  from outside a real deployment — if it stops working, that's external,
  not a sign anything here is broken.
- **Next up**: Intelligence, Scanner, Trade Lab, ported piece by piece.

---

## Setup — do these in order (first time only)

### 1. Install Node
```
node --version
npm --version
```
If that errors instead of printing a version, install the LTS version from
[nodejs.org](https://nodejs.org).

### 2. Install dependencies
```
npm install
```

### 3. Create your Supabase project
[supabase.com](https://supabase.com) -> sign up -> **New project**.

### 4. Run the database schema
**SQL Editor** -> **New query** -> paste the entire contents of
`supabase/schema.sql` -> **Run**. Safe to re-run any time you pull an
update that changes this file — every statement is written to not fail or
duplicate data if it's already been run before.

### 5. Deploy the price/validation function
**Edge Functions** -> **Deploy a new function** -> **Via Editor** -> name
it exactly `stock-data` -> delete the template code -> paste in the entire
contents of `supabase/functions/stock-data/index.ts` -> **Deploy**.

### 6. Get your API credentials
**Project Settings** -> **API** -> copy the **Project URL** and the
**Publishable** key.

### 7. Configure your local environment
Copy `.env.example` to `.env.local`, fill in the two real values:
```
VITE_SUPABASE_URL=https://your-actual-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-publishable-key
```

### 8. Run it locally
```
npm run dev
```

### 9. Push to GitHub, deploy on Vercel
Standard flow: `git add . && git commit -m "..." && git push`, then connect
the repo on [vercel.com](https://vercel.com) with the same two environment
variables added in its dashboard. Every push after that auto-deploys.

---

## Updating an existing setup with this version

This update touches the database (new Paper Trade tables + functions) and
the frontend — no Edge Function change this time:

1. Re-run the entire `supabase/schema.sql` in the SQL editor (safe to
   re-run — only adds the new Paper Trade tables/functions)
2. Replace your local `src` folder with the one in this delivery, and
   replace `README.md` too
3. `git add . && git commit -m "Add Paper Trade" && git push`

## Project structure, briefly

```
src/
  lib/
    supabase.js          - Supabase client
    useStockList.js      - shared data logic for Holdings & Watchlist
    usePriceAlerts.js    - custom price-target alerts logic
    technicalIndicators.js - pure RSI/SMA/MACD math, unit-testable
    news.js               - Google News RSS via rss2json, no backend needed
    usePaperTrade.js      - virtual wallet/positions/trades, calls the RPC functions below
  contexts/
    AuthContext.jsx      - session state, used everywhere via useAuth()
  components/
    StockTable.jsx       - the ONE shared table (Holdings and Watchlist both use this)
    stockDisplay.js      - pure helper functions (signal, P&L, formatting)
    AddStockBox.jsx      - shared "type a ticker, add it" input
    Layout.jsx           - header + nav
  pages/
    Login.jsx, Holdings.jsx, Watchlist.jsx, Alerts.jsx,
    Technical.jsx, Fundamentals.jsx, News.jsx, PaperTrade.jsx
supabase/
  schema.sql             - run in the Supabase SQL editor (safe to re-run)
                           includes buy_paper_stock/sell_paper_stock functions
  functions/
    stock-data/
      index.ts           - deploy via Dashboard -> Edge Functions
```
