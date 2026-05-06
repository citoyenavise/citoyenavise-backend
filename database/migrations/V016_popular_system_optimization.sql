-- =========================================
-- Migration V016 - Popular System Optimization
-- Date: 2026-05-05
-- Description: Dénormalisation et pré-calcul pour scalabilité 100k+ posts
-- =========================================

-- Étape 1: Ajouter colonnes de dénormalisation
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS popularity_score DECIMAL(10, 4) DEFAULT 0;

-- Étape 2: Créer un index composite pour requêtes populaires
CREATE INDEX IF NOT EXISTS idx_posts_popular
ON posts (popularity_score DESC, created_at DESC)
WHERE status = 'published' AND deleted_at IS NULL;

-- Étape 3: Index par range temporelle + score
CREATE INDEX IF NOT EXISTS idx_posts_popular_by_date
ON posts (created_at DESC, popularity_score DESC)
WHERE status = 'published' AND deleted_at IS NULL;

-- Étape 4: Initialiser comments_count depuis les commentaires existants
UPDATE posts SET comments_count = (
  SELECT COUNT(*) FROM comments
  WHERE post_id = posts.id AND deleted_at IS NULL
)
WHERE comments_count = 0;

-- Étape 5: Initialiser popularity_score basé sur la formule existante
UPDATE posts SET popularity_score = (
  likes_count * 2 + comments_count * 1.5
) * GREATEST(0.2, 1 - (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) / 240)
WHERE status = 'published' AND deleted_at IS NULL AND popularity_score = 0;

-- Étape 6: Index pour recherche par catégorie + popularité
CREATE INDEX IF NOT EXISTS idx_posts_popular_by_category
ON posts (category, popularity_score DESC, created_at DESC)
WHERE status = 'published' AND deleted_at IS NULL;

-- Étape 7: Index pour tri par likes
CREATE INDEX IF NOT EXISTS idx_posts_by_likes
ON posts (likes_count DESC, created_at DESC)
WHERE status = 'published' AND deleted_at IS NULL;

-- Étape 8: Index pour tri par comments
CREATE INDEX IF NOT EXISTS idx_posts_by_comments
ON posts (comments_count DESC, created_at DESC)
WHERE status = 'published' AND deleted_at IS NULL;

COMMENT ON COLUMN posts.comments_count IS 'Dénormalisé pour performance - updated on comment create/delete';
COMMENT ON COLUMN posts.popularity_score IS 'Pré-calculé scoring: (likes*2 + comments*1.5) * timePenalty - updated on like/comment events';
COMMENT ON INDEX idx_posts_popular IS 'Composite index for fast popular posts retrieval with temporal decay';
