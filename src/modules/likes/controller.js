/**
 * Likes Controller — Version standardisée
 */

const { z } = require('zod');
const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');
const { likeSchema, unlikeSchema } = require('./schema');

const getLikesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
});

module.exports = {
  /**
   * POST /api/v1/posts/:postId/like
   */
  likePost: async (req, res) => {
    const validation = likeSchema.safeParse(req.params);
    if (!validation.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Validation failed',
        validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const { postId } = validation.data;
    const result = await service.likePost(postId, req.user.userId);

    res.apiCreated(result);
  },

  /**
   * DELETE /api/v1/posts/:postId/like
   */
  unlikePost: async (req, res) => {
    const validation = unlikeSchema.safeParse(req.params);
    if (!validation.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Validation failed',
        validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const { postId } = validation.data;
    await service.unlikePost(postId, req.user.userId);

    res.apiSuccess({ unliked: true });
  },

  /**
   * GET /api/v1/posts/:postId/likes
   */
  getPostLikes: async (req, res) => {
    const { postId } = req.params;
    const validated = getLikesSchema.safeParse(req.query);

    if (!validated.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Invalid query parameters',
        validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const likes = await service.getPostLikes(postId, validated.data.limit, validated.data.page);

    if (likes && likes.data && Array.isArray(likes.data)) {
      res.apiPaginated(likes.data, likes.meta.total, likes.meta.page, likes.meta.limit);
    } else {
      res.apiSuccess(likes || []);
    }
  },

  /**
   * GET /api/v1/posts/:postId/likes/check
   */
  checkLike: async (req, res) => {
    const { postId } = req.params;
    const isLiked = await service.checkLike(postId, req.user.userId);

    res.apiSuccess({ isLiked });
  },
};
