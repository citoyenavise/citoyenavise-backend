/**
 * Profile Search Service — Recherche avancée avec full-text search
 */

const db = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');

class ProfileSearchService {
  /**
   * Recherche avancée de profils
   */
  static async advancedSearch(filters) {
    const {
      q = null,
      location = null,
      badges = null,
      reputationMin = 0,
      categories = null,
      verifiedOnly = false,
      sort = 'recent',
      page = 1,
      limit = 20,
      viewerId = null,
    } = filters;

    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;
    let whereConditions = ['u.deleted_at IS NULL', "p.profile_visibility != 'private'"];
    let selectFields = 'p.id, p.user_id, u.username, p.bio, p.avatar_url, p.location, p.reputation_score, p.is_verified, p.created_at';
    let orderClause = 'p.created_at DESC';

    // Full-text search
    if (q) {
      whereConditions.push(
        `to_tsvector('simple',
          coalesce(p.bio, '') || ' ' ||
          coalesce(p.location, '') || ' ' ||
          coalesce(array_to_string(p.interests, ' '), '')
        ) @@ plainto_tsquery('simple', $${paramIndex})`
      );
      params.push(q);
      paramIndex++;

      // Ajouter le scoring
      selectFields = `${selectFields},
        ts_rank_cd(
          to_tsvector('simple',
            coalesce(p.bio, '') || ' ' ||
            coalesce(p.location, '') || ' ' ||
            coalesce(array_to_string(p.interests, ' '), '')
          ),
          plainto_tsquery('simple', $1)
        ) as relevance`;
    }

    // Filtrer par localisation
    if (location) {
      whereConditions.push(`p.location ILIKE $${paramIndex}`);
      params.push(`%${location}%`);
      paramIndex++;
    }

    // Filtrer par réputation minimum
    if (reputationMin > 0) {
      whereConditions.push(`p.reputation_score >= $${paramIndex}`);
      params.push(reputationMin);
      paramIndex++;
    }

    // Filtrer par vérification
    if (verifiedOnly) {
      whereConditions.push('p.is_verified = true');
    }

    // Filtrer par badges
    if (badges) {
      const badgeArray = badges.split(',');
      whereConditions.push(
        `p.user_id IN (
          SELECT DISTINCT profile_id FROM profile_badges
          WHERE badge_type = ANY($${paramIndex}::text[])
        )`
      );
      params.push(badgeArray);
      paramIndex++;
    }

    // Filtrer par catégories d'intérêt
    if (categories) {
      const catArray = categories.split(',');
      whereConditions.push(`p.interests && $${paramIndex}::text[]`);
      params.push(catArray);
      paramIndex++;
    }

    // Filtre de visibilité pour non-propriétaires
    if (viewerId) {
      whereConditions.push(
        `(p.profile_visibility = 'public'
          OR p.user_id = $${paramIndex}
          OR (p.profile_visibility = 'followers'
              AND p.user_id IN (
                SELECT following_id FROM follows WHERE follower_id = $${paramIndex}
              ))
        )`
      );
      params.push(viewerId);
      paramIndex++;
    }

    // Tri
    if (sort === 'relevance' && q) {
      orderClause = 'relevance DESC, p.reputation_score DESC';
    } else if (sort === 'reputation') {
      orderClause = 'p.reputation_score DESC, p.created_at DESC';
    } else {
      orderClause = 'p.created_at DESC';
    }

    const whereClause = whereConditions.join(' AND ');
    params.push(limit, offset);

    // Récupérer les résultats
    const result = await db.query(
      `SELECT ${selectFields}
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE ${whereClause}
       ORDER BY ${orderClause}
       LIMIT $${paramIndex - 1} OFFSET $${paramIndex}`,
      params
    );

    // Compter le total
    const countParams = params.slice(0, -2);
    const countResult = await db.query(
      `SELECT COUNT(*) as count FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE ${whereClause}`,
      countParams
    );

    const total = parseInt(countResult.rows[0].count, 10);

    return {
      items: result.rows.map(p => this._formatSearchResult(p)),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Recherche simple (autocomplete)
   */
  static async quickSearch(q, limit = 10) {
    const result = await db.query(
      `SELECT p.id, p.user_id, u.username, p.avatar_url, p.is_verified
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.profile_visibility = 'public'
       AND (u.username ILIKE $1 OR p.bio ILIKE $1)
       ORDER BY p.reputation_score DESC
       LIMIT $2`,
      [`%${q}%`, limit]
    );

    return result.rows.map(p => ({
      id: p.id,
      userId: p.user_id,
      username: p.username,
      avatarUrl: p.avatar_url,
      isVerified: p.is_verified,
    }));
  }

  static _formatSearchResult(p) {
    const result = {
      id: p.id,
      userId: p.user_id,
      username: p.username,
      bio: p.bio,
      avatarUrl: p.avatar_url,
      location: p.location,
      reputationScore: p.reputation_score,
      isVerified: p.is_verified,
      createdAt: p.created_at,
    };

    if (p.relevance !== undefined && p.relevance !== null) {
      result.relevance = parseFloat(p.relevance).toFixed(4);
    }

    return result;
  }
}

module.exports = { ProfileSearchService };
