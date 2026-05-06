/**
 * Comments Controller — Version corrigée avec format standardisé
 */

const service = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');
const { createCommentSchema, updateCommentSchema, getCommentsSchema } = require('./validation');

module.exports = {
  /**
   * POST /api/v1/posts/:postId/comments
   */
  createComment: async (req, res) => {
    const { postId } = req.params;

    const validation = createCommentSchema.safeParse({
      postId,
      content: req.body.content,
    });

    if (!validation.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Validation failed',
        validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const { content } = validation.data;
    const comment = await service.createComment(postId, req.user.userId, content);

    res.apiCreated(comment);
  },

  /**
   * GET /api/v1/posts/:postId/comments
   */
  getCommentsByPost: async (req, res) => {
    const { postId } = req.params;
    const { limit = 20, page = 1, sort = 'latest' } = req.query;

    const validation = getCommentsSchema.safeParse({
      postId,
      limit,
      page,
      sort,
    });

    if (!validation.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Invalid query parameters',
        validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const result = await service.getCommentsByPost(
      postId,
      validation.data.limit,
      validation.data.page,
      validation.data.sort
    );

    // Retourner avec pagination
    res.apiPaginated(result.data, result.meta.total, result.meta.page, result.meta.limit);
  },

  /**
   * GET /api/v1/comments/:commentId
   */
  getComment: async (req, res) => {
    const { commentId } = req.params;
    const comment = await service.getCommentById(commentId);

    if (!comment) {
      throw new AppError('NOT_FOUND', 404, 'Comment not found');
    }

    res.apiSuccess(comment);
  },

  /**
   * PUT /api/v1/comments/:commentId
   */
  updateComment: async (req, res) => {
    const { commentId } = req.params;

    const validation = updateCommentSchema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Validation failed',
        validation.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const updated = await service.updateComment(
      commentId,
      req.user.userId,
      validation.data.content
    );

    res.apiUpdated(updated);
  },

  /**
   * DELETE /api/v1/comments/:commentId
   */
  deleteComment: async (req, res) => {
    const { commentId } = req.params;

    await service.deleteComment(commentId, req.user.userId);
    res.apiDeleted(commentId);
  },
};
