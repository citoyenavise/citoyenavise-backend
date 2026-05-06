-- =========================================
-- TABLE : comments
-- =========================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'flagged')),
  likes_count INT DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created ON comments(created_at DESC);
CREATE INDEX idx_comments_status ON comments(status);
CREATE INDEX idx_comments_deleted ON comments(deleted_at);
