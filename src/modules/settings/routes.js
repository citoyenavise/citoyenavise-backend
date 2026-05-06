/**
 * Settings Routes
 */

const express = require('express');
const router = express.Router();

const { requirePermission } = require('../../middlewares/adminAuth');
const { PERMISSIONS } = require('../admin/permissions');
const SettingsController = require('./controller');

// All settings endpoints require EDIT_SETTINGS permission
router.use(requirePermission(PERMISSIONS.EDIT_SETTINGS));

router.get('/', SettingsController.getAll);
router.get('/:key', SettingsController.getSingle);
router.put('/:key', SettingsController.update);

module.exports = router;
