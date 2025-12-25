-- Database schema for CastKeeper scheduled posts
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id SERIAL PRIMARY KEY,
  user_fid INTEGER NOT NULL,
  text TEXT NOT NULL,
  signer_uuid VARCHAR(255) NOT NULL,
  channel_id VARCHAR(255),
  embeds JSONB,
  scheduled_time TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  error TEXT,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for efficient querying of pending posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status_time 
ON scheduled_posts(status, scheduled_time);

-- Index for user's posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user_fid 
ON scheduled_posts(user_fid);
