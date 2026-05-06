/**
 * Analytics Dashboards Controller
 */

const { AnalyticsDashboards } = require('./dashboards');

exports.AnalyticsDashboardsController = {
  async getHourlyHeatmap(req, res, next) {
    try {
      const data = await AnalyticsDashboards.getHourlyHeatmap(req.query);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getTopContent(req, res, next) {
    try {
      const data = await AnalyticsDashboards.getTopContent(req.query);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getQuizCompletionStats(req, res, next) {
    try {
      const data = await AnalyticsDashboards.getQuizCompletionStats(req.query);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getTrends(req, res, next) {
    try {
      const data = await AnalyticsDashboards.getTrends(req.query);
      return res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async exportCsv(req, res, next) {
    try {
      const csv = await AnalyticsDashboards.exportCsv(req.query);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="export.csv"');
      return res.send(csv);
    } catch (err) {
      next(err);
    }
  },
};
