/**
 * Service profils citoyens
 */

const { v4: uuidv4 } = require('uuid');
const { query } = require('../../core/services/database');
const { AppError } = require('../../core/middleware/errorHandler');
const logger = require('../../core/utils/logger');

/**
 * Lister profils (paginated)
 */
async function listProfiles({ limit = 20, page = 1, search = null, region = null }) {
  const offset = (page - 1) * limit;
  const maxLimit = Math.min(limit, 100);

  let sql = `
    SELECT p.id, p.user_id, p.bio, p.avatar_url, p.location, p.interests,
           p.followers_count, p.posts_count, p.is_verified,
           u.username, u.email, u.role
    FROM profiles p
    JOIN users u ON p.user_id = u.id
    WHERE u.deleted_at IS NULL
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    sql += ` AND (u.username ILIKE $${paramIndex} OR p.bio ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex += 1;
  }

  if (region) {
    sql += ` AND p.location ILIKE $${paramIndex}`;
    params.push(`%${region}%`);
    paramIndex += 1;
  }

  sql += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(maxLimit, offset);

  const result = await query(sql, params);

  // Récupérer le total pour pagination
  let countSql = 'SELECT COUNT(*) FROM profiles p JOIN users u ON p.user_id = u.id WHERE u.deleted_at IS NULL';
  if (search) countSql += ` AND (u.username ILIKE $1 OR p.bio ILIKE $1)`;
  if (region) countSql += ` AND p.location ILIKE $${search ? 2 : 1}`;

  const countParams = [];
  if (search) countParams.push(`%${search}%`);
  if (region) countParams.push(`%${region}%`);

  const countResult = await query(countSql, countParams);
  const total = parseInt(countResult.rows[0].count, 10);

  return {
    data: result.rows.map(p => ({
      id: p.id,
      userId: p.user_id,
      username: p.username,
      bio: p.bio,
      avatarUrl: p.avatar_url,
      location: p.location,
      interests: p.interests,
      followersCount: p.followers_count,
      postsCount: p.posts_count,
      isVerified: p.is_verified,
    })),
    meta: {
      total,
      page,
      limit: maxLimit,
      pages: Math.ceil(total / maxLimit),
    },
  };
}

/**
 * Récupérer profil public
 */
