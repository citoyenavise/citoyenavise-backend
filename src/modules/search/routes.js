const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authRequired, authOptional } = require('../../core/middleware/auth');
const asyncHandler = require('../../core/middleware/asyncHandler');

// Global search (public)
router.get('/', authOptional, asyncHandler((req, res, next) => controller.search(req, res, next)));

// Search by type shortcuts
router.get('/posts', authOptional, asyncHandler((req, res, next) => {
  req.query.type = 'post';
  return controller.search(req, res, next);
}));

router.get('/initiatives', authOptional, asyncHandler((req, res, next) => {
  req.query.type = 'initiative';
  return controller.search(req, res, next);
}));

router.get('/articles', authOptional, asyncHandler((req, res, next) => {
  req.query.type = 'article';
  return controller.search(req, res, next);
}));

router.get('/videos', authOptional, asyncHandler((req, res, next) => {
  req.query.type = 'video';
  return controller.search(req, res, next);
}));

router.get('/profiles', authOptional, asyncHandler((req, res, next) => {
  req.query.type = 'profile';
  return controller.search(req, res, next);
}));

// Maintenance (protected - cache invalidation)
router.post('/reindex', authRequired, asyncHandler((req, res, next) => controller.reindex(req, res, next)));
router.post('/reindex/:type', authRequired, asyncHandler((req, res, next) => controller.reindex(req, res, next)));

module.exports = router;
