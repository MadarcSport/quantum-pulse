# Learn API Fetching (Using This Project)

This note explains how API fetching works in your Next.js project, with real examples for:

- Volume data
- CMF (Chaikin Money Flow)

## 1. Quick idea: what `fetch` is doing here

In this codebase, `fetch` is mostly used on the server (inside `app/lib/*.ts` and route handlers), not in browser components.

That means:

- API keys or provider logic can stay server-side (good for security and control)
- You can add caching/revalidation with Next.js options
- UI components receive already-prepared data

Example (Yahoo quote request):

```ts
const response = await fetch(
  `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol.toUpperCase()}`,
  { next: { revalidate: 60 } },
);
```

From `app/lib/stock-quote.ts`.

## 2. End-to-end flow in this project

### Step A: Page asks for stock data

In `app/page.tsx`, each stock loads:

- `fetchStockQuote(symbol)`
- `fetchAverageVolume90d(symbol)`
- `fetchCmfMetrics(symbol)`

This is done with `Promise.all(...)` so stocks load concurrently.

### Step B: Lib functions call external providers

In `app/lib/stock-quote.ts`, fetch helpers call:

- Yahoo Finance (primary)
- Nasdaq (fallback)

### Step C: UI renders computed stats

In `app/components/stock-snapshot-section.tsx`, UI calculates and displays:

- `Volume`
- `Avg Volume (90d)`
- `Volume vs 90d Avg`
- `CMF (7d) vs 90d Avg`

## 3. How volume is fetched

## 3.1 Current volume (`quote.volume`)

Function: `fetchStockQuote(symbol)` in `app/lib/stock-quote.ts`.

1. It first calls Yahoo quote endpoint.
2. Reads `regularMarketVolume`.
3. Validates numeric fields.
4. Returns a `StockQuote` with `source: "yahoo"`.
5. If Yahoo fails, it falls back to Nasdaq historical rows and uses the latest row volume.

Core field mapping:

- Yahoo: `regularMarketVolume -> quote.volume`
- Nasdaq fallback: `latest.volume -> quote.volume`

## 3.2 Average volume 90d

Function: `fetchAverageVolume90d(symbol)` in `app/lib/stock-quote.ts`.

Yahoo path:

1. Calls Yahoo chart API (`range=6mo`, `interval=1d`).
2. Extracts `indicators.quote[0].volume`.
3. Keeps finite numbers only.
4. Takes latest 90 values (`slice(-90)`).
5. Returns arithmetic average.

Fallback Nasdaq path:

1. Uses `fetchNasdaqHistoryRows(symbol)`.
2. Parses volume strings to numbers.
3. Uses first 90 rows (`slice(0, 90)`; Nasdaq rows are newest first).
4. Returns average.

## 3.3 Volume delta used in UI

In `app/components/stock-snapshot-section.tsx`:

```ts
const volumeDeltaPct =
  quote && avgVolume90d && avgVolume90d > 0
    ? ((quote.volume - avgVolume90d) / avgVolume90d) * 100
    : null;
```

This is what powers the `Volume vs 90d Avg` number shown on cards.

## 4. How CMF is fetched and calculated

Function entry point: `fetchCmfMetrics(symbol)` in `app/lib/stock-quote.ts`.

### 4.1 Fetch OHLCV series

CMF needs daily OHLCV data (`high`, `low`, `close`, `volume`).

- Primary: `fetchYahooDailyOhlcv(symbol)` from Yahoo chart API (`range=1y`, `interval=1d`)
- Fallback: `fetchNasdaqDailyOhlcv(symbol)` based on Nasdaq historical rows

If at least 7 valid points exist, CMF metrics are computed.

### 4.2 CMF formula used

In `computeCmf(points)`:

1. For each day, compute money flow multiplier:

```text
(2 * close - high - low) / (high - low)
```

2. Multiply by volume to get money flow volume.
3. Sum money flow volumes and divide by sum of volumes.

So:

```text
CMF = sum(multiplier * volume) / sum(volume)
```

### 4.3 Metrics returned

`getCmfMetrics(points)` returns:

- `cmf7d`: CMF over last 7 days
- `cmf7dAvg90d`: average of rolling 7d CMF windows over recent lookback
- `mfVelocity`: percent change between latest CMF14 and a CMF14 window shifted by 5 trading days

Note:

- This preserves percent-style velocity math while reducing noise versus a 1-day shift.

UI then computes:

```ts
cmfDelta = cmf7d - cmf7dAvg90d;
```

This is shown as `CMF (7d) vs 90d Avg`.

## 5. Internal API route example in this project

Besides direct server-side fetch helpers, your project also has an API route:

- `app/api/stocks/[symbol]/chart/route.ts`

This route:

1. Reads `symbol` from URL params
2. Calls `fetchStockChartData(symbol)`
3. Returns `NextResponse.json({ data })`
4. Adds `Cache-Control` headers

This is useful when a client component wants chart data on demand (instead of loading all chart data during initial page render).

## 6. Why this approach is good for learning

You can see several practical patterns in one project:

- Server-side `fetch` in reusable lib functions
- Provider fallback strategy (Yahoo -> Nasdaq)
- Data validation before returning results
- Transforming raw API payloads into domain-friendly types
- UI deriving final indicators from fetched values

## 7. Practice ideas

1. Add logging around fallback usage (`yahoo` vs `nasdaq`) and observe behavior.
2. Change `revalidate: 60` to another value and compare freshness vs request count.
3. Add one more metric from OHLCV (for example OBV) using the same fetch pipeline.
4. Create a dedicated route for CMF metrics (similar to chart route) and call it from a client component.

---

Companion diagrams note:

- `learn-api-fetching-diagrams.md`
