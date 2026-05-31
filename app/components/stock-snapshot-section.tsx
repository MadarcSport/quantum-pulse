"use client";

import { useEffect, useState } from "react";
import type { StockQuote } from "../lib/stock-quote";
import { StockChartDialog } from "./stock-chart-dialog";

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
      <section
        style={{
          border: "1px solid rgba(148, 163, 184, 0.2)",
          borderRadius: 16,
          background: "rgba(15, 23, 42, 0.72)",
          padding: 20,
          display: "grid",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "grid", gap: 4 }}>
            <h2
              style={{
                margin: 0,
                fontSize: "1.25rem",
                color: "#f8fafc",
              }}
            >
              {title} Snapshot
            </h2>
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
              Source: {quote ? toSourceLabel(quote.source) : "N/A"} (cached 60s)
            </p>
          </div>

          {showChart ? (
            <button
              type="button"
              onClick={() => setIsChartOpen(true)}
              style={{
                border: "1px solid rgba(56, 189, 248, 0.55)",
                background: "rgba(14, 165, 233, 0.16)",
                color: "#e0f2fe",
                borderRadius: 999,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Chart
            </button>
          ) : null}
        </div>

        {quote ? (
          <div
            style={{
              display: "grid",
              gap: 10,
              gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            }}
          >
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>
                Ticker
              </p>
              <p style={{ margin: "4px 0 0", fontWeight: 700 }}>
                {quote.symbol}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>Last</p>
              <p style={{ margin: "4px 0 0", fontWeight: 700 }}>
                {formatPrice(quote.close)}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>Open</p>
              <p style={{ margin: "4px 0 0" }}>{formatPrice(quote.open)}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>High</p>
              <p style={{ margin: "4px 0 0" }}>{formatPrice(quote.high)}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>Low</p>
              <p style={{ margin: "4px 0 0" }}>{formatPrice(quote.low)}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>
                Volume
              </p>
              <p style={{ margin: "4px 0 0" }}>{formatNumber(quote.volume)}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>
                Avg Volume (90d)
              </p>
              <p style={{ margin: "4px 0 0" }}>
                {avgVolume90d !== null
                  ? formatNumber(Math.round(avgVolume90d))
                  : "N/A"}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>
                Volume vs 90d Avg
              </p>
              <p style={{ margin: "4px 0 0", color: volumeDeltaColor }}>
                {volumeDeltaPct !== null
                  ? `${volumeDeltaPct >= 0 ? "+" : ""}${volumeDeltaPct.toFixed(1)}%`
                  : "N/A"}
              </p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>Date</p>
              <p style={{ margin: "4px 0 0" }}>{quote.date}</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>Time</p>
              <p style={{ margin: "4px 0 0" }}>{quote.time}</p>
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, color: "#fda4af" }}>
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
