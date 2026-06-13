"use client";

import { useId, useMemo, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
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
  theme?: "dark" | "clear";
};

type RangeKey = keyof ChartRanges;

type ChartCoordinate = ChartPoint & {
  index: number;
  x: number;
  y: number;
};

type ChartGeometry = {
  areaPath: string;
  chartHeight: number;
  chartWidth: number;
  coordinates: ChartCoordinate[];
  path: string;
};

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "day", label: "5D" },
  { key: "month", label: "Month" },
  { key: "ytd", label: "YTD" },
];

const MONTH_AXIS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const YTD_AXIS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
});

const DAY_TOOLTIP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const INTRADAY_TOOLTIP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const DATE_TOOLTIP_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const CHART_THEME_TRANSITION_MS = 1500;

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
  const parsed = parseLabelDate(label);
  if (!parsed) {
    return label;
  }

  if (range === "day") {
    return MONTH_AXIS_FORMATTER.format(parsed);
  }

  if (range === "month") {
    return MONTH_AXIS_FORMATTER.format(parsed);
  }

  return YTD_AXIS_FORMATTER.format(parsed);
}

function formatTooltipLabel(label: string, range: RangeKey) {
  const parsed = parseLabelDate(label);

  if (!parsed) {
    return label;
  }

  if (range === "day") {
    return DAY_TOOLTIP_FORMATTER.format(parsed);
  }

  const hasTime = /(\d{1,2}:\d{2})$/.test(label.trim());
  return hasTime
    ? INTRADAY_TOOLTIP_FORMATTER.format(parsed)
    : DATE_TOOLTIP_FORMATTER.format(parsed);
}

function calculateMovingAverage(
  points: ChartPoint[],
  period: number = 20,
): number[] {
  const ma: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const start = Math.max(0, i - period + 1);
    const subset = points.slice(start, i + 1);
    const sum = subset.reduce((acc, p) => acc + p.close, 0);
    ma.push(sum / subset.length);
  }
  return ma;
}

