/**
 * Achievements Service
 */

const db = require('../../lib/db');

exports.AchievementsService = {
  async checkAndGrant(userId, context) {
    const achievements = [];

    // Achievement: First Post
    if (context.type === 'post') {
      const postCount = await db.query(
        `SELECT COUNT(*) as count FROM posts WHERE user_id = $1`,
        [userId]
      );
      if (postCount.rows[0].count === 1) {
        await this.grant(userId, 'first_post');
        achievements.push('first_post');
      }
    }

    // Achievement: Quiz Master (5+ attempts)
    if (context.type === 'quiz') {
      const attempts = await db.query(
        `SELECT COUNT(*) as count FROM education_quiz_attempts WHERE user_id = $1`,
        [userId]
      );
      if (attempts.rows[0].count === 5) {
        await this.grant(userId, 'quiz_master');
        achievements.push('quiz_master');
      }
    }

    // Achievement: Initiative Starter (create initiative)
    if (context.type === 'initiative') {
      const initCount = await db.query(
        `SELECT COUNT(*) as count FROM initiatives WHERE creator_id = $1`,
        [userId]
      );
      if (initCount.rows[0].count === 1) {
        await this.grant(userId, 'initiative_starter');
        achievements.push('initiative_starter');
      }
    }

    return achievements;
  },

  async grant(userId, code) {
    const achRes = await db.query(
      `SELECT id FROM achievements WHERE code = $1`,
      [code]
    );

    if (!achRes.rows.length) return null;

    const achievementId = achRes.rows[0].id;

    // Ignore if already granted
    const result = await db.query(
      `INSERT INTO user_achievements (user_id, achievement_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING
       RETURNING *`,
      [userId, achievementId]
    );

    return result.rows[0];
  },

  async getAchievements(userId) {
    const result = await db.query(
      `SELECT a.* FROM achievements a
       JOIN user_achievements ua ON a.id = ua.achievement_id
       WHERE ua.user_id = $1
       ORDER BY ua.earned_at DESC`,
      [userId]
    );
    return result.rows;
  },
};
