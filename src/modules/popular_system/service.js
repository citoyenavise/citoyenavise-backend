/**
 * Popular System Service — Optimisé pour scalabilité 100k+ posts
 * - Tri et scoring déplacés au SQL
 * - Dénormalisation comments_count et popularity_score
 * - Invalidation Redis granulaire
 * - Logs et métriques pour observabilité
 */

const { query } = require('../../core/services/database');
const cache = require('../../core/services/cache');
const logger = require('../../core/utils/logger');

const RANGE_MAP = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  all: 3650,
};

// Métriques internes
const metrics = {
  cacheHits: 0,
  cacheMisses: 0,
  dbQueries: 0,
};

/**
 * Recalculer le popularity_score pour un post
 * Formule: (likes_count * 2 + comments_count * 1.5) * timePenalty
 */
async function recalculatePopularityScore(postId) {
  try {
    const result = await query(
      `UPDATE posts
       SET popularity_score = (
         likes_count * 2 + comments_count * 1.5
       ) * GREATEST(0.2, 1 - (EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) / 240)
       WHERE id = $1
       RETURNING popularity_score`,
      [postId]
    );

    if (result.rows.length > 0) {
      logger.debug('Recalculated popularity score', {
        meta: { postId, newScore: result.rows[0].popularity_score },
      });
    }
  } catch (err) {
    logger.error('Failed to recalculate popularity score', {
      meta: { postId, error: err.message },
    });
  }
}

/**
 * Mettre à jour comments_count pour un post
 */
async function updateCommentsCount(postId, delta = 0) {
  try {
    await query(
      `UPDATE posts
       SET comments_count = comments_count + $1
       WHERE id = $2`,
      [delta, postId]
    );

    // Recalculer le score après update
    await recalculatePopularityScore(postId);
  } catch (err) {
    logger.error('Failed to update comments count', {
      meta: { postId, delta, error: err.message },
    });
  }
}

/**
 * Posts populaires — Tri et scoring côté SQL
 * Optimisé pour 100k+ posts
 */
async function getPopular({ range = 'daily', page = 1, limit = 10, sort = 'score' }) {
  const offset = (page - 1) * limit;
  const safeLimitLimit = Math.min(parseInt(limit, 10), 50);

  // Clé cache granulaire
  const cacheKey = `popular:${range}:${page}:${safeLimitLimit}:${sort}`;

  // Vérifier le cache
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      metrics.cacheHits++;
      logger.debug('Cache HIT', {
        meta: { cacheKey, ratio: `${metrics.cacheHits}/${metrics.cacheHits + metrics.cacheMisses}` },
      });
      return cached;
    }
    metrics.cacheMisses++;
  } catch (err) {
    logger.warn('Cache get failed, continuing', { meta: { error: err.message } });
    metrics.cacheMisses++;
  }

  const days = RANGE_MAP[range] || 7;
  const since = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();

  // Construire ORDER BY selon sort
  let orderClause = 'p.popularity_score DESC, p.created_at DESC';
  if (sort === 'likes') {
    orderClause = 'p.likes_count DESC, p.created_at DESC';
  } else if (sort === 'comments') {
    orderClause = 'p.comments_count DESC, p.created_at DESC';
  }

  const startTime = Date.now();

  // Requête SQL optimisée: tri au SQL, pas de subquery pour comments_count
  const result = await query(
    `SELECT p.id, p.user_id, p.title, p.content, p.type, p.category,
            p.likes_count, p.views_count, p.comments_count, p.popularity_score, p.created_at,
            u.username, u.id as author_id, pr.avatar_url
     FROM posts p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN profiles pr ON u.id = pr.user_id
     WHERE p.status = 'published' AND p.deleted_at IS NULL AND u.deleted_at IS NULL AND p.created_at >= $1
     ORDER BY ${orderClause}
     LIMIT $2 OFFSET $3`,
    [since, safeLimitLimit, offset]
  );

  const dbTime = Date.now() - startTime;
  metrics.dbQueries++;

  // Formatter les résultats (pas de tri en mémoire)
  const posts = result.rows.map((p) => ({
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
    score: parseFloat(p.popularity_score || 0).toFixed(4),
  }));

  // Logs de performance
  logger.debug('Popular posts retrieved', {
    meta: {
      range,
      page,
      limit: safeLimitLimit,
      sort,
      count: posts.length,
      dbTimeMs: dbTime,
      cacheKey,
    },
  });

  // Cacher le résultat (60 seconds TTL)
  try {
    await cache.set(cacheKey, posts, 60);
  } catch (err) {
    logger.warn('Cache set failed', { meta: { error: err.message } });
  }

  return posts;
}

/**
 * Invalider le cache de manière granulaire
 * Invalide uniquement les clés pertinentes au lieu de tout
 */
async function invalidatePopularCache(range = null) {
  try {
    let pattern = 'popular:*';
    if (range) {
      pattern = `popular:${range}:*`;
    }

    await cache.invalidatePattern(pattern);
    logger.info('Invalidated popular cache', {
      meta: { pattern },
    });
  } catch (err) {
    logger.warn('Cache invalidation failed', { meta: { error: err.message } });
  }
}

/**
 * Récupérer les métriques actuelles
 */
function getMetrics() {
  const total = metrics.cacheHits + metrics.cacheMisses;
  const hitRate = total > 0 ? ((metrics.cacheHits / total) * 100).toFixed(2) : 0;

  return {
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
    totalRequests: total,
    hitRate: `${hitRate}%`,
    dbQueries: metrics.dbQueries,
  };
}

/**
 * Réinitialiser les métriques
 */
function resetMetrics() {
  metrics.cacheHits = 0;
  metrics.cacheMisses = 0;
  metrics.dbQueries = 0;
  logger.info('Metrics reset');
}

const PopularService = {
  getPopular,
  invalidatePopularCache,
  recalculatePopularityScore,
  updateCommentsCount,
  getMetrics,
  resetMetrics,
};

module.exports = { PopularService };
