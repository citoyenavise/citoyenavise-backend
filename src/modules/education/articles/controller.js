/**
 * Article Controller - Official
 */
const { apiSuccess, apiCreated } = require("../../../lib/apiResponse");
const { ArticleService } = require("./service");

exports.ArticleController = {
  async create(req, res, next) {
    try {
      const article = await ArticleService.createArticle({
        ...req.body,
        authorId: req.user.id,
      });
      return apiCreated(res, article);
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const { page, limit, search, category } = req.query;
      const data = await ArticleService.listArticles({
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
      const article = await ArticleService.getArticleById(req.params.id);
      await ArticleService.incrementViews(req.params.id);
      const likesCount = await ArticleService.getLikesCount(req.params.id);

      return apiSuccess(res, {
        ...article,
        likesCount,
      });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const article = await ArticleService.updateArticle(req.params.id, req.body);
      return apiSuccess(res, article);
    } catch (err) {
      next(err);
    }
  },

  async remove(req, res, next) {
    try {
      const article = await ArticleService.deleteArticle(req.params.id);
      return apiSuccess(res, article);
    } catch (err) {
      next(err);
    }
  },
};
