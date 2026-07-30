import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useAuth } from '../contexts/AuthContext'
import { resolveTicker, fetchLivePrices } from './useStockList'

/**
 * Custom "tell me when X hits ₹Y" alerts — separate from the computed
 * signals (Buy Zone / Breakout / etc.) which come from useStockList data.
 * A price_alerts row is "triggered" once the live price crosses the target
 * in the chosen direction; triggered alerts are what the Alerts page shows.
 */
export function usePriceAlerts() {
  const { user } = useAuth()
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('price_alerts')
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    const yfSymbols = [...new Set(data.map((r) => r.yf_symbol))]
    const livePrices = await fetchLivePrices(yfSymbols)

    setAlerts(
      data.map((r) => {
        const live = livePrices[r.yf_symbol]
        const cmp = live?.price ?? null
        const triggered =
          cmp !== null &&
          (r.direction === 'above' ? cmp >= r.target_price : cmp <= r.target_price)
        return {
          id: r.id,
          ticker: r.ticker,
          name: r.name,
          targetPrice: r.target_price,
          direction: r.direction,
          cmp,
          triggered,
        }
      })
    )
    setError(null)
    setLoading(false)
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addAlert = useCallback(
    async (rawTicker, targetPrice, direction) => {
      const resolved = await resolveTicker(rawTicker)
      if (!resolved) {
        throw new Error(`Couldn't find a stock matching "${rawTicker}" — check the ticker or company name.`)
      }
      const price = parseFloat(targetPrice)
      if (!price || price <= 0) {
        throw new Error('Enter a valid target price above 0.')
      }
      const { error: insertError } = await supabase.from('price_alerts').insert({
        user_id: user.id,
        ticker: resolved.ticker,
        name: resolved.name,
        yf_symbol: resolved.yfSymbol,
        target_price: price,
        direction,
      })
      if (insertError && insertError.code === '23505') {
        throw new Error(`You already have this exact alert set on ${resolved.ticker}.`)
      }
      if (insertError) throw new Error(insertError.message)
      await refresh()
    },
    [user, refresh]
  )

  const removeAlert = useCallback(
    async (id) => {
      const { error: deleteError } = await supabase.from('price_alerts').delete().eq('id', id)
      if (deleteError) throw new Error(deleteError.message)
      await refresh()
    },
    [refresh]
  )

  return { alerts, loading, error, addAlert, removeAlert }
}
