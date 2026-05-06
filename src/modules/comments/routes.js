/**
 * Routes — Comments (version corrigée)
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired } = require('../../core/middleware/auth');
const controller = require('./controller');

const router = express.Router();

// Créer un commentaire
router.post(
  '/posts/:postId/comments',
  authRequired,
  asyncHandler(controller.createComment)
);

// Lister les commentaires d'un post
router.get(
  '/posts/:postId/comments',
  asyncHandler(controller.getCommentsByPost)
);

// Récupérer un commentaire
router.get(
  '/comments/:commentId',
  asyncHandler(controller.getComment)
);

// Mettre à jour un commentaire
router.put(
  '/comments/:commentId',
  authRequired,
  asyncHandler(controller.updateComment)
);

// Supprimer un commentaire
router.delete(
  '/comments/:commentId',
  authRequired,
  asyncHandler(controller.deleteComment)
);

module.exports = router;
