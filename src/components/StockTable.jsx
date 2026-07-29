import { getSignal, getChangeColor, formatChange, formatRupees, calcPnL } from './stockDisplay'

const layerBadgeClass = {
  Immediate: 'bg-red-500/15 text-red-300 border-red-500/40',
  '1-Month': 'bg-amber/15 text-amber border-amber/40',
}
const defaultLayerClass = 'bg-green/15 text-green border-green/40'

const scanBadgeClass = {
  STRENGTHENING: 'bg-green/15 text-green border-green/40',
  WEAKENING: 'bg-amber/15 text-amber border-amber/40',
  INTACT: 'bg-accent/15 text-accent-bright border-accent/40',
}

/**
 * showPnL: true for Holdings (buy price / qty / P&L columns + editable inputs),
 * false for Watchlist (research-only columns, no position data).
 */
export default function StockTable({ rows, showPnL, onRemove, onFieldChange, emptyLabel }) {
  if (!rows.length) {
    return (
      <div className="text-center py-16 text-muted text-sm border border-border rounded-xl bg-card">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="overflow-visible rounded-xl border border-border shadow-sm">
      <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
        <thead>
          <tr className="bg-card2 text-left text-[10.5px] uppercase tracking-wider text-muted">
            <th className="p-3" style={{ width: showPnL ? '28%' : '38%' }}>Company</th>
            <th className="p-3" style={{ width: '10%' }}>CMP</th>
            <th className="p-3" style={{ width: '9%' }}>Change</th>
            {showPnL && <th className="p-3" style={{ width: '12%' }}>Buy / Qty</th>}
            {showPnL && <th className="p-3" style={{ width: '11%' }}>P&amp;L</th>}
            <th className="p-3" style={{ width: '10%' }}>P/E &middot; ROE</th>
            <th className="p-3" style={{ width: '13%' }}>52W Range</th>
            <th className="p-3" style={{ width: '10%' }}>Signal</th>
            <th className="p-3" style={{ width: '7%' }}>Manage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => {
            const signal = getSignal(s)
            const pnl = showPnL ? calcPnL(s) : null
            return (
              <tr key={s.id} className="border-t border-border-soft hover:bg-card2 align-top">
                <td className="p-3 whitespace-normal">
                  <div className="font-medium">{s.name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] text-muted">
                    <span>{s.ticker} &middot; {s.sector}</span>
                    <span className={`px-1.5 rounded border ${layerBadgeClass[s.layer] || defaultLayerClass}`}>
                      {s.layer}
                    </span>
                    {s.scanStatus && (
                      <span className={`px-1.5 rounded border ${scanBadgeClass[s.scanStatus]}`}>
                        {s.scanStatus}
                      </span>
                    )}
                  </div>
                  {s.catalyst && (
                    <div className="mt-1 text-[10px] font-semibold text-amber">{s.catalyst}</div>
                  )}
                </td>
                <td className="p-3 font-num font-semibold">
                  {s.loaded ? formatRupees(s.cmp) : <span className="text-muted">&hellip;</span>}
                </td>
                <td className={`p-3 font-num font-medium ${getChangeColor(s.changePct)}`}>
                  {s.loaded ? formatChange(s.changePct) : '--'}
                </td>
                {showPnL && (
                  <td className="p-3">
                    <input
                      type="number"
                      defaultValue={s.buyPrice || ''}
                      placeholder="Buy ₹"
                      onBlur={(e) => onFieldChange(s.id, 'buy_price', e.target.value)}
                      className="w-full mb-1 bg-card2 border border-border rounded px-1.5 py-1 text-[11px] font-num"
                    />
                    <input
                      type="number"
                      defaultValue={s.qty || ''}
                      placeholder="Qty"
                      onBlur={(e) => onFieldChange(s.id, 'qty', e.target.value)}
                      className="w-full bg-card2 border border-border rounded px-1.5 py-1 text-[11px] font-num"
                    />
                  </td>
                )}
                {showPnL && (
                  <td className="p-3 font-num">
                    {pnl ? (
                      <>
                        <div className={pnl.positive ? 'text-green font-semibold' : 'text-red font-semibold'}>
                          {pnl.positive ? '+' : ''}{formatRupees(Math.abs(pnl.abs))}
                        </div>
                        <div className={`text-[10.5px] ${pnl.positive ? 'text-green' : 'text-red'}`}>
                          {pnl.positive ? '+' : ''}{pnl.pct.toFixed(1)}%
                        </div>
                      </>
                    ) : (
                      <span className="text-muted text-[11px]">--</span>
                    )}
                  </td>
                )}
                <td className="p-3 text-[11px] font-num">
                  <div>P/E {s.pe ?? '--'}</div>
                  <div className={s.roe >= 20 ? 'text-green' : s.roe >= 10 ? 'text-amber' : s.roe != null ? 'text-red' : 'text-muted'}>
                    ROE {s.roe != null ? `${s.roe}%` : '--'}
                  </div>
                </td>
                <td className="p-3 text-[10.5px] text-muted font-num">
                  {formatRupees(s.low52)}&ndash;{formatRupees(s.high52)}
                </td>
                <td className="p-3 text-[11px]">
                  {signal && <span className={signal.color}>{signal.emoji} {signal.label}</span>}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => {
                      if (window.confirm(`Remove ${s.name} (${s.ticker})? This can't be undone.`)) {
                        onRemove(s.id)
                      }
                    }}
                    title="Remove"
                    className="text-xs border border-border rounded px-2 py-1 hover:bg-card2"
                  >
                    &#10005;
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
