import { HeroSection } from "./components/hero-section";
import { NewsPreviewSection } from "./components/news-preview-section";
import { StockSnapshotSection } from "./components/stock-snapshot-section";
import { fetchAverageVolume90d, fetchStockQuote } from "./lib/stock-quote";
import { getEnabledStocks } from "./lib/stocks-config";

export default async function Home() {
  const enabledStocks = getEnabledStocks();
  const stocksWithQuotes = await Promise.all(
    enabledStocks.map(async (stock) => ({
      ...stock,
      quote: await fetchStockQuote(stock.symbol),
      avgVolume90d: await fetchAverageVolume90d(stock.symbol),
    })),
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

        {stocksWithQuotes.length > 0 ? (
          stocksWithQuotes.map((stock) => (
            <StockSnapshotSection
              key={stock.symbol}
              title={stock.symbol}
              stockName={stock.name}
              quote={stock.quote}
              avgVolume90d={stock.avgVolume90d}
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

        <NewsPreviewSection />

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
