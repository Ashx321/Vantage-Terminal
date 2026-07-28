// Supabase Edge Function: stock-data
// Two responsibilities, both requiring a server-side call (browsers can't
// reach Yahoo Finance directly — same reason the original HTML app needed
// a Google Apps Script proxy):
//
//   { mode: "search", q: "reliance" }        -> resolve free-text/ticker
//     input to a REAL symbol + company name, or an empty list if nothing
//     matches. This is what makes "HELLO" and "ASHISH" get rejected instead
//     of silently accepted as fake stocks.
//   { mode: "quote", symbols: ["A.NS","B.NS"] } -> live price/change/
//     52-week range for already-resolved symbols.
//
// Called from the frontend via supabase.functions.invoke('stock-data', {...})
// which handles the auth header automatically — that's why this reads a
// POST body instead of URL query params.
//
// Deploy: Supabase Dashboard -> Edge Functions -> Deploy a new function ->
// Via Editor -> name it "stock-data" -> paste this whole file -> Deploy.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Browsers send a CORS preflight OPTIONS request before the real one —
  // must answer it or every call from the frontend will be blocked.
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode ?? "search";

    if (mode === "search") {
      const results = await searchYahoo(body.q ?? "");
      return json({ success: true, results });
    }

    if (mode === "quote") {
      const symbols: string[] = Array.isArray(body.symbols) ? body.symbols : [];
      const quotes = await fetchQuotes(symbols);
      return json({ success: true, quotes });
    }

    return json({ success: false, error: "Unknown mode. Use mode: 'search' or 'quote'." }, 400);
  } catch (err) {
    return json({ success: false, error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function searchYahoo(query: string) {
  if (!query.trim()) return [];
  const resp = await fetch(
    `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`,
    { headers: { "User-Agent": "Mozilla/5.0" } }
  );
  if (!resp.ok) return [];
  const data = await resp.json();
  const quotes = data?.quotes ?? [];
  return quotes
    .filter((q: any) => q.symbol && (q.quoteType === "EQUITY" || q.quoteType === "ETF"))
    .map((q: any) => ({
      symbol: q.symbol,
      name: q.shortname || q.longname || q.symbol,
      exchange: q.exchDisp || "",
    }));
}

async function fetchQuotes(symbols: string[]) {
  const result: Record<string, any> = {};
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        const resp = await fetch(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=1d`,
          { headers: { "User-Agent": "Mozilla/5.0" } }
        );
        if (!resp.ok) return;
        const data = await resp.json();
        const meta = data?.chart?.result?.[0]?.meta;
        if (!meta) return;
        const price = meta.regularMarketPrice ?? 0;
        const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? 0;
        result[sym] = {
          price,
          prevClose,
          changePct: prevClose ? ((price - prevClose) / prevClose) * 100 : 0,
          low52: meta.fiftyTwoWeekLow ?? 0,
          high52: meta.fiftyTwoWeekHigh ?? 0,
        };
      } catch {
        // skip this symbol, keep the rest
      }
    })
  );
  return result;
}
