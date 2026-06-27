"use client";

import { useEffect, useState } from "react";
import type { ChartData } from "../lib/stock-chart-data";
import { StockChart } from "./stock-chart";
import { StockVolumeTrendChart } from "./stock-volume-trend-chart";

type StockChartDialogProps = {
  symbol: string;
  name: string;
};

type ChartResponse = {
  data: ChartData;
};

const CHART_DIALOG_THEME_STORAGE_KEY = "stock-chart-dialog-clear-mode";

function toSourceLabel(source: ChartData["source"]) {
  return source === "yahoo" ? "Yahoo Finance" : "Nasdaq";
}

export function StockChartDialog({ symbol, name }: StockChartDialogProps) {
  const [data, setData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClearMode, setIsClearMode] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(CHART_DIALOG_THEME_STORAGE_KEY);
    setIsClearMode(stored === "on");
  }, []);

  function toggleClearMode() {
    setIsClearMode((previous) => {
      const next = !previous;
      window.localStorage.setItem(
        CHART_DIALOG_THEME_STORAGE_KEY,
        next ? "on" : "off",
      );
      return next;
    });
  }

  const toggleTrackBackground = isClearMode
    ? "linear-gradient(180deg, #dbeafe, #bfdbfe)"
    : "linear-gradient(180deg, #0f172a, #1e293b)";
  const toggleTrackBorder = isClearMode
    ? "1px solid rgba(15, 23, 42, 0.2)"
    : "1px solid rgba(148, 163, 184, 0.35)";
  const toggleThumbTransform = isClearMode
    ? "translateX(78px)"
    : "translateX(0px)";

  useEffect(() => {
    let isCancelled = false;

    async function loadChart() {
      try {
        setError(null);
        setData(null);

        const response = await fetch(`/api/stocks/${symbol}/chart`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load chart data.");
        }

        const json = (await response.json()) as ChartResponse;

        if (!isCancelled) {
          setData(json.data);
        }
      } catch {
        if (!isCancelled) {
          setError("Chart data is temporarily unavailable.");
        }
      }
    }

    void loadChart();

    return () => {
      isCancelled = true;
    };
  }, [symbol]);

  if (error) {
    return (
      <p style={{ margin: 0, color: isClearMode ? "#ef4444" : "#fda4af" }}>
        {error}
      </p>
    );
  }

  if (!data) {
    return (
      <div
        style={{
          display: "grid",
          gap: 12,
          minHeight: 260,
        }}
      >
        <p style={{ margin: 0, color: "#cbd5e1", fontSize: 14 }}>
          Loading {symbol.toUpperCase()} chart...
        </p>
        <div
          style={{
            height: 34,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, rgba(51, 65, 85, 0.32), rgba(71, 85, 105, 0.56), rgba(51, 65, 85, 0.32))",
            backgroundSize: "200% 100%",
            animation: "stock-chart-skeleton 1.3s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 220,
            borderRadius: 12,
            border: "1px solid rgba(148, 163, 184, 0.2)",
            background:
              "linear-gradient(90deg, rgba(30, 41, 59, 0.45), rgba(51, 65, 85, 0.6), rgba(30, 41, 59, 0.45))",
            backgroundSize: "200% 100%",
            animation: "stock-chart-skeleton 1.3s ease-in-out infinite",
          }}
        />
        <style>{`@keyframes stock-chart-skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>
        <p
          style={{
            margin: 0,
            color: isClearMode ? "#64748b" : "#94a3b8",
            fontSize: 12,
          }}
        >
          Source: {toSourceLabel(data.source)} (cached 60s)
        </p>

        <button
          type="button"
          onClick={toggleClearMode}
          aria-pressed={isClearMode}
          aria-label={
            isClearMode ? "Switch to dark mode" : "Switch to clear mode"
          }
          style={{
            position: "relative",
            width: 150,
            height: 38,
            borderRadius: 999,
            border: toggleTrackBorder,
            background: toggleTrackBackground,
            padding: 0,
            cursor: "pointer",
            overflow: "hidden",
            boxShadow: isClearMode
              ? "0 10px 22px rgba(59, 130, 246, 0.2)"
              : "0 10px 22px rgba(2, 6, 23, 0.35)",
            transition:
              "background 500ms ease, border-color 500ms ease, box-shadow 500ms ease",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: isClearMode ? "rgba(30, 41, 59, 0.65)" : "#f8fafc",
              opacity: isClearMode ? 0.7 : 1,
              transition: "color 500ms ease, opacity 500ms ease",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 14.2A9 9 0 1 1 9.8 3a7 7 0 0 0 11.2 11.2Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Dark
          </span>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              color: isClearMode ? "#0f172a" : "rgba(226, 232, 240, 0.75)",
              opacity: isClearMode ? 1 : 0.75,
              transition: "color 500ms ease, opacity 500ms ease",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="4"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            Clear
          </span>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 3,
              left: 3,
              width: 66,
              height: 30,
              borderRadius: 999,
              background: isClearMode
                ? "linear-gradient(180deg, #ffffff, #f8fafc)"
                : "linear-gradient(180deg, #334155, #1e293b)",
              border: isClearMode
                ? "1px solid rgba(148, 163, 184, 0.55)"
                : "1px solid rgba(148, 163, 184, 0.2)",
              boxShadow: isClearMode
                ? "0 6px 16px rgba(15, 23, 42, 0.18)"
                : "0 6px 14px rgba(2, 6, 23, 0.35)",
              transform: toggleThumbTransform,
              transition:
                "transform 1650ms cubic-bezier(0.22, 0.9, 0.3, 1), background 1500ms ease, border-color 1500ms ease",
            }}
          />
        </button>
      </div>
      <StockChart
        symbol={symbol}
        name={name}
        data={data.ranges}
        changeReference={data.changeReference}
        showHeading={false}
        theme={isClearMode ? "clear" : "dark"}
      />
      <StockVolumeTrendChart
        symbol={symbol}
        theme={isClearMode ? "clear" : "dark"}
      />
    </div>
  );
}
