import { HeroSection3 } from "../components/hero-section-3";
import { StocksPageClient } from "./stocks-page-client";
import {
  fetchAverageVolume7d,
  fetchAverageVolume90d,
  fetchCmfMetrics,
  fetchStockQuote,
} from "../lib/stock-quote";
import { getEnabledStocks } from "../lib/stocks-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function StocksPage() {
  const enabledStocks = getEnabledStocks();
  const stocksWithQuotes = await Promise.all(
    enabledStocks.map(async (stock) => ({
      ...stock,
      quote: await fetchStockQuote(stock.symbol),
      avgVolume7d: await fetchAverageVolume7d(stock.symbol),
      avgVolume90d: await fetchAverageVolume90d(stock.symbol),
      cmfMetrics: await fetchCmfMetrics(stock.symbol),
    })),
  );

  const stocksForClient = stocksWithQuotes.map((stock, originalIndex) => {
    const dayChangePct =
      stock.quote && stock.quote.previousClose > 0
        ? ((stock.quote.close - stock.quote.previousClose) /
            stock.quote.previousClose) *
          100
        : null;

    const volumeDeltaPct =
      stock.avgVolume7d !== null &&
      stock.avgVolume90d !== null &&
      stock.avgVolume90d > 0
        ? ((stock.avgVolume7d - stock.avgVolume90d) / stock.avgVolume90d) * 100
        : null;

    const cmfDelta =
      stock.cmfMetrics.cmf7d !== null && stock.cmfMetrics.cmf7dAvg90d !== null
        ? stock.cmfMetrics.cmf7d - stock.cmfMetrics.cmf7dAvg90d
        : null;

    return {
      ...stock,
      originalIndex,
      metrics: {
        dayChangePct,
        volumeDeltaPct,
        cmfDelta,
        mfVelocity: stock.cmfMetrics.mfVelocity,
      },
    };
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #020617 0%, #0f172a 50%, #020617 100%)",
        color: "#e2e8f0",
        padding: "32px 20px 48px",
      }}
    >
      <section
        style={{
          margin: "0 auto",
          maxWidth: 1120,
          display: "grid",
          gap: 28,
        }}
      >
        <HeroSection3 />

        {stocksForClient.length > 0 ? (
          <StocksPageClient stocks={stocksForClient} />
        ) : (
          <section
            style={{
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: 16,
              background: "rgba(15, 23, 42, 0.72)",
              padding: 20,
            }}
          >
            <p style={{ margin: 0, color: "#fda4af" }}>
              No enabled stocks found. Set at least one item to
              <code style={{ marginLeft: 6, marginRight: 6 }}>
                enabled: true
              </code>
              in <code>app/data/stocks.json</code>.
            </p>
          </section>
        )}
      </section>
    </main>
  );
}
