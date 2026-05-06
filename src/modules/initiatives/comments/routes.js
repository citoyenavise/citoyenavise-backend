const express = require('express');
const router = express.Router({ mergeParams: true });
const commentController = require('./controller');
const { authRequired, authOptional } = require('../../../core/middleware/auth');
const asyncHandler = require('../../../core/middleware/asyncHandler');

// List comments (public)
router.get('/', authOptional, asyncHandler((req, res, next) => commentController.listComments(req, res, next)));

// Create comment (protected)
router.post('/', authRequired, asyncHandler((req, res, next) => commentController.createComment(req, res, next)));

// Update comment (protected + owner)
router.put('/:commentId', authRequired, asyncHandler((req, res, next) => commentController.updateComment(req, res, next)));

// Delete comment (protected + owner)
router.delete('/:commentId', authRequired, asyncHandler((req, res, next) => commentController.deleteComment(req, res, next)));

module.exports = router;
