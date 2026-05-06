/**
 * Quiz Controller - Official
 */
const { apiSuccess, apiCreated } = require("../../../lib/apiResponse");
const { QuizService } = require("./service");

exports.QuizController = {
  async create(req, res, next) {
    try {
      const quiz = await QuizService.createQuiz({
        ...req.body,
        authorId: req.user.id,
      });
      return apiCreated(res, quiz);
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const { page, limit, search, category } = req.query;
      const data = await QuizService.listQuizzes({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        category,
      });
      return apiSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },

  async getOne(req, res, next) {
    try {
      const quiz = await QuizService.getQuizById(req.params.id);
      return apiSuccess(res, quiz);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const quiz = await QuizService.updateQuiz(req.params.id, req.body, req.user.id);
      return apiSuccess(res, quiz);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const quiz = await QuizService.deleteQuiz(req.params.id, req.user.id);
      return apiSuccess(res, quiz);
    } catch (err) {
      next(err);
    }
  },

  async getLeaderboard(req, res, next) {
    try {
      const { limit } = req.query;
      const leaderboard = await QuizService.getLeaderboard(
        req.params.id,
        limit ? Number(limit) : 10
      );
      return apiSuccess(res, leaderboard);
    } catch (err) {
      next(err);
    }
  },

  async submitAttempt(req, res, next) {
    try {
      const result = await QuizService.submitAttempt({
        quizId: req.params.id,
        userId: req.user.id,
        answers: req.body.answers,
      });
      return apiSuccess(res, result);
    } catch (err) {
      next(err);
    }
  },
};
