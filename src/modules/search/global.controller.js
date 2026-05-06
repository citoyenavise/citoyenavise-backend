/**
 * Global Search Controller
 */

const { GlobalSearchService } = require('./global.service');

const GlobalSearchController = {
  async search(req, res, next) {
    try {
      const { q, page = 1, limit = 20 } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Query must be at least 2 characters' });
      }

      const results = await GlobalSearchService.search({
        query: q,
        page: Number(page),
        limit: Number(limit),
      });

      return res.json({ success: true, data: results });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = GlobalSearchController;
