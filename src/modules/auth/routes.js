/**
 * Routes d'authentification
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired } = require('../../core/middleware/auth');
const controller = require('./controller');

const router = express.Router();

// Public routes
router.post('/register', asyncHandler(controller.register));
router.post('/login', asyncHandler(controller.login));
router.post('/refresh', asyncHandler(controller.refresh));
router.post('/logout', asyncHandler(controller.logout));

// Protected routes
router.get('/me', authRequired, asyncHandler(controller.getMe));

module.exports = router;
