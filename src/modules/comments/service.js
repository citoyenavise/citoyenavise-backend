/**
 * Comments Service — Version corrigée & stabilisée
 */

const { query, transaction } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');
const logger = require('../../core/utils/logger');
const eventBus = require('../../core/eventBus');
const CommentCreated = require('../../events/CommentCreated');

/**
 * Créer un commentaire
 */
async function createComment(postId, userId, content) {
  const post = await query(
    `SELECT id, user_id, status
     FROM posts
     WHERE id = $1 AND deleted_at IS NULL`,
    [postId]
  );

  if (!post.rows[0]) throw new AppError('Post non trouvé', 404);
  if (post.rows[0].status !== 'published') {
    throw new AppError('Impossible de commenter un post non publié', 400);
  }

  let commentId = null;

  await transaction(async (client) => {
    const result = await client.query(
      `INSERT INTO comments (post_id, user_id, content, status, created_at)
       VALUES ($1, $2, $3, 'published', NOW())
       RETURNING id`,
      [postId, userId, content]
    );

    commentId = result.rows[0].id;

    await client.query(
      `UPDATE posts
       SET replies_count = replies_count + 1
       WHERE id = $1`,
      [postId]
    );
  });

  // Emit event
  eventBus.emit(
    'comment.created',
    new CommentCreated({
      commentId,
      postId,
      userId,
      postOwnerId: post.rows[0].user_id,
      timestamp: new Date().toISOString(),
    }).toJSON()
  );

  return await getCommentById(commentId);
}

/**
 * Lister les commentaires d'un post
 */
async function getCommentsByPost(postId, limit, page, sort) {
  const offset = (page - 1) * limit;
  const maxLimit = Math.min(limit, 100);

  const orderBy =
    sort === 'popular'
      ? 'ORDER BY c.likes_count DESC, c.created_at ASC'
      : 'ORDER BY c.created_at ASC';

  const result = await query(
    `
    SELECT
      c.id,
      c.post_id AS "postId",
      c.user_id AS "userId",
      c.content,
      c.created_at AS "createdAt",
      c.updated_at AS "updatedAt",
      u.username,
      pr.avatar_url AS "avatarUrl"
    FROM comments c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE c.post_id = $1
      AND c.deleted_at IS NULL
      AND c.status = 'published'
    ${orderBy}
    LIMIT $2 OFFSET $3
  `,
    [postId, maxLimit, offset]
  );

  // Get total count
  const countResult = await query(
    `SELECT COUNT(*) as count FROM comments c
     WHERE c.post_id = $1 AND c.deleted_at IS NULL AND c.status = 'published'`,
    [postId]
  );
  const total = parseInt(countResult.rows[0].count, 10);

  return {
    data: result.rows,
    meta: {
      total,
      page,
      limit: maxLimit,
      pages: Math.ceil(total / maxLimit),
    },
  };
}

/**
 * Obtenir un commentaire
 */
async function getCommentById(commentId) {
  const result = await query(
    `
    SELECT
      c.id,
      c.post_id AS "postId",
      c.user_id AS "userId",
      c.content,
      c.status,
      c.created_at AS "createdAt",
      c.updated_at AS "updatedAt",
      u.username,
      pr.avatar_url AS "avatarUrl"
    FROM comments c
    JOIN users u ON c.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE c.id = $1
      AND c.deleted_at IS NULL
      AND c.status = 'published'
  `,
    [commentId]
  );

  if (!result.rows[0]) throw new AppError('Commentaire non trouvé', 404);
  return result.rows[0];
}

/**
 * Mettre à jour un commentaire
 */
async function updateComment(commentId, userId, content) {
  const comment = await query(
    `SELECT user_id FROM comments WHERE id = $1 AND deleted_at IS NULL`,
    [commentId]
  );

  if (!comment.rows[0]) throw new AppError('Commentaire non trouvé', 404);
  if (comment.rows[0].user_id !== userId) {
    throw new AppError('Non autorisé', 403);
  }

  await query(
    `UPDATE comments
     SET content = $1, updated_at = NOW()
     WHERE id = $2`,
    [content, commentId]
  );

  return await getCommentById(commentId);
}

/**
 * Supprimer un commentaire
 */
async function deleteComment(commentId, userId) {
  const comment = await query(
    `SELECT id, post_id, user_id
     FROM comments
     WHERE id = $1 AND deleted_at IS NULL`,
    [commentId]
  );

  if (!comment.rows[0]) throw new AppError('Commentaire non trouvé', 404);
  if (comment.rows[0].user_id !== userId) {
    throw new AppError('Non autorisé', 403);
  }

  await transaction(async (client) => {
    await client.query(
      `UPDATE comments
       SET deleted_at = NOW()
       WHERE id = $1`,
      [commentId]
    );

    await client.query(
      `UPDATE posts
       SET replies_count = GREATEST(replies_count - 1, 0)
       WHERE id = $1`,
      [comment.rows[0].post_id]
    );
  });
}

module.exports = {
  createComment,
  getCommentsByPost,
  getCommentById,
  updateComment,
  deleteComment,
};
