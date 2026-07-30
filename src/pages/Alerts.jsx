import { useState } from 'react'
import { useStockList } from '../lib/useStockList'
import { usePriceAlerts } from '../lib/usePriceAlerts'
import { getSignal, formatChange, getChangeColor, formatRupees } from '../components/stockDisplay'

function SetPriceAlertForm({ onAdd }) {
  const [ticker, setTicker] = useState('')
  const [price, setPrice] = useState('')
  const [direction, setDirection] = useState('above')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleAdd() {
    if (!ticker.trim() || !price) return
    setBusy(true)
    setError(null)
    try {
      await onAdd(ticker.trim(), price, direction)
      setTicker('')
      setPrice('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 mb-6">
      <div className="text-[11px] uppercase tracking-wider text-muted mb-3">Set a Price Alert</div>
      <div className="flex gap-2 flex-wrap items-center">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Ticker (e.g. RELIANCE)"
          className="flex-1 min-w-[160px] bg-card2 border border-border rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          className="bg-card2 border border-border rounded-lg px-3 py-2 text-sm"
        >
          <option value="above">goes above</option>
          <option value="below">goes below</option>
        </select>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Target price ₹"
          className="w-36 bg-card2 border border-border rounded-lg px-3 py-2 text-sm font-num"
        />
        <button
          onClick={handleAdd}
          disabled={busy}
          className="bg-gradient-to-r from-accent-bright to-accent text-[#171307] font-bold rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          + Add Alert
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red">{error}</div>}
    </div>
  )
}

export default function Alerts() {
  const holdings = useStockList('holdings')
  const watchlist = useStockList('watchlist')
  const priceAlerts = usePriceAlerts()

  const loading = holdings.loading || watchlist.loading || priceAlerts.loading

  const triggeredSignals = [
    ...holdings.rows.map((s) => ({ ...s, source: 'Holdings' })),
    ...watchlist.rows.map((s) => ({ ...s, source: 'Watchlist' })),
  ]
    .map((s) => ({ stock: s, signal: getSignal(s) }))
    .filter((x) => x.signal !== null)
    .sort((a, b) => Math.abs(b.stock.changePct) - Math.abs(a.stock.changePct))

  const triggeredPriceAlerts = priceAlerts.alerts.filter((a) => a.triggered)
  const pendingPriceAlerts = priceAlerts.alerts.filter((a) => !a.triggered)

  const totalTriggered = triggeredSignals.length + triggeredPriceAlerts.length

  return (
    <div>
      <div className="flex gap-4 justify-center py-2.5 mb-4 text-[13px] font-semibold flex-wrap">
        <span className="text-muted">
          {totalTriggered === 0 ? 'No alerts right now' : `${totalTriggered} triggered`}
        </span>
      </div>

      <SetPriceAlertForm onAdd={priceAlerts.addAlert} />

      {priceAlerts.error && (
        <div className="mb-4 text-sm text-red bg-red/10 border border-red/30 rounded-lg p-3">
          {priceAlerts.error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-muted text-sm">Loading…</div>
      ) : (
        <>
          {triggeredPriceAlerts.length > 0 && (
            <div className="space-y-3 mb-6">
              {triggeredPriceAlerts.map((a) => (
                <div key={a.id} className="bg-card border border-green/40 rounded-xl p-4 flex items-center gap-4">
                  <div className="text-2xl">&#127919;</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      {a.name} <span className="text-muted font-normal">({a.ticker})</span>
                    </div>
                    <div className="text-xs text-green mt-0.5">
                      Hit your target — went {a.direction} {formatRupees(a.targetPrice)}
                    </div>
                  </div>
                  <div className="font-num font-semibold text-sm">{formatRupees(a.cmp)}</div>
                  <button
                    onClick={() => priceAlerts.removeAlert(a.id)}
                    className="text-xs border border-border rounded px-2 py-1 hover:bg-card2"
                  >
                    &#10005;
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingPriceAlerts.length > 0 && (
            <div className="mb-6">
              <div className="text-[11px] uppercase tracking-wider text-muted mb-2">
                Waiting ({pendingPriceAlerts.length})
              </div>
              <div className="space-y-2">
                {pendingPriceAlerts.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 text-sm text-muted px-1">
                    <span className="flex-1">
                      {a.name} ({a.ticker}) — {a.direction} {formatRupees(a.targetPrice)}
                      {a.cmp !== null && <span> &middot; now {formatRupees(a.cmp)}</span>}
                    </span>
                    <button
                      onClick={() => priceAlerts.removeAlert(a.id)}
                      className="text-xs border border-border rounded px-2 py-1 hover:bg-card2"
                    >
                      &#10005;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-[11px] text-muted text-center mb-4">
            Below: computed from your Holdings and Watchlist automatically — near a 52-week high/low,
            or moved 5%+ today. Nothing to configure.
          </div>

          {triggeredSignals.length === 0 ? (
            <div className="text-center py-10 text-muted text-sm border border-border rounded-xl bg-card">
              Nothing has crossed a computed threshold yet.
            </div>
          ) : (
            <div className="space-y-3">
              {triggeredSignals.map(({ stock, signal }) => (
                <div
                  key={`${stock.source}-${stock.id}`}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="text-2xl">{signal.emoji}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">
                      {stock.name} <span className="text-muted font-normal">({stock.ticker})</span>
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {stock.source} &middot; <span className={signal.color}>{signal.label}</span>
                    </div>
                  </div>
                  <div className={`font-num font-semibold text-sm ${getChangeColor(stock.changePct)}`}>
                    {formatChange(stock.changePct)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
