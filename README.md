# Vantage Terminal — React + Supabase rebuild

The React + Supabase rebuild of Vantage Terminal, built incrementally on top
of a working foundation rather than all at once.

**Done so far**: real accounts, Holdings (with buy price/qty, live P&L,
portfolio-level totals), Watchlist, an Alerts feed (both computed signals
and custom price-target alerts you set yourself), real ticker validation,
live prices, and live P/E & ROE — all backed by a real database.

**Not yet ported**: Intelligence, Scanner, Trade Lab.

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
  a portfolio summary (Total Invested / Current Value / Overall P&L), an
  Alerts feed combining computed signals (Buy Zone / Breakout / Big Drop /
  Surge) with custom price-target alerts you set yourself, and a
  confirmation prompt before deleting anything.
- **Honesty note**: the ROE column is genuinely ROE (Return on Equity), not
  ROCE — Yahoo's free data doesn't expose ROCE.
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

1. Replace your local `src` folder with the one in this delivery, **and
   replace this README.md too** (the previous one was out of date)
2. Re-run the entire `supabase/schema.sql` in the SQL editor (safe — adds
   the new `price_alerts` table and fixes the grants gap, without touching
   existing data)
3. Redeploy `supabase/functions/stock-data/index.ts` the same way as step 5
   above (also fixes drift — this file was a version behind what's live)
4. `git add . && git commit -m "Sync repo, add custom price alerts" && git push`

## Project structure, briefly

```
src/
  lib/
    supabase.js        - Supabase client
    useStockList.js     - shared data logic for Holdings & Watchlist
    usePriceAlerts.js   - custom price-target alerts logic
  contexts/
    AuthContext.jsx     - session state, used everywhere via useAuth()
  components/
    StockTable.jsx      - the ONE shared table (Holdings and Watchlist both use this)
    stockDisplay.js     - pure helper functions (signal, P&L, formatting)
    AddStockBox.jsx      - shared "type a ticker, add it" input
    Layout.jsx           - header + nav
  pages/
    Login.jsx, Holdings.jsx, Watchlist.jsx, Alerts.jsx
supabase/
  schema.sql             - run in the Supabase SQL editor (safe to re-run)
  functions/
    stock-data/
      index.ts           - deploy via Dashboard -> Edge Functions
```
