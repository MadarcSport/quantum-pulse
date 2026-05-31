export type StockQuote = {
  symbol: string;
  date: string;
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  source: "yahoo" | "nasdaq";
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
    const open = row.regularMarketOpen;
    const high = row.regularMarketDayHigh;
    const low = row.regularMarketDayLow;
    const volume = row.regularMarketVolume;
    const marketTime = row.regularMarketTime;

    if (
      !Number.isFinite(close) ||
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

  if (!latest) {
    return null;
  }

  const open = parseNasdaqNumber(latest.open ?? "");
  const high = parseNasdaqNumber(latest.high ?? "");
  const low = parseNasdaqNumber(latest.low ?? "");
  const close = parseNasdaqNumber(latest.close ?? "");
  const volume = parseNasdaqNumber(latest.volume ?? "");

  if (
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
