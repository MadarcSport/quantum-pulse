"use client";

import { useEffect, useState } from "react";
import type { StockCmfMetrics, StockQuote } from "../lib/stock-quote";
import { StockForecastCard } from "./stock-forecast-card";
import { StockChartDialog } from "./stock-chart-dialog";
import styles from "./stock-snapshot-section.module.css";

type StockSnapshotSectionProps = {
  title: string;
  stockName: string;
  logoUrl?: string;
  quote: StockQuote | null;
  avgVolume90d: number | null;
  cmfMetrics: StockCmfMetrics;
  showChart?: boolean;
};

function toSourceLabel(source: StockQuote["source"]) {
  return source === "yahoo" ? "Yahoo Finance" : "Nasdaq";
}

const SHOW_QUOTE_DEBUG_BADGE =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_SHOW_QUOTE_DEBUG === "1";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function renderStatItem(
  stat: {
    label: string;
    value: string;
    color?: string;
    emphasize?: boolean;
  },
  onOpenCmfHelp: () => void,
) {
  return (
    <div key={stat.label} className={styles.statItem}>
      <p className={styles.statLabel}>
        <span>{stat.label}</span>
        {stat.label === "CMF (7d) vs 90d Avg" ? (
          <button
            type="button"
            className={styles.helpIconButton}
            onClick={onOpenCmfHelp}
            aria-label="Explain CMF (7d) vs 90d Avg"
          >
            ?
          </button>
        ) : null}
      </p>
      <p
        className={styles.statValue}
        style={{
          fontWeight: stat.emphasize ? 700 : 600,
          color: stat.color ?? "#e2e8f0",
        }}
      >
        {stat.value}
      </p>
    </div>
  );
}

