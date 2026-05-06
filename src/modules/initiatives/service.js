const { query, transaction } = require('../../core/services/database');
const { eventBus } = require('../../core/eventBus');
const AppError = require('../../core/errors');
const logger = require('../../core/utils/logger');

class InitiativeService {
  async create(data, userId) {
    try {
      const result = await query(
        `INSERT INTO initiatives (author_id, title, description, goals, category, latitude, longitude, deadline, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'draft')
         RETURNING id, author_id, title, description, goals, category, latitude, longitude, deadline, status, supporters_count, impact_score, created_at, updated_at`,
        [userId, data.title, data.description, data.goals || null, data.category, data.latitude || null, data.longitude || null, data.deadline || null]
      );

      if (!result.rows[0]) {
        throw AppError.databaseError('Failed to create initiative');
      }

      const initiative = result.rows[0];

      // Emit event
      try {
        eventBus.emit('initiative.created', {
          initiativeId: initiative.id,
          authorId: initiative.author_id,
          title: initiative.title,
          category: initiative.category,
          timestamp: new Date().toISOString(),
        });
      } catch (eventError) {
        logger.warn('Failed to emit initiative.created event', { meta: { error: eventError.message } });
      }

      return initiative;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('InitiativeService.create error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to create initiative');
    }
  }

