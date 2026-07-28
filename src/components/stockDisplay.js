// Pure functions only — no DOM, no React. Easy to unit test, and there is
// exactly ONE place that decides "what does Buy Zone mean" or "what color is
// a gain," instead of the two-copies-that-can-drift problem the HTML build
// had between renderTable() and renderWatchlistTable().

export function getSignal(stock) {
  if (!stock.loaded || !stock.cmp) return null
  const { cmp, low52, high52, changePct } = stock
  const pctFromLow = low52 > 0 ? ((cmp - low52) / low52) * 100 : 999
  const pctFromHigh = high52 > 0 ? ((high52 - cmp) / high52) * 100 : 999

  if (pctFromLow <= 10) return { label: 'Buy Zone', emoji: '\u{1F3AF}', color: 'text-green' }
  if (pctFromHigh <= 5) return { label: 'Breakout', emoji: '\u{1F680}', color: 'text-accent-bright' }
  if (changePct <= -5) return { label: 'Big Drop', emoji: '\u26A0\uFE0F', color: 'text-amber' }
  if (changePct >= 5) return { label: 'Surge', emoji: '\u{1F4C8}', color: 'text-green' }
  return null
}

export function getChangeColor(changePct) {
  return changePct >= 0 ? 'text-green' : 'text-red'
}

export function formatChange(changePct) {
  const sign = changePct >= 0 ? '+' : ''
  return `${sign}${changePct.toFixed(2)}%`
}

export function formatRupees(n) {
  return `\u20B9${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function calcPnL(stock) {
  const { buyPrice, qty, cmp, loaded } = stock
  if (!buyPrice || !loaded || !cmp) return null
  const abs = (cmp - buyPrice) * (qty || 0)
  const pct = ((cmp - buyPrice) / buyPrice) * 100
  return { abs, pct, positive: abs >= 0 }
}
