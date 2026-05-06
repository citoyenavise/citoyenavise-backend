/**
 * Service utilisateurs
 */

const { query, transaction } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');
const logger = require('../../core/utils/logger');

/**
 * Récupérer utilisateur par ID
 */
async function getUserById(userId) {
  const result = await query(
    `SELECT u.id, u.email, u.username, u.role, u.is_verified,
            p.id as profile_id, p.bio, p.avatar_url, p.location, p.interests,
            p.followers_count, p.posts_count
     FROM users u
     LEFT JOIN profiles p ON u.id = p.user_id
     WHERE u.id = $1 AND u.deleted_at IS NULL`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found', 404);
  }

  const user = result.rows[0];
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    isVerified: user.is_verified,
    profile: user.profile_id ? {
      id: user.profile_id,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      location: user.location,
      interests: user.interests,
      followersCount: user.followers_count,
      postsCount: user.posts_count,
    } : null,
  };
}

/**
 * Mettre à jour utilisateur
 */
async function updateUser(userId, { email, username }, requestingUserId) {
  // Vérifier ownership
  if (userId !== requestingUserId) {
    throw new AppError('Cannot update another user', 403);
  }

  const updates = [];
  const params = [userId];
  let paramIndex = 2;

  if (email) {
    const existing = await query(
      'SELECT id FROM users WHERE email = LOWER($1) AND id != $2',
      [email, userId]
    );
    if (existing.rows.length > 0) {
      throw new AppError('Email already in use', 409);
    }
    updates.push(`email = LOWER($${paramIndex})`);
    params.push(email);
    paramIndex += 1;
  }

  if (username) {
    const existing = await query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [username, userId]
    );
    if (existing.rows.length > 0) {
      throw new AppError('Username already taken', 409);
    }
    updates.push(`username = $${paramIndex}`);
    params.push(username);
    paramIndex += 1;
  }

  if (updates.length === 0) {
    return getUserById(userId);
  }

  updates.push('updated_at = NOW()');
  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;

  await query(sql, params);
  logger.info('User updated', { meta: { userId } });

  return getUserById(userId);
}

/**
 * Supprimer utilisateur (soft delete)
 */
async function deleteUser(userId, requestingUserId) {
  if (userId !== requestingUserId) {
    throw new AppError('Cannot delete another user', 403);
  }

  await query(
    'UPDATE users SET deleted_at = NOW() WHERE id = $1',
    [userId]
  );

  logger.info('User deleted', { meta: { userId } });
}

module.exports = {
  getUserById,
  updateUser,
  deleteUser,
};
