/**
 * Routes Module Videos
 */

const express = require('express');
const { asyncHandler } = require('../../../core/middleware/errorHandler');
const { authRequired } = require('../../../core/middleware/auth');
const validateRequest = require('../../../core/middleware/validateRequest');
const { createVideoSchema, updateVideoSchema } = require('./schema');
const VideoController = require('./controller');

const router = express.Router();

// POST /education/videos - Créer une vidéo
router.post(
  '/',
  authRequired,
  validateRequest(createVideoSchema),
  asyncHandler(VideoController.create)
);

// GET /education/videos - Lister les vidéos
router.get('/', asyncHandler(VideoController.list));

// GET /education/videos/:id - Récupérer une vidéo
router.get('/:id', asyncHandler(VideoController.getOne));

// PUT /education/videos/:id - Mettre à jour une vidéo
router.put(
  '/:id',
  authRequired,
  validateRequest(updateVideoSchema),
  asyncHandler(VideoController.update)
);

// DELETE /education/videos/:id - Supprimer une vidéo
router.delete('/:id', authRequired, asyncHandler(VideoController.remove));

module.exports = router;
