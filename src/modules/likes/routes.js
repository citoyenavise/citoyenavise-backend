/**
 * Routes — Likes (version corrigée)
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired, authOptional } = require('../../core/middleware/auth');
const controller = require('./controller');

const router = express.Router();

// Liker un post
router.post(
  '/posts/:postId/like',
  authRequired,
  asyncHandler(controller.likePost)
);

// Unliker un post
router.delete(
  '/posts/:postId/like',
  authRequired,
  asyncHandler(controller.unlikePost)
);

// Lister les likes
router.get(
  '/posts/:postId/likes',
  authOptional,
  asyncHandler(controller.getPostLikes)
);

// Vérifier si l'utilisateur a liké
router.get(
  '/posts/:postId/likes/check',
  authRequired,
  asyncHandler(controller.checkLike)
);

module.exports = router;
