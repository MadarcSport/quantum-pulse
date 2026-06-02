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
      indicators?: {
        quote?: Array<{
          high?: Array<number | null>;
          low?: Array<number | null>;
          close?: Array<number | null>;
          volume?: Array<number | null>;
        }>;
      };
    }>;
  };
};

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
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol.toUpperCase()}`,
      {
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as YahooQuoteResponse;
    const row = json.quoteResponse?.result?.[0];

    if (!row) {
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
      return null;
    }

    const { date, time } = formatDateTimeFromEpoch(Number(marketTime));

    return {
      symbol: row.symbol ?? symbol.toUpperCase(),
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

function getCmfMetrics(points: OhlcvPoint[]): StockCmfMetrics {
  const cmf7d = computeCmf(points.slice(-7));
  const cmf7dAvg90d = computeRollingCmfAverage(points, 7, 90);

  return {
    cmf7d,
    cmf7dAvg90d,
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
