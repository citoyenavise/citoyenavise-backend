const { query, transaction } = require('../../../core/database');
const { eventBus } = require('../../../core/eventBus');
const AppError = require('../../../core/errors/AppError');
const logger = require('../../../core/utils/logger');

class InitiativeCommentService {
  async createComment(initiativeId, userId, content) {
    try {
      // Check if initiative exists
      const initiativeResult = await query(
        'SELECT id FROM initiatives WHERE id = $1 AND deleted_at IS NULL',
        [initiativeId]
      );

      if (!initiativeResult.rows[0]) {
        throw AppError.notFound('Initiative not found');
      }

      let commentId = null;

      await transaction(async (client) => {
        const result = await client.query(
          `INSERT INTO comments (entity_type, entity_id, user_id, content, status, created_at)
           VALUES ('initiative', $1, $2, $3, 'published', NOW())
           RETURNING id, entity_id, user_id, content, created_at`,
          [initiativeId, userId, content]
        );

        commentId = result.rows[0].id;

        // Increment comments count on initiative
        await client.query(
          `UPDATE initiatives
           SET updated_at = NOW()
           WHERE id = $1`,
          [initiativeId]
        );
      });

      // Emit event
      try {
        eventBus.emit('initiative.commented', {
          commentId,
          initiativeId,
          userId,
          timestamp: new Date().toISOString(),
        });
      } catch (eventError) {
        logger.warn('Failed to emit initiative.commented event', { meta: { error: eventError.message } });
      }

      return await this.getCommentById(commentId);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('InitiativeCommentService.createComment error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to create comment');
    }
  }

  async getCommentById(commentId) {
    try {
      const result = await query(
        `SELECT c.id, c.entity_id, c.user_id, c.content, c.created_at, c.updated_at,
                u.username, p.avatar_url
         FROM comments c
         JOIN users u ON c.user_id = u.id
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE c.id = $1 AND c.deleted_at IS NULL`,
        [commentId]
      );

      if (!result.rows[0]) {
        throw AppError.notFound('Comment not found');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('InitiativeCommentService.getCommentById error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to fetch comment');
    }
  }

  async listComments(initiativeId, filters) {
    try {
      const { page, limit, sort } = filters;
      const offset = (page - 1) * limit;

      // Check if initiative exists
      const initiativeResult = await query(
        'SELECT id FROM initiatives WHERE id = $1 AND deleted_at IS NULL',
        [initiativeId]
      );

      if (!initiativeResult.rows[0]) {
        throw AppError.notFound('Initiative not found');
      }

      let orderClause = 'ORDER BY c.created_at DESC';
      if (sort === 'popular') {
        orderClause = 'ORDER BY c.likes_count DESC, c.created_at DESC';
      }

      const countResult = await query(
        `SELECT COUNT(*) as total FROM comments c
         WHERE c.entity_type = 'initiative' AND c.entity_id = $1 AND c.deleted_at IS NULL`,
        [initiativeId]
      );
      const total = countResult.rows[0].total;

      const result = await query(
        `SELECT c.id, c.entity_id, c.user_id, c.content, c.likes_count, c.created_at, c.updated_at,
                u.username, p.avatar_url
         FROM comments c
         JOIN users u ON c.user_id = u.id
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE c.entity_type = 'initiative' AND c.entity_id = $1 AND c.deleted_at IS NULL AND c.status = 'published'
         ${orderClause}
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
      if (error instanceof AppError) throw error;
      logger.error('InitiativeCommentService.listComments error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to fetch comments');
    }
  }

  async updateComment(commentId, content, userId) {
    try {
      // Check ownership
      const commentResult = await query('SELECT user_id FROM comments WHERE id = $1', [commentId]);

      if (!commentResult.rows[0]) {
        throw AppError.notFound('Comment not found');
      }

      if (commentResult.rows[0].user_id !== userId) {
        throw AppError.forbidden('You are not authorized to update this comment');
      }

      const result = await query(
        `UPDATE comments SET content = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL
         RETURNING id, content, updated_at`,
        [content, commentId]
      );

      if (!result.rows[0]) {
        throw AppError.databaseError('Failed to update comment');
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('InitiativeCommentService.updateComment error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to update comment');
    }
  }

  async deleteComment(commentId, userId) {
    try {
      // Check ownership
      const commentResult = await query('SELECT user_id FROM comments WHERE id = $1', [commentId]);

      if (!commentResult.rows[0]) {
        throw AppError.notFound('Comment not found');
      }

      if (commentResult.rows[0].user_id !== userId) {
        throw AppError.forbidden('You are not authorized to delete this comment');
      }

      await query(
        'UPDATE comments SET deleted_at = NOW() WHERE id = $1',
        [commentId]
      );

      return { id: commentId };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('InitiativeCommentService.deleteComment error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to delete comment');
    }
  }
}

module.exports = new InitiativeCommentService();
