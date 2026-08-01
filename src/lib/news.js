// News headlines via Google News RSS, parsed client-side through rss2json
// (a free public conversion service — browsers can't parse RSS/XML from a
// cross-origin request directly, and this needs no backend at all, unlike
// prices/ratios which needed the Edge Function to dodge Yahoo's blocking).
// Same approach the original HTML app used for its News Feed / News Intel.

export async function fetchNews(query, limit = 12) {
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`

  try {
    const resp = await fetch(apiUrl)
    if (!resp.ok) return []
    const data = await resp.json()
    if (data.status !== 'ok' || !Array.isArray(data.items)) return []
    return data.items.slice(0, limit).map((item) => ({
      title: item.title,
      link: item.link,
      // Google News RSS titles arrive as "Headline - Source" — split that
      // out so the source can be shown as its own small tag instead of
      // being stuck on the end of every headline.
      source: item.title.includes(' - ') ? item.title.split(' - ').pop() : '',
      headline: item.title.includes(' - ') ? item.title.split(' - ').slice(0, -1).join(' - ') : item.title,
      pubDate: item.pubDate,
    }))
  } catch {
    return []
  }
}
