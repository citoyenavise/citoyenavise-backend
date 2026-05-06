/**
 * Reports Routes
 */

const express = require('express');
const router = express.Router();

const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired } = require('../../core/middleware/auth');
const { requirePermission } = require('../../middlewares/adminAuth');
const { PERMISSIONS } = require('../admin/permissions');
const ReportsController = require('./controller');

/**
 * POST /api/v1/reports — Create a report
 */
router.post(
  '/',
  authRequired,
  asyncHandler(ReportsController.create)
);

/**
 * GET /api/v1/reports — List reports (admin/moderator only)
 */
router.get(
  '/',
  authRequired,
  requirePermission(PERMISSIONS.MANAGE_REPORTS),
  asyncHandler(ReportsController.list)
);

/**
 * GET /api/v1/reports/:id — Get single report
 */
router.get(
  '/:id',
  authRequired,
  requirePermission(PERMISSIONS.MANAGE_REPORTS),
  asyncHandler(ReportsController.getOne)
);

/**
 * POST /api/v1/reports/:id/resolve — Resolve a report (admin/moderator)
 */
router.post(
  '/:id/resolve',
  authRequired,
  requirePermission(PERMISSIONS.MANAGE_REPORTS),
  asyncHandler(ReportsController.resolve)
);

module.exports = router;
