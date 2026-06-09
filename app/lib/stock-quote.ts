export type StockQuote = {
  symbol: string;
  date: string;
  time: string;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: "yahoo" | "nasdaq";
};

export type StockCmfMetrics = {
  cmf7d: number | null;
  cmf7dAvg90d: number | null;
  mfVelocity: number | null;
};

type OhlcvPoint = {
  high: number;
  low: number;
  close: number;
  volume: number;
};

type NasdaqHistoricalVolumeResponse = {
  data?: {
    tradesTable?: {
      rows?: Array<{
        date?: string;
        close?: string;
        open?: string;
        high?: string;
        low?: string;
        volume: string;
      }>;
    };
  };
};

type YahooQuoteResponse = {
  quoteResponse?: {
    result?: Array<{
      symbol?: string;
      regularMarketTime?: number;
      regularMarketPreviousClose?: number;
      regularMarketPrice?: number;
      regularMarketOpen?: number;
      regularMarketDayHigh?: number;
      regularMarketDayLow?: number;
      regularMarketVolume?: number;
    }>;
  };
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      meta?: {
        symbol?: string;
        regularMarketTime?: number;
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        regularMarketOpen?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketVolume?: number;
      };
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>;
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
  };
};

const WARNED_KEYS = new Set<string>();

const YAHOO_HEADERS: HeadersInit = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  accept: "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  referer: "https://finance.yahoo.com/",
  origin: "https://finance.yahoo.com",
};

function warnOnce(key: string, message: string): void {
  if (WARNED_KEYS.has(key)) {
    return;
  }

  WARNED_KEYS.add(key);
  console.warn(`[stock-quote] ${message}`);
}

function parseNasdaqNumber(value: string): number {
  return Number(value.replace(/[$,\s]/g, ""));
}

function formatDateTimeFromEpoch(epochSeconds: number): {
  date: string;
  time: string;
} {
  const date = new Date(epochSeconds * 1000);
  const dateFormatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/New_York",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  });

  return {
    date: dateFormatter.format(date),
    time: timeFormatter.format(date),
  };
}

