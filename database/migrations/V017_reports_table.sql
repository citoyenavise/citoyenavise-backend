/**
 * V017: Create reports table for user/content reporting system
 */

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('post', 'comment', 'user', 'content')),
  target_id UUID NOT NULL,
  reason VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'dismissed')),
  resolution_action VARCHAR(50) CHECK (resolution_action IN ('none', 'warn', 'suspend', 'ban')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

-- Indices pour les requêtes courantes
CREATE INDEX idx_reports_status ON reports(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_target ON reports(target_type, target_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_user ON reports(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_resolved_by ON reports(resolved_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_reports_created_at ON reports(created_at DESC) WHERE deleted_at IS NULL;
