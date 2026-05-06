/**
 * Notifications Controller — Version standardisée
 */

const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');
const { markReadSchema, paginationSchema } = require('./schema');

module.exports = {
  async list(req, res) {
    const validation = paginationSchema.safeParse(req.query);
    if (!validation.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Invalid query parameters',
        validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const { page, limit } = validation.data;
    const result = await service.list(req.user.userId, validation.data.page, validation.data.limit);

    if (result && result.data && Array.isArray(result.data)) {
      res.apiPaginated(result.data, result.meta.total, result.meta.page, result.meta.limit);
    } else {
      res.apiSuccess(result || []);
    }
  },

  async markAsRead(req, res) {
    const validation = markReadSchema.safeParse(req.params);
    if (!validation.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Invalid parameters',
        validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const { id } = validation.data;
    await service.markAsRead(id, req.user.userId);

    res.apiSuccess({ marked: true });
  },

  async markAllAsRead(req, res) {
    await service.markAllAsRead(req.user.userId);
    res.apiSuccess({ allMarked: true });
  },
};
