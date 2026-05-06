/**
 * Routes carte interactive (GeoJSON)
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { requireRole } = require('../../core/middleware/auth');
const mapController = require('./controller');

const router = express.Router();

// Get nodes as GeoJSON
router.get('/nodes', asyncHandler(mapController.getNodes));

// Create node (admin only)
router.post('/nodes', requireRole('admin'), asyncHandler(mapController.createNode));

// Update node (admin only)
router.put('/nodes/:id', requireRole('admin'), asyncHandler(mapController.updateNode));

// Delete node (admin only)
router.delete('/nodes/:id', requireRole('admin'), asyncHandler(mapController.deleteNode));

module.exports = router;