async function fetchYahooQuote(symbol: string): Promise<StockQuote | null> {
  const normalizedSymbol = symbol.toUpperCase();

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${normalizedSymbol}`,
      {
        headers: YAHOO_HEADERS,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      warnOnce(
        `yahoo-quote-${normalizedSymbol}-${response.status}`,
        `Yahoo quote request failed for ${normalizedSymbol} with status ${response.status}. Trying Yahoo chart quote fallback.`,
      );
      return null;
    }

    const json = (await response.json()) as YahooQuoteResponse;
    const row = json.quoteResponse?.result?.[0];

    if (!row) {
      warnOnce(
        `yahoo-quote-empty-${normalizedSymbol}`,
        `Yahoo quote response was empty for ${normalizedSymbol}. Trying Yahoo chart quote fallback.`,
      );
      return null;
    }

    const close = row.regularMarketPrice;
    const previousClose = row.regularMarketPreviousClose;
    const open = row.regularMarketOpen;
    const high = row.regularMarketDayHigh;
    const low = row.regularMarketDayLow;
    const volume = row.regularMarketVolume;
    const marketTime = row.regularMarketTime;

    if (
      !Number.isFinite(close) ||
      !Number.isFinite(previousClose) ||
      !Number.isFinite(open) ||
      !Number.isFinite(high) ||
      !Number.isFinite(low) ||
      !Number.isFinite(volume) ||
      !Number.isFinite(marketTime)
    ) {
      warnOnce(
        `yahoo-quote-invalid-${normalizedSymbol}`,
        `Yahoo quote payload had invalid numeric fields for ${normalizedSymbol}. Trying Yahoo chart quote fallback.`,
      );
      return null;
    }

    const { date, time } = formatDateTimeFromEpoch(Number(marketTime));

    return {
      symbol: row.symbol ?? normalizedSymbol,
      date,
      time,
      previousClose: Number(previousClose),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
      source: "yahoo",
    };
  } catch {
    warnOnce(
      `yahoo-quote-exception-${normalizedSymbol}`,
      `Yahoo quote request threw for ${normalizedSymbol}. Trying Yahoo chart quote fallback.`,
    );
    return null;
  }
}

function getLastFiniteNumber(values?: Array<number | null>): number | null {
  if (!values) {
    return null;
  }

  for (let i = values.length - 1; i >= 0; i -= 1) {
    const value = values[i];
    if (Number.isFinite(value)) {
      return Number(value);
    }
  }

  return null;
}

function getExtrema(
  values: Array<number | null> | undefined,
  mode: "min" | "max",
): number | null {
  if (!values) {
    return null;
  }

  const finiteValues = values.filter((value): value is number =>
    Number.isFinite(value),
  );
  if (finiteValues.length === 0) {
    return null;
  }

  return mode === "max" ? Math.max(...finiteValues) : Math.min(...finiteValues);
}

async function fetchYahooChartQuote(
  symbol: string,
): Promise<StockQuote | null> {
  const normalizedSymbol = symbol.toUpperCase();

  try {
    const response = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?range=1d&interval=1m&includePrePost=true&events=div%2Csplits`,
      {
        headers: YAHOO_HEADERS,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      warnOnce(
        `yahoo-chart-quote-${normalizedSymbol}-${response.status}`,
        `Yahoo chart quote request failed for ${normalizedSymbol} with status ${response.status}. Falling back to Nasdaq history.`,
      );
      return null;
    }

    const json = (await response.json()) as YahooChartResponse;
    const result = json.chart?.result?.[0];
    const meta = result?.meta;
    const quote = result?.indicators?.quote?.[0];
    const timestamps = result?.timestamp ?? [];
    const marketTime =
      (Number.isFinite(meta?.regularMarketTime)
        ? Number(meta?.regularMarketTime)
        : null) ?? getLastFiniteNumber(timestamps as Array<number | null>);

    const close =
      (Number.isFinite(meta?.regularMarketPrice)
        ? Number(meta?.regularMarketPrice)
        : null) ?? getLastFiniteNumber(quote?.close);
    const previousClose =
      (Number.isFinite(meta?.previousClose)
        ? Number(meta?.previousClose)
        : null) ??
      (Number.isFinite(meta?.chartPreviousClose)
        ? Number(meta?.chartPreviousClose)
        : null);
    const open =
      (Number.isFinite(meta?.regularMarketOpen)
        ? Number(meta?.regularMarketOpen)
        : null) ?? getLastFiniteNumber(quote?.open);
    const high =
      (Number.isFinite(meta?.regularMarketDayHigh)
        ? Number(meta?.regularMarketDayHigh)
        : null) ?? getExtrema(quote?.high, "max");
    const low =
      (Number.isFinite(meta?.regularMarketDayLow)
        ? Number(meta?.regularMarketDayLow)
        : null) ?? getExtrema(quote?.low, "min");
    const volume =
      (Number.isFinite(meta?.regularMarketVolume)
        ? Number(meta?.regularMarketVolume)
        : null) ?? getLastFiniteNumber(quote?.volume);

    if (
      close === null ||
      previousClose === null ||
      open === null ||
      high === null ||
      low === null ||
      volume === null ||
      marketTime === null
    ) {
      warnOnce(
        `yahoo-chart-quote-invalid-${normalizedSymbol}`,
        `Yahoo chart quote payload had invalid numeric fields for ${normalizedSymbol}. Falling back to Nasdaq history.`,
      );
      return null;
    }

    const { date, time } = formatDateTimeFromEpoch(marketTime);

    return {
      symbol: meta?.symbol ?? normalizedSymbol,
      date,
      time,
      previousClose,
      open,
      high,
      low,
      close,
      volume,
      source: "yahoo",
    };
  } catch {
    warnOnce(
      `yahoo-chart-quote-exception-${normalizedSymbol}`,
      `Yahoo chart quote request threw for ${normalizedSymbol}. Falling back to Nasdaq history.`,
    );
    return null;
  }
}

