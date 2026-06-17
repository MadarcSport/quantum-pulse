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
);

CREATE INDEX IF NOT EXISTS stock_indicator_snapshots_symbol_date_idx
ON stock_indicator_snapshots (symbol, trading_date DESC);