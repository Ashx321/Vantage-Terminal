import { useStockList } from '../lib/useStockList'
import { formatRupees } from '../components/stockDisplay'

function FundRow({ s, source }) {
  return (
    <tr className="border-t border-border-soft hover:bg-card2">
      <td className="p-3">
        <div className="font-medium text-sm">{s.name}</div>
        <div className="text-[10.5px] text-muted">{s.ticker} &middot; {source}</div>
      </td>
      <td className="p-3 font-num text-sm">{s.loaded ? formatRupees(s.cmp) : '…'}</td>
      <td className="p-3 font-num text-sm">{s.pe ?? '--'}</td>
      <td className="p-3 font-num text-sm">{s.priceToBook ?? '--'}</td>
      <td className="p-3 font-num text-sm">
        <span className={s.roe >= 20 ? 'text-green' : s.roe >= 10 ? 'text-amber' : s.roe != null ? 'text-red' : 'text-muted'}>
          {s.roe != null ? `${s.roe}%` : '--'}
        </span>
      </td>
      <td className="p-3 font-num text-sm">
        <span className={s.debtToEquity != null && s.debtToEquity > 1 ? 'text-amber' : ''}>
          {s.debtToEquity ?? '--'}
        </span>
      </td>
      <td className="p-3 font-num text-sm">{s.divYield != null ? `${s.divYield}%` : '--'}</td>
    </tr>
  )
}

export default function Fundamentals() {
  const holdings = useStockList('holdings')
  const watchlist = useStockList('watchlist')
  const loading = holdings.loading || watchlist.loading
  const rows = [
    ...holdings.rows.map((s) => ({ s, source: 'Holdings' })),
    ...watchlist.rows.map((s) => ({ s, source: 'Watchlist' })),
  ]

  return (
    <div>
      <div className="text-[11px] text-muted text-center mb-4">
        Live P/E, Price-to-Book, ROE, Debt/Equity and Dividend Yield across everything you're
        tracking. Same live data already powering Holdings and Watchlist — just laid out for
        comparison here.
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted text-sm">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-muted text-sm border border-border rounded-xl bg-card">
          Nothing to show yet — add a stock to Holdings or Watchlist first.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card2 text-left text-[10.5px] uppercase tracking-wider text-muted">
                <th className="p-3">Company</th>
                <th className="p-3">CMP</th>
                <th className="p-3">P/E</th>
                <th className="p-3">P/B</th>
                <th className="p-3">ROE</th>
                <th className="p-3">Debt/Equity</th>
                <th className="p-3">Div Yield</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, source }) => (
                <FundRow key={`${source}-${s.id}`} s={s} source={source} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
