import { NextResponse } from "next/server";
import { fetchStockIndicatorSnapshots } from "../../../../lib/stock-indicator-snapshots";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { symbol } = await context.params;
  const { searchParams } = new URL(request.url);
  const days = Number(searchParams.get("days") ?? "5");
  const data = await fetchStockIndicatorSnapshots(symbol, days);

  return NextResponse.json(
    { data },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
