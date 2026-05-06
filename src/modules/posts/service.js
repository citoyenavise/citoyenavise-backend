/**
 * Service posts & idées — version corrigée et stabilisée
 */

const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');
const logger = require('../../core/utils/logger');
const eventBus = require('../../core/eventBus');

const VALID_TYPES = ['idea', 'proposal', 'question', 'discussion'];
const VALID_CATEGORIES = ['élections', 'gouvernement', 'droits', 'services', 'santé', 'éducation', 'environnement', 'économie', 'autres'];

/**
 * Validation stricte type + catégorie
 */
function validateTypeCategory(type, category) {
  if (!VALID_TYPES.includes(type)) {
    throw new AppError(`Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`, 400);
  }
  if (!VALID_CATEGORIES.includes(category)) {
    throw new AppError(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
  }
}

/**
 * Lister posts (feed)
 */
async function listPosts({ limit = 20, page = 1, category = null, type = null, sort = 'latest', userId = null }) {
  const offset = (page - 1) * limit;
  const maxLimit = Math.min(limit, 100);

  let sql = `
    SELECT p.id, p.user_id, p.title, p.content, p.type, p.category, p.likes_count, p.views_count, p.is_pinned, p.created_at,
           u.username, pr.avatar_url, pr.location
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE p.status = 'published' AND p.deleted_at IS NULL AND u.deleted_at IS NULL
  `;
  const params = [];
  let paramIndex = 1;

  if (category) {
    validateTypeCategory('idea', category); // validation catégorie seule
    sql += ` AND p.category = $${paramIndex}`;
    params.push(category);
    paramIndex += 1;
  }

  if (type) {
    if (!VALID_TYPES.includes(type)) throw new AppError('Invalid type', 400);
    sql += ` AND p.type = $${paramIndex}`;
    params.push(type);
    paramIndex += 1;
  }

  if (userId) {
    sql += ` AND p.user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex += 1;
  }

  sql += sort === 'popular'
    ? ' ORDER BY p.likes_count DESC, p.created_at DESC'
    : ' ORDER BY p.created_at DESC';

  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(maxLimit, offset);

  const result = await query(sql, params);

  // Total
  let countSql = `
    SELECT COUNT(*)
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.status = 'published' AND p.deleted_at IS NULL AND u.deleted_at IS NULL
  `;
  const countParams = [];
  let countIndex = 1;

  if (category) {
    countSql += ` AND p.category = $${countIndex}`;
    countParams.push(category);
    countIndex += 1;
  }
  if (type) {
    countSql += ` AND p.type = $${countIndex}`;
    countParams.push(type);
    countIndex += 1;
  }
  if (userId) {
    countSql += ` AND p.user_id = $${countIndex}`;
    countParams.push(userId);
  }

  const total = parseInt((await query(countSql, countParams)).rows[0].count, 10);

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
      isPinned: p.is_pinned,
      creator: {
        username: p.username,
        avatarUrl: p.avatar_url,
        location: p.location,
      },
      createdAt: p.created_at,
    })),
    meta: {
      total,
      page,
      limit: maxLimit,
      pages: Math.ceil(total / maxLimit),
    },
  };
}

/**
 * Récupérer post (uniquement publié)
 */
async function getPost(postId) {
  const result = await query(
    `SELECT p.id, p.user_id, p.title, p.content, p.type, p.category, p.likes_count, p.views_count, p.is_pinned, p.created_at, p.updated_at,
            u.username, pr.avatar_url, pr.location
     FROM posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN profiles pr ON u.id = pr.user_id
     WHERE p.id = $1 AND p.status = 'published' AND p.deleted_at IS NULL`,
    [postId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Post not found', 404);
  }

  const p = result.rows[0];
  return {
    id: p.id,
    userId: p.user_id,
    title: p.title,
    content: p.content,
    type: p.type,
    category: p.category,
    likesCount: p.likes_count,
    viewsCount: p.views_count,
    isPinned: p.is_pinned,
    creator: {
      username: p.username,
      avatarUrl: p.avatar_url,
      location: p.location,
    },
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

/**
 * Créer post
 */
async function createPost(userId, { title, content, type, category }) {
  validateTypeCategory(type, category);

  const postId = uuidv4();

  const result = await query(
    `INSERT INTO posts (id, user_id, title, content, type, category, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'published')
     RETURNING id, user_id, title, content, type, category, likes_count, created_at`,
    [postId, userId, title, content, type, category]
  );

  // Incrément posts_count
  await query(
    'UPDATE profiles SET posts_count = posts_count + 1 WHERE user_id = $1',
    [userId]
  );

  logger.info('Post created', { meta: { postId, userId } });

  // Émettre événement pour invalidation du cache popular
  eventBus.emit('post.created', {
    postId,
    userId,
    timestamp: new Date().toISOString(),
  });

  return result.rows[0];
}

/**
 * Mettre à jour post
 */
async function updatePost(postId, data, requestingUserId) {
  const result = await query('SELECT user_id, type FROM posts WHERE id = $1', [postId]);

  if (result.rows.length === 0) throw new AppError('Post not found', 404);
  if (result.rows[0].user_id !== requestingUserId) throw new AppError('Cannot update another post', 403);

  const originalType = result.rows[0].type;

  const updates = [];
  const params = [postId];
  let paramIndex = 2;

  if (data.title) {
    updates.push(`title = $${paramIndex}`);
    params.push(data.title);
    paramIndex++;
  }

  if (data.content) {
    updates.push(`content = $${paramIndex}`);
    params.push(data.content);
    paramIndex++;
  }

  if (data.category) {
    validateTypeCategory(originalType, data.category);
    updates.push(`category = $${paramIndex}`);
    params.push(data.category);
    paramIndex++;
  }

  if (updates.length === 0) return getPost(postId);

  updates.push('updated_at = NOW()');

  await query(`UPDATE posts SET ${updates.join(', ')} WHERE id = $1`, params);

  logger.info('Post updated', { meta: { postId } });
  return getPost(postId);
}

/**
 * Supprimer post
 */
async function deletePost(postId, requestingUserId) {
  const result = await query('SELECT user_id FROM posts WHERE id = $1', [postId]);

  if (result.rows.length === 0) throw new AppError('Post not found', 404);
  if (result.rows[0].user_id !== requestingUserId) throw new AppError('Cannot delete another post', 403);

  await query('UPDATE posts SET deleted_at = NOW() WHERE id = $1', [postId]);

  // Décrément posts_count
  await query(
    'UPDATE profiles SET posts_count = posts_count - 1 WHERE user_id = $1',
    [requestingUserId]
  );

  logger.info('Post deleted', { meta: { postId } });
}

/**
 * Signaler post (modération)
 */
async function flagPost(postId, reason, userId) {
  const exists = await query('SELECT id FROM posts WHERE id = $1 AND deleted_at IS NULL', [postId]);
  if (exists.rows.length === 0) throw new AppError('Post not found', 404);

  await query(
    `UPDATE posts
     SET status = 'flagged', is_flagged = true, flag_reason = $1, updated_at = NOW()
     WHERE id = $2`,
    [reason, postId]
  );

  logger.warn('Post flagged', { meta: { postId, userId, reason } });
}

/**
 * Liker un post
 */
async function likePost(postId, userId) {
  const exists = await query('SELECT id FROM posts WHERE id = $1 AND status = \'published\'', [postId]);
  if (exists.rows.length === 0) throw new AppError('Post not found', 404);

  await transaction(async (client) => {
    const insert = await client.query(
      `INSERT INTO likes (user_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, post_id) DO NOTHING
       RETURNING id`,
      [userId, postId]
    );

    if (insert.rows.length > 0) {
      await client.query(
        'UPDATE posts SET likes_count = likes_count + 1 WHERE id = $1',
        [postId]
      );
    }
  });
}

/**
 * Unliker un post
 */
async function unlikePost(postId, userId) {
  await transaction(async (client) => {
    const del = await client.query(
      'DELETE FROM likes WHERE user_id = $1 AND post_id = $2 RETURNING id',
      [userId, postId]
    );

    if (del.rows.length > 0) {
      await client.query(
        'UPDATE posts SET likes_count = likes_count - 1 WHERE id = $1',
        [postId]
      );
    }
  });
}

/**
 * Idées populaires
 */
async function getPopularIdeas({ limit = 5, category = null }) {
  const maxLimit = Math.min(limit, 20);

  if (category && !VALID_CATEGORIES.includes(category)) {
    throw new AppError('Invalid category', 400);
  }

  const params = ['idea', 'published'];
  let sql = `
    SELECT p.id, p.user_id, p.title, p.content, p.type, p.category, p.likes_count, p.views_count, p.is_pinned, p.created_at,
           u.username, pr.avatar_url, pr.location
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE p.type = $1 AND p.status = $2 AND p.deleted_at IS NULL AND u.deleted_at IS NULL
  `;

  if (category) {
    sql += ` AND p.category = $3`;
    params.push(category);
  }

  sql += ` ORDER BY p.likes_count DESC, p.created_at DESC LIMIT ${maxLimit}`;

  const result = await query(sql, params);

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
      isPinned: p.is_pinned,
      creator: {
        username: p.username,
        avatarUrl: p.avatar_url,
        location: p.location,
      },
      createdAt: p.created_at,
    })),
  };
}

/**
 * Posts populaires (avec filtrage par période et tri flexible)
 */
async function getPopularPosts({ range = 'daily', page = 1, limit = 10, sort = 'score' }) {
  const offset = (page - 1) * limit;
  const maxLimit = Math.min(limit, 50);

  let dateFilter = '';
  if (range === 'daily') {
    dateFilter = `AND p.created_at >= NOW() - INTERVAL '1 day'`;
  } else if (range === 'weekly') {
    dateFilter = `AND p.created_at >= NOW() - INTERVAL '7 days'`;
  } else if (range === 'monthly') {
    dateFilter = `AND p.created_at >= NOW() - INTERVAL '30 days'`;
  }

  let orderBy = 'p.likes_count DESC, p.views_count DESC, p.created_at DESC';
  if (sort === 'likes') {
    orderBy = 'p.likes_count DESC, p.created_at DESC';
  } else if (sort === 'comments') {
    orderBy = '(SELECT COUNT(*) FROM comments WHERE post_id = p.id) DESC, p.created_at DESC';
  }

  const sql = `
    SELECT p.id, p.user_id, p.title, p.content, p.type, p.category, p.likes_count, p.views_count, p.is_pinned, p.created_at,
           u.username, pr.avatar_url, pr.location,
           (SELECT COUNT(*) FROM comments WHERE post_id = p.id AND deleted_at IS NULL) as comments_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE p.status = 'published' AND p.deleted_at IS NULL AND u.deleted_at IS NULL ${dateFilter}
    ORDER BY ${orderBy}
    LIMIT $1 OFFSET $2
  `;

  const result = await query(sql, [maxLimit, offset]);

  const countSql = `
    SELECT COUNT(*)
    FROM posts p
    WHERE p.status = 'published' AND p.deleted_at IS NULL ${dateFilter}
  `;
  const total = parseInt((await query(countSql, [])).rows[0].count, 10);

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
      commentsCount: parseInt(p.comments_count, 10),
      isPinned: p.is_pinned,
      creator: {
        username: p.username,
        avatarUrl: p.avatar_url,
        location: p.location,
      },
      createdAt: p.created_at,
    })),
    meta: {
      total,
      page,
      limit: maxLimit,
      pages: Math.ceil(total / maxLimit),
      range,
      sort,
    },
  };
}

module.exports = {
  listPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  flagPost,
  likePost,
  unlikePost,
  getPopularIdeas,
  getPopularPosts,
};
