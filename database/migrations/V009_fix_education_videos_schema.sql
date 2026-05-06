-- =========================================
-- Migration V009 - Correction schema education_videos
-- Date: 2026-05-04
-- Description: Aligne education_videos sur les spécifications fonctionnelles
-- =========================================

-- Ajouter la contrainte NOT NULL sur duration_seconds (renommé en duration)
-- Étape 1: Renommer la colonne de duration_seconds à duration
ALTER TABLE education_videos RENAME COLUMN duration_seconds TO duration;

-- Étape 2: Ajouter la contrainte NOT NULL
ALTER TABLE education_videos ALTER COLUMN duration SET NOT NULL;

-- Étape 3: Ajouter l'index GIN sur tags (pour recherche full-text sur tags)
CREATE INDEX IF NOT EXISTS idx_education_videos_tags_gin ON education_videos USING GIN(tags);

-- Vérification: Index requis
-- ✅ idx_education_videos_category (existe)
-- ✅ idx_education_videos_tags_gin (créé)
-- ✅ idx_education_videos_created (existe avec created_at DESC)

COMMENT ON TABLE education_videos IS 'Videos éducatives avec métadonnées complètes - Spécifications V009';
COMMENT ON COLUMN education_videos.id IS 'UUID unique identifier';
COMMENT ON COLUMN education_videos.duration IS 'Durée en secondes (obligatoire)';
COMMENT ON COLUMN education_videos.tags IS 'Tags pour recherche et catégorisation (indexed GIN)';
