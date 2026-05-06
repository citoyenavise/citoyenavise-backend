const { createCommentSchema, updateCommentSchema, listCommentsSchema } = require('./schema');
const commentService = require('./service');
const AppError = require('../../../core/errors/AppError');

class InitiativeCommentController {
  async createComment(req, res, next) {
    try {
      const validated = createCommentSchema.safeParse(req.body);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const comment = await commentService.createComment(req.params.id, req.user.userId, validated.data.content);
      return res.apiCreated('Comment created successfully', comment);
    } catch (error) {
      next(error);
    }
  }

  async listComments(req, res, next) {
    try {
      const validated = listCommentsSchema.safeParse(req.query);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const result = await commentService.listComments(req.params.id, validated.data);
      return res.apiPaginated('Comments retrieved successfully', result.data, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async updateComment(req, res, next) {
    try {
      const validated = updateCommentSchema.safeParse(req.body);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const comment = await commentService.updateComment(req.params.commentId, validated.data.content, req.user.userId);
      return res.apiUpdated('Comment updated successfully', comment);
    } catch (error) {
      next(error);
    }
  }

  async deleteComment(req, res, next) {
    try {
      await commentService.deleteComment(req.params.commentId, req.user.userId);
      return res.apiDeleted('Comment deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InitiativeCommentController();
