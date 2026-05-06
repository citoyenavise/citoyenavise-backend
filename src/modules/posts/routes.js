/**
 * Routes posts & idées
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired, authOptional } = require('../../core/middleware/auth');
const postsController = require('./controller');

const router = express.Router();

// List posts (feed)
router.get('/', authOptional, asyncHandler(postsController.listPosts));

// Get popular posts
router.get('/popular', authOptional, asyncHandler(postsController.getPopularPosts));

// Get post
router.get('/:id', asyncHandler(postsController.getPost));

// Create post (protected)
router.post('/', authRequired, asyncHandler(postsController.createPost));

// Update post (protected)
router.put('/:id', authRequired, asyncHandler(postsController.updatePost));

// Delete post (protected)
router.delete('/:id', authRequired, asyncHandler(postsController.deletePost));

// Flag post (protected)
router.post('/:id/flag', authRequired, asyncHandler(postsController.flagPost));

// Like post (protected)
router.post('/:id/like', authRequired, asyncHandler(postsController.likePost));

// Unlike post (protected)
router.delete('/:id/like', authRequired, asyncHandler(postsController.unlikePost));

module.exports = router;
