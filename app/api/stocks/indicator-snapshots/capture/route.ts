import { NextResponse } from "next/server";
import {
  fetchAverageVolume7d,
  fetchAverageVolume90d,
  fetchCmfMetrics,
  fetchStockQuote,
} from "../../../../lib/stock-quote";
import { saveStockIndicatorSnapshot } from "../../../../lib/stock-indicator-snapshots";
import { getEnabledStocks } from "../../../../lib/stocks-config";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = [];

  for (const stock of getEnabledStocks()) {
    const [quote, avgVolume7d, avgVolume90d, cmfMetrics] = await Promise.all([
      fetchStockQuote(stock.symbol),
      fetchAverageVolume7d(stock.symbol),
      fetchAverageVolume90d(stock.symbol),
      fetchCmfMetrics(stock.symbol),
    ]);

    await saveStockIndicatorSnapshot({
      symbol: stock.symbol,
      quote,
      avgVolume7d,
      avgVolume90d,
      cmfMetrics,
    });

    results.push({
      symbol: stock.symbol,
      saved: Boolean(quote),
      tradingDate: quote?.date ?? null,
    });
  }

  return NextResponse.json(
    {
      saved: results.filter((result) => result.saved).length,
      total: results.length,
      results,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function GET(request: Request) {
  return POST(request);
}
