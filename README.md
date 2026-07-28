# Vantage Terminal — Phase 1 (Auth + Holdings + Watchlist)

This is the start of the React + Supabase rebuild of Vantage Terminal. It is
**not** a full port yet — it's Phase 1: real accounts, a real database, and
Holdings + Watchlist working end-to-end on the new stack. Everything else
(Alerts, Intelligence, Scanner, Trade Lab, live prices) comes next, piece by
piece, once this foundation is confirmed solid.

If you get stuck on any step below, copy the exact error message back to
Claude — much easier to fix a specific error than "it doesn't work."

## What's real right now vs. what's a placeholder

- **Real**: accounts (sign up/sign in), Holdings and Watchlist stored in an
  actual database, Row Level Security (your data is genuinely private to
  your account), duplicate-ticker protection at the database level, real
  ticker validation and live prices via the `stock-data` Edge Function
  (see step 4b below — you do need to deploy this one piece yourself).
- **Placeholder for now**: nothing major — Phase 1 is now functionally
  complete. Next natural additions: Alerts, and the rest of the original
  app's tabs (Intelligence, Scanner, Trade Lab), ported piece by piece.

---

## Setup — do these in order

### 1. Install Node (skip if `node --version` already prints something)
Download the **LTS** version from [nodejs.org](https://nodejs.org) and
install it normally. Then confirm in a terminal:
```
node --version
npm --version
```

### 2. Install the project's dependencies
Open a terminal **inside this folder** and run:
```
npm install
```

### 3. Create your Supabase project
Go to [supabase.com](https://supabase.com) -> sign up (GitHub login is
fastest) -> **New project**. Pick any name and a database password (save the
password somewhere - you likely won't need it again, but just in case).
Wait ~2 minutes for it to finish provisioning.

### 4. Run the database schema
In your new Supabase project: **SQL Editor** (left sidebar) -> **New query**.
Open `supabase/schema.sql` from this folder, copy the whole thing, paste it
in, click **Run**. You should see "Success. No rows returned." That's it -
your tables, security rules, and duplicate-protection are all live.

### 4b. Deploy the price/validation function
This is the piece that makes ticker validation and live prices real (instead
of accepting anything you type, or showing blank prices). No CLI needed:

1. Left sidebar -> **Edge Functions** -> **Deploy a new function** -> **Via Editor**
2. Name it exactly `stock-data` (the frontend code expects this exact name)
3. Delete whatever template code is there, and paste in the entire contents
   of `supabase/functions/stock-data/index.ts` from this folder
4. Click **Deploy**

That's it — it's now live at `https://your-project.supabase.co/functions/v1/stock-data`,
called automatically by the app whenever you add a stock or load a page.

### 5. Get your API credentials
**Project Settings** (gear icon) -> **API**. You need two values:
- **Project URL**
- **Project API keys -> anon / public**

### 6. Configure your local environment
Copy `.env.example` to a new file named `.env.local` in the same folder,
then paste your real values in:
```
VITE_SUPABASE_URL=https://your-actual-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key
```
`.env.local` is already in `.gitignore` - it will never be committed or
uploaded anywhere.

### 7. Run it locally
```
npm run dev
```
Open the URL it prints (usually `http://localhost:5173`). Sign up for an
account, confirm your email if prompted, sign in, and try adding a ticker to
Holdings and to Watchlist.

### 8. Push this to GitHub
```
git init
git add .
git commit -m "Phase 1: auth, holdings, watchlist on Supabase"
```
Then on github.com: **New repository** (don't add a README/gitignore -
we already have them), copy the URL it gives you, then:
```
git remote add origin YOUR_REPO_URL_HERE
git branch -M main
git push -u origin main
```

### 9. Deploy it (Vercel)
Go to [vercel.com](https://vercel.com) -> sign up with GitHub -> **Add New
Project** -> pick this repo -> it auto-detects Vite, no config needed. Before
clicking Deploy, expand **Environment Variables** and add the same two keys
from step 6 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Then Deploy.

From here on, every `git push` to `main` auto-deploys. That's the "ship
multiple times a day" workflow - this is the point where it gets easy.

---

## Project structure, briefly

```
src/
  lib/
    supabase.js       - Supabase client
    useStockList.js   - shared data logic for both Holdings & Watchlist
  contexts/
    AuthContext.jsx   - session state, used everywhere via useAuth()
  components/
    StockTable.jsx    - the ONE shared table (Holdings and Watchlist both use this)
    stockDisplay.js   - pure helper functions (signal, P&L, formatting)
    AddStockBox.jsx   - shared "type a ticker, add it" input
    Layout.jsx        - header + nav
  pages/
    Login.jsx, Holdings.jsx, Watchlist.jsx
supabase/
  schema.sql          - run this once in the Supabase SQL editor
  functions/
    stock-data/
      index.ts        - deploy via Dashboard -> Edge Functions (step 4b)
```
