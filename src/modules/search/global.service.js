/**
 * Global Search Service
 */

const db = require('../../lib/db');

class GlobalSearchService {
  static async search({ query, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;

    const [posts, articles, videos, initiatives, profiles] = await Promise.all([
      db.query(
        `SELECT 'post' as type, id, title, content as description, created_at FROM posts
         WHERE status = 'published' AND deleted_at IS NULL AND (title ILIKE $1 OR content ILIKE $1)
         LIMIT $2 OFFSET $3`,
        [searchTerm, limit, offset]
      ),
      db.query(
        `SELECT 'article' as type, id, title, content as description, created_at FROM education_articles
         WHERE deleted_at IS NULL AND (title ILIKE $1 OR content ILIKE $1)
         LIMIT $2 OFFSET $3`,
        [searchTerm, limit, offset]
      ),
      db.query(
        `SELECT 'video' as type, id, title, description, created_at FROM education_videos
         WHERE deleted_at IS NULL AND (title ILIKE $1 OR description ILIKE $1)
         LIMIT $2 OFFSET $3`,
        [searchTerm, limit, offset]
      ),
      db.query(
        `SELECT 'initiative' as type, id, title, description, created_at FROM initiatives
         WHERE deleted_at IS NULL AND (title ILIKE $1 OR description ILIKE $1)
         LIMIT $2 OFFSET $3`,
        [searchTerm, limit, offset]
      ),
      db.query(
        `SELECT 'profile' as type, id, username as title, bio as description, created_at FROM profiles
         WHERE user_id NOT IN (SELECT id FROM users WHERE deleted_at IS NOT NULL)
         AND (username ILIKE $1 OR bio ILIKE $1)
         LIMIT $2 OFFSET $3`,
        [searchTerm, limit, offset]
      ),
    ]);

    return {
      posts: posts.rows,
      articles: articles.rows,
      videos: videos.rows,
      initiatives: initiatives.rows,
      profiles: profiles.rows,
      meta: { page, limit },
    };
  }
}

module.exports = { GlobalSearchService };
