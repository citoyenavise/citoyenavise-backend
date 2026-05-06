/**
 * Analytics Dashboards Routes
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../../middlewares/adminAuth');
const { PERMISSIONS } = require('../admin/permissions');
const { AnalyticsDashboardsController } = require('./dashboards.controller');

// All dashboard endpoints require VIEW_STATS permission
router.use(requirePermission(PERMISSIONS.VIEW_STATS));

router.get('/heatmap', AnalyticsDashboardsController.getHourlyHeatmap);
router.get('/top-content', AnalyticsDashboardsController.getTopContent);
router.get('/quiz-completion', AnalyticsDashboardsController.getQuizCompletionStats);
router.get('/trends', AnalyticsDashboardsController.getTrends);
router.get('/export', AnalyticsDashboardsController.exportCsv);

module.exports = router;
