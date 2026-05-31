"use client";

import { useMemo, useState } from "react";
import type {
  ChartChangeReference,
  ChartPoint,
  ChartRanges,
} from "../lib/stock-chart-data";

type StockChartProps = {
  symbol: string;
  name: string;
  data: ChartRanges;
  changeReference?: ChartChangeReference;
  showHeading?: boolean;
};

type RangeKey = keyof ChartRanges;

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "day", label: "Day" },
  { key: "month", label: "Month" },
  { key: "ytd", label: "YTD" },
];

function getTickIndices(length: number, maxTicks = 5) {
  if (length <= 0) {
    return [];
  }

  if (length <= maxTicks) {
    return Array.from({ length }, (_, index) => index);
  }

  return Array.from(
    new Set(
      Array.from({ length: maxTicks }, (_, index) =>
        Math.round((index * (length - 1)) / (maxTicks - 1)),
      ),
    ),
  );
}

function parseLabelDate(label: string) {
  const normalized = label.trim();

  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const usDateMatch = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usDateMatch) {
    const [, month, day, year] = usDateMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const intradayMatch = normalized.match(
    /^(\d{1,2})\/(\d{1,2}),\s*(\d{1,2}):(\d{2})$/,
  );
  if (intradayMatch) {
    const [, month, day, hour, minute] = intradayMatch;
    const now = new Date();
    return new Date(
      now.getFullYear(),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    );
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatAxisLabel(label: string, range: RangeKey) {
  if (range === "day") {
    const timeMatch = label.trim().match(/(\d{1,2}:\d{2})$/);
    return timeMatch ? timeMatch[1] : label;
  }

  const parsed = parseLabelDate(label);
  if (!parsed) {
    const monthMatch = label.trim().match(/^(\d{1,2})\//);
    return monthMatch ? monthMatch[1] : label;
  }

  return String(parsed.getMonth() + 1);
}

function toPath(
  points: ChartPoint[],
  width: number,
  height: number,
  padding: number,
) {
  if (points.length === 0) {
    return "";
  }

  const closes = points.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const valueRange = max - min || 1;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  return points
    .map((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * chartWidth;
      const normalized = (point.close - min) / valueRange;
      const y = padding + chartHeight - normalized * chartHeight;
      return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function StockChart({
  symbol,
  name,
  data,
  changeReference,
  showHeading = true,
}: StockChartProps) {
  const [range, setRange] = useState<RangeKey>("month");
  const points = data[range];
  const width = 860;
  const height = 280;
  const padding = 24;

  const path = useMemo(() => toPath(points, width, height, padding), [points]);
  const axisTickIndices = useMemo(
    () => getTickIndices(points.length),
    [points],
  );

  const latest = points[points.length - 1]?.close;
  const first = points[0]?.close;
  const baseline = changeReference?.[range] ?? first;
  const delta =
    latest !== undefined && baseline !== undefined && baseline !== null
      ? latest - baseline
      : 0;
  const deltaPct =
    latest !== undefined &&
    baseline !== undefined &&
    baseline !== null &&
    baseline !== 0
      ? (delta / baseline) * 100
      : 0;
  const deltaColor = delta >= 0 ? "#22c55e" : "#f87171";

  return (
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
      {showHeading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#f8fafc" }}>
            {symbol.toUpperCase()} Price Chart
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            {RANGE_OPTIONS.map((option) => {
              const isActive = option.key === range;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setRange(option.key)}
                  style={{
                    border: isActive
                      ? "1px solid rgba(56, 189, 248, 0.9)"
                      : "1px solid rgba(148, 163, 184, 0.35)",
                    background: isActive
                      ? "rgba(14, 165, 233, 0.18)"
                      : "transparent",
                    color: isActive ? "#e0f2fe" : "#cbd5e1",
                    borderRadius: 999,
                    padding: "7px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {!showHeading ? (
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "flex-start",
          }}
        >
          {RANGE_OPTIONS.map((option) => {
            const isActive = option.key === range;
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                style={{
                  border: isActive
                    ? "1px solid rgba(56, 189, 248, 0.9)"
                    : "1px solid rgba(148, 163, 184, 0.35)",
                  background: isActive
                    ? "rgba(14, 165, 233, 0.18)"
                    : "transparent",
                  color: isActive ? "#e0f2fe" : "#cbd5e1",
                  borderRadius: 999,
                  padding: "7px 14px",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {points.length > 1 ? (
        <>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "baseline",
              flexWrap: "wrap",
            }}
          >
            <p style={{ margin: 0, color: "#94a3b8", fontSize: 13 }}>
              Last:{" "}
              <span style={{ color: "#f8fafc" }}>${latest?.toFixed(2)}</span>
            </p>
            <p style={{ margin: 0, color: deltaColor, fontSize: 13 }}>
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(2)} ({deltaPct >= 0 ? "+" : ""}
              {deltaPct.toFixed(2)}%)
            </p>
          </div>
          <div style={{ width: "100%", overflowX: "auto" }}>
            <div style={{ minWidth: 500 }}>
              <svg
                viewBox={`0 0 ${width} ${height}`}
                width="100%"
                height={height}
                role="img"
                aria-label={`${symbol.toUpperCase()} ${range} price chart`}
                style={{ display: "block" }}
              >
                <rect
                  x="0"
                  y="0"
                  width={width}
                  height={height}
                  fill="rgba(15, 23, 42, 0.6)"
                />
                <path
                  d={path}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div
                aria-hidden="true"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: `6px ${padding}px 0`,
                  color: "#64748b",
                  fontSize: 11,
                }}
              >
                {axisTickIndices.map((tickIndex, index) => (
                  <span
                    key={`${tickIndex}-${points[tickIndex]?.label ?? index}`}
                    style={{
                      flex: 1,
                      textAlign:
                        index === 0
                          ? "left"
                          : index === axisTickIndices.length - 1
                            ? "right"
                            : "center",
                    }}
                  >
                    {formatAxisLabel(points[tickIndex]?.label ?? "", range)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p style={{ margin: 0, color: "#fda4af" }}>
          Not enough historical data to draw a chart for {name}.
        </p>
      )}
    </section>
  );
}
