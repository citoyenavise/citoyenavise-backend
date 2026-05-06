/**
 * Media Routes — File upload endpoints
 */

const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../../core/middleware/auth');
const { uploadHandler, getMediaHandler, deleteMediaHandler } = require('./controller');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
});

// POST /api/v1/media — Upload file (multipart/form-data)
router.post('/', requireAuth, upload.single('file'), uploadHandler);

// GET /api/v1/media/:id — Get media info
router.get('/:id', getMediaHandler);

// DELETE /api/v1/media/:id — Delete media (owner only)
router.delete('/:id', requireAuth, deleteMediaHandler);

module.exports = router;
