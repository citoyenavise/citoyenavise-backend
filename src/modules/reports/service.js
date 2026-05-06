/**
 * Reports Service — Report creation, listing, and resolution
 */

const { query } = require('../../core/services/database');
const logger = require('../../core/utils/logger');
const { eventBus } = require('../../core/eventBus');

class ReportsService {
  /**
   * Create a new report
   */
  static async createReport(userId, data) {
    try {
      const result = await query(
        `INSERT INTO reports (user_id, target_type, target_id, reason, description, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id, target_type, target_id, reason, description, status, created_at`,
        [userId, data.targetType, data.targetId, data.reason, data.description || null, 'open']
      );

      const report = result.rows[0];

      // Emit event for audit/notification
      eventBus.emit('report.created', {
        reportId: report.id,
        userId,
        targetType: data.targetType,
        targetId: data.targetId,
      });

      logger.info('Report created', {
        meta: { reportId: report.id, userId, targetType: data.targetType },
      });

      return report;
    } catch (err) {
      logger.error('Failed to create report', { meta: { error: err.message } });
      throw err;
    }
  }

  /**
   * List reports with filtering
   */
  static async listReports(params) {
    const { page = 1, limit = 20, status, targetType, sort = 'created_at' } = params;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    let values = [];
    let paramIndex = 1;

    if (status) {
      whereConditions.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (targetType) {
      whereConditions.push(`target_type = $${paramIndex}`);
      values.push(targetType);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    values.push(limit);
    values.push(offset);

    try {
      const result = await query(
        `SELECT r.id, r.user_id, r.target_type, r.target_id, r.reason, r.description,
                r.status, r.created_at, r.updated_at, u.username
         FROM reports r
         JOIN users u ON r.user_id = u.id
         ${whereClause}
         ORDER BY r.${sort} DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        values
      );

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM reports r ${whereClause}`,
        values.slice(0, -2)
      );

      return {
        data: result.rows,
        meta: {
          total: parseInt(countResult.rows[0].count, 10),
          page,
          limit,
        },
      };
    } catch (err) {
      logger.error('Failed to list reports', { meta: { error: err.message } });
      throw err;
    }
  }

  /**
   * Get a single report
   */
  static async getReport(reportId) {
    try {
      const result = await query(
        `SELECT r.id, r.user_id, r.target_type, r.target_id, r.reason, r.description,
                r.status, r.created_at, r.updated_at, u.username
         FROM reports r
         JOIN users u ON r.user_id = u.id
         WHERE r.id = $1`,
        [reportId]
      );

      return result.rows[0] || null;
    } catch (err) {
      logger.error('Failed to get report', { meta: { reportId, error: err.message } });
      throw err;
    }
  }

  /**
   * Resolve a report with action
   */
  static async resolveReport(reportId, adminId, data) {
    try {
      const report = await this.getReport(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      const result = await query(
        `UPDATE reports
         SET status = $1, resolution_action = $2, resolution_notes = $3, resolved_by = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING id, status, resolution_action, resolution_notes, resolved_by, updated_at`,
        [data.status, data.action || null, data.notes || null, adminId, reportId]
      );

      const resolved = result.rows[0];

      // Emit event for audit
      eventBus.emit('report.resolved', {
        reportId,
        adminId,
        status: data.status,
        action: data.action,
        targetType: report.target_type,
        targetId: report.target_id,
      });

      logger.info('Report resolved', {
        meta: { reportId, status: data.status, action: data.action },
      });

      return resolved;
    } catch (err) {
      logger.error('Failed to resolve report', { meta: { reportId, error: err.message } });
      throw err;
    }
  }
}

module.exports = { ReportsService };
