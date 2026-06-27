export type CmfTrendPoint = {
  label: string;
  cmf7d: number;
  cmf7dAvg90d: number;
  spreadVs90d: number;
};

export type CmfTrendData = {
  points: CmfTrendPoint[];
  source: "yahoo" | "nasdaq";
};

type DailyOhlcvPoint = {
  label: string;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type YahooOhlcvResponse = {
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

type NasdaqOhlcvResponse = {
  data?: {
    tradesTable?: {
      rows?: Array<{
        date?: string;
        high?: string;
        low?: string;
        close?: string;
        volume?: string;
      }>;
    };
  };
};

const FETCH_TIMEOUT_MS = 3500;
const CMF_TREND_POINTS = 30;
const CMF_PERIOD = 7;
const CMF_BASELINE_DAYS = 90;
const MIN_HISTORY_POINTS = CMF_PERIOD + CMF_BASELINE_DAYS - 1;
const YAHOO_HEADERS: HeadersInit = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36",
  accept: "application/json, text/plain, */*",
  "accept-language": "en-US,en;q=0.9",
  referer: "https://finance.yahoo.com/",
  origin: "https://finance.yahoo.com",
};

async function fetchWithTimeout(
  input: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseNasdaqNumber(value: string): number {
  return Number(value.replace(/[$,\s]/g, ""));
}

function isIncompleteCurrentNyDailyBar(timestamp: number): boolean {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  const nyYear = getPart("year");
  const nyMonth = getPart("month");
  const nyDay = getPart("day");
  const nyHour = getPart("hour");
  const nyMinute = getPart("minute");
  const barDate = new Date(timestamp * 1000);
  const barLabel = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(barDate);
  const todayLabel = `${nyYear}-${String(nyMonth).padStart(2, "0")}-${String(
    nyDay,
  ).padStart(2, "0")}`;

  return barLabel === todayLabel && nyHour * 60 + nyMinute < 16 * 60;
}

async function fetchYahooOhlcvHistory(
  symbol: string,
): Promise<DailyOhlcvPoint[]> {
  try {
    const normalizedSymbol = symbol.toUpperCase();
    const response = await fetchWithTimeout(
      `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}?range=1y&interval=1d&includePrePost=false&events=div%2Csplits`,
      {
        headers: YAHOO_HEADERS,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as YahooOhlcvResponse;
    const result = json.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const quote = result?.indicators?.quote?.[0];
    const highs = quote?.high ?? [];
    const lows = quote?.low ?? [];
    const closes = quote?.close ?? [];
    const volumes = quote?.volume ?? [];
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/New_York",
    });
    const points: DailyOhlcvPoint[] = [];

    for (let index = 0; index < timestamps.length; index += 1) {
      const timestamp = timestamps[index];
      const high = highs[index];
      const low = lows[index];
      const close = closes[index];
      const volume = volumes[index];

      if (
        !Number.isFinite(timestamp) ||
        isIncompleteCurrentNyDailyBar(Number(timestamp)) ||
        !Number.isFinite(high) ||
        !Number.isFinite(low) ||
        !Number.isFinite(close) ||
        !Number.isFinite(volume) ||
        Number(volume) <= 0
      ) {
        continue;
      }

      points.push({
        label: formatter.format(new Date(Number(timestamp) * 1000)),
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

async function fetchNasdaqOhlcvHistory(
  symbol: string,
): Promise<DailyOhlcvPoint[]> {
  try {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const toDate = today.toISOString().slice(0, 10);
    const fromDate = oneYearAgo.toISOString().slice(0, 10);
    const normalizedSymbol = symbol.toUpperCase();
    const url = `https://api.nasdaq.com/api/quote/${normalizedSymbol}/historical?assetclass=stocks&fromdate=${fromDate}&todate=${toDate}&limit=365`;

    const response = await fetchWithTimeout(url, {
      headers: {
        "user-agent": "Mozilla/5.0",
        accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as NasdaqOhlcvResponse;
    const rows = json.data?.tradesTable?.rows ?? [];

    return rows
      .map((row) => ({
        label: row.date ?? "",
        high: parseNasdaqNumber(row.high ?? ""),
        low: parseNasdaqNumber(row.low ?? ""),
        close: parseNasdaqNumber(row.close ?? ""),
        volume: parseNasdaqNumber(row.volume ?? ""),
      }))
      .filter(
        (point) =>
          point.label.length > 0 &&
          Number.isFinite(point.high) &&
          Number.isFinite(point.low) &&
          Number.isFinite(point.close) &&
          Number.isFinite(point.volume) &&
          point.volume > 0,
      )
      .reverse();
  } catch {
    return [];
  }
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeCmf(points: DailyOhlcvPoint[]): number | null {
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

function getCmfTrend(points: DailyOhlcvPoint[]): CmfTrendPoint[] {
  const trend: CmfTrendPoint[] = [];

  for (let index = MIN_HISTORY_POINTS - 1; index < points.length; index += 1) {
    const cmf7d = computeCmf(points.slice(index - CMF_PERIOD + 1, index + 1));
    const rollingCmfValues: number[] = [];

    for (
      let rollingEnd = index - CMF_BASELINE_DAYS + 1;
      rollingEnd <= index;
      rollingEnd += 1
    ) {
      const value = computeCmf(
        points.slice(rollingEnd - CMF_PERIOD + 1, rollingEnd + 1),
      );

      if (value !== null) {
        rollingCmfValues.push(value);
      }
    }

    if (cmf7d === null || rollingCmfValues.length < CMF_BASELINE_DAYS) {
      continue;
    }

    const cmf7dAvg90d = average(rollingCmfValues);

    trend.push({
      label: points[index].label,
      cmf7d,
      cmf7dAvg90d,
      spreadVs90d: cmf7d - cmf7dAvg90d,
    });
  }

  return trend.slice(-CMF_TREND_POINTS);
}

export async function fetchStockCmfTrend(
  symbol: string,
): Promise<CmfTrendData> {
  const yahoo = await fetchYahooOhlcvHistory(symbol);
  const history =
    yahoo.length >= MIN_HISTORY_POINTS
      ? yahoo
      : await fetchNasdaqOhlcvHistory(symbol);
  const source: CmfTrendData["source"] =
    yahoo.length >= MIN_HISTORY_POINTS ? "yahoo" : "nasdaq";

  return {
    points: getCmfTrend(history),
    source,
  };
}
