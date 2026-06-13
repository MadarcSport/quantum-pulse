"use client";

import { useEffect, useMemo, useState } from "react";
import { StockSnapshotSection } from "../components/stock-snapshot-section";
import styles from "./stocks-page-client.module.css";

import type { StockCmfMetrics, StockQuote } from "../lib/stock-quote";

export type StocksPageStock = {
  symbol: string;
  name: string;
  logoUrl?: string;
  showChart?: boolean;
  quote: StockQuote | null;
  avgVolume7d: number | null;
  avgVolume90d: number | null;
  cmfMetrics: StockCmfMetrics;
  originalIndex: number;
  metrics: {
    dayChangePct: number | null;
    volumeDeltaPct: number | null;
    cmfDelta: number | null;
    mfVelocity: number | null;
  };
};

type FilterKey = "dayChangePct" | "volumeDeltaPct" | "cmfDelta" | "mfVelocity";

type FilterOption = {
  key: FilterKey;
  label: string;
};

const FILTER_OPTIONS: FilterOption[] = [
  { key: "dayChangePct", label: "% Change" },
  { key: "volumeDeltaPct", label: "Volume 7d vs 90d Avg" },
  { key: "cmfDelta", label: "CMF (7d) vs 90d Avg" },
  { key: "mfVelocity", label: "MF Velocity" },
];

function compareNullableDesc(a: number | null, b: number | null): number {
  if (a === null && b === null) {
    return 0;
  }

  if (a === null) {
    return 1;
  }

  if (b === null) {
    return -1;
  }

  return b - a;
}

export function StocksPageClient({ stocks }: { stocks: StocksPageStock[] }) {
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sortedStocks = useMemo(() => {
    if (activeFilter === null) {
      return stocks;
    }

    return [...stocks].sort((left, right) => {
      const metricOrder = compareNullableDesc(
        left.metrics[activeFilter],
        right.metrics[activeFilter],
      );

      if (metricOrder !== 0) {
        return metricOrder;
      }

      return left.originalIndex - right.originalIndex;
    });
  }, [activeFilter, stocks]);

  const activeLabel = FILTER_OPTIONS.find(
    (option) => option.key === activeFilter,
  )?.label;

  useEffect(() => {
    if (!isFilterOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterOpen]);

  return (
    <section style={{ display: "grid", gap: 8 }}>
      <section className={styles.filterCard} aria-label="Stock filters">
        <div className={styles.filterHeader}>
          <div className={styles.filterHeadlineRow}>
            <button
              type="button"
              className={styles.openFilterButton}
              onClick={() => setIsFilterOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isFilterOpen}
            >
              Filter
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
                className={styles.filterButtonIcon}
              >
                <path
                  d="M4 7h5m6 0h5M9 7a2 2 0 1 1 4 0 2 2 0 0 1-4 0ZM4 17h9m6 0h1m-5 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className={styles.filterState}>
            {activeLabel ? `Sorted by ${activeLabel}` : "Default order"}
          </div>
        </div>
      </section>

      {isFilterOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Stock filters"
          className={styles.filterOverlay}
          onClick={() => setIsFilterOpen(false)}
        >
          <div
            className={styles.filterModal}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.filterModalHeader}>
              <h2 className={styles.filterTitle}>Choose a sort metric</h2>

              <button
                type="button"
                className={styles.modalCloseButton}
                onClick={() => setIsFilterOpen(false)}
              >
                Close
              </button>
            </div>

            <p className={styles.filterDescription}>
              Sort the stock cards by any of these metrics.
            </p>

            <div className={styles.filterButtonRow}>
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  className={`${styles.filterButton} ${activeFilter === option.key ? styles.filterButtonActive : ""}`}
                  aria-pressed={activeFilter === option.key}
                  onClick={() => {
                    setActiveFilter(option.key);
                    setIsFilterOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}

              <button
                type="button"
                className={styles.clearButton}
                onClick={() => {
                  setActiveFilter(null);
                  setIsFilterOpen(false);
                }}
                disabled={activeFilter === null}
              >
                Clear filter
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 28 }}>
        {sortedStocks.map((stock) => (
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
      </div>
    </section>
  );
}
