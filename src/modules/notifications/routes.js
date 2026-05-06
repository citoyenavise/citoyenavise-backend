/**
 * Notifications Routes
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired } = require('../../core/middleware/auth');
const controller = require('./controller');

const router = express.Router();

router.get('/', authRequired, asyncHandler(controller.list));
router.patch('/:id/read', authRequired, asyncHandler(controller.markAsRead));
router.patch('/read-all', authRequired, asyncHandler(controller.markAllAsRead));

module.exports = router;