async function getProfile(profileId) {
  const result = await query(
    `SELECT p.id, p.user_id, p.bio, p.avatar_url, p.location, p.interests,
            p.followers_count, p.posts_count, p.is_verified, p.created_at,
            u.username, u.role
     FROM profiles p
     JOIN users u ON p.user_id = u.id
     WHERE p.id = $1 AND u.deleted_at IS NULL`,
    [profileId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Profile not found', 404);
  }

  const p = result.rows[0];
  return {
    id: p.id,
    userId: p.user_id,
    username: p.username,
    bio: p.bio,
    avatarUrl: p.avatar_url,
    location: p.location,
    interests: p.interests,
    followersCount: p.followers_count,
    postsCount: p.posts_count,
    isVerified: p.is_verified,
    createdAt: p.created_at,
  };
}

/**
 * Créer profil (appelé automatiquement lors de register)
 */
async function createProfile(userId, { bio, avatarUrl, location, latitude, longitude, interests }) {
  const profileId = uuidv4();

  const result = await query(
    `INSERT INTO profiles (id, user_id, bio, avatar_url, location, latitude, longitude, interests)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, user_id, bio, avatar_url, location, interests`,
    [profileId, userId, bio || null, avatarUrl || null, location || null, latitude || null, longitude || null, interests || []]
  );

  logger.info('Profile created', { meta: { profileId, userId } });

  return result.rows[0];
}

/**
 * Mettre à jour profil
 */
async function updateProfile(profileId, data, requestingUserId) {
  // Vérifier ownership
  const result = await query(
    'SELECT user_id FROM profiles WHERE id = $1',
    [profileId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Profile not found', 404);
  }

  if (result.rows[0].user_id !== requestingUserId) {
    throw new AppError('Cannot update another profile', 403);
  }

  const updates = [];
  const params = [profileId];
  let paramIndex = 2;

  const updateableFields = ['bio', 'avatarUrl', 'location', 'latitude', 'longitude', 'interests'];
  const dbFields = {
    bio: 'bio',
    avatarUrl: 'avatar_url',
    location: 'location',
    latitude: 'latitude',
    longitude: 'longitude',
    interests: 'interests',
  };

  for (const field of updateableFields) {
    if (data[field] !== undefined) {
      updates.push(`${dbFields[field]} = $${paramIndex}`);
      params.push(data[field]);
      paramIndex += 1;
    }
  }

  if (updates.length === 0) {
    return getProfile(profileId);
  }

  updates.push('updated_at = NOW()');
  const sql = `UPDATE profiles SET ${updates.join(', ')} WHERE id = $1 RETURNING *`;

  await query(sql, params);
  logger.info('Profile updated', { meta: { profileId } });

  return getProfile(profileId);
}

/**
 * Récupérer posts d'un profil
 */
async function getProfilePosts(profileId, { limit = 20, page = 1 }) {
  const offset = (page - 1) * limit;
  const maxLimit = Math.min(limit, 100);

  const result = await query(
    `SELECT id, title, content, type, category, likes_count, created_at
     FROM posts
     WHERE user_id = (SELECT user_id FROM profiles WHERE id = $1)
       AND status = 'published' AND deleted_at IS NULL
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [profileId, maxLimit, offset]
  );

  return result.rows;
}

/**
 * Récupérer followers
 */
async function getFollowers(profileId, { limit = 20, page = 1 }) {
  const offset = (page - 1) * limit;
  const maxLimit = Math.min(limit, 100);

  const userId = (await query('SELECT user_id FROM profiles WHERE id = $1', [profileId])).rows[0].user_id;

  const result = await query(
    `SELECT p.id, p.user_id, u.username, p.avatar_url, p.bio
     FROM follows f
     JOIN users u ON f.follower_id = u.id
     JOIN profiles p ON u.id = p.user_id
     WHERE f.following_id = $1
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, maxLimit, offset]
  );

  return result.rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    username: r.username,
    avatarUrl: r.avatar_url,
    bio: r.bio,
  }));
}

/**
 * Suivre un profil
 */
async function followProfile(profileId, followerId) {
  const result = await query(
    'SELECT user_id FROM profiles WHERE id = $1',
    [profileId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Profile not found', 404);
  }

  const followingId = result.rows[0].user_id;

  if (followerId === followingId) {
    throw new AppError('Cannot follow yourself', 400);
  }

  // Insert ou ignore si déjà suivi
  await query(
    `INSERT INTO follows (follower_id, following_id)
     VALUES ($1, $2)
     ON CONFLICT (follower_id, following_id) DO NOTHING`,
    [followerId, followingId]
  );

  // Incrémenter le compteur
  await query(
    'UPDATE profiles SET followers_count = followers_count + 1 WHERE user_id = $1',
    [followingId]
  );

  logger.info('Profile followed', { meta: { followerId, followingId } });
}

/**
 * Arrêter de suivre
 */
async function unfollowProfile(profileId, followerId) {
  const result = await query(
    'SELECT user_id FROM profiles WHERE id = $1',
    [profileId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Profile not found', 404);
  }

  const followingId = result.rows[0].user_id;

  await query(
    'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
    [followerId, followingId]
  );

  // Décrémenter le compteur
  await query(
    'UPDATE profiles SET followers_count = followers_count - 1 WHERE user_id = $1',
    [followingId]
  );

  logger.info('Profile unfollowed', { meta: { followerId, followingId } });
}

module.exports = {
  listProfiles,
  getProfile,
  createProfile,
  updateProfile,
  getProfilePosts,
  getFollowers,
  followProfile,
  unfollowProfile,
};
