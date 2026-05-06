/**
 * Profiles Extended Routes — Routes pour les 7 nouvelles fonctionnalités
 */

const express = require('express');
const router = express.Router();

const auth = require('../../middlewares/auth');
const validateRequest = require('../../middlewares/validateRequest');

const {
  privacySchema,
  preferencesSchema,
  dynamicFieldSchema,
  dynamicFieldsUpdateSchema,
  advancedSearchSchema,
  versionsSchema,
} = require('./schema');

const controller = require('./extended.controller');

// ===== PRIVACY ROUTES =====
router.put('/me/privacy', auth, validateRequest(privacySchema), controller.updatePrivacy);
router.get('/me/privacy', auth, controller.getPrivacy);

// ===== PREFERENCES ROUTES =====
router.put('/me/preferences', auth, validateRequest(preferencesSchema), controller.updatePreferences);
router.get('/me/preferences', auth, controller.getPreferences);

// ===== DYNAMIC FIELDS ROUTES =====
router.get('/:id/fields', controller.getFields);
router.put('/me/field', auth, validateRequest(dynamicFieldSchema), controller.updateField);
router.put('/me/fields', auth, validateRequest(dynamicFieldsUpdateSchema), controller.updateFields);
router.delete('/me/field/:fieldKey', auth, controller.deleteField);
router.get('/definitions/fields', controller.getFieldDefinitions);

// ===== REPUTATION & BADGES ROUTES =====
router.get('/:id/reputation', controller.getReputation);
router.get('/:id/badges', controller.getBadges);
router.get('/:id/reputation/history', validateRequest(versionsSchema), controller.getReputationHistory);

// ===== SEARCH ROUTES =====
router.get('/search/advanced', validateRequest(advancedSearchSchema), controller.advancedSearch);
router.get('/search/quick', controller.quickSearch);

// ===== VERSIONING & AUDIT ROUTES =====
router.get('/:id/versions', validateRequest(versionsSchema), controller.getVersionHistory);
router.get('/:id/versions/:fieldName', validateRequest(versionsSchema), controller.getFieldHistory);
router.get('/versions/compare', controller.compareVersions);

module.exports = router;
