export type ChartPoint = {
  label: string;
  close: number;
};

export type ChartRanges = {
  day: ChartPoint[];
  month: ChartPoint[];
  ytd: ChartPoint[];
};

export type ChartChangeReference = {
  day: number | null;
  month: number | null;
  ytd: number | null;
};

export type ChartData = {
  ranges: ChartRanges;
  changeReference: ChartChangeReference;
  source: "yahoo" | "nasdaq";
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
};

type NasdaqHistoricalResponse = {
  data?: {
    tradesTable?: {
      rows?: Array<{
        date: string;
        close: string;
      }>;
    };
  };
};

const FETCH_TIMEOUT_MS = 3500;
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

async function fetchYahooHistory(
  symbol: string,
  range: "1y",
): Promise<ChartPoint[]> {
  try {
    const response = await fetchWithTimeout(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?range=${range}&interval=1d&includePrePost=false&events=div%2Csplits`,
      {
        headers: YAHOO_HEADERS,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return [];
    }

    const json = (await response.json()) as YahooChartResponse;
    const result = json.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];

    if (timestamps.length === 0 || closes.length === 0) {
      return [];
    }

    const points: ChartPoint[] = [];
    const formatter = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "America/New_York",
    });

    for (let i = 0; i < timestamps.length; i += 1) {
      const timestamp = timestamps[i];
      const closeValue = closes[i];

      if (!Number.isFinite(closeValue)) {
        continue;
      }

      const date = new Date(timestamp * 1000);

      points.push({
        label: formatter.format(date),
        close: Number(closeValue),
      });
    }

    return points;
  } catch {
    return [];
  }
}

function parseNasdaqPrice(value: string): number {
  return Number(value.replace(/[$,\s]/g, ""));
}

function getYearFromLabel(label: string): number | null {
  const normalized = label.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return Number(normalized.slice(0, 4));
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(normalized)) {
    const parts = normalized.split("/");
    return Number(parts[2]);
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.getFullYear();
}

async function fetchNasdaqHistory(symbol: string): Promise<ChartPoint[]> {
  try {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const toDate = today.toISOString().slice(0, 10);
    const fromDate = oneYearAgo.toISOString().slice(0, 10);
    const url = `https://api.nasdaq.com/api/quote/${symbol.toUpperCase()}/historical?assetclass=stocks&fromdate=${fromDate}&todate=${toDate}&limit=365`;

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

    const json = (await response.json()) as NasdaqHistoricalResponse;
    const rows = json.data?.tradesTable?.rows ?? [];

    return rows
      .map((row) => ({
        label: row.date,
        close: parseNasdaqPrice(row.close),
      }))
      .filter((point) => Number.isFinite(point.close))
      .reverse();
  } catch {
    return [];
  }
}

function getChartData(
  daily: ChartPoint[],
  source: "yahoo" | "nasdaq",
): ChartData {
  const fiveDays = daily.slice(-5);
  const fiveDaysStartIndex = Math.max(daily.length - fiveDays.length, 0);
  const fiveDaysReference =
    fiveDaysStartIndex > 0
      ? (daily[fiveDaysStartIndex - 1]?.close ?? null)
      : (fiveDays[0]?.close ?? null);

  const month = daily.slice(-22);
  const monthStartIndex = Math.max(daily.length - month.length, 0);
  const monthReference =
    monthStartIndex > 0
      ? (daily[monthStartIndex - 1]?.close ?? null)
      : (month[0]?.close ?? null);

  const currentYear = new Date().getFullYear();
  const ytdStartIndex = daily.findIndex(
    (point) => getYearFromLabel(point.label) === currentYear,
  );
  const ytd = ytdStartIndex >= 0 ? daily.slice(ytdStartIndex) : [];
  const ytdPoints = ytd.length > 1 ? ytd : daily;
  const ytdReference =
    ytdStartIndex > 0
      ? (daily[ytdStartIndex - 1]?.close ?? null)
      : (ytdPoints[0]?.close ?? null);

  return {
    ranges: {
      day: fiveDays,
      month,
      ytd: ytdPoints,
    },
    changeReference: {
      day: fiveDaysReference,
      month: monthReference,
      ytd: ytdReference,
    },
    source,
  };
}

export async function fetchStockChartData(symbol: string): Promise<ChartData> {
  const [yahooDaily, nasdaq] = await Promise.all([
    fetchYahooHistory(symbol, "1y"),
    fetchNasdaqHistory(symbol),
  ]);

  const historyForChart = yahooDaily.length > 1 ? yahooDaily : nasdaq;
  const source: "yahoo" | "nasdaq" = yahooDaily.length > 1 ? "yahoo" : "nasdaq";

  return getChartData(historyForChart, source);
}
