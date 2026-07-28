-- ============================================================
-- Vantage Terminal — Phase 1 schema (Auth + Holdings + Watchlist)
-- ============================================================
-- HOW TO RUN THIS:
-- Supabase dashboard -> SQL Editor -> New query -> paste this
-- whole file -> Run. Takes a few seconds. Safe to re-run: every
-- statement below is idempotent (IF NOT EXISTS / OR REPLACE).
--
-- You do NOT need to create a "users" table yourself — Supabase
-- Auth already manages one at auth.users. We just reference it.
-- ============================================================

-- ---------- HOLDINGS ----------
create table if not exists public.holdings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ticker        text not null,
  name          text not null,
  yf_symbol     text not null,
  sector        text default 'Unknown',
  layer         text not null default 'Holdings'
                  check (layer in ('Holdings','Immediate','1-Month','Long-Term')),
  buy_price     numeric(12,2) default 0,
  qty           numeric(12,4) default 0,
  -- Honesty note carried over from the HTML version: scan_status is not
  -- auto-computed by anything yet. It's a manual/placeholder field until
  -- a real momentum-based job is built. Default reflects that truthfully.
  scan_status   text default 'INTACT'
                  check (scan_status in ('INTACT','STRENGTHENING','WEAKENING')),
  catalyst      text default '',
  catalyst_date date,
  created_at    timestamptz not null default now(),

  -- This UNIQUE constraint is doing real work: it's the database-level fix
  -- for the exact duplicate-entry bug class we hit repeatedly in the HTML
  -- version (the watchlist dedup collision). Now it's structurally
  -- impossible to insert the same ticker twice for the same user, instead
  -- of relying on remembering to check for it in every code path.
  unique (user_id, ticker)
);

-- ---------- WATCHLIST ----------
create table if not exists public.watchlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  name        text not null,
  yf_symbol   text not null,
  sector      text default 'Unknown',
  category    text default 'User Added',
  score       numeric(5,2) default 60,
  notes       text default '',
  created_at  timestamptz not null default now(),

  unique (user_id, ticker)
);

-- ---------- Helpful indexes ----------
create index if not exists holdings_user_id_idx  on public.holdings  (user_id);
create index if not exists watchlist_user_id_idx on public.watchlist (user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Without this, anyone with your anon key (which is public, by design)
-- could read or write every user's data. RLS is what makes that key safe
-- to ship in browser code — Postgres itself enforces "you only ever see
-- your own rows," no matter what the client sends.
-- ============================================================
alter table public.holdings  enable row level security;
alter table public.watchlist enable row level security;

drop policy if exists "select own holdings" on public.holdings;
create policy "select own holdings" on public.holdings
  for select using (auth.uid() = user_id);

drop policy if exists "insert own holdings" on public.holdings;
create policy "insert own holdings" on public.holdings
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own holdings" on public.holdings;
create policy "update own holdings" on public.holdings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own holdings" on public.holdings;
create policy "delete own holdings" on public.holdings
  for delete using (auth.uid() = user_id);

drop policy if exists "select own watchlist" on public.watchlist;
create policy "select own watchlist" on public.watchlist
  for select using (auth.uid() = user_id);

drop policy if exists "insert own watchlist" on public.watchlist;
create policy "insert own watchlist" on public.watchlist
  for insert with check (auth.uid() = user_id);

drop policy if exists "update own watchlist" on public.watchlist;
create policy "update own watchlist" on public.watchlist
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "delete own watchlist" on public.watchlist;
create policy "delete own watchlist" on public.watchlist
  for delete using (auth.uid() = user_id);
