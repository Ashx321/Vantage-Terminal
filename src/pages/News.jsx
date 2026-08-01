import { useEffect, useState } from 'react'
import { fetchNews } from '../lib/news'
import { resolveTicker } from '../lib/useStockList'

const MARKET_QUERIES = [
  { label: 'Nifty & Sensex', q: 'Nifty Sensex NSE BSE market' },
  { label: 'RBI & Policy', q: 'RBI monetary policy India' },
  { label: 'Global Markets', q: 'global stock markets Wall Street' },
]

function NewsCard({ item }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-card border border-border rounded-xl p-4 hover:border-accent transition-colors"
    >
      <div className="text-sm font-medium leading-snug mb-2">{item.headline}</div>
      <div className="flex items-center gap-2 text-[10.5px] text-muted">
        {item.source && <span className="px-2 py-0.5 rounded bg-card2">{item.source}</span>}
        {item.pubDate && <span>{new Date(item.pubDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
      </div>
    </a>
  )
}

function NewsGrid({ items, loading, emptyLabel }) {
  if (loading) return <div className="text-center py-10 text-muted text-sm">Loading…</div>
  if (items.length === 0) {
    return (
      <div className="text-center py-10 text-muted text-sm border border-border rounded-xl bg-card">
        {emptyLabel}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((item, i) => (
        <NewsCard key={i} item={item} />
      ))}
    </div>
  )
}

export default function News() {
  const [marketTab, setMarketTab] = useState(MARKET_QUERIES[0].q)
  const [marketNews, setMarketNews] = useState([])
  const [marketLoading, setMarketLoading] = useState(true)

  const [query, setQuery] = useState('')
  const [stockNews, setStockNews] = useState(null)
  const [stockLoading, setStockLoading] = useState(false)
  const [stockLabel, setStockLabel] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    setMarketLoading(true)
    fetchNews(marketTab).then((items) => {
      setMarketNews(items)
      setMarketLoading(false)
    })
  }, [marketTab])

  async function handleSearch() {
    if (!query.trim()) return
    setStockLoading(true)
    setError(null)
    try {
      const resolved = await resolveTicker(query.trim())
      if (!resolved) throw new Error(`Couldn't find a stock matching "${query}".`)
      setStockLabel(resolved.name)
      const items = await fetchNews(`${resolved.name} share price`)
      setStockNews(items)
    } catch (err) {
      setError(err.message)
      setStockNews(null)
    } finally {
      setStockLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="text-[11px] uppercase tracking-wider text-muted mb-3">Company News</div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Ticker or company name (e.g. RELIANCE)"
            className="flex-1 min-w-[220px] bg-card2 border border-border rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={handleSearch}
            disabled={stockLoading}
            className="bg-gradient-to-r from-accent-bright to-accent text-[#171307] font-bold rounded-lg px-4 py-2 text-sm disabled:opacity-50"
          >
            {stockLoading ? 'Searching…' : 'Search'}
          </button>
        </div>
        {error && <div className="mt-2 text-xs text-red">{error}</div>}
      </div>

      {stockNews !== null && (
        <div className="mb-8">
          <div className="text-sm font-semibold mb-3">{stockLabel}</div>
          <NewsGrid items={stockNews} loading={stockLoading} emptyLabel="No recent news found for this company." />
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {MARKET_QUERIES.map((m) => (
          <button
            key={m.q}
            onClick={() => setMarketTab(m.q)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
              marketTab === m.q ? 'bg-accent/15 text-accent-bright border-accent' : 'text-muted border-border hover:text-text'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <NewsGrid items={marketNews} loading={marketLoading} emptyLabel="No headlines available right now." />
    </div>
  )
}
