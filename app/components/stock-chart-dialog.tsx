"use client";

import { useEffect, useState } from "react";
import type { ChartData } from "../lib/stock-chart-data";
import { StockChart } from "./stock-chart";

type StockChartDialogProps = {
  symbol: string;
  name: string;
};

type ChartResponse = {
  data: ChartData;
};

function toSourceLabel(source: ChartData["source"]) {
  return source === "yahoo" ? "Yahoo Finance" : "Nasdaq";
}

export function StockChartDialog({ symbol, name }: StockChartDialogProps) {
  const [data, setData] = useState<ChartData | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    return <p style={{ margin: 0, color: "#fda4af" }}>{error}</p>;
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
      <p style={{ margin: 0, color: "#94a3b8", fontSize: 12 }}>
        Source: {toSourceLabel(data.source)} (cached 60s)
      </p>
      <StockChart
        symbol={symbol}
        name={name}
        data={data.ranges}
        changeReference={data.changeReference}
        showHeading={false}
      />
    </div>
  );
}
