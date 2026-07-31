import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../contexts/AuthContext'

// Turns a raw table row (snake_case, from Postgres) into the camelCase shape
// the display components expect, and merges in live price + ratio data.
function toDisplayShape(row, livePrice, liveRatio) {
  return {
    id: row.id,
    ticker: row.ticker,
    name: row.name,
    yfSymbol: row.yf_symbol,
    sector: row.sector,
    layer: row.layer,
    scanStatus: row.scan_status,
    catalyst: row.catalyst,
    buyPrice: row.buy_price,
    qty: row.qty,
    pe: liveRatio?.trailingPE != null ? liveRatio.trailingPE.toFixed(1) : null,
    // Genuinely ROE (Return on Equity), not ROCE — see the note in the Edge
    // Function. Labelled as ROE in the UI to match what this actually is.
    roe: liveRatio?.roePct != null ? liveRatio.roePct.toFixed(1) : null,
    priceToBook: liveRatio?.priceToBook != null ? liveRatio.priceToBook.toFixed(2) : null,
    debtToEquity: liveRatio?.debtToEquity != null ? liveRatio.debtToEquity.toFixed(2) : null,
    divYield: liveRatio?.dividendYieldPct != null ? liveRatio.dividendYieldPct.toFixed(2) : null,
    low52: livePrice?.low52 ?? 0,
    high52: livePrice?.high52 ?? 0,
    cmp: livePrice?.price ?? 0,
    changePct: livePrice?.changePct ?? 0,
    loaded: !!livePrice,
  }
}

/**
 * table: 'holdings' | 'watchlist' — same hook powers both pages.
 * Ticker validation and live prices both go through the `stock-data` Edge
 * Function (see supabase/functions/stock-data/index.ts), which proxies
 * Yahoo Finance server-side.
 */
export function useStockList(table) {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    const yfSymbols = data.map((r) => r.yf_symbol)
    const [livePrices, liveRatios] = await Promise.all([
      fetchLivePrices(yfSymbols),
      fetchRatios(yfSymbols),
    ])
    setRows(data.map((r) => toDisplayShape(r, livePrices[r.yf_symbol], liveRatios[r.yf_symbol])))
    setError(null)
    setLoading(false)
  }, [user, table])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addTicker = useCallback(
    async (rawInput) => {
      const resolved = await resolveTicker(rawInput)
      if (!resolved) {
        throw new Error(`Couldn't find a stock matching "${rawInput}" — check the ticker or company name.`)
      }
      const { error: insertError } = await supabase.from(table).insert({
        user_id: user.id,
        ticker: resolved.ticker,
        name: resolved.name,
        yf_symbol: resolved.yfSymbol,
      })
      // Postgres unique(user_id, ticker) means a duplicate insert fails here
      // with a 23505 error instead of silently creating a second copy —
      // exactly the bug class from the old HTML build, now impossible.
      if (insertError && insertError.code === '23505') {
        throw new Error(`${resolved.ticker} is already in your ${table === 'holdings' ? 'Holdings' : 'Watchlist'}.`)
      }
      if (insertError) throw new Error(insertError.message)
      await refresh()
    },
    [table, user, refresh]
  )

  const removeRow = useCallback(
    async (id) => {
      const { error: deleteError } = await supabase.from(table).delete().eq('id', id)
      if (deleteError) throw new Error(deleteError.message)
      await refresh()
    },
    [table, refresh]
  )

  const updateField = useCallback(
    async (id, field, value) => {
      const { error: updateError } = await supabase
        .from(table)
        .update({ [field]: parseFloat(value) || 0 })
        .eq('id', id)
      if (updateError) throw new Error(updateError.message)
      await refresh()
    },
    [table, refresh]
  )

  return { rows, loading, error, addTicker, removeRow, updateField, refresh }
}

// --- Real ticker resolution, via the stock-data Edge Function ---------
// Calls Yahoo Finance's search (server-side, since browsers can't reach it
// directly) and returns null if nothing real matches — this is what makes
// garbage input like "HELLO" get rejected instead of silently accepted.
// Exported so other hooks (e.g. usePriceAlerts) can reuse it instead of
// duplicating the same logic a second time.
export async function resolveTicker(rawInput) {
  const input = rawInput.trim()
  if (!input) return null

  const { data, error } = await supabase.functions.invoke('stock-data', {
    body: { mode: 'search', q: input },
  })

  if (error || !data?.success || !data.results?.length) return null

  // Prefer an NSE listing if the search returned multiple exchanges for
  // the same company (common for large caps also listed elsewhere).
  const pick = data.results.find((r) => r.symbol.endsWith('.NS')) || data.results[0]
  return {
    ticker: pick.symbol.replace(/\.(NS|BO)$/i, ''),
    name: pick.name,
    yfSymbol: pick.symbol,
  }
}

// --- Live prices, via the same Edge Function ---------------------------
// Exported for reuse by usePriceAlerts.
export async function fetchLivePrices(yfSymbols) {
  if (!yfSymbols.length) return {}
  const { data, error } = await supabase.functions.invoke('stock-data', {
    body: { mode: 'quote', symbols: yfSymbols },
  })
  if (error || !data?.success) return {}
  return data.quotes ?? {}
}

// --- Live P/E and ROE, via the same Edge Function -----------------------
async function fetchRatios(yfSymbols) {
  if (!yfSymbols.length) return {}
  const { data, error } = await supabase.functions.invoke('stock-data', {
    body: { mode: 'ratios', symbols: yfSymbols },
  })
  if (error || !data?.success) return {}
  return data.ratios ?? {}
}
