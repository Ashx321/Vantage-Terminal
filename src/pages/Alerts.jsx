import { useStockList } from '../lib/useStockList'
import { getSignal, formatChange, getChangeColor } from '../components/stockDisplay'

export default function Alerts() {
  const holdings = useStockList('holdings')
  const watchlist = useStockList('watchlist')

  const loading = holdings.loading || watchlist.loading

  const triggered = [
    ...holdings.rows.map((s) => ({ ...s, source: 'Holdings' })),
    ...watchlist.rows.map((s) => ({ ...s, source: 'Watchlist' })),
  ]
    .map((s) => ({ stock: s, signal: getSignal(s) }))
    .filter((x) => x.signal !== null)
    // Biggest movers first — most useful thing to see at the top of a feed.
    .sort((a, b) => Math.abs(b.stock.changePct) - Math.abs(a.stock.changePct))

  const counts = triggered.reduce((acc, { signal }) => {
    acc[signal.label] = (acc[signal.label] || 0) + 1
    return acc
  }, {})

  return (
    <div>
      <div className="flex gap-4 justify-center py-2.5 mb-4 text-[13px] font-semibold flex-wrap">
        <span className="text-muted">
          {triggered.length === 0 ? 'No alerts right now' : `${triggered.length} triggered`}
        </span>
        {Object.entries(counts).map(([label, n]) => (
          <span key={label} className="text-muted font-normal text-[11px]">
            {label}: {n}
          </span>
        ))}
      </div>

      <div className="text-[11px] text-muted text-center mb-5">
        Pulled live from your Holdings and Watchlist — a stock shows up here when it's near its
        52-week high/low, or moved 5%+ today. Nothing to configure; it's computed from prices you're
        already tracking.
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted text-sm">Loading…</div>
      ) : triggered.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm border border-border rounded-xl bg-card">
          Nothing has crossed a threshold yet. Check back after the next price refresh.
        </div>
      ) : (
        <div className="space-y-3">
          {triggered.map(({ stock, signal }) => (
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
    </div>
  )
}
