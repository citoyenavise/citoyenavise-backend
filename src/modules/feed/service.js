/**
 * Feed Service — Smart feed with temporal scoring
 */

const { query } = require('../../core/services/database');

class FeedService {
  /**
   * Get smart feed for user
   * Scoring: popularity + recency + user interests
   */
  static async getSmartFeed({ userId, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    // Smart scoring formula:
    // baseScore = log(1 + likes + comments)
    // timeDecay = exp(-hours_old / 48)
    // finalScore = baseScore * timeDecay
    const result = await query(
      `SELECT
         p.id,
         p.user_id,
         p.title,
         p.content,
         p.type,
         p.category,
         p.likes_count,
         p.views_count,
         p.comments_count,
         p.created_at,
         u.username,
         u.id as author_id,
         pr.avatar_url,
         (
           LN(1 + COALESCE(p.likes_count, 0) + COALESCE(p.comments_count, 0)) *
           EXP(-EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600 / 48)
         ) as feed_score
       FROM posts p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN profiles pr ON u.id = pr.user_id
       WHERE p.status = 'published'
         AND p.deleted_at IS NULL
         AND u.deleted_at IS NULL
       ORDER BY feed_score DESC, p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count
    const totalRes = await query(
      `SELECT COUNT(*) as count FROM posts
       WHERE status = 'published' AND deleted_at IS NULL`
    );

    return {
      data: result.rows.map(p => ({
        id: p.id,
        userId: p.user_id,
        title: p.title,
        content: p.content,
        type: p.type,
        category: p.category,
        likesCount: p.likes_count,
        viewsCount: p.views_count,
        commentsCount: p.comments_count,
        createdAt: p.created_at,
        author: {
          id: p.author_id,
          username: p.username,
          avatarUrl: p.avatar_url,
        },
        feedScore: parseFloat(p.feed_score || 0).toFixed(4),
      })),
      meta: {
        total: parseInt(totalRes.rows[0].count, 10),
        page,
        limit,
      },
    };
  }

  /**
   * Get user activity (posts, comments, likes, etc.)
   */
  static async getUserActivity({ userId, page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;

    const result = await query(
      `(
        SELECT
          'post' as type,
          p.id,
          p.title as title,
          p.created_at,
          p.user_id,
          NULL::TEXT as target_type
        FROM posts p
        WHERE p.user_id = $1 AND p.deleted_at IS NULL
      )
      UNION ALL
      (
        SELECT
          'comment' as type,
          c.id,
          c.content as title,
          c.created_at,
          c.user_id,
          c.target_type
        FROM comments c
        WHERE c.user_id = $1 AND c.deleted_at IS NULL
      )
      UNION ALL
      (
        SELECT
          'like' as type,
          l.id,
          l.target_type || ':' || l.target_id as title,
          l.created_at,
          l.user_id,
          l.target_type
        FROM likes l
        WHERE l.user_id = $1
      )
      UNION ALL
      (
        SELECT
          'initiative' as type,
          i.id,
          i.title,
          i.created_at,
          i.creator_id as user_id,
          NULL::TEXT as target_type
        FROM initiatives i
        WHERE i.creator_id = $1 AND i.deleted_at IS NULL
      )
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }
}

module.exports = { FeedService };
