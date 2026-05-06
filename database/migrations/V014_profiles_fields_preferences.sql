-- =========================================
-- Migration V014 - Profiles: Dynamic Fields & Preferences
-- Date: 2026-05-05
-- Description: Champs dynamiques et préférences de contenu
-- =========================================

-- Étape 1: Table profile_field_definitions (schéma des champs)
CREATE TABLE IF NOT EXISTS profile_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key VARCHAR(100) NOT NULL UNIQUE,
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'boolean', 'select', 'multiselect', 'url', 'email')),
  field_description TEXT,
  is_visible_in_profile BOOLEAN DEFAULT true,
  is_searchable BOOLEAN DEFAULT false,
  validation_rules JSONB,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_field_definitions_key ON profile_field_definitions(field_key);
CREATE INDEX IF NOT EXISTS idx_profile_field_definitions_type ON profile_field_definitions(field_type);

-- Étape 2: Table profile_fields (valeurs dynamiques des champs)
CREATE TABLE IF NOT EXISTS profile_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  field_definition_id UUID NOT NULL REFERENCES profile_field_definitions(id) ON DELETE RESTRICT,
  field_key VARCHAR(100) NOT NULL,
  field_value TEXT,
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'followers')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(profile_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_profile_fields_profile ON profile_fields(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_fields_definition ON profile_fields(field_definition_id);
CREATE INDEX IF NOT EXISTS idx_profile_fields_key ON profile_fields(field_key);
CREATE INDEX IF NOT EXISTS idx_profile_fields_visibility ON profile_fields(visibility);

-- Étape 3: Table profile_preferences
CREATE TABLE IF NOT EXISTS profile_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(user_id) ON DELETE CASCADE,
  preferred_categories TEXT[] DEFAULT '{}',
  hide_mature_content BOOLEAN DEFAULT false,
  language VARCHAR(10) DEFAULT 'fr',
  notification_frequency VARCHAR(20) DEFAULT 'daily' CHECK (notification_frequency IN ('never', 'daily', 'weekly', 'instant')),
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  show_in_discovery BOOLEAN DEFAULT true,
  allow_messages BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profile_preferences_profile ON profile_preferences(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_preferences_language ON profile_preferences(language);

COMMENT ON TABLE profile_field_definitions IS 'Définit les champs personnalisés disponibles pour les profils';
COMMENT ON TABLE profile_fields IS 'Stocke les valeurs personnalisées des champs pour chaque profil';
COMMENT ON TABLE profile_preferences IS 'Préférences de contenu et notifications des profils';
