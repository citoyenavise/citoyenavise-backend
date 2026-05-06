const { createVoteSchema, listVotesSchema } = require('./schema');
const voteService = require('./service');
const AppError = require('../../../core/errors/AppError');

class VoteController {
  async addVote(req, res, next) {
    try {
      const validated = createVoteSchema.safeParse(req.body);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const vote = await voteService.addVote(req.params.id, req.user.userId);
      return res.apiCreated('Vote added successfully', vote);
    } catch (error) {
      next(error);
    }
  }

  async removeVote(req, res, next) {
    try {
      await voteService.removeVote(req.params.id, req.user.userId);
      return res.apiDeleted('Vote removed successfully');
    } catch (error) {
      next(error);
    }
  }

  async getVoteStatus(req, res, next) {
    try {
      const hasVoted = await voteService.hasVoted(req.params.id, req.user?.userId);
      return res.apiSuccess('Vote status retrieved', { hasVoted });
    } catch (error) {
      next(error);
    }
  }

  async listVoters(req, res, next) {
    try {
      const validated = listVotesSchema.safeParse(req.query);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const result = await voteService.listVoters(req.params.id, validated.data);
      return res.apiPaginated('Voters retrieved successfully', result.data, result.meta);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VoteController();
