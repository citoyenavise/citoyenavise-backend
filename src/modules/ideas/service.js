/**
 * Ideas Service
 * Logique métier pour les idées civiques
 */

const { v4: uuidv4 } = require('uuid');
const { query, transaction } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');
const logger = require('../../core/utils/logger');

const VALID_CATEGORIES = [
  'élections', 'gouvernement', 'droits', 'services', 'santé',
  'éducation', 'environnement', 'économie', 'impôts', 'sécurité',
  'logement', 'transport', 'immigration', 'justice', 'accessibilité',
  'autochtones', 'budget', 'autre'
];

/**
 * Valider catégorie
 */
function validateCategory(category) {
  if (!VALID_CATEGORIES.includes(category)) {
    throw new AppError(`Catégorie invalide. Doit être: ${VALID_CATEGORIES.join(', ')}`, 400);
  }
}

/**
 * Lister les idées
 */
async function listIdeas({ limit = 20, page = 1, category = null, sort = 'latest', userId = null }) {
  const offset = (page - 1) * limit;
  const maxLimit = Math.min(limit, 100);

  let sql = `
    SELECT p.id, p.user_id, p.title, p.content, p.category, p.likes_count, p.views_count, p.created_at,
           u.username, pr.avatar_url, pr.location, pr.bio,
           (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as likes_count
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE p.type = 'idea' AND p.status = 'published' AND p.deleted_at IS NULL AND u.deleted_at IS NULL
  `;

  const params = [];
  let paramIndex = 1;

  if (category) {
    validateCategory(category);
    sql += ` AND p.category = $${paramIndex}`;
    params.push(category);
    paramIndex += 1;
  }

  // Tri
  if (sort === 'popular') {
    sql += ' ORDER BY p.likes_count DESC, p.created_at DESC';
  } else if (sort === 'trending') {
    // Trending = likes récents
    sql += ' ORDER BY p.created_at DESC, p.likes_count DESC';
  } else {
    sql += ' ORDER BY p.created_at DESC';
  }

  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(maxLimit, offset);

  const result = await query(sql, params);

  // Total pour pagination
  let countSql = 'SELECT COUNT(*) as count FROM posts p JOIN users u ON p.user_id = u.id WHERE p.type = $1 AND p.status = $2 AND p.deleted_at IS NULL AND u.deleted_at IS NULL';
  const countParams = ['idea', 'published'];

  if (category) {
    countSql += ' AND p.category = $3';
    countParams.push(category);
  }

  const countResult = await query(countSql, countParams);
  const total = parseInt(countResult.rows[0].count);

  return {
    data: result.rows.map(idea => ({
      id: idea.id,
      userId: idea.user_id,
      title: idea.title,
      content: idea.content,
      category: idea.category,
      likesCount: idea.likes_count,
      viewsCount: idea.views_count,
      creator: {
        username: idea.username,
        avatarUrl: idea.avatar_url,
        location: idea.location,
        bio: idea.bio,
      },
      createdAt: idea.created_at,
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
 * Obtenir une idée
 */
async function getIdea(ideaId, userId = null) {
  const result = await query(`
    SELECT p.id, p.user_id, p.title, p.content, p.category, p.likes_count, p.views_count, p.created_at, p.updated_at,
           u.username, pr.avatar_url, pr.location, pr.bio,
           EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $2) as is_liked
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE p.id = $1 AND p.type = 'idea' AND p.status = 'published' AND p.deleted_at IS NULL
  `, [ideaId, userId]);

  return result.rows[0] || null;
}

/**
 * Créer une idée
 */
async function createIdea({ title, content, category, userId }) {
  validateCategory(category);

  const ideaId = uuidv4();

  try {
    await transaction(async (client) => {
      // Créer le post
      await client.query(`
        INSERT INTO posts (id, user_id, title, content, type, category, status, likes_count, views_count, created_at, updated_at)
        VALUES ($1, $2, $3, $4, 'idea', $5, 'published', 0, 0, NOW(), NOW())
      `, [ideaId, userId, title, content, category]);

      // Mettre à jour le compteur de l'utilisateur
      await client.query(`
        UPDATE profiles SET posts_count = posts_count + 1
        WHERE user_id = $1
      `, [userId]);
    });

    logger.info('Idée créée', { ideaId, userId });
    return await getIdea(ideaId, userId);
  } catch (error) {
    logger.error('Erreur lors de la création de l\'idée', { error: error.message });
    throw error;
  }
}

/**
 * Modifier une idée
 */
async function updateIdea(ideaId, updates, userId) {
  // Vérifier que l'utilisateur est propriétaire
  const result = await query('SELECT user_id FROM posts WHERE id = $1 AND type = $2', [ideaId, 'idea']);
  if (!result.rows[0]) {
    throw new AppError('Idée non trouvée', 404);
  }
  if (result.rows[0].user_id !== userId) {
    throw new AppError('Vous ne pouvez modifier que vos propres idées', 403);
  }

  // Valider les mises à jour
  if (updates.category) {
    validateCategory(updates.category);
  }

  const setClause = [];
  const params = [ideaId];
  let paramIndex = 2;

  if (updates.title) {
    setClause.push(`title = $${paramIndex}`);
    params.push(updates.title);
    paramIndex += 1;
  }
  if (updates.content) {
    setClause.push(`content = $${paramIndex}`);
    params.push(updates.content);
    paramIndex += 1;
  }
  if (updates.category) {
    setClause.push(`category = $${paramIndex}`);
    params.push(updates.category);
    paramIndex += 1;
  }

  if (setClause.length === 0) {
    return await getIdea(ideaId, userId);
  }

  setClause.push('updated_at = NOW()');
  const sql = `UPDATE posts SET ${setClause.join(', ')} WHERE id = $1 RETURNING *`;

  await query(sql, params);
  return await getIdea(ideaId, userId);
}

/**
 * Supprimer une idée
 */
async function deleteIdea(ideaId, userId) {
  // Vérifier propriétaire
  const result = await query('SELECT user_id FROM posts WHERE id = $1 AND type = $2', [ideaId, 'idea']);
  if (!result.rows[0]) {
    throw new AppError('Idée non trouvée', 404);
  }
  if (result.rows[0].user_id !== userId) {
    throw new AppError('Vous ne pouvez supprimer que vos propres idées', 403);
  }

  await transaction(async (client) => {
    // Soft delete
    await client.query('UPDATE posts SET deleted_at = NOW() WHERE id = $1', [ideaId]);

    // Mettre à jour compteur
    await client.query('UPDATE profiles SET posts_count = posts_count - 1 WHERE user_id = $1', [userId]);

    // Supprimer les likes
    await client.query('DELETE FROM likes WHERE post_id = $1', [ideaId]);
  });

  logger.info('Idée supprimée', { ideaId, userId });
}

/**
 * Liker une idée
 */
async function likeIdea(ideaId, userId) {
  // Vérifier que l'idée existe
  const ideaResult = await query('SELECT id FROM posts WHERE id = $1 AND type = $2 AND status = $3', [ideaId, 'idea', 'published']);
  if (!ideaResult.rows[0]) {
    throw new AppError('Idée non trouvée', 404);
  }

  try {
    await transaction(async (client) => {
      // Ajouter le like (ignore si existe déjà)
      await client.query(`
        INSERT INTO likes (user_id, post_id, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT DO NOTHING
      `, [userId, ideaId]);

      // Incrémenter le compteur
      await client.query(`
        UPDATE posts SET likes_count = likes_count + 1
        WHERE id = $1 AND likes_count < (SELECT COUNT(*) FROM likes WHERE post_id = $1)
      `, [ideaId]);
    });

    return await getIdea(ideaId, userId);
  } catch (error) {
    logger.error('Erreur lors du like', { error: error.message });
    throw error;
  }
}

/**
 * Retirer un like
 */
async function unlikeIdea(ideaId, userId) {
  const ideaResult = await query('SELECT id FROM posts WHERE id = $1 AND type = $2', [ideaId, 'idea']);
  if (!ideaResult.rows[0]) {
    throw new AppError('Idée non trouvée', 404);
  }

  await transaction(async (client) => {
    await client.query('DELETE FROM likes WHERE user_id = $1 AND post_id = $2', [userId, ideaId]);

    // Mettre à jour compteur
    await client.query(`
      UPDATE posts SET likes_count = (SELECT COUNT(*) FROM likes WHERE post_id = $1)
      WHERE id = $1
    `, [ideaId]);
  });

  return await getIdea(ideaId, userId);
}

/**
 * Idées populaires (pour homepage)
 */
async function getPopularIdeas({ limit = 10, category = null }) {
  const maxLimit = Math.min(limit, 50);

  let sql = `
    SELECT p.id, p.user_id, p.title, p.content, p.category, p.likes_count, p.views_count, p.created_at,
           u.username, pr.avatar_url
    FROM posts p
    JOIN users u ON p.user_id = u.id
    LEFT JOIN profiles pr ON u.id = pr.user_id
    WHERE p.type = 'idea' AND p.status = 'published' AND p.deleted_at IS NULL
  `;

  const params = [];
  let paramIndex = 1;

  if (category) {
    validateCategory(category);
    sql += ` AND p.category = $${paramIndex}`;
    params.push(category);
    paramIndex += 1;
  }

  sql += ` ORDER BY p.likes_count DESC, p.created_at DESC LIMIT $${paramIndex}`;
  params.push(maxLimit);

  const result = await query(sql, params);
  return result.rows;
}

module.exports = {
  listIdeas,
  getIdea,
  createIdea,
  updateIdea,
  deleteIdea,
  likeIdea,
  unlikeIdea,
  getPopularIdeas,
};
