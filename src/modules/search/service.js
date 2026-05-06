const { query } = require('../../core/services/database');
const AppError = require('../../core/errors');
const logger = require('../../core/utils/logger');

const SEARCH_TYPES = {
  post: 'post',
  initiative: 'initiative',
  article: 'article',
  video: 'video',
  profile: 'profile',
};

function buildOrderBy(sort) {
  if (sort === 'date') return 'ORDER BY created_at DESC';
  if (sort === 'popularity') return 'ORDER BY popularity DESC';
  return 'ORDER BY created_at DESC'; // default to date (no relevance score in ILIKE)
}

function normalizeResult(type, row) {
  switch (type) {
    case SEARCH_TYPES.post:
      return {
        id: row.id,
        type: 'post',
        title: row.title,
        excerpt: row.content ? row.content.slice(0, 200) : null,
        createdAt: row.created_at,
        popularity: row.likes_count ?? 0,
        author: row.username ? {
          id: row.user_id,
          username: row.username,
          avatar: row.avatar_url,
        } : null,
        metadata: {
          category: row.category || null,
          tags: row.tags || [],
        },
      };
    case SEARCH_TYPES.initiative:
      return {
        id: row.id,
        type: 'initiative',
        title: row.title,
        excerpt: row.description ? row.description.slice(0, 200) : null,
        createdAt: row.created_at,
        popularity: row.supporters_count ?? 0,
        author: row.username ? {
          id: row.author_id,
          username: row.username,
          avatar: row.avatar_url,
        } : null,
        metadata: {
          category: row.category || null,
          status: row.status,
          latitude: row.latitude,
          longitude: row.longitude,
        },
      };
    case SEARCH_TYPES.article:
      return {
        id: row.id,
        type: 'article',
        title: row.title,
        excerpt: row.content ? row.content.slice(0, 200) : null,
        createdAt: row.created_at,
        popularity: row.views_count ?? 0,
        author: row.username ? {
          id: row.author_id,
          username: row.username,
          avatar: row.avatar_url,
        } : null,
        metadata: {
          category: row.category || null,
          status: row.status,
        },
      };
    case SEARCH_TYPES.video:
      return {
        id: row.id,
        type: 'video',
        title: row.title,
        excerpt: row.description ? row.description.slice(0, 200) : null,
        createdAt: row.created_at,
        popularity: row.views_count ?? 0,
        author: row.username ? {
          id: row.author_id,
          username: row.username,
          avatar: row.avatar_url,
        } : null,
        metadata: {
          category: row.category || null,
          duration: row.duration_seconds,
          thumbnailUrl: row.thumbnail_url,
        },
      };
    case SEARCH_TYPES.profile:
      return {
        id: row.id,
        type: 'profile',
        title: row.username,
        excerpt: row.bio ? row.bio.slice(0, 200) : null,
        createdAt: row.created_at,
        popularity: 0,
        author: null,
        metadata: {
          location: row.location || null,
          bio: row.bio,
        },
      };
    default:
      return null;
  }
}

