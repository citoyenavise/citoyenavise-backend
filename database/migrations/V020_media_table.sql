/**
 * V020: Media uploads table
 */

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('image', 'video', 'document')),
  size BIGINT,
  mimetype VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_media_user ON media(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_status ON media(status);
