/**
 * Global Search Routes
 */

const express = require('express');
const router = express.Router();

const GlobalSearchController = require('./global.controller');

// GET /api/v1/search?q=...&page=...&limit=...
router.get('/', GlobalSearchController.search);

module.exports = router;
