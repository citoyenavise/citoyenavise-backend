-- =========================================
-- Migration V015 - Profiles: Audit, Versioning, Full-Text Search
-- Date: 2026-05-05
-- Description: Versioning des profils et index de recherche avancée
-- =========================================

-- Étape 1: Table profile_versions (historique des modifications)
CREATE TABLE IF NOT EXISTS profile_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  changed_at TIMESTAMP DEFAULT NOW(),
  change_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_profile_versions_profile ON profile_versions(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_versions_changed ON profile_versions(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_versions_field ON profile_versions(field_name);

COMMENT ON TABLE profile_versions IS 'Historique des modifications apportées aux profils - audit trail';

-- Étape 2: Index full-text search sur profiles
CREATE INDEX IF NOT EXISTS idx_profiles_fts
ON profiles
USING GIN (
  to_tsvector('simple',
    coalesce(bio, '') || ' ' ||
    coalesce(location, '') || ' ' ||
    coalesce(array_to_string(interests, ' '), '')
  )
);

-- Étape 3: Index GIN sur preferred_categories pour recherche par intérêts
CREATE INDEX IF NOT EXISTS idx_profile_preferences_categories
ON profile_preferences
USING GIN (preferred_categories);

-- Étape 4: Index combiné pour recherche avancée (reputation + visibility)
CREATE INDEX IF NOT EXISTS idx_profiles_search
ON profiles (reputation_score DESC, profile_visibility, is_verified)
WHERE profile_visibility != 'private';

COMMENT ON INDEX idx_profiles_fts IS 'Full-text search index pour bio, location, interests';
COMMENT ON INDEX idx_profiles_search IS 'Index pour recherche avancée (réputation, visibilité, vérification)';
