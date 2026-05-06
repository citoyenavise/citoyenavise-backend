/**
 * Contrôleur profils — VERSION STANDARDISÉE
 */

const { z } = require('zod');
const profilesService = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');

// Validation
const updateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url('Avatar URL invalide').optional(),
  location: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  interests: z.array(z.string()).optional(),
});

const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
});

/**
 * GET /api/v1/profiles
 */
async function listProfiles(req, res) {
  const validated = paginationSchema.extend({
    search: z.string().optional(),
    region: z.string().optional(),
  }).safeParse(req.query);

  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      'Invalid query parameters',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const result = await profilesService.listProfiles(validated.data);
  const { data, total, page, limit } = result;
  res.apiPaginated(data, total, page, limit);
}

/**
 * GET /api/v1/profiles/:id
 */
async function getProfile(req, res) {
  const { id } = req.params;
  const profile = await profilesService.getProfile(id);

  if (!profile) {
    throw new AppError('NOT_FOUND', 404, 'Profile not found');
  }

  res.apiSuccess(profile);
}

/**
 * PUT /api/v1/profiles/:id
 */
async function updateProfile(req, res) {
  const { id } = req.params;
  const validated = updateProfileSchema.safeParse(req.body);

  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      'Validation failed',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const profile = await profilesService.updateProfile(
    id,
    validated.data,
    req.user.userId
  );

  res.apiUpdated(profile);
}

/**
 * GET /api/v1/profiles/:id/posts
 */
async function getProfilePosts(req, res) {
  const { id } = req.params;
  const validated = paginationSchema.safeParse(req.query);

  if (!validated.success) {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid query parameters');
  }

  const result = await profilesService.getProfilePosts(id, validated.data);
  const { data, total, page, limit } = result;
  res.apiPaginated(data, total, page, limit);
}

/**
 * GET /api/v1/profiles/:id/followers
 */
async function getFollowers(req, res) {
  const { id } = req.params;
  const validated = paginationSchema.safeParse(req.query);

  if (!validated.success) {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid query parameters');
  }

  const result = await profilesService.getFollowers(id, validated.data);
  const { data, total, page, limit } = result;
  res.apiPaginated(data, total, page, limit);
}

/**
 * POST /api/v1/profiles/:id/follow
 */
async function followProfile(req, res) {
  const { id } = req.params;
  await profilesService.followProfile(id, req.user.userId);
  res.apiCreated({ followed: true });
}

/**
 * DELETE /api/v1/profiles/:id/follow
 */
async function unfollowProfile(req, res) {
  const { id } = req.params;
  await profilesService.unfollowProfile(id, req.user.userId);
  res.apiSuccess({ unfollowed: true });
}

module.exports = {
  listProfiles,
  getProfile,
  updateProfile,
  getProfilePosts,
  getFollowers,
  followProfile,
  unfollowProfile,
};
