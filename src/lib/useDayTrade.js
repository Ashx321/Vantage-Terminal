import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../contexts/AuthContext'
import { resolveTicker, fetchLivePrices } from './useStockList'

const DAILY_LOSS_LIMIT = 4000 // 2% of the ₹2,00,000 starting balance

export function useDayTrade() {
  const { user } = useAuth()
  const [cash, setCash] = useState(null)
  const [realizedPlToday, setRealizedPlToday] = useState(0)
  const [positions, setPositions] = useState([])
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const [{ data: walletRow }, { data: posRows }, { data: tradeRows }] = await Promise.all([
      supabase.from('day_wallet').select('cash, realized_pl_today, trading_day').maybeSingle(),
      supabase.from('day_positions').select('*').order('created_at', { ascending: true }),
      supabase.from('day_trades').select('*').order('created_at', { ascending: false }).limit(20),
    ])

    const today = new Date().toISOString().split('T')[0]
    // Mirrors the server-side reset logic for DISPLAY purposes only — the
    // actual reset and enforcement always happens in the database function,
    // this just avoids showing yesterday's stale loss total for a moment
    // before the next trade triggers the real reset server-side.
    const isNewDay = walletRow && walletRow.trading_day < today
    setCash(walletRow?.cash ?? 200000)
    setRealizedPlToday(isNewDay ? 0 : walletRow?.realized_pl_today ?? 0)

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

      const { error: rpcError } = await supabase.rpc('buy_day_stock', {
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

      const { error: rpcError } = await supabase.rpc('sell_day_stock', {
        p_ticker: position.ticker,
        p_price: position.cmp,
        p_qty: q,
      })
      if (rpcError) throw new Error(rpcError.message)
      await refresh()
    },
    [refresh]
  )

  return {
    cash,
    realizedPlToday,
    lossLimitHit: realizedPlToday <= -DAILY_LOSS_LIMIT,
    dailyLossLimit: DAILY_LOSS_LIMIT,
    positions,
    trades,
    loading,
    buy,
    sell,
  }
}
