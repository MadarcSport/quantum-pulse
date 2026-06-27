"use client";

import { useEffect, useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type {
  VolumeTrendData,
  VolumeTrendPoint,
} from "../lib/stock-volume-trend";

type StockVolumeTrendChartProps = {
  symbol: string;
  theme?: "dark" | "clear";
};

type VolumeTrendResponse = {
  data: VolumeTrendData;
};

type VolumeTrendCoordinate = VolumeTrendPoint & {
  index: number;
  x: number;
  y: number;
  zeroY: number;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const COMPACT_VOLUME_FORMATTER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const THEME_TRANSITION_MS = 1500;

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

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(label: string) {
  const parsed = parseLabelDate(label);
  return parsed ? DATE_FORMATTER.format(parsed) : label;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatVolume(value: number) {
  return COMPACT_VOLUME_FORMATTER.format(value);
}

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

function toSourceLabel(source: VolumeTrendData["source"]) {
  return source === "yahoo" ? "Yahoo Finance" : "Nasdaq";
}

export function StockVolumeTrendChart({
  symbol,
  theme = "dark",
}: StockVolumeTrendChartProps) {
  const [data, setData] = useState<VolumeTrendData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 860;
  const height = 250;
  const padding = 52;
  const isClearMode = theme === "clear";
  const points = data?.points ?? [];

  useEffect(() => {
    let isCancelled = false;

    async function loadVolumeTrend() {
      try {
        setError(null);
        setData(null);
        setHoveredIndex(null);

        const response = await fetch(`/api/stocks/${symbol}/volume-trend`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load volume trend data.");
        }

        const json = (await response.json()) as VolumeTrendResponse;

        if (!isCancelled) {
          setData(json.data);
        }
      } catch {
        if (!isCancelled) {
          setError("Volume trend data is temporarily unavailable.");
        }
      }
    }

    void loadVolumeTrend();

    return () => {
      isCancelled = true;
    };
  }, [symbol]);

  const themeTransition = `${THEME_TRANSITION_MS}ms ease`;
  const cardBorder = isClearMode
    ? "1px solid rgba(15, 23, 42, 0.14)"
    : "1px solid rgba(148, 163, 184, 0.2)";
  const cardBackground = isClearMode
    ? "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.95))"
    : "rgba(15, 23, 42, 0.72)";
  const headingColor = isClearMode ? "#0f172a" : "#f8fafc";
  const mutedTextColor = isClearMode ? "#64748b" : "#94a3b8";
  const strongTextColor = isClearMode ? "#0f172a" : "#f8fafc";
  const gridStroke = isClearMode
    ? "rgba(100, 116, 139, 0.28)"
    : "rgba(148, 163, 184, 0.22)";
  const chartRectFill = isClearMode
    ? "rgba(226, 232, 240, 0.55)"
    : "rgba(15, 23, 42, 0.6)";
  const positiveFill = isClearMode ? "#16a34a" : "#22c55e";
  const negativeFill = isClearMode ? "#dc2626" : "#f87171";
  const zeroLineColor = isClearMode
    ? "rgba(15, 23, 42, 0.48)"
    : "rgba(226, 232, 240, 0.55)";
  const tooltipBorder = isClearMode
    ? "1px solid rgba(15, 23, 42, 0.2)"
    : "1px solid rgba(148, 163, 184, 0.25)";
  const tooltipBackground = isClearMode
    ? "rgba(255, 255, 255, 0.97)"
    : "rgba(15, 23, 42, 0.94)";
  const tooltipShadow = isClearMode
    ? "0 12px 30px rgba(15, 23, 42, 0.16)"
    : "0 16px 36px rgba(2, 6, 23, 0.42)";

  const chart = useMemo(() => {
    if (points.length === 0) {
      return {
        coordinates: [] as VolumeTrendCoordinate[],
        gridLines: [] as Array<{ value: number; y: number }>,
        maxAbs: 1,
        zeroY: height / 2,
      };
    }

    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const values = points.map((point) => point.percentVs90d);
    const maxAbs = Math.max(5, Math.ceil(Math.max(...values.map(Math.abs))));
    const zeroY = padding + chartHeight / 2;
    const coordinates = points.map((point, index) => {
      const x = padding + (index / Math.max(points.length - 1, 1)) * chartWidth;
      const y = zeroY - (point.percentVs90d / maxAbs) * (chartHeight / 2);

      return {
        ...point,
        index,
        x,
        y,
        zeroY,
      };
    });
    const gridLines = [-maxAbs, -maxAbs / 2, 0, maxAbs / 2, maxAbs].map(
      (value) => ({
        value,
        y: zeroY - (value / maxAbs) * (chartHeight / 2),
      }),
    );

    return { coordinates, gridLines, maxAbs, zeroY };
  }, [height, padding, points, width]);

  const tickIndices = useMemo(() => getTickIndices(points.length), [points]);
  const hoveredPoint =
    hoveredIndex === null ? null : (chart.coordinates[hoveredIndex] ?? null);
  const tooltipX = hoveredPoint
    ? Math.min(Math.max(hoveredPoint.x, 104), width - 104)
    : 0;
  const latest = points[points.length - 1];

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (chart.coordinates.length === 0) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) {
      return;
    }

    const x = ((event.clientX - bounds.left) / bounds.width) * width;
    const relativeIndex = Math.round(
      ((x - padding) / (width - padding * 2)) *
        Math.max(chart.coordinates.length - 1, 1),
    );
    const nextIndex = Math.min(
      Math.max(relativeIndex, 0),
      chart.coordinates.length - 1,
    );

    setHoveredIndex(nextIndex);
  }

  return (
    <section
      style={{
        border: cardBorder,
        borderRadius: 16,
        background: cardBackground,
        padding: 20,
        display: "grid",
        gap: 14,
        transition: `border-color ${themeTransition}, background ${themeTransition}`,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "grid", gap: 5 }}>
          <h2
            style={{
              margin: 0,
              fontSize: "1.05rem",
              color: headingColor,
              transition: `color ${themeTransition}`,
            }}
          >
            Volume Trend: 7D Avg vs 90D Avg
          </h2>
          <p
            style={{
              margin: 0,
              color: mutedTextColor,
              fontSize: 12,
              transition: `color ${themeTransition}`,
            }}
          >
            Recent average volume compared with the 90 trading-day baseline.
          </p>
        </div>
        {data ? (
          <p
            style={{
              margin: 0,
              color: mutedTextColor,
              fontSize: 12,
              transition: `color ${themeTransition}`,
            }}
          >
            Source: {toSourceLabel(data.source)}
          </p>
        ) : null}
      </div>

      {error ? (
        <p style={{ margin: 0, color: isClearMode ? "#dc2626" : "#fda4af" }}>
          {error}
        </p>
      ) : null}

      {!error && !data ? (
        <div
          style={{
            height: 220,
            borderRadius: 12,
            border: "1px solid rgba(148, 163, 184, 0.2)",
            background: isClearMode
              ? "linear-gradient(90deg, rgba(226, 232, 240, 0.55), rgba(241, 245, 249, 0.9), rgba(226, 232, 240, 0.55))"
              : "linear-gradient(90deg, rgba(30, 41, 59, 0.45), rgba(51, 65, 85, 0.6), rgba(30, 41, 59, 0.45))",
            backgroundSize: "200% 100%",
            animation: "stock-volume-trend-skeleton 1.3s ease-in-out infinite",
          }}
        />
      ) : null}

      {!error && data && points.length > 1 ? (
        <>
          {latest ? (
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "baseline",
                flexWrap: "wrap",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: mutedTextColor,
                  fontSize: 13,
                  transition: `color ${themeTransition}`,
                }}
              >
                Latest:{" "}
                <span
                  style={{
                    color:
                      latest.percentVs90d >= 0 ? positiveFill : negativeFill,
                    fontWeight: 700,
                  }}
                >
                  {formatPercent(latest.percentVs90d)}
                </span>
              </p>
              <p
                style={{
                  margin: 0,
                  color: strongTextColor,
                  fontSize: 13,
                  transition: `color ${themeTransition}`,
                }}
              >
                7D {formatVolume(latest.volume7dAvg)} vs 90D{" "}
                {formatVolume(latest.volume90dAvg)}
              </p>
            </div>
          ) : null}

          <div style={{ width: "100%", overflowX: "auto" }}>
            <div style={{ minWidth: 500, position: "relative" }}>
              {hoveredPoint ? (
                <div
                  style={{
                    position: "absolute",
                    left: `${(tooltipX / width) * 100}%`,
                    top: `${(Math.min(hoveredPoint.y, hoveredPoint.zeroY) / height) * 100}%`,
                    transform: "translate(-50%, calc(-100% - 12px))",
                    pointerEvents: "none",
                    zIndex: 1,
                    minWidth: 190,
                    border: tooltipBorder,
                    borderRadius: 12,
                    background: tooltipBackground,
                    padding: "10px 12px",
                    boxShadow: tooltipShadow,
                    transition: `border-color ${themeTransition}, background ${themeTransition}, box-shadow ${themeTransition}`,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: mutedTextColor,
                      fontSize: 11,
                      whiteSpace: "nowrap",
                      transition: `color ${themeTransition}`,
                    }}
                  >
                    {formatDate(hoveredPoint.label)}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color:
                        hoveredPoint.percentVs90d >= 0
                          ? positiveFill
                          : negativeFill,
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {formatPercent(hoveredPoint.percentVs90d)}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: strongTextColor,
                      fontSize: 12,
                      transition: `color ${themeTransition}`,
                    }}
                  >
                    7D Avg: {formatVolume(hoveredPoint.volume7dAvg)}
                    <br />
                    90D Avg: {formatVolume(hoveredPoint.volume90dAvg)}
                  </p>
                </div>
              ) : null}

              <svg
                viewBox={`0 0 ${width} ${height}`}
                width="100%"
                height={height}
                role="img"
                aria-label={`${symbol.toUpperCase()} volume trend chart`}
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHoveredIndex(null)}
                style={{
                  display: "block",
                  cursor: "crosshair",
                  touchAction: "none",
                }}
              >
                <rect
                  x="0"
                  y="0"
                  width={width}
                  height={height}
                  fill={chartRectFill}
                  style={{ transition: `fill ${themeTransition}` }}
                />
                {chart.gridLines.map((line) => (
                  <line
                    key={line.value}
                    x1={padding}
                    x2={width - padding}
                    y1={line.y}
                    y2={line.y}
                    stroke={line.value === 0 ? zeroLineColor : gridStroke}
                    strokeDasharray={line.value === 0 ? undefined : "4 6"}
                    strokeWidth={line.value === 0 ? "1.5" : "1"}
                    style={{ transition: `stroke ${themeTransition}` }}
                  />
                ))}
                {chart.gridLines.map((line) => (
                  <text
                    key={`label-${line.value}`}
                    x={12}
                    y={line.y + 4}
                    fontSize="11"
                    fill={mutedTextColor}
                    textAnchor="start"
                    style={{ transition: `fill ${themeTransition}` }}
                  >
                    {formatPercent(line.value)}
                  </text>
                ))}
                {chart.coordinates.map((point) => {
                  const barWidth = Math.max(
                    5,
                    Math.min(18, (width - padding * 2) / points.length - 5),
                  );
                  const barY = Math.min(point.y, point.zeroY);
                  const barHeight = Math.max(
                    Math.abs(point.zeroY - point.y),
                    2,
                  );

                  return (
                    <rect
                      key={`${point.label}-${point.index}`}
                      x={point.x - barWidth / 2}
                      y={barY}
                      width={barWidth}
                      height={barHeight}
                      rx="3"
                      fill={
                        point.percentVs90d >= 0 ? positiveFill : negativeFill
                      }
                      opacity={
                        hoveredIndex === null || hoveredIndex === point.index
                          ? 0.95
                          : 0.42
                      }
                      style={{
                        transition: `fill ${themeTransition}, opacity 180ms ease`,
                      }}
                    />
                  );
                })}
              </svg>

              <div
                aria-hidden="true"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: `6px ${padding}px 0`,
                  color: mutedTextColor,
                  fontSize: 11,
                  transition: `color ${themeTransition}`,
                }}
              >
                {tickIndices.map((tickIndex, index) => (
                  <span
                    key={`${tickIndex}-${points[tickIndex]?.label ?? index}`}
                    style={{
                      flex: 1,
                      textAlign:
                        index === 0
                          ? "left"
                          : index === tickIndices.length - 1
                            ? "right"
                            : "center",
                    }}
                  >
                    {formatDate(points[tickIndex]?.label ?? "").replace(
                      /, \d{4}$/,
                      "",
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {!error && data && points.length <= 1 ? (
        <p style={{ margin: 0, color: isClearMode ? "#dc2626" : "#fda4af" }}>
          Not enough volume history to draw the 7D vs 90D chart.
        </p>
      ) : null}

      <style>{`@keyframes stock-volume-trend-skeleton { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </section>
  );
}
