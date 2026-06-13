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
  quotePath?: "yahoo-daily" | "yahoo-v7" | "yahoo-chart" | "nasdaq-history";
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

type DailyQuotePoint = {
  close: number;
  high: number;
  low: number;
  open: number;
  timestamp: number;
  volume: number;
};

const WARNED_KEYS = new Set<string>();
let yahooRateLimitedUntil = 0;
const nasdaqHistoryRowsCache = new Map<
  string,
  Promise<
    Array<{
      date?: string;
      close?: string;
      open?: string;
      high?: string;
      low?: string;
      volume?: string;
    }>
  >
>();
function getPositiveEnvNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

const FETCH_TIMEOUT_MS = getPositiveEnvNumber("STOCK_FETCH_TIMEOUT_MS", 2500);
const YAHOO_RETRY_COUNT = Math.max(
  0,
  Math.floor(getPositiveEnvNumber("STOCK_FETCH_RETRIES", 0)),
);
const YAHOO_RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000;
const ENABLE_DEV_MOCK_QUOTES =
  process.env.NODE_ENV !== "production" &&
  process.env.DISABLE_DEV_MOCK_QUOTES !== "1";

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

function isYahooTemporarilyRateLimited(): boolean {
  return Date.now() < yahooRateLimitedUntil;
}

function markYahooRateLimit(status: number): void {
  if (status !== 429) {
    return;
  }

  yahooRateLimitedUntil = Date.now() + YAHOO_RATE_LIMIT_COOLDOWN_MS;
  warnOnce(
    "yahoo-rate-limit-cooldown",
    "Yahoo Finance is rate-limiting requests (429). Temporarily falling back to Nasdaq.",
  );
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs = FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchWithRetry(
  input: string,
  init: RequestInit,
  options: {
    retries?: number;
    timeoutMs?: number;
    label: string;
  },
): Promise<Response> {
  const { retries = 0, timeoutMs = FETCH_TIMEOUT_MS, label } = options;
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fetchWithTimeout(input, init, timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }

      warnOnce(
        `${label}-retry-${attempt + 1}`,
        `${label} request failed on attempt ${attempt + 1}. Retrying once.`,
      );
    }
  }

  throw lastError;
}

function parseNasdaqNumber(value: string): number {
  return Number(value.replace(/[$,\s]/g, ""));
}

function hashSymbol(symbol: string): number {
  let hash = 0;
  for (const char of symbol) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1_000_000;
  }
  return hash;
}

function getDevMockQuote(symbol: string): StockQuote {
  const normalizedSymbol = symbol.toUpperCase();
  const seed = hashSymbol(normalizedSymbol);
  const base = 20 + (seed % 9000) / 100;
  const movePct = ((seed % 700) - 350) / 1000;
  const close = Number(base.toFixed(2));
  const previousClose = Number((close / (1 + movePct)).toFixed(2));
  const open = Number((close * (1 - movePct / 2)).toFixed(2));
  const high = Number((Math.max(open, close) * 1.01).toFixed(2));
  const low = Number((Math.min(open, close) * 0.99).toFixed(2));
  const volume = 500_000 + (seed % 5_000_000);
  const { date } = formatDateTimeFromEpoch(Math.floor(Date.now() / 1000));

  return {
    symbol: normalizedSymbol,
    date,
    time: "Local Mock",
    previousClose,
    open,
    high,
    low,
    close,
    volume,
    source: "nasdaq",
    quotePath: "nasdaq-history",
  };
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

function getNyDateKeyFromEpoch(epochSeconds: number): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/New_York",
  });

  return formatter.format(new Date(epochSeconds * 1000));
}

function getNyClock(): { day: number; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  }).formatToParts(new Date());

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);

  const dayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return {
    day: dayMap[weekday] ?? -1,
    hour,
    minute,
  };
}

function isBeforeNyCloseOnWeekday(): boolean {
  const { day, hour, minute } = getNyClock();
  const isWeekday = day >= 1 && day <= 5;

  if (!isWeekday) {
    return false;
  }

  if (hour < 16) {
    return true;
  }

  return hour === 16 && minute === 0;
}

