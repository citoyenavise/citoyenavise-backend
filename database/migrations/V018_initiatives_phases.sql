/**
 * V018: Add phases to initiatives table
 * Permet de suivre l'évolution des initiatives (discussion → vote → décision)
 */

ALTER TABLE initiatives
  ADD COLUMN IF NOT EXISTS phase VARCHAR(50) DEFAULT 'discussion'
    CHECK (phase IN ('discussion', 'vote', 'decision')),
  ADD COLUMN IF NOT EXISTS phase_started_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS phase_ended_at TIMESTAMP;

-- Index pour rechercher par phase
CREATE INDEX IF NOT EXISTS idx_initiatives_phase ON initiatives(phase) WHERE deleted_at IS NULL;

-- Table optionnelle pour l'historique des phases
CREATE TABLE IF NOT EXISTS initiative_phase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  old_phase VARCHAR(50),
  new_phase VARCHAR(50) NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_initiative_phase_history ON initiative_phase_history(initiative_id);
