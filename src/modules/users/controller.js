/**
 * Contrôleur utilisateurs — VERSION STANDARDISÉE
 */

const { z } = require('zod');
const usersService = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');

const updateUserSchema = z.object({
  email: z.string().email('Email invalide').optional(),
  username: z.string().min(3, 'Min 3 chars').max(50).optional(),
});

/**
 * GET /api/v1/users/:id
 */
async function getUser(req, res) {
  const { id } = req.params;
  const user = await usersService.getUserById(id);

  if (!user) {
    throw new AppError('NOT_FOUND', 404, 'User not found');
  }

  res.apiSuccess(user);
}

/**
 * PUT /api/v1/users/:id
 */
async function updateUser(req, res) {
  const { id } = req.params;
  const validated = updateUserSchema.safeParse(req.body);

  if (!validated.success) {
    throw new AppError(
      'VALIDATION_ERROR',
      400,
      'Validation failed',
      validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
    );
  }

  const user = await usersService.updateUser(id, validated.data, req.user.userId);
  res.apiUpdated(user);
}

/**
 * DELETE /api/v1/users/:id
 */
async function deleteUser(req, res) {
  const { id } = req.params;
  await usersService.deleteUser(id, req.user.userId);
  res.apiDeleted(id);
}

module.exports = {
  getUser,
  updateUser,
  deleteUser,
};
