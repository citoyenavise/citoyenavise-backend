/**
 * Notifications Extended Service
 */

const db = require('../../lib/db');

exports.NotificationsServiceExtended = {
  async markAsRead(notificationId, userId) {
    const result = await db.query(
      `UPDATE notifications
       SET read_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    return result.rows[0] || null;
  },

  async getSettings(userId) {
    let result = await db.query(
      `SELECT * FROM notification_settings WHERE user_id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      // Create default settings
      await db.query(
        `INSERT INTO notification_settings (user_id, email_enabled, push_enabled, quiz_results, reports, initiatives)
         VALUES ($1, true, true, true, true, true)
         RETURNING *`,
        [userId]
      );
      result = await db.query(`SELECT * FROM notification_settings WHERE user_id = $1`, [userId]);
    }

    return result.rows[0];
  },

  async updateSettings(userId, data) {
    const { email_enabled, push_enabled, quiz_results, reports, initiatives } = data;
    const result = await db.query(
      `UPDATE notification_settings
       SET email_enabled = COALESCE($1, email_enabled),
           push_enabled = COALESCE($2, push_enabled),
           quiz_results = COALESCE($3, quiz_results),
           reports = COALESCE($4, reports),
           initiatives = COALESCE($5, initiatives)
       WHERE user_id = $6
       RETURNING *`,
      [email_enabled, push_enabled, quiz_results, reports, initiatives, userId]
    );
    return result.rows[0];
  },
};
