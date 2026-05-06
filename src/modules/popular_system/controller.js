/**
 * Popular System Controller — Version officielle standardisée
 * Gestion des contenus populaires avec scoring temporal
 */

const { PopularQuerySchema } = require('./schema');
const { PopularService } = require('./service');
const { AppError } = require('../../core/middleware/errorHandler');

const PopularController = {
  async getPopular(req, res) {
    const parse = PopularQuerySchema.safeParse(req.query);
    if (!parse.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Invalid query parameters',
        parse.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const data = await PopularService.getPopular(parse.data);

    if (data && data.data && Array.isArray(data.data)) {
      return res.apiPaginated(data.data, data.meta?.total || 0, data.meta?.page || parse.data.page, data.meta?.limit || parse.data.limit);
    }

    return res.apiSuccess(data || {});
  },

  /**
   * Endpoint interne pour consulter les métriques de cache
   * GET /api/v1/popular/metrics (admin/monitoring only)
   */
  async getMetrics(req, res) {
    const metrics = PopularService.getMetrics();
    return res.apiSuccess(metrics);
  },

  /**
   * Endpoint interne pour réinitialiser les métriques
   * POST /api/v1/popular/metrics/reset (admin only)
   */
  async resetMetrics(req, res) {
    PopularService.resetMetrics();
    return res.apiSuccess({ message: 'Metrics reset' });
  },
};

module.exports = PopularController;