async function fetchNasdaqHistoryRows(symbol: string): Promise<
  Array<{
    date?: string;
    close?: string;
    open?: string;
    high?: string;
    low?: string;
    volume?: string;
  }>
> {
  try {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const toDate = today.toISOString().slice(0, 10);
    const fromDate = oneYearAgo.toISOString().slice(0, 10);
    const url = `https://api.nasdaq.com/api/quote/${symbol.toUpperCase()}/historical?assetclass=stocks&fromdate=${fromDate}&todate=${toDate}&limit=365`;

    const response = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0",
        accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as NasdaqHistoricalVolumeResponse;
    return json.data?.tradesTable?.rows ?? [];
  } catch {
    return [];
  }
}

export async function fetchStockQuote(
  symbol: string,
): Promise<StockQuote | null> {
  const yahooQuote = await fetchYahooQuote(symbol);
  if (yahooQuote) {
    return yahooQuote;
  }

  const yahooChartQuote = await fetchYahooChartQuote(symbol);
  if (yahooChartQuote) {
    return yahooChartQuote;
  }

  const rows = await fetchNasdaqHistoryRows(symbol);
  const latest = rows[0];
  const previous = rows[1];

  if (!latest || !previous) {
    return null;
  }

  const previousClose = parseNasdaqNumber(previous.close ?? "");
  const open = parseNasdaqNumber(latest.open ?? "");
  const high = parseNasdaqNumber(latest.high ?? "");
  const low = parseNasdaqNumber(latest.low ?? "");
  const close = parseNasdaqNumber(latest.close ?? "");
  const volume = parseNasdaqNumber(latest.volume ?? "");

  if (
    !Number.isFinite(previousClose) ||
    !Number.isFinite(open) ||
    !Number.isFinite(high) ||
    !Number.isFinite(low) ||
    !Number.isFinite(close) ||
    !Number.isFinite(volume)
  ) {
    return null;
  }

  return {
    symbol: symbol.toUpperCase(),
    date: latest.date ?? "N/A",
    time: "Market Close",
    previousClose,
    open,
    high,
    low,
    close,
    volume,
    source: "nasdaq",
  };
}

async function fetchYahooAverageVolume90d(
  symbol: string,
): Promise<number | null> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?range=6mo&interval=1d&includePrePost=false&events=div%2Csplits`,
      {
        headers: YAHOO_HEADERS,
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as YahooChartResponse;
    const volumes = (
      json.chart?.result?.[0]?.indicators?.quote?.[0]?.volume ?? []
    ).filter((value): value is number => Number.isFinite(value));

    const recent = volumes.slice(-90);
    if (recent.length === 0) {
      return null;
    }

    const total = recent.reduce((sum, value) => sum + value, 0);
    return total / recent.length;
  } catch {
    return null;
  }
}

async function fetchYahooDailyOhlcv(symbol: string): Promise<OhlcvPoint[]> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?range=1y&interval=1d&includePrePost=false&events=div%2Csplits`,
      {
        headers: YAHOO_HEADERS,
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as YahooChartResponse;
    const quote = json.chart?.result?.[0]?.indicators?.quote?.[0];
    const highs = quote?.high ?? [];
    const lows = quote?.low ?? [];
    const closes = quote?.close ?? [];
    const volumes = quote?.volume ?? [];
    const length = Math.min(
      highs.length,
      lows.length,
      closes.length,
      volumes.length,
    );

    const points: OhlcvPoint[] = [];

    for (let i = 0; i < length; i += 1) {
      const high = highs[i];
      const low = lows[i];
      const close = closes[i];
      const volume = volumes[i];

      if (
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close) ||
        !Number.isFinite(volume)
      ) {
        continue;
      }

      points.push({
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
      });
    }

    return points;
  } catch {
    return [];
  }
}

