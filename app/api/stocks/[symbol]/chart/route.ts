import { NextResponse } from "next/server";
import { fetchStockChartData } from "../../../../lib/stock-chart-data";

type RouteContext = {
  params: Promise<{
    symbol: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { symbol } = await context.params;
  const data = await fetchStockChartData(symbol);

  return NextResponse.json(
    { data },
    {
      headers: {
        "Cache-Control":
          "public, max-age=30, s-maxage=60, stale-while-revalidate=120",
      },
    },
  );
}
