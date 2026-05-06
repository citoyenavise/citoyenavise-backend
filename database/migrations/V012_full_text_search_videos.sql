-- =========================================
-- Migration V012 - Full-Text Search pour Videos
-- Date: 2026-05-05
-- Description: Ajoute un index GIN full-text pour recherche avec scoring
-- =========================================

-- Créer un index GIN sur tsvector pour le full-text search
-- Combine titre, description, et tags en un seul vecteur indexé
CREATE INDEX IF NOT EXISTS idx_education_videos_fts
ON education_videos
USING GIN (
  to_tsvector('simple',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  )
);

-- Index supplémentaire pour combiner FTS + deleted_at pour les recherches filtrées
CREATE INDEX IF NOT EXISTS idx_education_videos_fts_active
ON education_videos (deleted_at)
WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_education_videos_fts IS 'Full-text search index combining title, description, and tags with GIN for fast ranking';
COMMENT ON INDEX idx_education_videos_fts_active IS 'Partial index for active videos only (deleted_at IS NULL)';
