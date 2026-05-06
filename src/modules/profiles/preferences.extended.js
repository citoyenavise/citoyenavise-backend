/**
 * User Preferences Service
 */

const db = require('../../lib/db');

exports.PreferencesService = {
  async getPreferences(userId) {
    let result = await db.query(
      `SELECT * FROM user_preferences WHERE user_id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      await db.query(
        `INSERT INTO user_preferences (user_id) VALUES ($1)`,
        [userId]
      );
      result = await db.query(`SELECT * FROM user_preferences WHERE user_id = $1`, [userId]);
    }

    return result.rows[0];
  },

  async updatePreferences(userId, data) {
    const { language, theme, notifications_email, notifications_push, newsletter } = data;

    const result = await db.query(
      `UPDATE user_preferences
       SET language = COALESCE($1, language),
           theme = COALESCE($2, theme),
           notifications_email = COALESCE($3, notifications_email),
           notifications_push = COALESCE($4, notifications_push),
           newsletter = COALESCE($5, newsletter),
           updated_at = NOW()
       WHERE user_id = $6
       RETURNING *`,
      [language, theme, notifications_email, notifications_push, newsletter, userId]
    );

    return result.rows[0];
  },
};
