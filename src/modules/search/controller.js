const { searchQuerySchema, reindexSchema } = require('./schema');
const service = require('./service');
const AppError = require('../../core/errors');

class SearchController {
  async search(req, res, next) {
    try {
      const validated = searchQuerySchema.safeParse(req.query);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const { q, type, category, page, limit, sort } = validated.data;
      const params = { q, category, page, limit, sort };

      let result;
      if (!type) {
        result = await service.searchGlobal(params);
      } else if (type === 'post') {
        result = await service.searchPosts(params);
      } else if (type === 'initiative') {
        result = await service.searchInitiatives(params);
      } else if (type === 'article') {
        result = await service.searchArticles(params);
      } else if (type === 'video') {
        result = await service.searchVideos(params);
      } else if (type === 'profile') {
        result = await service.searchProfiles(params);
      } else {
        result = { items: [], total: 0 };
      }

      const pages = Math.ceil(result.total / limit);
      return res.apiPaginated('Search results', result.items, { total: result.total, page, limit, pages });
    } catch (error) {
      next(error);
    }
  }

  async reindex(req, res, next) {
    try {
      const validated = reindexSchema.safeParse({ type: req.params.type || req.body?.type || 'all' });
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      // For now, just invalidate cache
      await service.invalidateCache();
      return res.apiSuccess('Search cache invalidated', { type: validated.data.type, status: 'ok' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SearchController();
