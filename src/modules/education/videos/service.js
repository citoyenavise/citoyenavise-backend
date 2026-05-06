/**
 * Service Videos - Logique métier
 */

const db = require('../../../core/services/database');
const { AppError } = require('../../../core/middleware/errorHandler');
const logger = require('../../../core/utils/logger');

class VideoService {
  /**
   * Créer une vidéo
   * @param {Object} data - Données de la vidéo
   * @param {string} userId - ID de l'auteur
   */
  static async createVideo(data, userId) {
    try {
      const result = await db.query(
        `INSERT INTO education_videos
         (author_id, title, description, url, category, duration, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [
          userId,
          data.title,
          data.description || null,
          data.url,
          data.category,
          data.duration,
          JSON.stringify(data.tags || []),
        ]
      );

      return result.rows[0];
    } catch (error) {
      logger.error('VideoService.createVideo error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to create video');
    }
  }

  /**
   * Récupérer toutes les vidéos avec filtres et pagination
   * Implémente un full-text search PostgreSQL avec scoring si q est fourni
   * @param {Object} filters - Filtres (page, limit, q, category, sort)
   */
  static async getVideos(filters) {
    try {
      const { page = 1, limit = 20, q = null, category = null, sort = 'latest' } = filters;
      const offset = (page - 1) * limit;

      const params = [];
      let paramIndex = 1;
      let whereConditions = ['v.deleted_at IS NULL'];
      let selectFields = 'v.id, v.title, v.description, v.url, v.category, v.duration, v.tags, v.views_count, v.likes_count, v.author_id, v.created_at, v.updated_at, u.username, pr.avatar_url';
      let orderClause = 'v.created_at DESC';
      let relevance = null;

      // Full-text search avec scoring si q est fourni
      if (q) {
        const tsQuery = q.trim().split(/\s+/).map(term => `${term}:*`).join(' | ');
        whereConditions.push(
          `to_tsvector('simple',
            coalesce(v.title, '') || ' ' ||
            coalesce(v.description, '') || ' ' ||
            coalesce(array_to_string(v.tags, ' '), '')
          ) @@ plainto_tsquery('simple', $${paramIndex})`
        );
        params.push(q);
        paramIndex++;

        // Ajouter le scoring par ts_rank_cd (plus rapide que ts_rank)
        selectFields = `v.id, v.title, v.description, v.url, v.category, v.duration, v.tags, v.views_count, v.likes_count, v.author_id, v.created_at, v.updated_at, u.username, pr.avatar_url,
          ts_rank_cd(
            to_tsvector('simple',
              coalesce(v.title, '') || ' ' ||
              coalesce(v.description, '') || ' ' ||
              coalesce(array_to_string(v.tags, ' '), '')
            ),
            plainto_tsquery('simple', $1)
          ) as relevance`;
        relevance = true;

        // Tri par pertinence d'abord, puis par date
        orderClause = 'relevance DESC, v.created_at DESC';
      } else if (sort === 'popular') {
        // Tri par popularité sans recherche
        orderClause = 'v.views_count DESC, v.created_at DESC';
      }

      // Filtre par catégorie
      if (category) {
        whereConditions.push(`v.category = $${paramIndex}`);
        params.push(category);
        paramIndex++;
      }

      const whereClause = whereConditions.join(' AND ');

      // Ajouter limit et offset
      params.push(limit, offset);

      // Récupérer les vidéos
      const videosResult = await db.query(
        `SELECT ${selectFields}
         FROM education_videos v
         JOIN users u ON v.author_id = u.id
         LEFT JOIN profiles pr ON u.id = pr.user_id
         WHERE ${whereClause}
         ORDER BY ${orderClause}
         LIMIT $${paramIndex - 1} OFFSET $${paramIndex}`,
        params
      );

      // Compter le total (sans limit/offset)
      const countParams = params.slice(0, -2);
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM education_videos v WHERE ${whereClause}`,
        countParams
      );

      const total = parseInt(countResult.rows[0].count, 10);
      const pages = Math.ceil(total / limit);

      return {
        items: videosResult.rows.map(v => {
          const item = {
            id: v.id,
            title: v.title,
            description: v.description,
            url: v.url,
            category: v.category,
            duration: v.duration,
            tags: JSON.parse(v.tags || '[]'),
            viewsCount: v.views_count,
            likesCount: v.likes_count,
            author: {
              id: v.author_id,
              username: v.username,
              avatarUrl: v.avatar_url,
            },
            createdAt: v.created_at,
            updatedAt: v.updated_at,
          };

          // Ajouter le score de pertinence si recherche full-text
          if (relevance && v.relevance !== null) {
            item.relevance = parseFloat(v.relevance).toFixed(4);
          }

          return item;
        }),
        pagination: {
          total,
          page,
          limit,
          pages,
        },
      };
    } catch (error) {
      logger.error('VideoService.getVideos error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to fetch videos');
    }
  }