async function searchPosts({ q, category, page, limit, sort }) {
  try {
    const offset = (page - 1) * limit;
    let paramIndex = 1;
    let whereClause = "WHERE p.deleted_at IS NULL";
    const params = [];

    // Search query
    whereClause += ` AND (p.title ILIKE $${paramIndex} OR p.content ILIKE $${paramIndex})`;
    params.push(`%${q}%`);
    paramIndex++;

    if (category) {
      whereClause += ` AND p.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Count total
    const countResult = await query(`SELECT COUNT(*) as total FROM posts p ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get results
    params.push(limit, offset);
    const result = await query(
      `SELECT p.id, p.title, p.content, p.category, p.user_id, p.likes_count, p.created_at, p.tags,
              u.username, p.avatar_url
       FROM posts p
       LEFT JOIN users u ON p.user_id = u.id
       ${whereClause}
       ${buildOrderBy(sort)}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      items: result.rows.map(row => normalizeResult(SEARCH_TYPES.post, row)),
      total,
    };
  } catch (error) {
    logger.error('searchPosts error', { meta: { error: error.message } });
    throw AppError.databaseError('Failed to search posts');
  }
}

async function searchInitiatives({ q, category, page, limit, sort }) {
  try {
    const offset = (page - 1) * limit;
    let paramIndex = 1;
    let whereClause = "WHERE i.deleted_at IS NULL";
    const params = [];

    // Search query
    whereClause += ` AND (i.title ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex})`;
    params.push(`%${q}%`);
    paramIndex++;

    if (category) {
      whereClause += ` AND i.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Count total
    const countResult = await query(`SELECT COUNT(*) as total FROM initiatives i ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get results
    params.push(limit, offset);
    const result = await query(
      `SELECT i.id, i.title, i.description, i.category, i.status, i.latitude, i.longitude,
              i.author_id, i.supporters_count, i.created_at,
              u.username, p.avatar_url
       FROM initiatives i
       LEFT JOIN users u ON i.author_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       ${whereClause}
       ${buildOrderBy(sort)}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      items: result.rows.map(row => normalizeResult(SEARCH_TYPES.initiative, row)),
      total,
    };
  } catch (error) {
    logger.error('searchInitiatives error', { meta: { error: error.message } });
    throw AppError.databaseError('Failed to search initiatives');
  }
}

async function searchArticles({ q, category, page, limit, sort }) {
  try {
    const offset = (page - 1) * limit;
    let paramIndex = 1;
    let whereClause = "WHERE a.deleted_at IS NULL";
    const params = [];

    // Search query
    whereClause += ` AND (a.title ILIKE $${paramIndex} OR a.content ILIKE $${paramIndex})`;
    params.push(`%${q}%`);
    paramIndex++;

    if (category) {
      whereClause += ` AND a.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Count total
    const countResult = await query(`SELECT COUNT(*) as total FROM education_articles a ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get results
    params.push(limit, offset);
    const result = await query(
      `SELECT a.id, a.title, a.content, a.category, a.status, a.views_count, a.created_at,
              a.author_id, u.username, p.avatar_url
       FROM education_articles a
       LEFT JOIN users u ON a.author_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       ${whereClause}
       ${buildOrderBy(sort)}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      items: result.rows.map(row => normalizeResult(SEARCH_TYPES.article, row)),
      total,
    };
  } catch (error) {
    logger.error('searchArticles error', { meta: { error: error.message } });
    throw AppError.databaseError('Failed to search articles');
  }
}

async function searchVideos({ q, category, page, limit, sort }) {
  try {
    const offset = (page - 1) * limit;
    let paramIndex = 1;
    let whereClause = "WHERE v.deleted_at IS NULL";
    const params = [];

    // Search query
    whereClause += ` AND (v.title ILIKE $${paramIndex} OR v.description ILIKE $${paramIndex})`;
    params.push(`%${q}%`);
    paramIndex++;

    if (category) {
      whereClause += ` AND v.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Count total
    const countResult = await query(`SELECT COUNT(*) as total FROM education_videos v ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get results
    params.push(limit, offset);
    const result = await query(
      `SELECT v.id, v.title, v.description, v.category, v.views_count, v.duration_seconds,
              v.thumbnail_url, v.created_at, v.author_id, u.username, p.avatar_url
       FROM education_videos v
       LEFT JOIN users u ON v.author_id = u.id
       LEFT JOIN user_profiles p ON u.id = p.user_id
       ${whereClause}
       ${buildOrderBy(sort)}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      items: result.rows.map(row => normalizeResult(SEARCH_TYPES.video, row)),
      total,
    };
  } catch (error) {
    logger.error('searchVideos error', { meta: { error: error.message } });
    throw AppError.databaseError('Failed to search videos');
  }
}

async function searchProfiles({ q, page, limit, sort }) {
  try {
    const offset = (page - 1) * limit;
    let paramIndex = 1;
    let whereClause = "WHERE u.deleted_at IS NULL";
    const params = [];

    // Search query
    whereClause += ` AND (u.username ILIKE $${paramIndex} OR p.bio ILIKE $${paramIndex})`;
    params.push(`%${q}%`);
    paramIndex++;

    // Count total
    const countResult = await query(
      `SELECT COUNT(DISTINCT u.id) as total FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get results
    params.push(limit, offset);
    const result = await query(
      `SELECT DISTINCT u.id, u.username, u.created_at, p.bio, p.location
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      items: result.rows.map(row => normalizeResult(SEARCH_TYPES.profile, row)),
      total,
    };
  } catch (error) {
    logger.error('searchProfiles error', { meta: { error: error.message } });
    throw AppError.databaseError('Failed to search profiles');
  }
}

async function searchGlobal(params) {
  try {
    const results = await Promise.all([
      searchPosts(params),
      searchInitiatives(params),
      searchArticles(params),
      searchVideos(params),
      searchProfiles(params),
    ]);

    const merged = [];
    for (const result of results) {
      merged.push(...result.items);
    }

    // Sort by date (most recent first)
    merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const start = (params.page - 1) * params.limit;
    const items = merged.slice(start, start + params.limit);

    return {
      items,
      total: merged.length,
    };
  } catch (error) {
    logger.error('searchGlobal error', { meta: { error: error.message } });
    throw AppError.databaseError('Failed to perform global search');
  }
}

async function invalidateCache() {
  return; // No Redis caching for search results
}

module.exports = {
  searchPosts,
  searchInitiatives,
  searchArticles,
  searchVideos,
  searchProfiles,
  searchGlobal,
  invalidateCache,
};
