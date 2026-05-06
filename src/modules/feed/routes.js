/**
 * Feed Routes
 */

const express = require('express');
const router = express.Router();

const { authOptional } = require('../../core/middleware/auth');
const FeedController = require('./controller');

/**
 * GET /api/v1/feed — Smart feed with temporal scoring
 */
router.get(
  '/',
  authOptional,
  FeedController.getSmartFeed
);

/**
 * GET /api/v1/feed/activity/:userId — User activity timeline
 */
router.get(
  '/activity/:userId',
  FeedController.getUserActivity
);

/**
 * GET /api/v1/feed/me/activity — My activity timeline
 */
router.get(
  '/me/activity',
  (req, res, next) => {
    req.params.userId = req.user?.id;
    if (!req.params.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    FeedController.getUserActivity(req, res, next);
  }
);

module.exports = router;
