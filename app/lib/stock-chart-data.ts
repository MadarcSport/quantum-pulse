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

async function fetchYahooHistory(
  symbol: string,
  interval: "5m" | "1d",
  range: "5d" | "1y",
): Promise<ChartPoint[]> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?range=${range}&interval=${interval}&includePrePost=false&events=div%2Csplits`,
      {
        next: { revalidate: 60 },
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
    const formatter =
      interval === "1d"
        ? new Intl.DateTimeFormat("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            timeZone: "America/New_York",
          })
        : new Intl.DateTimeFormat("en-US", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
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
  intradayLike: ChartPoint[],
  daily: ChartPoint[],
  source: "yahoo" | "nasdaq",
): ChartData {
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

  const dayReference = daily.length > 1 ? daily[daily.length - 2]?.close : null;

  return {
    ranges: {
      day: intradayLike.slice(-80),
      month,
      ytd: ytdPoints,
    },
    changeReference: {
      day: dayReference,
      month: monthReference,
      ytd: ytdReference,
    },
    source,
  };
}

export async function fetchStockChartData(symbol: string): Promise<ChartData> {
  const [yahooIntraday, yahooDaily, nasdaq] = await Promise.all([
    fetchYahooHistory(symbol, "5m", "5d"),
    fetchYahooHistory(symbol, "1d", "1y"),
    fetchNasdaqHistory(symbol),
  ]);

  const historyForChart = yahooDaily.length > 1 ? yahooDaily : nasdaq;
  const dayForChart =
    yahooIntraday.length > 1 ? yahooIntraday : historyForChart;
  const source: "yahoo" | "nasdaq" = yahooDaily.length > 1 ? "yahoo" : "nasdaq";

  return getChartData(dayForChart, historyForChart, source);
}
