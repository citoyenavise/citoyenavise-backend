const { query } = require('../../../core/services/database');
const { eventBus } = require('../../../core/eventBus');
const AppError = require('../../../core/errors/AppError');
const logger = require('../../../core/utils/logger');

class VoteService {
  async addVote(initiativeId, userId) {
    try {
      // Check if initiative exists
      const initiativeResult = await query('SELECT id FROM initiatives WHERE id = $1 AND deleted_at IS NULL', [initiativeId]);
      if (!initiativeResult.rows[0]) {
        throw AppError.notFound('Initiative not found');
      }

      // Check if user already voted
      const existingVote = await query(
        'SELECT id FROM initiatives_votes WHERE initiative_id = $1 AND user_id = $2',
        [initiativeId, userId]
      );

      if (existingVote.rows[0]) {
        throw AppError.validationError('You already support this initiative', {});
      }

      // Add vote
      const result = await query(
        `INSERT INTO initiatives_votes (initiative_id, user_id)
         VALUES ($1, $2)
         RETURNING id, initiative_id, user_id, created_at`,
        [initiativeId, userId]
      );

      if (!result.rows[0]) {
        throw AppError.databaseError('Failed to add vote');
      }

      // Increment supporters count
      await query(
        'UPDATE initiatives SET supporters_count = supporters_count + 1 WHERE id = $1',
        [initiativeId]
      );

      // Emit event
      try {
        eventBus.emit('initiative.voted', {
          initiativeId,
          userId,
          timestamp: new Date().toISOString(),
        });
      } catch (eventError) {
        logger.warn('Failed to emit initiative.voted event', { meta: { error: eventError.message } });
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('VoteService.addVote error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to add vote');
    }
  }

  async removeVote(initiativeId, userId) {
    try {
      // Check if vote exists
      const voteResult = await query(
        'SELECT id FROM initiatives_votes WHERE initiative_id = $1 AND user_id = $2',
        [initiativeId, userId]
      );

      if (!voteResult.rows[0]) {
        throw AppError.notFound('Vote not found');
      }

      // Remove vote
      await query(
        'DELETE FROM initiatives_votes WHERE initiative_id = $1 AND user_id = $2',
        [initiativeId, userId]
      );

      // Decrement supporters count
      await query(
        'UPDATE initiatives SET supporters_count = MAX(0, supporters_count - 1) WHERE id = $1',
        [initiativeId]
      );

      // Emit event
      try {
        eventBus.emit('initiative.unvoted', {
          initiativeId,
          userId,
          timestamp: new Date().toISOString(),
        });
      } catch (eventError) {
        logger.warn('Failed to emit initiative.unvoted event', { meta: { error: eventError.message } });
      }

      return { id: initiativeId };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('VoteService.removeVote error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to remove vote');
    }
  }

  async hasVoted(initiativeId, userId) {
    try {
      const result = await query(
        'SELECT id FROM initiatives_votes WHERE initiative_id = $1 AND user_id = $2',
        [initiativeId, userId]
      );

      return !!result.rows[0];
    } catch (error) {
      logger.error('VoteService.hasVoted error', { meta: { error: error.message } });
      return false;
    }
  }

  async listVoters(initiativeId, filters) {
    try {
      const { page, limit } = filters;
      const offset = (page - 1) * limit;

      const countResult = await query('SELECT COUNT(*) as total FROM initiatives_votes WHERE initiative_id = $1', [initiativeId]);
      const total = countResult.rows[0].total;

      const result = await query(
        `SELECT iv.id, iv.user_id, iv.created_at, u.username, p.avatar_url
         FROM initiatives_votes iv
         JOIN users u ON u.id = iv.user_id
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE iv.initiative_id = $1
         ORDER BY iv.created_at DESC
         LIMIT $2 OFFSET $3`,
        [initiativeId, limit, offset]
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
      logger.error('VoteService.listVoters error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to fetch voters');
    }
  }
}

module.exports = new VoteService();