export function StockSnapshotSection({
  title,
  stockName,
  logoUrl,
  quote,
  avgVolume90d,
  cmfMetrics,
  showChart = true,
}: StockSnapshotSectionProps) {
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isCmfHelpOpen, setIsCmfHelpOpen] = useState(false);
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [hasLogoError, setHasLogoError] = useState(false);
  const showLogoFallback = !logoUrl || hasLogoError;

  const volumeDeltaPct =
    quote && avgVolume90d && avgVolume90d > 0
      ? ((quote.volume - avgVolume90d) / avgVolume90d) * 100
      : null;
  const volumeDeltaColor =
    volumeDeltaPct === null
      ? "#94a3b8"
      : volumeDeltaPct >= 0
        ? "#22c55e"
        : "#f87171";

  const cmfDelta =
    cmfMetrics.cmf7d !== null && cmfMetrics.cmf7dAvg90d !== null
      ? cmfMetrics.cmf7d - cmfMetrics.cmf7dAvg90d
      : null;
  const cmfDeltaColor =
    cmfDelta === null ? "#94a3b8" : cmfDelta >= 0 ? "#22c55e" : "#f87171";

  const dayChangePct =
    quote && quote.previousClose > 0
      ? ((quote.close - quote.previousClose) / quote.previousClose) * 100
      : null;
  const dayChangeColor =
    dayChangePct === null
      ? "#94a3b8"
      : dayChangePct >= 0
        ? "#22c55e"
        : "#f87171";

  const stats = quote
    ? [
        {
          label: "% Change (vs Prev Close)",
          value:
            dayChangePct !== null
              ? `${dayChangePct >= 0 ? "+" : ""}${dayChangePct.toFixed(2)}%`
              : "N/A",
          color: dayChangeColor,
        },
        { label: "Last", value: formatPrice(quote.close), emphasize: true },
        { label: "Open", value: formatPrice(quote.open) },
        { label: "Volume", value: formatNumber(quote.volume) },
        {
          label: "Avg Volume (90d)",
          value:
            avgVolume90d !== null
              ? formatNumber(Math.round(avgVolume90d))
              : "N/A",
        },
        {
          label: "Volume vs 90d Avg",
          value:
            volumeDeltaPct !== null
              ? `${volumeDeltaPct >= 0 ? "+" : ""}${volumeDeltaPct.toFixed(1)}%`
              : "N/A",
          color: volumeDeltaColor,
        },
        {
          label: "CMF (7d) vs 90d Avg",
          value:
            cmfDelta !== null
              ? `${cmfDelta >= 0 ? "+" : ""}${cmfDelta.toFixed(3)}`
              : "N/A",
          color: cmfDeltaColor,
        },
        { label: "Date", value: quote.date },
      ]
    : [];
  const primaryStats = stats.slice(0, 2);
  const extraStats = stats.slice(2);

  useEffect(() => {
    if (!isChartOpen && !isCmfHelpOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsChartOpen(false);
        setIsCmfHelpOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isChartOpen, isCmfHelpOpen]);

  return (
    <>
      <section className={styles.sectionCard}>
        <div className={styles.headerRow}>
          <div className={styles.titleWrap}>
            <div className={styles.titleRow}>
              {logoUrl && !hasLogoError ? (
                <img
                  src={logoUrl}
                  alt={`${stockName} logo`}
                  className={styles.logo}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => setHasLogoError(true)}
                />
              ) : null}
              {showLogoFallback ? (
                <span className={styles.logoFallback} aria-hidden="true">
                  {title.slice(0, 1)}
                </span>
              ) : null}

              <div className={styles.nameBlock}>
                <h2 className={styles.symbolPrimary}>{title}</h2>
                <p className={styles.companyName}>{stockName}</p>
              </div>
            </div>
          </div>

          {showChart ? (
            <button
              type="button"
              onClick={() => setIsChartOpen(true)}
              className={styles.chartButton}
            >
              Chart
            </button>
          ) : null}
        </div>

        {quote ? (
          <>
            <div className={styles.desktopStatsGrid}>
              {stats.map((stat) =>
                renderStatItem(stat, () => setIsCmfHelpOpen(true)),
              )}
            </div>

            <div className={styles.mobileStatsWrap}>
              <div className={styles.statsGrid}>
                {primaryStats.map((stat) =>
                  renderStatItem(stat, () => setIsCmfHelpOpen(true)),
                )}
              </div>

              {extraStats.length > 0 && !isMobileExpanded ? (
                <div className={styles.mobileToggleWrap}>
                  <button
                    type="button"
                    className={styles.showMoreButton}
                    onClick={() => setIsMobileExpanded((current) => !current)}
                    aria-expanded={isMobileExpanded}
                  >
                    {isMobileExpanded ? "Show less" : "Show more"}
                  </button>
                </div>
              ) : null}

              <div
                className={`${styles.statsGrid} ${styles.mobileExtraGrid} ${isMobileExpanded ? styles.mobileExpanded : ""}`}
              >
                {extraStats.map((stat) =>
                  renderStatItem(stat, () => setIsCmfHelpOpen(true)),
                )}
              </div>

              {extraStats.length > 0 && isMobileExpanded ? (
                <div className={styles.mobileToggleWrap}>
                  <button
                    type="button"
                    className={styles.showMoreButton}
                    onClick={() => setIsMobileExpanded(false)}
                    aria-expanded={isMobileExpanded}
                  >
                    Show less
                  </button>
                </div>
              ) : null}
            </div>

            <div
              className={`${styles.forecastWrap} ${isMobileExpanded ? styles.forecastExpanded : ""}`}
            >
              <p className={styles.sourceMeta}>
                Source: {toSourceLabel(quote.source)} (cached 60s)
                {SHOW_QUOTE_DEBUG_BADGE && quote.quotePath ? (
                  <span className={styles.debugBadge}>{quote.quotePath}</span>
                ) : null}
              </p>
              <StockForecastCard
                volumeSurgePct={volumeDeltaPct}
                cmfSpread={cmfDelta}
                mfVelocity={cmfMetrics.mfVelocity}
              />
            </div>
          </>
        ) : (
          <p className={styles.errorText}>
            {title} quote is temporarily unavailable.
          </p>
        )}
      </section>

      {showChart && isChartOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${title} chart`}
          onClick={() => setIsChartOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            background: "rgba(2, 6, 23, 0.76)",
            display: "grid",
            alignItems: "center",
            justifyItems: "center",
            padding: "16px clamp(12px, 3vw, 24px)",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(960px, 100%)",
              maxHeight: "min(90vh, 920px)",
              overflowY: "auto",
              borderRadius: 20,
              border: "1px solid rgba(148, 163, 184, 0.22)",
              background:
                "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98))",
              boxShadow: "0 24px 90px rgba(2, 6, 23, 0.5)",
              padding: "18px clamp(14px, 3vw, 24px)",
              display: "grid",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1.15rem" }}>
                {title} Chart
              </h3>
              <button
                type="button"
                onClick={() => setIsChartOpen(false)}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.35)",
                  background: "transparent",
                  color: "#cbd5e1",
                  borderRadius: 999,
                  padding: "8px 14px",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <StockChartDialog symbol={title} name={stockName} />
          </div>
        </div>
      ) : null}

      {isCmfHelpOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="CMF explanation"
          onClick={() => setIsCmfHelpOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(2, 6, 23, 0.76)",
            display: "grid",
            alignItems: "center",
            justifyItems: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(620px, 100%)",
              borderRadius: 16,
              border: "1px solid rgba(148, 163, 184, 0.3)",
              background:
                "linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98))",
              boxShadow: "0 20px 70px rgba(2, 6, 23, 0.45)",
              padding: "16px 18px",
              display: "grid",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1rem" }}>
                CMF (7d) vs 90d Avg
              </h3>
              <button
                type="button"
                onClick={() => setIsCmfHelpOpen(false)}
                style={{
                  border: "1px solid rgba(148, 163, 184, 0.35)",
                  background: "transparent",
                  color: "#cbd5e1",
                  borderRadius: 999,
                  padding: "6px 12px",
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>

            <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
              This metric compares recent Chaikin Money Flow (CMF) to its recent
              baseline.
            </p>
            <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
              It is calculated as:{" "}
              <strong>
                CMF(7d) - average rolling CMF(7d) over the last ~90 trading days
              </strong>
              .
            </p>
            <p style={{ margin: 0, color: "#cbd5e1", lineHeight: 1.6 }}>
              Positive values (for example <strong>+0.273</strong>) mean recent
              money-flow pressure is stronger than the 90-day baseline. Negative
              values mean weaker pressure.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
