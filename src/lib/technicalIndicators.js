// Pure math only — no DOM, no React, no network. Takes an array of daily
// closing prices (oldest first) and returns indicator values. Kept
// separate from any component so it's directly testable in isolation.

export function sma(closes, period) {
  if (closes.length < period) return null
  const slice = closes.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

// Exponential moving average series (returns the full series, not just the
// latest value) — MACD needs the whole EMA series, not one number.
function emaSeries(closes, period) {
  const k = 2 / (period + 1)
  const out = []
  let prev = closes.slice(0, period).reduce((a, b) => a + b, 0) / period // seed with SMA
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      out.push(null)
    } else if (i === period - 1) {
      out.push(prev)
    } else {
      prev = closes[i] * k + prev * (1 - k)
      out.push(prev)
    }
  }
  return out
}

export function ema(closes, period) {
  const series = emaSeries(closes, period)
  return series[series.length - 1] ?? null
}

// Standard 14-period RSI using Wilder's smoothing.
export function rsi(closes, period = 14) {
  if (closes.length < period + 1) return null
  let gains = 0
  let losses = 0
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1]
    if (change >= 0) gains += change
    else losses -= change
  }
  let avgGain = gains / period
  let avgLoss = losses / period

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1]
    const gain = change >= 0 ? change : 0
    const loss = change < 0 ? -change : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

// MACD: 12-EMA minus 26-EMA, with a 9-EMA signal line over that difference.
export function macd(closes) {
  if (closes.length < 26) return null
  const ema12 = emaSeries(closes, 12)
  const ema26 = emaSeries(closes, 26)
  const macdLine = closes.map((_, i) =>
    ema12[i] != null && ema26[i] != null ? ema12[i] - ema26[i] : null
  )
  const validMacd = macdLine.filter((v) => v != null)
  if (validMacd.length < 9) return null
  const signalSeries = emaSeries(validMacd, 9)
  const signal = signalSeries[signalSeries.length - 1]
  const macdValue = validMacd[validMacd.length - 1]
  return { macd: macdValue, signal, histogram: macdValue - signal }
}

// RSI is a timing/caution signal, not a trend-direction signal — a stock in
// a strong uptrend can sit above RSI 70 for a long time without reversing,
// so this returns a zone label rather than feeding destructively into the
// trend verdict below (an earlier version did that and produced "Bearish"
// for a textbook steady uptrend, which is wrong).
export function rsiZone(value) {
  if (value == null) return null
  if (value >= 70) return { label: 'Overbought', color: 'text-amber' }
  if (value <= 30) return { label: 'Oversold', color: 'text-amber' }
  return { label: 'Neutral', color: 'text-muted' }
}

// Trend verdict: driven by price vs moving averages and MACD direction only.
// Small epsilon on the MACD histogram so floating-point noise around zero
// (e.g. -1e-15 in a perfectly linear series) doesn't get read as a real
// bearish signal — only a histogram meaningfully away from zero counts.
export function technicalVerdict(closes) {
  const sma20 = sma(closes, 20)
  if (sma20 == null) return { verdict: 'Not enough data', color: 'text-muted' }
  const sma50 = sma(closes, 50)
  const m = macd(closes)
  const cmp = closes[closes.length - 1]
  const epsilon = cmp * 0.0005 // 0.05% of price — anything smaller is noise, not signal

  let score = 0
  if (cmp > sma20 + epsilon) score += 1
  else if (cmp < sma20 - epsilon) score -= 1
  if (sma50 != null) {
    if (cmp > sma50 + epsilon) score += 1
    else if (cmp < sma50 - epsilon) score -= 1
  }
  if (m) {
    if (m.histogram > epsilon) score += 1
    else if (m.histogram < -epsilon) score -= 1
  }

  if (score >= 2) return { verdict: 'Bullish', color: 'text-green' }
  if (score <= -2) return { verdict: 'Bearish', color: 'text-red' }
  return { verdict: 'Neutral', color: 'text-amber' }
}
