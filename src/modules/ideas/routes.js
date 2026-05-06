/**
 * Routes — Idées Civiques
 * API complète pour les idées (créer, lister, liker, populaires)
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired, authOptional } = require('../../core/middleware/auth');
const controller = require('./controller');

const router = express.Router();

/**
 * GET /api/v1/ideas/popular — Idées les plus likées
 */
router.get(
  '/popular',
  authOptional,
  asyncHandler(controller.getPopular)
);

/**
 * GET /api/v1/ideas — Lister les idées
 * Query: limit, page, category, sort (latest|popular|trending)
 */
router.get(
  '/',
  authOptional,
  asyncHandler(controller.listIdeas)
);

/**
 * POST /api/v1/ideas — Créer une idée
 * Body: { title, content, category }
 */
router.post(
  '/',
  authRequired,
  asyncHandler(controller.createIdea)
);

/**
 * GET /api/v1/ideas/:id — Détail d'une idée
 */
router.get(
  '/:id',
  authOptional,
  asyncHandler(controller.getIdea)
);

/**
 * PUT /api/v1/ideas/:id — Modifier une idée
 * Body: { title?, content?, category? }
 */
router.put(
  '/:id',
  authRequired,
  asyncHandler(controller.updateIdea)
);

/**
 * DELETE /api/v1/ideas/:id — Supprimer une idée
 */
router.delete(
  '/:id',
  authRequired,
  asyncHandler(controller.deleteIdea)
);

/**
 * POST /api/v1/ideas/:id/like — Liker une idée
 */
router.post(
  '/:id/like',
  authRequired,
  asyncHandler(controller.likeIdea)
);

/**
 * DELETE /api/v1/ideas/:id/like — Retirer un like
 */
router.delete(
  '/:id/like',
  authRequired,
  asyncHandler(controller.unlikeIdea)
);

module.exports = router;