  async list(filters) {
    try {
      const { page, limit, search, category, status, sort } = filters;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE deleted_at IS NULL';
      const params = [];
      let paramIndex = 1;

      if (search) {
        whereClause += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (category) {
        whereClause += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      let orderClause = 'ORDER BY created_at DESC';
      if (sort === 'popular') {
        orderClause = 'ORDER BY supporters_count DESC, created_at DESC';
      } else if (sort === 'deadline') {
        orderClause = 'ORDER BY deadline ASC, created_at DESC';
      }

      const countResult = await query(`SELECT COUNT(*) as total FROM initiatives ${whereClause}`, params);
      const total = countResult.rows[0].total;

      params.push(limit, offset);
      const result = await query(
        `SELECT id, author_id, title, description, goals, category, latitude, longitude, deadline, status, supporters_count, impact_score, created_at, updated_at, closed_at
         FROM initiatives ${whereClause}
         ${orderClause}
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
      );

      const pages = Math.ceil(total / limit);

      return {
        data: result.rows,
        meta: {
          total,
          page,
          limit,
          pages,
        },
      };
    } catch (error) {
      logger.error('InitiativeService.list error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to fetch initiatives');
    }
  }

  async getById(initiativeId) {
    try {
      const result = await query(
        `SELECT id, author_id, title, description, goals, category, latitude, longitude, deadline, status, supporters_count, impact_score, created_at, updated_at, closed_at
         FROM initiatives
         WHERE id = $1 AND deleted_at IS NULL`,
        [initiativeId]
      );

      if (!result.rows[0]) {
        throw AppError.notFound('Initiative not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('InitiativeService.getById error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to fetch initiative');
    }
  }

  async update(initiativeId, data, userId) {
    try {
      // Check ownership
      const initiativeResult = await query('SELECT author_id FROM initiatives WHERE id = $1', [initiativeId]);
      if (!initiativeResult.rows[0]) {
        throw AppError.notFound('Initiative not found');
      }
      if (initiativeResult.rows[0].author_id !== userId) {
        throw AppError.forbidden('You are not authorized to update this initiative');
      }

      const updates = [];
      const params = [initiativeId];
      let paramIndex = 2;

      if (data.title !== undefined) {
        updates.push(`title = $${paramIndex}`);
        params.push(data.title);
        paramIndex++;
      }
      if (data.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        params.push(data.description);
        paramIndex++;
      }
      if (data.goals !== undefined) {
        updates.push(`goals = $${paramIndex}`);
        params.push(data.goals);
        paramIndex++;
      }
      if (data.category !== undefined) {
        updates.push(`category = $${paramIndex}`);
        params.push(data.category);
        paramIndex++;
      }
      if (data.latitude !== undefined) {
        updates.push(`latitude = $${paramIndex}`);
        params.push(data.latitude);
        paramIndex++;
      }
      if (data.longitude !== undefined) {
        updates.push(`longitude = $${paramIndex}`);
        params.push(data.longitude);
        paramIndex++;
      }
      if (data.deadline !== undefined) {
        updates.push(`deadline = $${paramIndex}`);
        params.push(data.deadline);
        paramIndex++;
      }
      if (data.status !== undefined) {
        updates.push(`status = $${paramIndex}`);
        params.push(data.status);
        paramIndex++;
        if (data.status === 'closed') {
          updates.push(`closed_at = NOW()`);
        }
      }

      if (updates.length === 0) {
        return this.getById(initiativeId);
      }

      updates.push('updated_at = NOW()');

      const result = await query(
        `UPDATE initiatives SET ${updates.join(', ')}
         WHERE id = $1
         RETURNING id, author_id, title, description, goals, category, latitude, longitude, deadline, status, supporters_count, impact_score, created_at, updated_at, closed_at`,
        params
      );

      if (!result.rows[0]) {
        throw AppError.databaseError('Failed to update initiative');
      }

      // Emit event
      try {
        eventBus.emit('initiative.updated', {
          initiativeId: result.rows[0].id,
          authorId: result.rows[0].author_id,
          newStatus: result.rows[0].status,
          timestamp: new Date().toISOString(),
        });
      } catch (eventError) {
        logger.warn('Failed to emit initiative.updated event', { meta: { error: eventError.message } });
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('InitiativeService.update error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to update initiative');
    }
  }

  async delete(initiativeId, userId) {
    try {
      // Check ownership
      const initiativeResult = await query('SELECT author_id FROM initiatives WHERE id = $1', [initiativeId]);
      if (!initiativeResult.rows[0]) {
        throw AppError.notFound('Initiative not found');
      }
      if (initiativeResult.rows[0].author_id !== userId) {
        throw AppError.forbidden('You are not authorized to delete this initiative');
      }

      await query('UPDATE initiatives SET deleted_at = NOW() WHERE id = $1', [initiativeId]);

      return { id: initiativeId };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('InitiativeService.delete error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to delete initiative');
    }
  }

  async close(initiativeId, userId, status) {
    try {
      // Check ownership
      const initiativeResult = await query('SELECT author_id, status FROM initiatives WHERE id = $1', [initiativeId]);
      if (!initiativeResult.rows[0]) {
        throw AppError.notFound('Initiative not found');
      }
      if (initiativeResult.rows[0].author_id !== userId) {
        throw AppError.forbidden('You are not authorized to close this initiative');
      }

      const result = await query(
        `UPDATE initiatives SET status = $2, closed_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING id, author_id, title, status, supporters_count, closed_at`,
        [initiativeId, status]
      );

      if (!result.rows[0]) {
        throw AppError.databaseError('Failed to close initiative');
      }

      // Emit event
      try {
        eventBus.emit('initiative.closed', {
          initiativeId: result.rows[0].id,
          authorId: result.rows[0].author_id,
          status: result.rows[0].status,
          supportersCount: result.rows[0].supporters_count,
          timestamp: new Date().toISOString(),
        });
      } catch (eventError) {
        logger.warn('Failed to emit initiative.closed event', { meta: { error: eventError.message } });
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('InitiativeService.close error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to close initiative');
    }
  }

  async getStats(initiativeId) {
    try {
      const result = await query(
        `SELECT
           id, title, supporters_count, impact_score,
           (SELECT COUNT(*) FROM initiatives_votes WHERE initiative_id = $1) as votes_count,
           (SELECT COUNT(*) FROM comments WHERE entity_type = 'initiative' AND entity_id = $1 AND deleted_at IS NULL) as comments_count
         FROM initiatives
         WHERE id = $1 AND deleted_at IS NULL`,
        [initiativeId]
      );

      if (!result.rows[0]) {
        throw AppError.notFound('Initiative not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('InitiativeService.getStats error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to fetch initiative stats');
    }
  }
}

module.exports = new InitiativeService();
