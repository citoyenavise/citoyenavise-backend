const { trackEventSchema, statsQuerySchema } = require('./schema');
const service = require('./service');
const AppError = require('../../core/errors');

class AnalyticsController {
  async track(req, res, next) {
    try {
      const validated = trackEventSchema.safeParse(req.body);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const event = await service.track(validated.data);
      return res.apiCreated('Event tracked', event);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const validated = statsQuerySchema.safeParse(req.query);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const stats = await service.getStats(validated.data.range);
      return res.apiSuccess('Analytics stats', stats);
    } catch (error) {
      next(error);
    }
  }

  async getOptimizationReport(req, res, next) {
    try {
      const report = await service.getOptimizationReport();
      return res.apiSuccess('Optimization report', report);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AnalyticsController();
