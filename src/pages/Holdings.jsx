import { useStockList } from '../lib/useStockList'
import StockTable from '../components/StockTable'
import AddStockBox from '../components/AddStockBox'
import { formatRupees } from '../components/stockDisplay'

export default function Holdings() {
  const { rows, loading, error, addTicker, removeRow, updateField } = useStockList('holdings')

  const counts = {
    strong: rows.filter((s) => s.scanStatus === 'STRENGTHENING').length,
    intact: rows.filter((s) => s.scanStatus === 'INTACT').length,
    weak: rows.filter((s) => s.scanStatus === 'WEAKENING').length,
    total: rows.length,
  }

  // Only count a stock toward the portfolio totals if it has a real buy
  // price, a real quantity, AND a live price — otherwise "current value"
  // and "invested" would be computed over different, mismatched sets of
  // stocks and the P&L comparison would be meaningless.
  const tracked = rows.filter((s) => s.buyPrice > 0 && s.qty > 0 && s.loaded)
  const totalInvested = tracked.reduce((sum, s) => sum + s.buyPrice * s.qty, 0)
  const currentValue = tracked.reduce((sum, s) => sum + s.cmp * s.qty, 0)
  const totalPL = currentValue - totalInvested
  const totalPLPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0
  const plPositive = totalPL >= 0
  const untrackedCount = rows.length - tracked.length

  return (
    <div>
      {tracked.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-[10.5px] uppercase tracking-wider text-muted mb-1.5">Total Invested</div>
            <div className="font-num text-xl font-semibold">{formatRupees(totalInvested)}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-[10.5px] uppercase tracking-wider text-muted mb-1.5">Current Value</div>
            <div className="font-num text-xl font-semibold">{formatRupees(currentValue)}</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 border-l-2" style={{ borderLeftColor: plPositive ? 'var(--color-green)' : 'var(--color-red)' }}>
            <div className="text-[10.5px] uppercase tracking-wider text-muted mb-1.5">Overall P&amp;L</div>
            <div className={`font-num text-xl font-semibold ${plPositive ? 'text-green' : 'text-red'}`}>
              {plPositive ? '+' : ''}{formatRupees(Math.abs(totalPL))}
              <span className="text-sm ml-2">({plPositive ? '+' : ''}{totalPLPct.toFixed(1)}%)</span>
            </div>
          </div>
        </div>
      )}
      {untrackedCount > 0 && (
        <div className="text-[11px] text-muted text-center mb-4">
          {untrackedCount} {untrackedCount === 1 ? 'holding is' : 'holdings are'} missing a buy price or
          quantity, so {untrackedCount === 1 ? "it isn't" : "they aren't"} included in the totals above.
        </div>
      )}

      <div className="flex gap-4 justify-center py-2.5 mb-3 text-[13px] font-semibold">
        <span className="text-green">&#8593; STRONG: {counts.strong}</span>
        <span className="text-accent-bright">&#10003; INTACT: {counts.intact}</span>
        <span className="text-amber">&#8595; WEAK: {counts.weak}</span>
        <span className="text-muted">TOTAL: {counts.total}</span>
        <span className="text-muted font-normal text-[11px] ml-2">
          Stocks you own — set a buy price to track profit/loss.
        </span>
      </div>

      <AddStockBox
        placeholder="Type a ticker (e.g. RELIANCE, TCS)…"
        onAdd={(ticker) => addTicker(ticker)}
      />

      {error && <div className="mb-4 text-sm text-red bg-red/10 border border-red/30 rounded-lg p-3">{error}</div>}
      {loading ? (
        <div className="text-center py-16 text-muted text-sm">Loading…</div>
      ) : (
        <StockTable
          rows={rows}
          showPnL
          onRemove={removeRow}
          onFieldChange={updateField}
          emptyLabel="No holdings yet — add your first stock above."
        />
      )}
    </div>
  )
}