async function fetchYahooDailyQuote(
  symbol: string,
): Promise<StockQuote | null> {
  if (isYahooTemporarilyRateLimited()) {
    return null;
  }

  const normalizedSymbol = symbol.toUpperCase();
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?range=1y&interval=1d&includePrePost=false&events=div%2Csplits`;

  try {
    const response = await fetchWithRetry(
      url,
      {
        headers: YAHOO_HEADERS,
        cache: "no-store",
      },
      {
        retries: YAHOO_RETRY_COUNT,
        label: `Yahoo daily quote ${normalizedSymbol}`,
      },
    );

    if (!response.ok) {
      markYahooRateLimit(response.status);
      warnOnce(
        `yahoo-daily-quote-${normalizedSymbol}-${response.status}`,
        `Yahoo daily quote request failed for ${normalizedSymbol} with status ${response.status}. Trying Yahoo live quote fallback.`,
      );
      return null;
    }

    const json = (await response.json()) as YahooChartResponse;
    const result = json.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0];
    const opens = quote?.open ?? [];
    const highs = quote?.high ?? [];
    const lows = quote?.low ?? [];
    const closes = quote?.close ?? [];
    const volumes = quote?.volume ?? [];

    const points: DailyQuotePoint[] = [];

    for (let i = 0; i < timestamps.length; i += 1) {
      const timestamp = timestamps[i];
      const open = opens[i];
      const high = highs[i];
      const low = lows[i];
      const close = closes[i];
      const volume = volumes[i];

      if (
        !Number.isFinite(timestamp) ||
        !Number.isFinite(open) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close) ||
        !Number.isFinite(volume)
      ) {
        continue;
      }

      points.push({
        timestamp: Number(timestamp),
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
      });
    }

    if (points.length < 2) {
      warnOnce(
        `yahoo-daily-quote-insufficient-${normalizedSymbol}`,
        `Yahoo daily quote response had insufficient rows for ${normalizedSymbol}. Trying Yahoo live quote fallback.`,
      );
      return null;
    }

    const latestIndex = points.length - 1;
    const todayNyKey = getNyDateKeyFromEpoch(Math.floor(Date.now() / 1000));
    const latestNyKey = getNyDateKeyFromEpoch(points[latestIndex].timestamp);
    const usePreviousSession =
      latestNyKey === todayNyKey && isBeforeNyCloseOnWeekday();
    const selectedIndex = usePreviousSession ? latestIndex - 1 : latestIndex;

    if (selectedIndex <= 0) {
      return null;
    }

    const selected = points[selectedIndex];
    const previous = points[selectedIndex - 1];

    if (!selected || !previous) {
      return null;
    }

    const { date } = formatDateTimeFromEpoch(selected.timestamp);

    return {
      symbol: normalizedSymbol,
      date,
      time: "Market Close",
      previousClose: previous.close,
      open: selected.open,
      high: selected.high,
      low: selected.low,
      close: selected.close,
      volume: selected.volume,
      source: "yahoo",
      quotePath: "yahoo-daily",
    };
  } catch {
    warnOnce(
      `yahoo-daily-quote-exception-${normalizedSymbol}`,
      `Yahoo daily quote request threw or timed out for ${normalizedSymbol}. Trying Yahoo live quote fallback.`,
    );
    return null;
  }
}

async function fetchYahooQuote(symbol: string): Promise<StockQuote | null> {
  if (isYahooTemporarilyRateLimited()) {
    return null;
  }

  const normalizedSymbol = symbol.toUpperCase();
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${normalizedSymbol}`;

  try {
    const response = await fetchWithRetry(
      url,
      {
        headers: YAHOO_HEADERS,
        cache: "no-store",
      },
      {
        retries: YAHOO_RETRY_COUNT,
        label: `Yahoo quote ${normalizedSymbol}`,
      },
    );

    if (!response.ok) {
      markYahooRateLimit(response.status);
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
      quotePath: "yahoo-v7",
    };
  } catch {
    warnOnce(
      `yahoo-quote-exception-${normalizedSymbol}`,
      `Yahoo quote request threw or timed out for ${normalizedSymbol}. Trying Yahoo chart quote fallback.`,
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
  if (isYahooTemporarilyRateLimited()) {
    return null;
  }

  const normalizedSymbol = symbol.toUpperCase();
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?range=1d&interval=1m&includePrePost=true&events=div%2Csplits`;

  try {
    const response = await fetchWithRetry(
      url,
      {
        headers: YAHOO_HEADERS,
        cache: "no-store",
      },
      {
        retries: YAHOO_RETRY_COUNT,
        label: `Yahoo chart quote ${normalizedSymbol}`,
      },
    );

    if (!response.ok) {
      markYahooRateLimit(response.status);
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
      quotePath: "yahoo-chart",
    };
  } catch {
    warnOnce(
      `yahoo-chart-quote-exception-${normalizedSymbol}`,
      `Yahoo chart quote request threw or timed out for ${normalizedSymbol}. Falling back to Nasdaq history.`,
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
  const normalizedSymbol = symbol.toUpperCase();
  const existingRequest = nasdaqHistoryRowsCache.get(normalizedSymbol);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    try {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      const toDate = today.toISOString().slice(0, 10);
      const fromDate = oneYearAgo.toISOString().slice(0, 10);
      const url = `https://api.nasdaq.com/api/quote/${normalizedSymbol}/historical?assetclass=stocks&fromdate=${fromDate}&todate=${toDate}&limit=365`;

      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            "user-agent": "Mozilla/5.0",
            accept: "application/json",
          },
          next: { revalidate: 60 },
        },
        FETCH_TIMEOUT_MS,
      );

      if (!response.ok) {
        warnOnce(
          `nasdaq-history-${normalizedSymbol}-${response.status}`,
          `Nasdaq history request failed for ${normalizedSymbol} with status ${response.status}.`,
        );
        return [];
      }

      const json = (await response.json()) as NasdaqHistoricalVolumeResponse;
      const rows = json.data?.tradesTable?.rows ?? [];

      if (rows.length === 0) {
        warnOnce(
          `nasdaq-history-empty-${normalizedSymbol}`,
          `Nasdaq history returned no rows for ${normalizedSymbol}.`,
        );
      }

      return rows;
    } catch {
      warnOnce(
        `nasdaq-history-exception-${normalizedSymbol}`,
        `Nasdaq history request threw or timed out for ${normalizedSymbol}.`,
      );
      return [];
    }
  })();

  nasdaqHistoryRowsCache.set(normalizedSymbol, request);
  return request;
}

