-- V004: Add performance indexes for critical queries
-- This migration creates strategic indexes to improve query performance
-- Based on query analysis and production patterns

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(email_verified);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_official ON profiles(is_official) WHERE is_official = true;
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_category ON profiles(category);

-- Posts table indexes
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_is_featured ON posts(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_posts_visibility ON posts(visibility);

-- Likes table indexes (for fast counting)
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_post_user ON likes(post_id, user_id);

-- Follows table indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_follows_unique ON follows(follower_id, following_id);

-- Comments table indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Map nodes indexes
CREATE INDEX IF NOT EXISTS idx_map_nodes_user_id ON map_nodes(user_id);
CREATE INDEX IF NOT EXISTS idx_map_nodes_created_at ON map_nodes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_map_nodes_type ON map_nodes(type);
-- Spatial index for map queries
CREATE INDEX IF NOT EXISTS idx_map_nodes_geometry ON map_nodes USING GIST(geometry);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Search vector indexes (for full-text search)
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_profiles_search ON profiles USING GIN(search_vector);

-- Trigram indexes for LIKE queries
CREATE INDEX IF NOT EXISTS idx_posts_title_trgm ON posts USING GIST(title gist_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON posts USING GIST(content gist_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING GIST(username gist_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_bio_trgm ON profiles USING GIST(bio gist_trgm_ops);

-- Composite indexes for common join queries
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_post_created ON likes(post_id, created_at DESC);

-- Refresh tokens table indexes (for cleanup queries)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked_at ON refresh_tokens(revoked_at) WHERE revoked_at IS NOT NULL;

-- Analyze tables to update statistics
ANALYZE users;
ANALYZE profiles;
ANALYZE posts;
ANALYZE likes;
ANALYZE follows;
ANALYZE comments;
ANALYZE map_nodes;
ANALYZE notifications;
ANALYZE refresh_tokens;
