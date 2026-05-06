/**
 * Notifications Extended Routes
 * Mark as read + settings endpoints
 */

const express = require('express');
const router = express.Router();

const { authRequired } = require('../../core/middleware/auth');
const { NotificationsService } = require('./service');

// Mark notification as read
router.post('/:id/read', authRequired, async (req, res, next) => {
  try {
    const notification = await NotificationsService.markAsRead(req.params.id, req.user.id);
    return res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
});

// Get notification settings
router.get('/settings', authRequired, async (req, res, next) => {
  try {
    const settings = await NotificationsService.getSettings(req.user.id);
    return res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

// Update notification settings
router.put('/settings', authRequired, async (req, res, next) => {
  try {
    const settings = await NotificationsService.updateSettings(req.user.id, req.body);
    return res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
