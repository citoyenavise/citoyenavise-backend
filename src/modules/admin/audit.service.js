/**
 * Admin Audit Service — Tracking admin actions
 */

const { query } = require('../../core/services/database');

exports.AdminAuditService = {
  async logAction({ adminId, action, targetType, targetId, metadata = null }) {
    try {
      await query(
        `INSERT INTO admin_audit_logs (admin_id, action, target_type, target_id, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [adminId, action, targetType, targetId, metadata ? JSON.stringify(metadata) : null]
      );
    } catch (err) {
      console.error('Audit logging failed:', err.message);
    }
  },

  async getAuditLog({ adminId, action, targetType, page = 1, limit = 50 }) {
    const offset = (page - 1) * limit;
    const params = [];
    const where = [];

    if (adminId) {
      params.push(adminId);
      where.push(`admin_id = $${params.length}`);
    }

    if (action) {
      params.push(action);
      where.push(`action = $${params.length}`);
    }

    if (targetType) {
      params.push(targetType);
      where.push(`target_type = $${params.length}`);
    }

    const query = `
      SELECT *
      FROM admin_audit_logs
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const result = await query(query, [...params, limit, offset]);
    return result.rows;
  },
};
