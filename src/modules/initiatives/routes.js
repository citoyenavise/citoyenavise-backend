const express = require('express');
const router = express.Router();
const initiativeController = require('./controller');
const votesRoutes = require('./votes/routes');
const commentsRoutes = require('./comments/routes');
const { authRequired, authOptional } = require('../../core/middleware/auth');
const { asyncHandler } = require('../../core/middleware/errorHandler');

// List initiatives (public)
router.get('/', authOptional, asyncHandler((req, res, next) => initiativeController.list(req, res, next)));

// Create initiative (protected)
router.post('/', authRequired, asyncHandler((req, res, next) => initiativeController.create(req, res, next)));

// Votes sub-routes
router.use('/:id/votes', votesRoutes);

// Comments sub-routes
router.use('/:id/comments', commentsRoutes);

// Get initiative detail (public)
router.get('/:id', authOptional, asyncHandler((req, res, next) => initiativeController.getById(req, res, next)));

// Get initiative stats (public)
router.get('/:id/stats', authOptional, asyncHandler((req, res, next) => initiativeController.getStats(req, res, next)));

// Update initiative (protected + owner)
router.put('/:id', authRequired, asyncHandler((req, res, next) => initiativeController.update(req, res, next)));

// Close initiative (protected + owner)
router.post('/:id/close', authRequired, asyncHandler((req, res, next) => initiativeController.close(req, res, next)));

// Delete initiative (protected + owner)
router.delete('/:id', authRequired, asyncHandler((req, res, next) => initiativeController.delete(req, res, next)));

module.exports = router;
