import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { resolveTicker } from '../lib/useStockList'
import { sma, rsi, macd, rsiZone, technicalVerdict } from '../lib/technicalIndicators'
import { formatRupees } from '../components/stockDisplay'

async function fetchHistory(yfSymbol) {
  const { data, error } = await supabase.functions.invoke('stock-data', {
    body: { mode: 'history', symbol: yfSymbol, range: '6mo' },
  })
  if (error || !data?.success) return []
  return data.closes ?? []
}

export default function Technical() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  async function handleAnalyze() {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const resolved = await resolveTicker(query.trim())
      if (!resolved) throw new Error(`Couldn't find a stock matching "${query}".`)
      const closes = await fetchHistory(resolved.yfSymbol)
      if (closes.length < 20) {
        throw new Error(`Not enough price history for ${resolved.ticker} to compute indicators yet.`)
      }
      setResult({
        name: resolved.name,
        ticker: resolved.ticker,
        cmp: closes[closes.length - 1],
        rsiValue: rsi(closes),
        sma20: sma(closes, 20),
        sma50: sma(closes, 50),
        sma200: sma(closes, 200),
        macdResult: macd(closes),
        verdict: technicalVerdict(closes),
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="text-[11px] uppercase tracking-wider text-muted mb-3">Technical Analysis</div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Ticker or company name (e.g. RELIANCE)"
            className="flex-1 min-w-[220px] bg-card2 border border-border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-gradient-to-r from-accent-bright to-accent text-[#171307] font-bold rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
        {error && <div className="mt-2 text-xs text-red">{error}</div>}
      </div>

      {result && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
            <div>
              <div className="text-lg font-semibold">{result.name}</div>
              <div className="text-xs text-muted">{result.ticker} &middot; {formatRupees(result.cmp)}</div>
            </div>
            <div className={`text-sm font-bold px-3 py-1.5 rounded-lg border ${result.verdict.color}`} style={{ borderColor: 'currentColor' }}>
              {result.verdict.verdict}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card2 rounded-lg p-3">
              <div className="text-[10px] uppercase text-muted mb-1">RSI (14)</div>
              <div className="font-num text-lg font-semibold">{result.rsiValue?.toFixed(1) ?? '--'}</div>
              {rsiZone(result.rsiValue) && (
                <div className={`text-[10.5px] ${rsiZone(result.rsiValue).color}`}>{rsiZone(result.rsiValue).label}</div>
              )}
            </div>
            <div className="bg-card2 rounded-lg p-3">
              <div className="text-[10px] uppercase text-muted mb-1">SMA 20</div>
              <div className="font-num text-lg font-semibold">{result.sma20 ? formatRupees(result.sma20) : '--'}</div>
            </div>
            <div className="bg-card2 rounded-lg p-3">
              <div className="text-[10px] uppercase text-muted mb-1">SMA 50</div>
              <div className="font-num text-lg font-semibold">{result.sma50 ? formatRupees(result.sma50) : '--'}</div>
            </div>
            <div className="bg-card2 rounded-lg p-3">
              <div className="text-[10px] uppercase text-muted mb-1">SMA 200</div>
              <div className="font-num text-lg font-semibold">{result.sma200 ? formatRupees(result.sma200) : 'Need 200d'}</div>
            </div>
          </div>

          {result.macdResult && (
            <div className="mt-3 bg-card2 rounded-lg p-3 text-xs font-num flex gap-5 flex-wrap">
              <span>MACD: <b>{result.macdResult.macd.toFixed(2)}</b></span>
              <span>Signal: <b>{result.macdResult.signal.toFixed(2)}</b></span>
              <span className={result.macdResult.histogram > 0 ? 'text-green' : 'text-red'}>
                Histogram: <b>{result.macdResult.histogram.toFixed(2)}</b>
              </span>
            </div>
          )}

          <div className="text-[10.5px] text-muted mt-4">
            Verdict is a rule-based read of trend (price vs. moving averages, MACD direction) — not a
            prediction, not machine learning. RSI is shown separately since an "overbought" stock can
            stay overbought for a long time in a strong trend.
          </div>
        </div>
      )}
    </div>
  )
}
