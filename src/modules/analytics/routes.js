const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authRequired, authOptional } = require('../../core/middleware/auth');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const AppError = require('../../core/errors');

// Admin-only middleware
const adminOnly = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
    throw AppError.forbidden('Admin access required');
  }
  next();
};

// Track event (public)
router.post('/track', authOptional, asyncHandler((req, res, next) => controller.track(req, res, next)));

// Get stats (admin only)
router.get('/stats', authRequired, adminOnly, asyncHandler((req, res, next) => controller.getStats(req, res, next)));

module.exports = router;
