-- =========================================
-- Migration V001 - Schema Initial
-- Date: 2026-05-02
-- Description: Création du schéma complet
-- =========================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- Table de versioning
CREATE TABLE IF NOT EXISTS schema_versions (
  version_number INT PRIMARY KEY,
  description VARCHAR(255) NOT NULL,
  installed_on TIMESTAMP DEFAULT NOW(),
  execution_time INT
);

-- =========================================
-- TABLE : users
-- =========================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  role VARCHAR(20) DEFAULT 'citizen' CHECK (role IN ('citizen', 'moderator', 'admin')),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(LOWER(email));
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_deleted ON users(deleted_at);

-- =========================================
-- TABLE : profiles
-- =========================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  avatar_url VARCHAR(512),
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  interests TEXT[] DEFAULT '{}',
  followers_count INT DEFAULT 0,
  posts_count INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_profiles_verified ON profiles(is_verified);

-- =========================================
-- TABLE : posts
-- =========================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'discussion' CHECK (type IN ('idea', 'proposal', 'question', 'discussion')),
  category VARCHAR(50),
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  status VARCHAR(50) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived', 'flagged')),
  likes_count INT DEFAULT 0,
  replies_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  flag_reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_type ON posts(type);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_deleted ON posts(deleted_at);

-- =========================================
-- TABLE : likes
-- =========================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, post_id)
);

CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);

-- =========================================
-- TABLE : follows
-- =========================================
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- =========================================
-- TABLE : map_nodes
-- =========================================
CREATE TABLE IF NOT EXISTS map_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  node_type VARCHAR(50) DEFAULT 'citizen' CHECK (node_type IN ('citizen', 'organization', 'event')),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  province VARCHAR(2),
  municipality VARCHAR(255),
  category VARCHAR(50),
  url VARCHAR(512),
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- PostGIS geometry
ALTER TABLE map_nodes ADD COLUMN IF NOT EXISTS geometry GEOMETRY(Point, 4326)
  GENERATED ALWAYS AS (ST_SetSRID(ST_Point(longitude, latitude), 4326)) STORED;

CREATE INDEX idx_map_nodes_profile ON map_nodes(profile_id);
CREATE INDEX idx_map_nodes_type ON map_nodes(node_type);
CREATE INDEX idx_map_nodes_province ON map_nodes(province);
CREATE INDEX idx_map_nodes_geometry ON map_nodes USING gist(geometry);

-- Record migration
INSERT INTO schema_versions (version_number, description)
VALUES (1, 'Initial schema with users, posts, likes, follows, map_nodes');
