-- =========================================
-- Migration V007 - Initiatives Module
-- Date: 2026-05-04
-- Description: Tables pour initiatives, votes, et localisation
-- =========================================

-- =========================================
-- TABLE : initiatives
-- =========================================
CREATE TABLE IF NOT EXISTS initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  goals TEXT,
  category VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
  deadline TIMESTAMP,
  supporters_count INT DEFAULT 0,
  impact_score DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE INDEX idx_initiatives_author_id ON initiatives(author_id);
CREATE INDEX idx_initiatives_category ON initiatives(category);
CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_created ON initiatives(created_at DESC);
CREATE INDEX idx_initiatives_deleted ON initiatives(deleted_at);
CREATE INDEX idx_initiatives_location ON initiatives USING GIST(ll_to_earth(latitude, longitude)) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- =========================================
-- TABLE : initiatives_votes
-- =========================================
CREATE TABLE IF NOT EXISTS initiatives_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(initiative_id, user_id)
);

CREATE INDEX idx_initiatives_votes_initiative_id ON initiatives_votes(initiative_id);
CREATE INDEX idx_initiatives_votes_user_id ON initiatives_votes(user_id);
CREATE INDEX idx_initiatives_votes_created ON initiatives_votes(created_at DESC);

-- =========================================
-- TABLE : initiatives_map_nodes (alias pour géolocalisation)
-- =========================================
-- Cette table relie initiatives aux map_nodes existants
-- Une initiative peut avoir 0 ou plusieurs points sur la carte
CREATE TABLE IF NOT EXISTS initiatives_map_nodes (
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  node_id UUID NOT NULL REFERENCES map_nodes(id) ON DELETE CASCADE,
  PRIMARY KEY (initiative_id, node_id)
);

CREATE INDEX idx_initiatives_map_nodes_initiative ON initiatives_map_nodes(initiative_id);
CREATE INDEX idx_initiatives_map_nodes_node ON initiatives_map_nodes(node_id);
