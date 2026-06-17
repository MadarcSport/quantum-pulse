import { HeroSection } from "./components/hero-section";
import { MoreStocksButton } from "./components/more-stocks-button";
import { NewsPreviewSection } from "./components/news-preview-section";
import { StockSnapshotSection } from "./components/stock-snapshot-section";
import {
  fetchAverageVolume7d,
  fetchAverageVolume90d,
  fetchCmfMetrics,
  fetchStockQuote,
} from "./lib/stock-quote";
import { saveStockIndicatorSnapshot } from "./lib/stock-indicator-snapshots";
import { getEnabledStocks } from "./lib/stocks-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Home() {
  const enabledStocks = getEnabledStocks();
  const previewStocks = enabledStocks.slice(0, 3);
  const previewStocksWithQuotes = await Promise.all(
    previewStocks.map(async (stock) => {
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

      return {
        ...stock,
        quote,
        avgVolume7d,
        avgVolume90d,
        cmfMetrics,
      };
    }),
  );

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
        <HeroSection />

        {previewStocksWithQuotes.length > 0 ? (
          previewStocksWithQuotes.map((stock) => (
            <StockSnapshotSection
              key={stock.symbol}
              title={stock.symbol}
              stockName={stock.name}
              logoUrl={stock.logoUrl}
              quote={stock.quote}
              avgVolume7d={stock.avgVolume7d}
              avgVolume90d={stock.avgVolume90d}
              cmfMetrics={stock.cmfMetrics}
              showChart={stock.showChart}
            />
          ))
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

        {enabledStocks.length > previewStocks.length ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MoreStocksButton />
          </div>
        ) : null}

        <div style={{ marginTop: 20 }}>
          <NewsPreviewSection />
        </div>

        <p
          style={{
            margin: 0,
            color: "#94a3b8",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          For informational purposes only.
        </p>
      </section>
    </main>
  );
}
