import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../contexts/AuthContext'
import { resolveTicker, fetchLivePrices } from './useStockList'

export function usePaperTrade() {
  const { user } = useAuth()
  const [cash, setCash] = useState(null)
  const [positions, setPositions] = useState([])
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)

    // The wallet row is created lazily by the first buy_paper_stock call —
    // until then, there's genuinely no row yet, so default to the starting
    // balance for display rather than treating "no row" as an error.
    const [{ data: walletRow }, { data: posRows }, { data: tradeRows }] = await Promise.all([
      supabase.from('paper_wallet').select('cash').maybeSingle(),
      supabase.from('paper_positions').select('*').order('created_at', { ascending: true }),
      supabase.from('paper_trades').select('*').order('created_at', { ascending: false }).limit(20),
    ])

    setCash(walletRow?.cash ?? 100000)

    const yfSymbols = (posRows ?? []).map((p) => p.yf_symbol)
    const livePrices = await fetchLivePrices(yfSymbols)

    setPositions(
      (posRows ?? []).map((p) => {
        const live = livePrices[p.yf_symbol]
        const cmp = live?.price ?? null
        return {
          id: p.id,
          ticker: p.ticker,
          name: p.name,
          yfSymbol: p.yf_symbol,
          qty: p.qty,
          avgBuyPrice: p.avg_buy_price,
          cmp,
          loaded: cmp !== null,
        }
      })
    )
    setTrades(tradeRows ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const buy = useCallback(
    async (rawTicker, qty) => {
      const resolved = await resolveTicker(rawTicker)
      if (!resolved) throw new Error(`Couldn't find a stock matching "${rawTicker}".`)
      const q = parseFloat(qty)
      if (!q || q <= 0) throw new Error('Enter a quantity above 0.')

      const livePrice = await fetchLivePrices([resolved.yfSymbol])
      const price = livePrice[resolved.yfSymbol]?.price
      if (!price) throw new Error(`Couldn't get a live price for ${resolved.ticker} right now.`)

      const { error: rpcError } = await supabase.rpc('buy_paper_stock', {
        p_ticker: resolved.ticker,
        p_name: resolved.name,
        p_yf_symbol: resolved.yfSymbol,
        p_qty: q,
        p_price: price,
      })
      if (rpcError) throw new Error(rpcError.message)
      await refresh()
      return { ticker: resolved.ticker, price }
    },
    [refresh]
  )

  const sell = useCallback(
    async (position, qty) => {
      const q = parseFloat(qty)
      if (!q || q <= 0) throw new Error('Enter a quantity above 0.')
      if (!position.loaded) throw new Error(`No live price available for ${position.ticker} right now.`)

      const { error: rpcError } = await supabase.rpc('sell_paper_stock', {
        p_ticker: position.ticker,
        p_price: position.cmp,
        p_qty: q,
      })
      if (rpcError) throw new Error(rpcError.message)
      await refresh()
    },
    [refresh]
  )

  return { cash, positions, trades, loading, error, buy, sell, refresh }
}
