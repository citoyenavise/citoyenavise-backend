/**
 * Analytics Dashboards Service
 */

const db = require('../../lib/db');

exports.AnalyticsDashboards = {
  async getHourlyHeatmap({ range = 'day' }) {
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 1;
    const result = await db.query(
      `SELECT
         EXTRACT(HOUR FROM created_at)::INT as hour,
         COUNT(*) as event_count,
         COUNT(DISTINCT user_id) as unique_users
       FROM posts
       WHERE created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY hour
       ORDER BY hour`,
      []
    );
    return result.rows;
  },

  async getTopContent({ type = 'posts', range = 'day', limit = 10 }) {
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 1;
    let query = '';

    if (type === 'posts') {
      query = `
        SELECT id, title, likes_count, comments_count, views_count, created_at
        FROM posts
        WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '${days} days'
        ORDER BY likes_count DESC LIMIT $1`;
    } else if (type === 'articles') {
      query = `
        SELECT id, title, view_count, created_at
        FROM education_articles
        WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '${days} days'
        ORDER BY view_count DESC LIMIT $1`;
    } else if (type === 'initiatives') {
      query = `
        SELECT id, title, supporters_count, created_at
        FROM initiatives
        WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '${days} days'
        ORDER BY supporters_count DESC LIMIT $1`;
    }

    const result = await db.query(query, [limit]);
    return result.rows;
  },

  async getQuizCompletionStats({ range = 'day' }) {
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 1;
    const result = await db.query(
      `SELECT
         COUNT(DISTINCT quiz_id) as total_quizzes,
         COUNT(*) as total_attempts,
         AVG(percentage)::NUMERIC(5,2) as avg_score,
         COUNT(DISTINCT user_id) as unique_students
       FROM education_quiz_attempts
       WHERE created_at >= NOW() - INTERVAL '${days} days'`,
      []
    );
    return result.rows[0];
  },

  async getTrends({ range = 'month' }) {
    const days = range === 'week' ? 7 : range === 'month' ? 30 : 1;
    const result = await db.query(
      `SELECT
         DATE(created_at) as date,
         COUNT(*) as posts_created,
         COUNT(DISTINCT user_id) as active_users
       FROM posts
       WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY DATE(created_at)
       ORDER BY date DESC`,
      []
    );
    return result.rows;
  },

  async exportCsv({ type = 'users', range = 'month' }) {
    let rows = [];

    if (type === 'users') {
      const result = await db.query(
        `SELECT id, username, email, role, created_at FROM users WHERE deleted_at IS NULL`
      );
      rows = result.rows;
    } else if (type === 'posts') {
      const result = await db.query(
        `SELECT id, title, likes_count, comments_count, created_at FROM posts WHERE deleted_at IS NULL`
      );
      rows = result.rows;
    } else if (type === 'quiz_attempts') {
      const result = await db.query(
        `SELECT id, quiz_id, user_id, score, total, percentage, created_at FROM education_quiz_attempts`
      );
      rows = result.rows;
    }

    // Convert to CSV
    if (!rows.length) return '';

    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => r[h]).join(','))].join('\n');

    return csv;
  },
};
