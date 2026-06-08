# Learn API Fetching Diagrams

This companion note visualizes how `volume` and `CMF` data move through this project.

## 1. Volume Flow (Request -> Provider -> Transform -> UI)

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant P as Next Page (app/page.tsx)
    participant L as stock-quote.ts
    participant Y as Yahoo Finance API
    participant N as Nasdaq API
    participant C as StockSnapshotSection UI

    U->>P: Open Home/Stocks page
    P->>L: fetchStockQuote(symbol)
    L->>Y: GET /v7/finance/quote
    alt Yahoo quote OK
        Y-->>L: regularMarketVolume (+ OHLC)
        L-->>P: quote.volume (source: yahoo)
    else Yahoo fails
        L->>N: GET /historical
        N-->>L: latest historical row
        L-->>P: quote.volume (source: nasdaq)
    end

    P->>L: fetchAverageVolume90d(symbol)
    L->>Y: GET /v8/finance/chart (6mo, 1d)
    alt Yahoo chart OK
        Y-->>L: daily volumes[]
        L-->>P: avgVolume90d from latest 90 values
    else Yahoo fails
        L->>N: GET /historical
        N-->>L: rows with volume
        L-->>P: avgVolume90d from first 90 rows
    end

    P->>C: pass quote + avgVolume90d
    C->>C: compute volumeDeltaPct
    C-->>U: show Volume, Avg Volume (90d), Volume vs 90d Avg
```

## 2. CMF Flow (Request -> OHLCV -> Metrics -> UI)

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant P as Next Page (app/page.tsx)
    participant L as stock-quote.ts
    participant Y as Yahoo Finance API
    participant N as Nasdaq API
    participant C as StockSnapshotSection UI

    U->>P: Open Home/Stocks page
    P->>L: fetchCmfMetrics(symbol)
    L->>Y: GET /v8/finance/chart (1y, 1d)
    alt Yahoo has >= 7 valid OHLCV points
        Y-->>L: highs[], lows[], closes[], volumes[]
        L->>L: computeCmf(last 7d)
        L->>L: computeRollingCmfAverage(7d windows, lookback 90d)
        L->>L: computeMoneyFlowVelocity(latest 7d vs previous 7d)
        L-->>P: cmf7d, cmf7dAvg90d, mfVelocity
    else Yahoo insufficient/failed
        L->>N: GET /historical
        N-->>L: daily rows (H/L/C/V)
        alt Nasdaq has >= 7 valid points
            L->>L: same CMF computations
            L-->>P: cmf7d, cmf7dAvg90d, mfVelocity
        else Not enough points
            L-->>P: null metrics
        end
    end

    P->>C: pass cmfMetrics
    C->>C: cmfDelta = cmf7d - cmf7dAvg90d
    C-->>U: show CMF (7d) vs 90d Avg
```

## 3. Data Shapes At A Glance

- `StockQuote.volume`: current session volume for the symbol.
- `avgVolume90d`: arithmetic mean of recent 90 daily volumes.
- `cmf7d`: CMF over last 7 days.
- `cmf7dAvg90d`: average of rolling 7-day CMF windows over recent lookback.
- `mfVelocity`: percent change between latest and prior 7-day CMF windows.

## 4. Where To Read In Code

- `app/page.tsx` and `app/stocks/page.tsx`
- `app/lib/stock-quote.ts`
- `app/components/stock-snapshot-section.tsx`

## 5. Suggested Learning Exercise

1. Add temporary `console.log` statements in `fetchCmfMetrics` and `fetchAverageVolume90d` to see which provider path (Yahoo or Nasdaq) is used in runtime.
2. Compare resulting UI values after changing `next: { revalidate: 60 }` to another interval.
