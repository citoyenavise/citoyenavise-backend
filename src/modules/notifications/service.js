/**
 * Notifications Service
 */

const { query } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');

async function createNotification({ userId, type, payload }) {
  await query(
    `INSERT INTO notifications (user_id, type, payload, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [userId, type, payload]
  );
}

async function list(userId, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT id, type, payload, created_at, read_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows;
}

async function markAsRead(id, userId) {
  const result = await query(
    `UPDATE notifications
     SET read_at = NOW()
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (result.rowCount === 0) {
    throw new AppError('Notification introuvable', 404);
  }
}

async function markAllAsRead(userId) {
  await query(
    `UPDATE notifications
     SET read_at = NOW()
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
}

module.exports = {
  createNotification,
  list,
  markAsRead,
  markAllAsRead,
};
