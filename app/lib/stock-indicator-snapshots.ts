import "server-only";

import type { StockCmfMetrics, StockQuote } from "./stock-quote";
import { getNeonSql } from "./neon-db";

export type StockIndicatorSnapshot = {
  symbol: string;
  tradingDate: string;
  avgVolume7d: number | null;
  avgVolume90d: number | null;
  volumeDeltaPct: number | null;
  cmf7d: number | null;
  cmf7dAvg90d: number | null;
  cmfSpread: number | null;
  mfVelocity: number | null;
  quoteSource: StockQuote["source"] | null;
  quotePath: StockQuote["quotePath"] | null;
};

type SnapshotRow = {
  symbol: string;
  trading_date: string;
  avg_volume_7d: number | string | null;
  avg_volume_90d: number | string | null;
  volume_delta_pct: number | string | null;
  cmf_7d: number | string | null;
  cmf_7d_avg_90d: number | string | null;
  cmf_spread: number | string | null;
  mf_velocity: number | string | null;
  quote_source: StockQuote["source"] | null;
  quote_path: StockQuote["quotePath"] | null;
};

type SaveSnapshotInput = {
  symbol: string;
  quote: StockQuote | null;
  avgVolume7d: number | null;
  avgVolume90d: number | null;
  cmfMetrics: StockCmfMetrics;
};

let schemaPromise: Promise<void> | null = null;
let hasWarnedSaveFailure = false;

function isTradingDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function toNullableNumber(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toSnapshot(row: SnapshotRow): StockIndicatorSnapshot {
  return {
    symbol: row.symbol,
    tradingDate: row.trading_date,
    avgVolume7d: toNullableNumber(row.avg_volume_7d),
    avgVolume90d: toNullableNumber(row.avg_volume_90d),
    volumeDeltaPct: toNullableNumber(row.volume_delta_pct),
    cmf7d: toNullableNumber(row.cmf_7d),
    cmf7dAvg90d: toNullableNumber(row.cmf_7d_avg_90d),
    cmfSpread: toNullableNumber(row.cmf_spread),
    mfVelocity: toNullableNumber(row.mf_velocity),
    quoteSource: row.quote_source,
    quotePath: row.quote_path,
  };
}

async function ensureSnapshotSchema(): Promise<void> {
  if (schemaPromise) {
    return schemaPromise;
  }

  schemaPromise = (async () => {
    const sql = await getNeonSql();
    if (!sql) {
      return;
    }

    await sql`
      CREATE TABLE IF NOT EXISTS stock_indicator_snapshots (
        id BIGSERIAL PRIMARY KEY,
        symbol TEXT NOT NULL,
        trading_date DATE NOT NULL,
        avg_volume_7d NUMERIC,
        avg_volume_90d NUMERIC,
        volume_delta_pct NUMERIC,
        cmf_7d NUMERIC,
        cmf_7d_avg_90d NUMERIC,
        cmf_spread NUMERIC,
        mf_velocity NUMERIC,
        quote_source TEXT,
        quote_path TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT stock_indicator_snapshots_symbol_date_key UNIQUE (symbol, trading_date)
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS stock_indicator_snapshots_symbol_date_idx
      ON stock_indicator_snapshots (symbol, trading_date DESC)
    `;
  })();

  return schemaPromise;
}

export async function saveStockIndicatorSnapshot({
  symbol,
  quote,
  avgVolume7d,
  avgVolume90d,
  cmfMetrics,
}: SaveSnapshotInput): Promise<void> {
  if (!quote || !isTradingDate(quote.date)) {
    return;
  }

  const sql = await getNeonSql();
  if (!sql) {
    return;
  }

  const normalizedSymbol = symbol.toUpperCase();
  const volumeDeltaPct =
    avgVolume7d !== null && avgVolume90d !== null && avgVolume90d > 0
      ? ((avgVolume7d - avgVolume90d) / avgVolume90d) * 100
      : null;
  const cmfSpread =
    cmfMetrics.cmf7d !== null && cmfMetrics.cmf7dAvg90d !== null
      ? cmfMetrics.cmf7d - cmfMetrics.cmf7dAvg90d
      : null;

  try {
    await ensureSnapshotSchema();

    await sql`
      INSERT INTO stock_indicator_snapshots (
        symbol,
        trading_date,
        avg_volume_7d,
        avg_volume_90d,
        volume_delta_pct,
        cmf_7d,
        cmf_7d_avg_90d,
        cmf_spread,
        mf_velocity,
        quote_source,
        quote_path
      ) VALUES (
        ${normalizedSymbol},
        ${quote.date},
        ${avgVolume7d},
        ${avgVolume90d},
        ${volumeDeltaPct},
        ${cmfMetrics.cmf7d},
        ${cmfMetrics.cmf7dAvg90d},
        ${cmfSpread},
        ${cmfMetrics.mfVelocity},
        ${quote.source},
        ${quote.quotePath ?? null}
      )
      ON CONFLICT (symbol, trading_date)
      DO UPDATE SET
        avg_volume_7d = EXCLUDED.avg_volume_7d,
        avg_volume_90d = EXCLUDED.avg_volume_90d,
        volume_delta_pct = EXCLUDED.volume_delta_pct,
        cmf_7d = EXCLUDED.cmf_7d,
        cmf_7d_avg_90d = EXCLUDED.cmf_7d_avg_90d,
        cmf_spread = EXCLUDED.cmf_spread,
        mf_velocity = EXCLUDED.mf_velocity,
        quote_source = EXCLUDED.quote_source,
        quote_path = EXCLUDED.quote_path,
        updated_at = NOW()
    `;
  } catch (error) {
    if (!hasWarnedSaveFailure) {
      hasWarnedSaveFailure = true;
      console.warn(
        `[stock-indicator-snapshots] Failed to save ${normalizedSymbol} snapshot.`,
        error,
      );
    }
  }
}

export async function fetchStockIndicatorSnapshots(
  symbol: string,
  limit = 5,
): Promise<StockIndicatorSnapshot[]> {
  const sql = await getNeonSql();
  if (!sql) {
    return [];
  }

  await ensureSnapshotSchema();

  const normalizedSymbol = symbol.toUpperCase();
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 30);
  const rows = await sql<SnapshotRow>`
    SELECT
      symbol,
      trading_date::text,
      avg_volume_7d,
      avg_volume_90d,
      volume_delta_pct,
      cmf_7d,
      cmf_7d_avg_90d,
      cmf_spread,
      mf_velocity,
      quote_source,
      quote_path
    FROM stock_indicator_snapshots
    WHERE symbol = ${normalizedSymbol}
    ORDER BY trading_date DESC
    LIMIT ${safeLimit}
  `;

  return rows.map(toSnapshot).reverse();
}
