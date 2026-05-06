-- =========================================
-- Migration V008 - Analytics Module
-- Date: 2026-05-04
-- Description: Event tracking and analytics tables
-- =========================================

-- =========================================
-- TABLE : analytics_events
-- =========================================
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('view', 'click', 'search', 'initiative_view', 'video_view', 'article_view')),
  target_id UUID,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT
);

-- Indices pour performances
CREATE INDEX idx_analytics_type ON analytics_events(type);
CREATE INDEX idx_analytics_target_id ON analytics_events(target_id);
CREATE INDEX idx_analytics_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_type_created ON analytics_events(type, created_at DESC);

-- =========================================
-- TABLE : analytics_summary (optional - pour cache persistant)
-- =========================================
CREATE TABLE IF NOT EXISTS analytics_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  range VARCHAR(10) NOT NULL CHECK (range IN ('24h', '7d', '30d', 'all')),
  total_views INT DEFAULT 0,
  total_searches INT DEFAULT 0,
  initiative_views INT DEFAULT 0,
  video_views INT DEFAULT 0,
  article_views INT DEFAULT 0,
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(range)
);

CREATE INDEX idx_analytics_summary_range ON analytics_summary(range);
