export type VolumeTrendPoint = {
  label: string;
  volume7dAvg: number;
  volume90dAvg: number;
  percentVs90d: number;
};

export type VolumeTrendData = {
  points: VolumeTrendPoint[];
  source: "yahoo" | "nasdaq";
};

type DailyVolumePoint = {
  label: string;
  volume: number;
};

type YahooVolumeResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          volume?: Array<number | null>;
        }>;
      };
    }>;
  };
};

type NasdaqVolumeResponse = {
  data?: {
    tradesTable?: {
      rows?: Array<{
        date?: string;
        volume?: string;
      }>;
    };
  };
};

const FETCH_TIMEOUT_MS = 3500;
const VOLUME_TREND_POINTS = 30;
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

function parseNasdaqVolume(value: string): number {
  return Number(value.replace(/[,\s]/g, ""));
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

async function fetchYahooVolumeHistory(
  symbol: string,
): Promise<DailyVolumePoint[]> {
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

    const json = (await response.json()) as YahooVolumeResponse;
    const result = json.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const volumes = result?.indicators?.quote?.[0]?.volume ?? [];
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/New_York",
    });
    const points: DailyVolumePoint[] = [];

    for (let index = 0; index < timestamps.length; index += 1) {
      const timestamp = timestamps[index];
      const volume = volumes[index];

      if (
        !Number.isFinite(timestamp) ||
        isIncompleteCurrentNyDailyBar(Number(timestamp)) ||
        !Number.isFinite(volume) ||
        Number(volume) <= 0
      ) {
        continue;
      }

      points.push({
        label: formatter.format(new Date(Number(timestamp) * 1000)),
        volume: Number(volume),
      });
    }

    return points;
  } catch {
    return [];
  }
}

async function fetchNasdaqVolumeHistory(
  symbol: string,
): Promise<DailyVolumePoint[]> {
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

    const json = (await response.json()) as NasdaqVolumeResponse;
    const rows = json.data?.tradesTable?.rows ?? [];

    return rows
      .map((row) => ({
        label: row.date ?? "",
        volume: parseNasdaqVolume(row.volume ?? ""),
      }))
      .filter(
        (point) =>
          point.label.length > 0 &&
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

function getVolumeTrend(points: DailyVolumePoint[]): VolumeTrendPoint[] {
  const trend: VolumeTrendPoint[] = [];

  for (let index = 89; index < points.length; index += 1) {
    const recent7 = points.slice(Math.max(0, index - 6), index + 1);
    const recent90 = points.slice(index - 89, index + 1);

    if (recent7.length < 7 || recent90.length < 90) {
      continue;
    }

    const volume7dAvg = average(recent7.map((point) => point.volume));
    const volume90dAvg = average(recent90.map((point) => point.volume));

    if (volume90dAvg <= 0) {
      continue;
    }

    trend.push({
      label: points[index].label,
      volume7dAvg,
      volume90dAvg,
      percentVs90d: (volume7dAvg / volume90dAvg - 1) * 100,
    });
  }

  return trend.slice(-VOLUME_TREND_POINTS);
}

export async function fetchStockVolumeTrend(
  symbol: string,
): Promise<VolumeTrendData> {
  const yahoo = await fetchYahooVolumeHistory(symbol);
  const history =
    yahoo.length >= 90 ? yahoo : await fetchNasdaqVolumeHistory(symbol);
  const source: VolumeTrendData["source"] =
    yahoo.length >= 90 ? "yahoo" : "nasdaq";

  return {
    points: getVolumeTrend(history),
    source,
  };
}