export async function fetchStockQuote(
  symbol: string,
): Promise<StockQuote | null> {
  const normalizedSymbol = symbol.toUpperCase();
  const yahooDailyQuote = await fetchYahooDailyQuote(symbol);
  if (yahooDailyQuote) {
    return yahooDailyQuote;
  }

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
    warnOnce(
      `stock-quote-unavailable-${normalizedSymbol}`,
      `Quote data is unavailable for ${normalizedSymbol} after Yahoo and Nasdaq fallbacks.`,
    );
    if (ENABLE_DEV_MOCK_QUOTES) {
      warnOnce(
        `stock-quote-dev-mock-${normalizedSymbol}`,
        `Using local mock quote for ${normalizedSymbol} in development mode due upstream fetch failures.`,
      );
      return getDevMockQuote(normalizedSymbol);
    }
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
    warnOnce(
      `stock-quote-invalid-nasdaq-${normalizedSymbol}`,
      `Nasdaq fallback quote contained invalid numeric fields for ${normalizedSymbol}.`,
    );
    if (ENABLE_DEV_MOCK_QUOTES) {
      warnOnce(
        `stock-quote-dev-mock-invalid-${normalizedSymbol}`,
        `Using local mock quote for ${normalizedSymbol} in development mode due invalid fallback payload.`,
      );
      return getDevMockQuote(normalizedSymbol);
    }
    return null;
  }

  return {
    symbol: normalizedSymbol,
    date: latest.date ?? "N/A",
    time: "Market Close",
    previousClose,
    open,
    high,
    low,
    close,
    volume,
    source: "nasdaq",
    quotePath: "nasdaq-history",
  };
}

