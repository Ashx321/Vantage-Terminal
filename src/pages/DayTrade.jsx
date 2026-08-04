import { useState } from 'react'
import { useDayTrade } from '../lib/useDayTrade'
import { formatRupees } from '../components/stockDisplay'

function BuyForm({ onBuy, disabled }) {
  const [ticker, setTicker] = useState('')
  const [qty, setQty] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [success, setSuccess] = useState(null)

  async function handleBuy() {
    if (!ticker.trim() || !qty) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await onBuy(ticker.trim(), qty)
      setSuccess(`Bought ${qty} ${result.ticker} @ ${formatRupees(result.price)}`)
      setTicker('')
      setQty('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="text-[11px] uppercase tracking-wider text-muted mb-3">Buy</div>
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Ticker (e.g. RELIANCE)"
          disabled={disabled}
          className="flex-1 min-w-[140px] bg-card2 border border-border rounded-lg px-3 py-2 text-sm disabled:opacity-50"
        />
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          placeholder="Qty"
          disabled={disabled}
          className="w-24 bg-card2 border border-border rounded-lg px-3 py-2 text-sm font-num disabled:opacity-50"
        />
        <button
          onClick={handleBuy}
          disabled={busy || disabled}
          className="bg-gradient-to-r from-green to-[#22a366] text-white font-bold rounded-lg px-4 py-2 text-sm disabled:opacity-50"
        >
          Buy at market
        </button>
      </div>
      {error && <div className="mt-2 text-xs text-red">{error}</div>}
      {success && <div className="mt-2 text-xs text-green">{success}</div>}
    </div>
  )
}

function PositionRow({ position, onSell }) {
  const [sellQty, setSellQty] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const value = position.loaded ? position.cmp * position.qty : null
  const cost = position.avgBuyPrice * position.qty
  const pl = value !== null ? value - cost : null
  const plPct = pl !== null ? (pl / cost) * 100 : null

  async function handleSell() {
    if (!sellQty) return
    setBusy(true)
    setError(null)
    try {
      await onSell(position, sellQty)
      setSellQty('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <tr className="border-t border-border-soft">
      <td className="p-3">
        <div className="font-medium text-sm">{position.name}</div>
        <div className="text-[10.5px] text-muted">{position.ticker} &middot; qty {position.qty}</div>
      </td>
      <td className="p-3 font-num text-sm">{formatRupees(position.avgBuyPrice)}</td>
      <td className="p-3 font-num text-sm">{position.loaded ? formatRupees(position.cmp) : '…'}</td>
      <td className="p-3 font-num text-sm">
        {pl !== null ? (
          <span className={pl >= 0 ? 'text-green' : 'text-red'}>
            {pl >= 0 ? '+' : ''}{formatRupees(Math.abs(pl))} ({pl >= 0 ? '+' : ''}{plPct.toFixed(1)}%)
          </span>
        ) : '--'}
      </td>
      <td className="p-3">
        <div className="flex gap-1.5 items-center">
          <input
            type="number"
            value={sellQty}
            onChange={(e) => setSellQty(e.target.value)}
            placeholder="Qty"
            className="w-16 bg-card2 border border-border rounded px-2 py-1 text-xs font-num"
          />
          <button
            onClick={handleSell}
            disabled={busy}
            className="text-xs border border-red/40 text-red rounded px-2 py-1 hover:bg-red/10 disabled:opacity-50"
          >
            Sell
          </button>
        </div>
        {error && <div className="text-[10px] text-red mt-1">{error}</div>}
      </td>
    </tr>
  )
}

export default function DayTrade() {
  const { cash, realizedPlToday, lossLimitHit, dailyLossLimit, positions, trades, loading, buy, sell } = useDayTrade()

  const holdingsValue = positions.reduce((sum, p) => sum + (p.loaded ? p.cmp * p.qty : p.avgBuyPrice * p.qty), 0)
  const netWorth = (cash ?? 0) + holdingsValue

  return (
    <div>
      {lossLimitHit && (
        <div className="bg-red/10 border border-red/40 rounded-xl p-4 mb-4 text-sm text-red">
          <b>Daily loss limit reached</b> — down {formatRupees(Math.abs(realizedPlToday))} today (limit is{' '}
          {formatRupees(dailyLossLimit)}). New buys are paused until tomorrow — you can still sell to close
          any open position.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10.5px] uppercase tracking-wider text-muted mb-1.5">Cash</div>
          <div className="font-num text-xl font-semibold">{cash !== null ? formatRupees(cash) : '…'}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10.5px] uppercase tracking-wider text-muted mb-1.5">Holdings Value</div>
          <div className="font-num text-xl font-semibold">{formatRupees(holdingsValue)}</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10.5px] uppercase tracking-wider text-muted mb-1.5">Net Worth</div>
          <div className="font-num text-xl font-semibold">{formatRupees(netWorth)}</div>
          <div className="text-[10.5px] text-muted">Started at &#8377;2,00,000</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[10.5px] uppercase tracking-wider text-muted mb-1.5">Realized Today</div>
          <div className={`font-num text-xl font-semibold ${realizedPlToday >= 0 ? 'text-green' : 'text-red'}`}>
            {realizedPlToday >= 0 ? '+' : ''}{formatRupees(Math.abs(realizedPlToday))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <BuyForm onBuy={buy} disabled={lossLimitHit} />
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted text-sm">Loading…</div>
      ) : positions.length === 0 ? (
        <div className="text-center py-10 text-muted text-sm border border-border rounded-xl bg-card mb-6">
          No open positions yet — buy something above to get started.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-card2 text-left text-[10.5px] uppercase tracking-wider text-muted">
                <th className="p-3">Position</th>
                <th className="p-3">Avg Buy</th>
                <th className="p-3">CMP</th>
                <th className="p-3">P&amp;L</th>
                <th className="p-3">Sell</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <PositionRow key={p.id} position={p} onSell={sell} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {trades.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wider text-muted mb-2">Recent Trades</div>
          <div className="space-y-1.5">
            {trades.map((t) => (
              <div key={t.id} className="flex justify-between text-xs text-muted px-1">
                <span>
                  <span className={t.side === 'buy' ? 'text-green' : 'text-red'}>
                    {t.side === 'buy' ? 'BUY' : 'SELL'}
                  </span>{' '}
                  {t.qty} {t.ticker} @ {formatRupees(t.price)}
                </span>
                <span>{new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-[10.5px] text-muted text-center mt-6">
        100% virtual — no brokerage connection, no real money, ever. The daily loss limit
        (2% of the starting balance) blocks new buys after a bad day — it never blocks selling.
      </div>
    </div>
  )
}
