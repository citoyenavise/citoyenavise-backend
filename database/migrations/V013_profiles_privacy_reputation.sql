-- =========================================
-- Migration V013 - Profiles: Privacy, Reputation, Badges
-- Date: 2026-05-05
-- Description: Ajoute visibilité, badges, réputation au module profiles
-- =========================================

-- Étape 1: Ajouter colonnes de confidentialité à profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'followers')),
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_stats BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reputation_score INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_visibility ON profiles(profile_visibility);
CREATE INDEX IF NOT EXISTS idx_profiles_reputation ON profiles(reputation_score DESC);

-- Étape 2: Table profile_badges
CREATE TABLE IF NOT EXISTS profile_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  badge_type VARCHAR(100) NOT NULL,
  badge_name VARCHAR(255) NOT NULL,
  badge_description TEXT,
  badge_icon_url VARCHAR(512),
  earned_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_badges_profile ON profile_badges(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_badges_type ON profile_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_profile_badges_earned ON profile_badges(earned_at DESC);

-- Étape 3: Table reputation_events
CREATE TABLE IF NOT EXISTS reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  points INT DEFAULT 0,
  description TEXT,
  source_id UUID,
  source_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reputation_events_profile ON reputation_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_type ON reputation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_reputation_events_created ON reputation_events(created_at DESC);

COMMENT ON COLUMN reputation_events.event_type IS 'post_liked, post_created, comment_helpful, badge_earned, etc.';
COMMENT ON COLUMN reputation_events.points IS 'Points gagnés/perdus pour cet événement';
COMMENT ON COLUMN reputation_events.source_id IS 'ID du post/comment/etc qui a généré l événement';
