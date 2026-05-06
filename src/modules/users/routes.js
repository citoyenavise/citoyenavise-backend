/**
 * Routes utilisateurs
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired } = require('../../core/middleware/auth');
const usersController = require('./controller');

const router = express.Router();

// Get user
router.get('/:id', asyncHandler(usersController.getUser));

// Update user (protected)
router.put('/:id', authRequired, asyncHandler(usersController.updateUser));

// Delete user (protected)
router.delete('/:id', authRequired, asyncHandler(usersController.deleteUser));

module.exports = router;
