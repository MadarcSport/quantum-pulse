"use client";

import { useEffect, useState } from "react";
import type { StockQuote } from "../lib/stock-quote";
import { StockChartDialog } from "./stock-chart-dialog";
import styles from "./stock-snapshot-section.module.css";

type StockSnapshotSectionProps = {
  title: string;
  stockName: string;
  quote: StockQuote | null;
  avgVolume90d: number | null;
  showChart?: boolean;
};

function toSourceLabel(source: StockQuote["source"]) {
  return source === "yahoo" ? "Yahoo Finance" : "Nasdaq";
}

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

export function StockSnapshotSection({
  title,
  stockName,
  quote,
  avgVolume90d,
  showChart = true,
}: StockSnapshotSectionProps) {
  const [isChartOpen, setIsChartOpen] = useState(false);

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

  const stats = quote
    ? [
        { label: "Ticker", value: quote.symbol },
        { label: "Last", value: formatPrice(quote.close), emphasize: true },
        { label: "Open", value: formatPrice(quote.open) },
        { label: "High", value: formatPrice(quote.high) },
        { label: "Low", value: formatPrice(quote.low) },
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
        { label: "Date", value: quote.date },
        { label: "Time", value: quote.time },
      ]
    : [];

  useEffect(() => {
    if (!isChartOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsChartOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isChartOpen]);

  return (
    <>
      <section className={styles.sectionCard}>
        <div className={styles.headerRow}>
          <div className={styles.titleWrap}>
            <h2 className={styles.title}>{title} Snapshot</h2>
            <p className={styles.source}>
              Source: {quote ? toSourceLabel(quote.source) : "N/A"} (cached 60s)
            </p>
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
          <div className={styles.statsGrid}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.statItem}>
                <p className={styles.statLabel}>{stat.label}</p>
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
            ))}
          </div>
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
    </>
  );
}
