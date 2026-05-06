/**
 * Reports Controller — HTTP handlers for reports
 */

const { ReportsService } = require('./service');
const { CreateReportSchema, ListReportsSchema, ResolveReportSchema } = require('./schema');
const { AppError } = require('../../core/middleware/errorHandler');

const ReportsController = {
  /**
   * Create a new report
   * POST /api/v1/reports
   */
  async create(req, res) {
    const parse = CreateReportSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Invalid report data',
        parse.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const report = await ReportsService.createReport(req.user.id, parse.data);
    return res.apiSuccess(report, 201);
  },

  /**
   * List reports
   * GET /api/v1/reports
   */
  async list(req, res) {
    const parse = ListReportsSchema.safeParse(req.query);
    if (!parse.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Invalid query parameters',
        parse.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const result = await ReportsService.listReports(parse.data);
    return res.apiPaginated(result.data, result.meta.total, result.meta.page, result.meta.limit);
  },

  /**
   * Get a single report
   * GET /api/v1/reports/:id
   */
  async getOne(req, res) {
    const { id } = req.params;
    const report = await ReportsService.getReport(id);

    if (!report) {
      throw new AppError('NOT_FOUND', 404, 'Report not found');
    }

    return res.apiSuccess(report);
  },

  /**
   * Resolve a report
   * POST /api/v1/reports/:id/resolve
   */
  async resolve(req, res) {
    const parse = ResolveReportSchema.safeParse(req.body);
    if (!parse.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Invalid resolution data',
        parse.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const resolved = await ReportsService.resolveReport(req.params.id, req.user.id, parse.data);
    return res.apiSuccess(resolved);
  },
};

module.exports = ReportsController;