async function fetchNasdaqDailyOhlcv(symbol: string): Promise<OhlcvPoint[]> {
  const rows = await fetchNasdaqHistoryRows(symbol);

  return rows
    .map((row) => ({
      high: parseNasdaqNumber(row.high ?? ""),
      low: parseNasdaqNumber(row.low ?? ""),
      close: parseNasdaqNumber(row.close ?? ""),
      volume: parseNasdaqNumber(row.volume ?? ""),
    }))
    .filter(
      (point) =>
        Number.isFinite(point.high) &&
        Number.isFinite(point.low) &&
        Number.isFinite(point.close) &&
        Number.isFinite(point.volume),
    )
    .reverse();
}

function computeCmf(points: OhlcvPoint[]): number | null {
  let moneyFlowVolumeSum = 0;
  let volumeSum = 0;

  for (const point of points) {
    if (point.volume <= 0) {
      continue;
    }

    const spread = point.high - point.low;
    const moneyFlowMultiplier =
      spread === 0 ? 0 : (2 * point.close - point.high - point.low) / spread;

    moneyFlowVolumeSum += moneyFlowMultiplier * point.volume;
    volumeSum += point.volume;
  }

  if (volumeSum <= 0) {
    return null;
  }

  return moneyFlowVolumeSum / volumeSum;
}

function computeRollingCmfAverage(
  points: OhlcvPoint[],
  cmfPeriod: number,
  lookbackDays: number,
): number | null {
  if (points.length < cmfPeriod) {
    return null;
  }

  const firstEndIndex = Math.max(cmfPeriod - 1, points.length - lookbackDays);
  const rollingValues: number[] = [];

  for (let end = firstEndIndex; end < points.length; end += 1) {
    const start = end - cmfPeriod + 1;
    const value = computeCmf(points.slice(start, end + 1));
    if (value !== null) {
      rollingValues.push(value);
    }
  }

  if (rollingValues.length === 0) {
    return null;
  }

  const total = rollingValues.reduce((sum, value) => sum + value, 0);
  return total / rollingValues.length;
}

function computeMoneyFlowVelocity(points: OhlcvPoint[]): number | null {
  if (points.length < 8) {
    return null;
  }

  const latestCmf7d = computeCmf(points.slice(-7));
  const previousCmf7d = computeCmf(points.slice(-8, -1));

  if (latestCmf7d === null || previousCmf7d === null) {
    return null;
  }

  const denominator = Math.max(Math.abs(previousCmf7d), 0.01);
  return ((latestCmf7d - previousCmf7d) / denominator) * 100;
}

function getCmfMetrics(points: OhlcvPoint[]): StockCmfMetrics {
  const cmf7d = computeCmf(points.slice(-7));
  const cmf7dAvg90d = computeRollingCmfAverage(points, 7, 90);
  const mfVelocity = computeMoneyFlowVelocity(points);

  return {
    cmf7d,
    cmf7dAvg90d,
    mfVelocity,
  };
}

export async function fetchCmfMetrics(
  symbol: string,
): Promise<StockCmfMetrics> {
  const yahooPoints = await fetchYahooDailyOhlcv(symbol);
  if (yahooPoints.length >= 7) {
    return getCmfMetrics(yahooPoints);
  }

  const nasdaqPoints = await fetchNasdaqDailyOhlcv(symbol);
  if (nasdaqPoints.length >= 7) {
    return getCmfMetrics(nasdaqPoints);
  }

  return {
    cmf7d: null,
    cmf7dAvg90d: null,
    mfVelocity: null,
  };
}

export async function fetchAverageVolume90d(
  symbol: string,
): Promise<number | null> {
  const yahooAvg = await fetchYahooAverageVolume90d(symbol);
  if (yahooAvg !== null) {
    return yahooAvg;
  }

  const rows = await fetchNasdaqHistoryRows(symbol);
  const volumes = rows
    .map((row) => parseNasdaqNumber(row.volume ?? ""))
    .filter((volume) => Number.isFinite(volume));

  const recent = volumes.slice(0, 90);

  if (recent.length === 0) {
    return null;
  }

  const total = recent.reduce((sum, value) => sum + value, 0);
  return total / recent.length;
}
