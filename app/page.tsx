import { Suspense } from "react";
import { EbookPreviewSection } from "./components/ebook-preview-section";
import { MoreStocksButton } from "./components/more-stocks-button";
import { NewsPreviewSection } from "./components/news-preview-section";
import previewStyles from "./components/news-preview-section.module.css";
import { StockSnapshotSection } from "./components/stock-snapshot-section";
import stockSnapshotStyles from "./components/stock-snapshot-section.module.css";
import {
  fetchAverageVolume7d,
  fetchAverageVolume90d,
  fetchCmfMetrics,
  fetchStockQuote,
} from "./lib/stock-quote";
import { getEnabledStocks } from "./lib/stocks-config";
import { HeroSection3 } from "./components/hero-section-3";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function SkeletonBar({
  width,
  height = 12,
}: {
  width: string;
  height?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width,
        height,
        borderRadius: 999,
        background:
          "linear-gradient(90deg, rgba(148, 163, 184, 0.18), rgba(56, 189, 248, 0.22), rgba(148, 163, 184, 0.18))",
      }}
    />
  );
}

function StockPreviewSkeletonCard({ index }: { index: number }) {
  const statWidths = ["62%", "44%", "48%", "58%", "68%", "52%", "46%", "38%"];

  return (
    <section
      className={stockSnapshotStyles.sectionCard}
      aria-label="Loading stock preview"
      aria-busy="true"
    >
      <div className={stockSnapshotStyles.headerRow}>
        <div className={stockSnapshotStyles.titleWrap}>
          <div className={stockSnapshotStyles.titleRow}>
            <span
              className={stockSnapshotStyles.logoFallback}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <div className={stockSnapshotStyles.nameBlock}>
              <SkeletonBar width="72px" height={20} />
              <SkeletonBar width="180px" height={12} />
            </div>
          </div>
        </div>

        <button
          type="button"
          className={stockSnapshotStyles.chartButton}
          disabled
          aria-hidden="true"
          tabIndex={-1}
          style={{ opacity: 0.6 }}
        >
          Chart
        </button>
      </div>

      <div className={stockSnapshotStyles.desktopStatsGrid}>
        {statWidths.map((width, statIndex) => (
          <div key={statIndex} className={stockSnapshotStyles.statItem}>
            <SkeletonBar width="58%" height={10} />
            <SkeletonBar width={width} height={16} />
          </div>
        ))}
      </div>

      <div className={stockSnapshotStyles.mobileStatsWrap}>
        <div className={stockSnapshotStyles.statsGrid}>
          {statWidths.slice(0, 2).map((width, statIndex) => (
            <div key={statIndex} className={stockSnapshotStyles.statItem}>
              <SkeletonBar width="58%" height={10} />
              <SkeletonBar width={width} height={16} />
            </div>
          ))}
        </div>

        <div className={stockSnapshotStyles.mobileToggleWrap}>
          <button
            type="button"
            className={stockSnapshotStyles.showMoreButton}
            disabled
            aria-hidden="true"
            tabIndex={-1}
            style={{ opacity: 0.6 }}
          >
            Show more
          </button>
        </div>
      </div>

      <div className={stockSnapshotStyles.forecastWrap}>
        <SkeletonBar width="220px" height={13} />
        <div className={stockSnapshotStyles.statItem}>
          <SkeletonBar width="35%" height={10} />
          <SkeletonBar width="70%" height={16} />
        </div>
      </div>
    </section>
  );
}

function StockPreviewFallback({
  enabledStocks,
}: {
  enabledStocks: ReturnType<typeof getEnabledStocks>;
}) {
  const previewCount = Math.min(enabledStocks.length, 3);
  const skeletonCount = previewCount > 0 ? previewCount : 1;

  return (
    <>
      {Array.from({ length: skeletonCount }, (_, index) => (
        <StockPreviewSkeletonCard key={index} index={index} />
      ))}

      {enabledStocks.length > previewCount ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 42,
          }}
          aria-hidden="true"
        />
      ) : null}
    </>
  );
}

async function StockPreviewSections({
  enabledStocks,
}: {
  enabledStocks: ReturnType<typeof getEnabledStocks>;
}) {
  const previewStocks = enabledStocks.slice(0, 3);
  const previewStocksWithQuotes = await Promise.all(
    previewStocks.map(async (stock) => {
      const [quote, avgVolume7d, avgVolume90d, cmfMetrics] = await Promise.all([
        fetchStockQuote(stock.symbol),
        fetchAverageVolume7d(stock.symbol),
        fetchAverageVolume90d(stock.symbol),
        fetchCmfMetrics(stock.symbol),
      ]);

      return {
        ...stock,
        quote,
        avgVolume7d,
        avgVolume90d,
        cmfMetrics,
      };
    }),
  );

  if (previewStocksWithQuotes.length === 0) {
    return (
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
          <code style={{ marginLeft: 6, marginRight: 6 }}>enabled: true</code>
          in <code>app/data/stocks.json</code>.
        </p>
      </section>
    );
  }

  return (
    <>
      {previewStocksWithQuotes.map((stock) => (
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
      ))}

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
    </>
  );
}

export default function Home() {
  const enabledStocks = getEnabledStocks();

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
        <HeroSection3
          title="Quantum Computing"
          description="Selection of Stocks involved in Quantum Computing research, development, or applications."
        />

        <section className={previewStyles.section} aria-label="Stocks preview">
          <div className={previewStyles.header}>
            <div className={previewStyles.headerText}>
              <p className={previewStyles.kicker}>Stocks Preview</p>
              <h2 className={previewStyles.title}>Featured Quantum Stocks</h2>
            </div>
          </div>

          <Suspense
            fallback={<StockPreviewFallback enabledStocks={enabledStocks} />}
          >
            <StockPreviewSections enabledStocks={enabledStocks} />
          </Suspense>
        </section>

        <div style={{ marginTop: 20 }}>
          <NewsPreviewSection />
        </div>

        <div style={{ marginTop: 20 }}>
          <EbookPreviewSection />
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