function getChartGeometry(
  points: ChartPoint[],
  width: number,
  height: number,
  padding: number,
): ChartGeometry {
  if (points.length === 0) {
    return {
      areaPath: "",
      chartHeight: height - padding * 2,
      chartWidth: width - padding * 2,
      coordinates: [],
      path: "",
    };
  }

  const closes = points.map((point) => point.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const valueRange = max - min || 1;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const coordinates = points.map((point, index) => {
    const x = padding + (index / Math.max(points.length - 1, 1)) * chartWidth;
    const normalized = (point.close - min) / valueRange;
    const y = padding + chartHeight - normalized * chartHeight;
    return {
      ...point,
      index,
      x,
      y,
    };
  });

  const path = coordinates
    .map((point, index) => {
      return `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
    })
    .join(" ");

  const firstPoint = coordinates[0];
  const lastPoint = coordinates[coordinates.length - 1];
  const baselineY = height - padding;
  const areaPath =
    coordinates.length > 1
      ? `${path} L${lastPoint.x.toFixed(2)} ${baselineY.toFixed(2)} L${firstPoint.x.toFixed(2)} ${baselineY.toFixed(2)} Z`
      : "";

  return {
    areaPath,
    chartHeight,
    chartWidth,
    coordinates,
    path,
  };
}

export function StockChart({
  symbol,
  name,
  data,
  changeReference,
  showHeading = true,
  theme = "dark",
}: StockChartProps) {
  const [range, setRange] = useState<RangeKey>("month");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const points = data[range];
  const width = 860;
  const height = 280;
  const padding = 55;
  const gradientId = useId().replace(/:/g, "");

  const chartGeometry = useMemo(
    () => getChartGeometry(points, width, height, padding),
    [points],
  );
  const axisTickIndices = useMemo(
    () => getTickIndices(points.length),
    [points],
  );
  const hoveredPoint =
    hoveredIndex === null
      ? null
      : (chartGeometry.coordinates[hoveredIndex] ?? null);
  const tooltipX = hoveredPoint
    ? Math.min(Math.max(hoveredPoint.x, 88), width - 88)
    : 0;
  const gridLines = useMemo(
    () =>
      Array.from({ length: 4 }, (_, index) => {
        return padding + (chartGeometry.chartHeight * index) / 3;
      }),
    [chartGeometry.chartHeight],
  );

  const yAxisPrices = useMemo(() => {
    if (points.length === 0) return [];
    const closes = points.map((p) => p.close);
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const priceRange = maxPrice - minPrice || 1;

    return Array.from({ length: 4 }, (_, index) => {
      const ratio = index / 3;
      const price = maxPrice - ratio * priceRange;
      const y = padding + (chartGeometry.chartHeight * index) / 3;
      return { price, y };
    });
  }, [points, chartGeometry.chartHeight]);

  const maPath = useMemo(() => {
    if (points.length === 0) return "";
    const closes = points.map((p) => p.close);
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const priceRange = maxPrice - minPrice || 1;

    const maValues = calculateMovingAverage(points, 20);
    const coordinates = maValues.map((maValue, index) => {
      const x =
        padding +
        (index / Math.max(points.length - 1, 1)) * chartGeometry.chartWidth;
      const normalized = (maValue - minPrice) / priceRange;
      const y =
        padding +
        chartGeometry.chartHeight -
        normalized * chartGeometry.chartHeight;
      return { x, y };
    });

    return coordinates
      .map((point, index) => {
        return `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      })
      .join(" ");
  }, [points, chartGeometry.chartWidth, chartGeometry.chartHeight]);

  const ma100Path = useMemo(() => {
    if (points.length === 0) return "";
    const closes = points.map((p) => p.close);
    const minPrice = Math.min(...closes);
    const maxPrice = Math.max(...closes);
    const priceRange = maxPrice - minPrice || 1;

    const maValues = calculateMovingAverage(points, 100);
    const coordinates = maValues.map((maValue, index) => {
      const x =
        padding +
        (index / Math.max(points.length - 1, 1)) * chartGeometry.chartWidth;
      const normalized = (maValue - minPrice) / priceRange;
      const y =
        padding +
        chartGeometry.chartHeight -
        normalized * chartGeometry.chartHeight;
      return { x, y };
    });

    return coordinates
      .map((point, index) => {
        return `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      })
      .join(" ");
  }, [points, chartGeometry.chartWidth, chartGeometry.chartHeight]);

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
  const isClearMode = theme === "clear";

  const cardBorder = isClearMode
    ? "1px solid rgba(15, 23, 42, 0.14)"
    : "1px solid rgba(148, 163, 184, 0.2)";
  const cardBackground = isClearMode
    ? "linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.95))"
    : "rgba(15, 23, 42, 0.72)";
  const headingColor = isClearMode ? "#0f172a" : "#f8fafc";
  const mutedTextColor = isClearMode ? "#64748b" : "#94a3b8";
  const strongTextColor = isClearMode ? "#0f172a" : "#f8fafc";
  const activeBorderColor = isClearMode
    ? "1px solid rgba(2, 132, 199, 0.72)"
    : "1px solid rgba(56, 189, 248, 0.9)";
  const activeButtonBackground = isClearMode
    ? "rgba(2, 132, 199, 0.14)"
    : "rgba(14, 165, 233, 0.18)";
  const inactiveBorderColor = isClearMode
    ? "1px solid rgba(100, 116, 139, 0.45)"
    : "1px solid rgba(148, 163, 184, 0.35)";
  const inactiveButtonColor = isClearMode ? "#334155" : "#cbd5e1";
  const activeButtonColor = isClearMode ? "#0c4a6e" : "#e0f2fe";
  const tooltipBorder = isClearMode
    ? "1px solid rgba(15, 23, 42, 0.2)"
    : "1px solid rgba(148, 163, 184, 0.25)";
  const tooltipBackground = isClearMode
    ? "rgba(255, 255, 255, 0.97)"
    : "rgba(15, 23, 42, 0.94)";
  const tooltipShadow = isClearMode
    ? "0 12px 30px rgba(15, 23, 42, 0.16)"
    : "0 16px 36px rgba(2, 6, 23, 0.42)";
  const chartRectFill = isClearMode
    ? "rgba(226, 232, 240, 0.55)"
    : "rgba(15, 23, 42, 0.6)";
  const gridStroke = isClearMode
    ? "rgba(100, 116, 139, 0.3)"
    : "rgba(148, 163, 184, 0.22)";
  const lineColor = isClearMode ? "#0284c7" : "#38bdf8";
  const gradientTop = isClearMode
    ? "rgba(2, 132, 199, 0.2)"
    : "rgba(56, 189, 248, 0.24)";
  const gradientBottom = isClearMode
    ? "rgba(2, 132, 199, 0)"
    : "rgba(56, 189, 248, 0)";
  const hoverLineColor = isClearMode
    ? "rgba(14, 116, 144, 0.6)"
    : "rgba(125, 211, 252, 0.7)";
  const hoverPointStroke = isClearMode
    ? "rgba(248, 250, 252, 0.95)"
    : "rgba(15, 23, 42, 0.95)";
  const axisColor = isClearMode ? "#475569" : "#64748b";
  const themeTransition = `${CHART_THEME_TRANSITION_MS}ms ease`;
  const showMa20 = range === "month" || range === "ytd";
  const showMa100 = range === "ytd";

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>) {
    if (chartGeometry.coordinates.length === 0) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) {
      return;
    }

    const x = ((event.clientX - bounds.left) / bounds.width) * width;
    const relativeIndex = Math.round(
      ((x - padding) / chartGeometry.chartWidth) *
        Math.max(chartGeometry.coordinates.length - 1, 1),
    );
    const nextIndex = Math.min(
      Math.max(relativeIndex, 0),
      chartGeometry.coordinates.length - 1,
    );

    setHoveredIndex(nextIndex);
  }

  function handleRangeChange(nextRange: RangeKey) {
    setRange(nextRange);
    setHoveredIndex(null);
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
          <h2
            style={{
              margin: 0,
              fontSize: "1.25rem",
              color: headingColor,
              transition: `color ${themeTransition}`,
            }}
          >
            {symbol.toUpperCase()} Price Chart
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            {RANGE_OPTIONS.map((option) => {
              const isActive = option.key === range;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleRangeChange(option.key)}
                  style={{
                    border: isActive ? activeBorderColor : inactiveBorderColor,
                    background: isActive
                      ? activeButtonBackground
                      : "transparent",
                    color: isActive ? activeButtonColor : inactiveButtonColor,
                    borderRadius: 999,
                    padding: "7px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: `border-color ${themeTransition}, background ${themeTransition}, color ${themeTransition}`,
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
                onClick={() => handleRangeChange(option.key)}
                style={{
                  border: isActive ? activeBorderColor : inactiveBorderColor,
                  background: isActive ? activeButtonBackground : "transparent",
                  color: isActive ? activeButtonColor : inactiveButtonColor,
                  borderRadius: 999,
                  padding: "7px 14px",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: `border-color ${themeTransition}, background ${themeTransition}, color ${themeTransition}`,
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
            <p
              style={{
                margin: 0,
                color: mutedTextColor,
                fontSize: 13,
                transition: `color ${themeTransition}`,
              }}
            >
              Last:{" "}
              <span style={{ color: strongTextColor }}>
                ${latest?.toFixed(2)}
              </span>
            </p>
            <p style={{ margin: 0, color: deltaColor, fontSize: 13 }}>
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(2)} ({deltaPct >= 0 ? "+" : ""}
              {deltaPct.toFixed(2)}%)
            </p>
            {showMa20 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 10,
                  fontSize: 11,
                  color: mutedTextColor,
                }}
              >
                <svg width="20" height="8" viewBox="0 0 20 8">
                  <line
                    x1="0"
                    y1="4"
                    x2="20"
                    y2="4"
                    stroke={isClearMode ? "#f97316" : "#fb923c"}
                    strokeWidth="2"
                    strokeDasharray="5 5"
                  />
                </svg>
                <span>MA(20)</span>
              </div>
            ) : null}
            {showMa100 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 8,
                  fontSize: 11,
                  color: mutedTextColor,
                }}
              >
                <svg width="20" height="8" viewBox="0 0 20 8">
                  <line
                    x1="0"
                    y1="4"
                    x2="20"
                    y2="4"
                    stroke={isClearMode ? "#a855f7" : "#d946ef"}
                    strokeWidth="2"
                    strokeDasharray="3 7"
                  />
                </svg>
                <span>MA(100)</span>
              </div>
            ) : null}
          </div>
          <div style={{ width: "100%", overflowX: "auto" }}>
            <div style={{ minWidth: 500, position: "relative" }}>
              {hoveredPoint ? (
                <div
                  style={{
                    position: "absolute",
                    left: `${(tooltipX / width) * 100}%`,
                    top: `${(hoveredPoint.y / height) * 100}%`,
                    transform: "translate(-50%, calc(-100% - 12px))",
                    pointerEvents: "none",
                    zIndex: 1,
                    minWidth: 132,
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
                    {formatTooltipLabel(hoveredPoint.label, range)}
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      color: strongTextColor,
                      fontSize: 13,
                      fontWeight: 600,
                      transition: `color ${themeTransition}`,
                    }}
                  >
                    ${hoveredPoint.close.toFixed(2)}
                  </p>
                </div>
              ) : null}
              <svg
                viewBox={`0 0 ${width} ${height}`}
                width="100%"
                height={height}
                role="img"
                aria-label={`${symbol.toUpperCase()} ${range} price chart`}
                onPointerMove={handlePointerMove}
                onPointerLeave={() => setHoveredIndex(null)}
                style={{
                  display: "block",
                  cursor: "crosshair",
                  touchAction: "none",
                }}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor={gradientTop}
                      style={{ transition: `stop-color ${themeTransition}` }}
                    />
                    <stop
                      offset="100%"
                      stopColor={gradientBottom}
                      style={{ transition: `stop-color ${themeTransition}` }}
                    />
                  </linearGradient>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width={width}
                  height={height}
                  fill={chartRectFill}
                  style={{ transition: `fill ${themeTransition}` }}
                />
                {gridLines.map((lineY) => (
                  <line
                    key={lineY}
                    x1={padding}
                    x2={width - padding}
                    y1={lineY}
                    y2={lineY}
                    stroke={gridStroke}
                    strokeDasharray="4 6"
                    strokeWidth="1"
                    style={{ transition: `stroke ${themeTransition}` }}
                  />
                ))}
                {yAxisPrices.map((item) => (
                  <text
                    key={`price-${item.price}`}
                    x={12}
                    y={item.y + 4}
                    fontSize="11"
                    fill={mutedTextColor}
                    textAnchor="start"
                    style={{ transition: `fill ${themeTransition}` }}
                  >
                    ${item.price.toFixed(2)}
                  </text>
                ))}
                <path
                  d={chartGeometry.areaPath}
                  fill={`url(#${gradientId})`}
                  style={{ transition: `fill ${themeTransition}` }}
                />
                <path
                  d={chartGeometry.path}
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transition: `stroke ${themeTransition}` }}
                />
                {showMa20 && maPath ? (
                  <path
                    d={maPath}
                    fill="none"
                    stroke={isClearMode ? "#f97316" : "#fb923c"}
                    strokeWidth="2"
                    strokeDasharray="5 5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: `stroke ${themeTransition}`,
                      opacity: 0.75,
                    }}
                  />
                ) : null}
                {showMa100 && ma100Path ? (
                  <path
                    d={ma100Path}
                    fill="none"
                    stroke={isClearMode ? "#a855f7" : "#d946ef"}
                    strokeWidth="2"
                    strokeDasharray="3 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      transition: `stroke ${themeTransition}`,
                      opacity: 0.7,
                    }}
                  />
                ) : null}
                {hoveredPoint ? (
                  <>
                    <line
                      x1={hoveredPoint.x}
                      x2={hoveredPoint.x}
                      y1={padding}
                      y2={height - padding}
                      stroke={hoverLineColor}
                      strokeDasharray="4 6"
                      strokeWidth="1"
                      style={{ transition: `stroke ${themeTransition}` }}
                    />
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="5.5"
                      fill={lineColor}
                      stroke={hoverPointStroke}
                      strokeWidth="3"
                      style={{
                        transition: `fill ${themeTransition}, stroke ${themeTransition}`,
                      }}
                    />
                  </>
                ) : null}
              </svg>
              <div
                aria-hidden="true"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: `6px ${padding}px 0`,
                  color: axisColor,
                  fontSize: 11,
                  transition: `color ${themeTransition}`,
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
