-- Migration: Add performance indexes
-- Date: 2026-05-03
-- Purpose: Optimize query performance based on access patterns

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_province ON profiles(province);

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_deleted_at ON posts(deleted_at) WHERE deleted_at IS NULL;
-- Compound index for common queries
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);

-- Likes table indexes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
-- Unique constraint for idempotence
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_user_post ON likes(user_id, post_id);

-- Follows table indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_follows_unique ON follows(follower_id, following_id);

-- Flags table indexes
CREATE INDEX IF NOT EXISTS idx_flags_post_id ON flags(post_id);
CREATE INDEX IF NOT EXISTS idx_flags_flagged_by ON flags(flagged_by);
CREATE INDEX IF NOT EXISTS idx_flags_resolved_at ON flags(resolved_at);

-- Map nodes indexes
CREATE INDEX IF NOT EXISTS idx_map_nodes_profile_id ON map_nodes(profile_id);
CREATE INDEX IF NOT EXISTS idx_map_nodes_province ON map_nodes(province);
-- Spatial index for PostGIS queries

-- Content pages indexes
CREATE INDEX IF NOT EXISTS idx_content_pages_slug ON content_pages(slug);
CREATE INDEX IF NOT EXISTS idx_content_pages_published ON content_pages(is_published);

-- Notes:
-- 1. All indexes follow naming convention: idx_table_columns
-- 2. Unique indexes used for constraint enforcement
-- 3. WHERE clauses used for partial indexes (e.g., deleted_at filtering)
-- 4. Spatial index via GIST for PostGIS queries
-- 5. Compound indexes for common multi-column queries
-- 6. DESC on created_at for chronological ordering efficiency
