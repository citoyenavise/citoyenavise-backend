/**
 * Contrôleur authentification — VERSION STANDARDISÉE
 */

const { z } = require('zod');
const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');

// Schémas de validation
const registerSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
  password: z.string().min(8, 'Min 8 caractères').regex(/[A-Z]/, 'Une majuscule requise'),
  username: z.string().min(3, 'Min 3 caractères').max(50),
});

const loginSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase(),
  password: z.string().min(1, 'Password required'),
});

const refreshSchema = z.object({
  refreshToken: z.string('Refresh token required'),
});

/**
 * POST /api/v1/auth/register
 */
async function register(req, res) {
  const validated = registerSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      'Validation failed',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const result = await service.registerUser(validated.data);

  res.apiCreated({
    user: result.user,
    profile: result.profile,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
}

/**
 * POST /api/v1/auth/login
 */
async function login(req, res) {
  const validated = loginSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      'Validation failed',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const result = await service.loginUser(validated.data);
  if (!result) {
    throw new AppError('INVALID_CREDENTIALS', 401, 'Email or password incorrect');
  }

  res.apiSuccess({
    user: result.user,
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
}

/**
 * GET /api/v1/auth/me
 */
async function getMe(req, res) {
  const user = await service.getCurrentUser(req.user.userId);
  if (!user) {
    throw new AppError('NOT_FOUND', 404, 'User not found');
  }

  res.apiSuccess(user);
}

/**
 * POST /api/v1/auth/refresh
 */
async function refresh(req, res) {
  const validated = refreshSchema.safeParse(req.body);
  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      'Validation failed',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const result = await service.refreshAccessToken(validated.data.refreshToken);
  if (!result) {
    throw new AppError('TOKEN_EXPIRED', 401, 'Refresh token invalid or expired');
  }

  res.apiSuccess({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
}

/**
 * POST /api/v1/auth/logout
 */
async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await service.logout(refreshToken);
  }

  res.apiSuccess({ loggedOut: true });
}

module.exports = {
  register,
  login,
  getMe,
  refresh,
  logout,
};
