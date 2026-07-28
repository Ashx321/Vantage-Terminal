import { useStockList } from '../lib/useStockList'
import StockTable from '../components/StockTable'
import AddStockBox from '../components/AddStockBox'

export default function Holdings() {
  const { rows, loading, error, addTicker, removeRow, updateField } = useStockList('holdings')

  const counts = {
    strong: rows.filter((s) => s.scanStatus === 'STRENGTHENING').length,
    intact: rows.filter((s) => s.scanStatus === 'INTACT').length,
    weak: rows.filter((s) => s.scanStatus === 'WEAKENING').length,
    total: rows.length,
  }

  return (
    <div>
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
