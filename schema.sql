-- Database schema for CastKeeper scheduled posts
-- This matches the structure expected by /api/scheduled route
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id TEXT PRIMARY KEY,
  fid INTEGER NOT NULL,
  text TEXT NOT NULL,
  signer_uuid TEXT NOT NULL,
  channel_id TEXT,
  embeds JSONB,
  scheduled_time TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'pending',
  error TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient querying of pending posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status_time 
ON scheduled_posts(status, scheduled_time);

-- Index for user's posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_fid 
ON scheduled_posts(fid);
