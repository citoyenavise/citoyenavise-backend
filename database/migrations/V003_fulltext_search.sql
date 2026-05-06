-- V003: Add full-text search capabilities (PostgreSQL text search)

-- Créer extension pour text search avancé (trigram matching)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Ajouter colonnes tsvector générées pour posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing posts
UPDATE posts SET search_vector = to_tsvector('french', COALESCE(title, '') || ' ' || COALESCE(content, ''));

-- Trigger pour mettre à jour la colonne tsvector automatiquement
CREATE OR REPLACE FUNCTION update_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('french', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_search_vector_trigger ON posts;

CREATE TRIGGER posts_search_vector_trigger
BEFORE INSERT OR UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_posts_search_vector();

-- Ajouter colonnes tsvector générées pour users (search par username + bio)
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate existing users
UPDATE users SET search_vector = to_tsvector('french', COALESCE(username, '')) WHERE search_vector IS NULL;
UPDATE profiles SET search_vector = to_tsvector('french', COALESCE(bio, '')) WHERE search_vector IS NULL;

-- Trigger pour users
CREATE OR REPLACE FUNCTION update_users_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('french', COALESCE(NEW.username, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_search_vector_trigger ON users;

CREATE TRIGGER users_search_vector_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_search_vector();

-- Trigger pour profiles
CREATE OR REPLACE FUNCTION update_profiles_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('french', COALESCE(NEW.bio, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_search_vector_trigger ON profiles;

CREATE TRIGGER profiles_search_vector_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_profiles_search_vector();

-- Créer GIN indexes pour performance optimale
CREATE INDEX IF NOT EXISTS idx_posts_search_vector ON posts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_users_search_vector ON users USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector ON profiles USING GIN(search_vector);

-- Créer GIST indexes pour trigram similarity
CREATE INDEX IF NOT EXISTS idx_posts_title_trigram ON posts USING GIST(title gist_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_trigram ON posts USING GIST(content gist_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_username_trigram ON users USING GIST(username gist_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_bio_trigram ON profiles USING GIST(bio gist_trgm_ops);
