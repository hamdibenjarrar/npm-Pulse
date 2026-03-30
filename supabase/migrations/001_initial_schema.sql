-- supabase/migrations/001_initial_schema.sql
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- npm Pulse — Database Schema
-- Run this in your Supabase SQL editor
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Cached scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_name TEXT NOT NULL,
  version TEXT NOT NULL,
  score_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint for upsert
  CONSTRAINT scores_package_version_unique
    UNIQUE (package_name, version)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_scores_package
  ON scores (package_name, version);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_scores_updated
  ON scores (updated_at);

-- API keys table (for rate limiting & billing)
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,           -- first 8 chars for display: "pk_live_..."
  tier TEXT NOT NULL DEFAULT 'free',  -- free, pro, team, enterprise
  daily_limit INTEGER NOT NULL DEFAULT 100,
  daily_used INTEGER NOT NULL DEFAULT 0,
  daily_reset_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON api_keys (key_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_email
  ON api_keys (user_email);

-- Analytics table (track API usage for insights)
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,           -- score, batch, compare
  api_key_id UUID REFERENCES api_keys(id),
  response_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_package
  ON analytics (package_name, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_key
  ON analytics (api_key_id, created_at);

-- Function to auto-cleanup old cache entries (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_stale_scores()
RETURNS void AS $$
BEGIN
  DELETE FROM scores
  WHERE updated_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- RLS policies (Row Level Security)
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Scores are readable by everyone (public API cache)
CREATE POLICY "Scores are publicly readable"
  ON scores FOR SELECT
  USING (true);

-- Only service role can write scores
CREATE POLICY "Service role can write scores"
  ON scores FOR ALL
  USING (auth.role() = 'service_role');

-- API keys are private to their owner
CREATE POLICY "Users can read own keys"
  ON api_keys FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

-- Service role manages everything
CREATE POLICY "Service role manages keys"
  ON api_keys FOR ALL
  USING (auth.role() = 'service_role');

-- Analytics readable by key owner
CREATE POLICY "Service role manages analytics"
  ON analytics FOR ALL
  USING (auth.role() = 'service_role');
