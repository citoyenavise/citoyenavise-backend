/**
 * Likes Service — Version corrigée
 */

const { query, transaction } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');
const cache = require('../../core/services/cache');
const logger = require('../../core/utils/logger');
const eventBus = require('../../core/eventBus');
const LikeAdded = require('../../events/LikeAdded');

/**
 * Liker un post
 */
async function likePost(postId, userId) {
  const post = await query(
    `SELECT id, user_id, status
     FROM posts
     WHERE id = $1 AND deleted_at IS NULL`,
    [postId]
  );

  if (!post.rows[0]) throw new AppError('Post non trouvé', 404);
  if (post.rows[0].status !== 'published') {
    throw new AppError('Impossible de liker un post non publié', 400);
  }

  let inserted = false;

  await transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO likes (user_id, post_id, created_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (user_id, post_id) DO NOTHING
       RETURNING id`,
      [userId, postId]
    );

    inserted = result.rows.length > 0;

    if (inserted) {
      await client.query(
        `UPDATE posts
         SET likes_count = likes_count + 1
         WHERE id = $1`,
        [postId]
      );

      await cache.invalidatePattern('popular:*');
    }
  });

  if (inserted) {
    eventBus.emit(
      'like.added',
      new LikeAdded({
        postId,
        userId,
        postOwnerId: post.rows[0].user_id,
        timestamp: new Date().toISOString(),
      }).toJSON()
    );
  }

  return { postId, userId, liked: inserted };
}

/**
 * Retirer un like
 */
async function unlikePost(postId, userId) {
  const post = await query(
    `SELECT id FROM posts WHERE id = $1 AND deleted_at IS NULL`,
    [postId]
  );

  if (!post.rows[0]) throw new AppError('Post non trouvé', 404);

  await transaction(async (client) => {
    const result = await client.query(
      `DELETE FROM likes
       WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );

    if (result.rowCount > 0) {
      await client.query(
        `UPDATE posts
         SET likes_count = GREATEST(likes_count - 1, 0)
         WHERE id = $1`,
        [postId]
      );

      await cache.invalidatePattern('popular:*');
    }
  });
}

/**
 * Obtenir les likes d'un post
 */
async function getPostLikes(postId, limit = 20) {
  const maxLimit = Math.min(limit, 100);

  const result = await query(`
    SELECT u.id, u.username, pr.avatar_url, l.created_at
    FROM likes l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE l.post_id = $1 AND u.deleted_at IS NULL
    ORDER BY l.created_at DESC
    LIMIT $2
  `, [postId, maxLimit]);

  return result.rows;
}

/**
 * Vérifier si l'utilisateur a aimé un post
 */
async function checkLike(postId, userId) {
  if (!userId) return false;

  const result = await query(
    'SELECT id FROM likes WHERE user_id = $1 AND post_id = $2',
    [userId, postId]
  );

  return result.rows.length > 0;
}

/**
 * Obtenir les statistiques de likes d'un post
 */
async function getPostLikeStats(postId) {
  const result = await query(`
    SELECT
      COUNT(*) as total_likes,
      COUNT(DISTINCT user_id) as unique_likers
    FROM likes
    WHERE post_id = $1
  `, [postId]);

  return {
    totalLikes: parseInt(result.rows[0].total_likes),
    uniqueLikers: parseInt(result.rows[0].unique_likers),
  };
}

module.exports = {
  likePost,
  unlikePost,
  getPostLikes,
  checkLike,
  getPostLikeStats,
};