  /**
   * Récupérer une vidéo par ID
   * @param {string} id - UUID de la vidéo
   */
  static async getVideoById(id) {
    try {
      const result = await db.query(
        `SELECT v.id, v.title, v.description, v.url, v.category, v.duration, v.tags,
                v.views_count, v.likes_count, v.author_id, v.created_at, v.updated_at,
                u.username, pr.avatar_url
         FROM education_videos v
         JOIN users u ON v.author_id = u.id
         LEFT JOIN profiles pr ON u.id = pr.user_id
         WHERE v.id = $1 AND v.deleted_at IS NULL`,
        [id]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const v = result.rows[0];

      // Incrémenter les vues
      await db.query(
        'UPDATE education_videos SET views_count = views_count + 1 WHERE id = $1',
        [id]
      );

      return {
        id: v.id,
        title: v.title,
        description: v.description,
        url: v.url,
        category: v.category,
        duration: v.duration,
        tags: JSON.parse(v.tags || '[]'),
        viewsCount: v.views_count + 1,
        likesCount: v.likes_count,
        author: {
          id: v.author_id,
          username: v.username,
          avatarUrl: v.avatar_url,
        },
        createdAt: v.created_at,
        updatedAt: v.updated_at,
      };
    } catch (error) {
      logger.error('VideoService.getVideoById error', { meta: { error: error.message, id } });
      throw AppError.databaseError('Failed to fetch video');
    }
  }

  /**
   * Mettre à jour une vidéo
   * @param {string} id - UUID de la vidéo
   * @param {Object} data - Données à mettre à jour
   * @param {string} userId - ID de l'utilisateur (pour vérification de propriété)
   */
  static async updateVideo(id, data, userId) {
    try {
      // Vérifier l'existence et la propriété
      const checkResult = await db.query(
        'SELECT author_id FROM education_videos WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );

      if (checkResult.rows.length === 0) {
        throw AppError.notFound('Video not found');
      }

      if (checkResult.rows[0].author_id !== userId) {
        throw AppError.forbidden('Not authorized to update this video');
      }

      // Construire les champs à mettre à jour
      const updateFields = [];
      const updateParams = [];
      let paramIndex = 1;

      if (data.title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        updateParams.push(data.title);
        paramIndex++;
      }
      if (data.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        updateParams.push(data.description || null);
        paramIndex++;
      }
      if (data.url !== undefined) {
        updateFields.push(`url = $${paramIndex}`);
        updateParams.push(data.url);
        paramIndex++;
      }
      if (data.category !== undefined) {
        updateFields.push(`category = $${paramIndex}`);
        updateParams.push(data.category);
        paramIndex++;
      }
      if (data.duration !== undefined) {
        updateFields.push(`duration = $${paramIndex}`);
        updateParams.push(data.duration);
        paramIndex++;
      }
      if (data.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex}`);
        updateParams.push(JSON.stringify(data.tags));
        paramIndex++;
      }

      if (updateFields.length === 0) {
        return this.getVideoById(id);
      }

      updateFields.push(`updated_at = NOW()`);
      updateParams.push(id);

      const result = await db.query(
        `UPDATE education_videos SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        updateParams
      );

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('VideoService.updateVideo error', { meta: { error: error.message, id } });
      throw AppError.databaseError('Failed to update video');
    }
  }

  /**
   * Supprimer une vidéo (soft delete)
   * @param {string} id - UUID de la vidéo
   * @param {string} userId - ID de l'utilisateur (pour vérification)
   */
  static async deleteVideo(id, userId) {
    try {
      // Vérifier l'existence et la propriété
      const checkResult = await db.query(
        'SELECT author_id FROM education_videos WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );

      if (checkResult.rows.length === 0) {
        throw AppError.notFound('Video not found');
      }

      if (checkResult.rows[0].author_id !== userId) {
        throw AppError.forbidden('Not authorized to delete this video');
      }

      // Soft delete
      await db.query(
        'UPDATE education_videos SET deleted_at = NOW() WHERE id = $1',
        [id]
      );

      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('VideoService.deleteVideo error', { meta: { error: error.message, id } });
      throw AppError.databaseError('Failed to delete video');
    }
  }
}

module.exports = VideoService;