async function fetchYahooAverageVolume90d(
  symbol: string,
): Promise<number | null> {
  if (isYahooTemporarilyRateLimited()) {
    return null;
  }

  const normalizedSymbol = symbol.toUpperCase();
  try {
    const response = await fetchWithRetry(
      `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?range=6mo&interval=1d&includePrePost=false&events=div%2Csplits`,
      {
        headers: YAHOO_HEADERS,
        next: { revalidate: 60 },
      },
      {
        retries: YAHOO_RETRY_COUNT,
        label: `Yahoo avg volume ${normalizedSymbol}`,
      },
    );

    if (!response.ok) {
      markYahooRateLimit(response.status);
      warnOnce(
        `yahoo-avg-volume-${normalizedSymbol}-${response.status}`,
        `Yahoo average volume request failed for ${normalizedSymbol} with status ${response.status}. Falling back to Nasdaq history.`,
      );
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
    warnOnce(
      `yahoo-avg-volume-exception-${normalizedSymbol}`,
      `Yahoo average volume request threw or timed out for ${normalizedSymbol}. Falling back to Nasdaq history.`,
    );
    return null;
  }
}

async function fetchYahooDailyOhlcv(symbol: string): Promise<OhlcvPoint[]> {
  if (isYahooTemporarilyRateLimited()) {
    return [];
  }

  const normalizedSymbol = symbol.toUpperCase();
  try {
    const response = await fetchWithRetry(
      `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?range=1y&interval=1d&includePrePost=false&events=div%2Csplits`,
      {
        headers: YAHOO_HEADERS,
        next: { revalidate: 60 },
      },
      {
        retries: YAHOO_RETRY_COUNT,
        label: `Yahoo OHLCV ${normalizedSymbol}`,
      },
    );

    if (!response.ok) {
      markYahooRateLimit(response.status);
      warnOnce(
        `yahoo-ohlcv-${normalizedSymbol}-${response.status}`,
        `Yahoo OHLCV request failed for ${normalizedSymbol} with status ${response.status}. Falling back to Nasdaq history.`,
      );
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
    warnOnce(
      `yahoo-ohlcv-exception-${normalizedSymbol}`,
      `Yahoo OHLCV request threw or timed out for ${normalizedSymbol}. Falling back to Nasdaq history.`,
    );
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
  const period = 14;
  const shiftDays = 5;

  if (points.length < period + shiftDays) {
    return null;
  }

  const latestCmf14d = computeCmf(points.slice(-period));
  const previousCmf14d = computeCmf(
    points.slice(-(period + shiftDays), -shiftDays),
  );

  if (latestCmf14d === null || previousCmf14d === null) {
    return null;
  }

  const denominator = Math.max(Math.abs(previousCmf14d), 0.01);
  return ((latestCmf14d - previousCmf14d) / denominator) * 100;
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

export async function fetchAverageVolume7d(
  symbol: string,
): Promise<number | null> {
  const yahooAvg90d = await fetchYahooAverageVolume90d(symbol);

  if (yahooAvg90d !== null && !isYahooTemporarilyRateLimited()) {
    const normalizedSymbol = symbol.toUpperCase();
    try {
      const response = await fetchWithRetry(
        `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?range=1mo&interval=1d&includePrePost=false&events=div%2Csplits`,
        {
          headers: YAHOO_HEADERS,
          next: { revalidate: 60 },
        },
        {
          retries: YAHOO_RETRY_COUNT,
          label: `Yahoo avg volume 7d ${normalizedSymbol}`,
        },
      );

      if (response.ok) {
        const json = (await response.json()) as YahooChartResponse;
        const volumes = (
          json.chart?.result?.[0]?.indicators?.quote?.[0]?.volume ?? []
        ).filter((value): value is number => Number.isFinite(value));
        const recent = volumes.slice(-7);

        if (recent.length > 0) {
          const total = recent.reduce((sum, value) => sum + value, 0);
          return total / recent.length;
        }
      } else {
        markYahooRateLimit(response.status);
      }
    } catch {
      // fall through to Nasdaq fallback
    }
  }

  const rows = await fetchNasdaqHistoryRows(symbol);
  const volumes = rows
    .map((row) => parseNasdaqNumber(row.volume ?? ""))
    .filter((volume) => Number.isFinite(volume));

  const recent = volumes.slice(0, 7);

  if (recent.length === 0) {
    return null;
  }

  const total = recent.reduce((sum, value) => sum + value, 0);
  return total / recent.length;
}
