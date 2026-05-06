/**
 * Feed Controller — HTTP handlers
 */

const { FeedService } = require('./service');
const { GetFeedSchema } = require('./schema');


const FeedController = {
  async getSmartFeed(req, res, next) {
    try {
      const parse = GetFeedSchema.safeParse(req.query);
      if (!parse.success) {
        return res.status(422).json({
          error: 'Invalid query parameters',
          details: parse.error.issues,
        });
      }

      const data = await FeedService.getSmartFeed({
        userId: req.user?.id,
        page: parse.data.page,
        limit: parse.data.limit,
      });

      return res.json(data);
    } catch (err) {
      next(err);
    }
  },

  async getUserActivity(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const activity = await FeedService.getUserActivity({
        userId: req.params.userId || req.user.id,
        page: Number(page),
        limit: Number(limit),
      });

      return res.json(activity);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = FeedController;
