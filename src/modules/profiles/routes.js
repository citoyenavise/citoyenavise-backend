/**
 * Routes profils citoyens — version étendue (100% plateforme)
 * Inclut les 7 nouvelles fonctionnalités: Privacy, Reputation, Dynamic Fields, Preferences, Search, Versioning
 */

const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const { authRequired, authOptional } = require('../../core/middleware/auth');
const validateRequest = require('../../middlewares/validateRequest');

const profilesController = require('./controller');
const extendedController = require('./extended.controller');

const {
  privacySchema,
  preferencesSchema,
  dynamicFieldSchema,
  dynamicFieldsUpdateSchema,
  advancedSearchSchema,
  versionsSchema,
} = require('./schema');

const router = express.Router();

// ===== CORE PROFILES ROUTES (existants) =====
// List profiles (public)
router.get('/', authOptional, asyncHandler(profilesController.listProfiles));

// Get profile (public)
router.get('/:id', asyncHandler(profilesController.getProfile));

// Update profile (protected)
router.put('/:id', authRequired, asyncHandler(profilesController.updateProfile));

// Get profile posts (public)
router.get('/:id/posts', asyncHandler(profilesController.getProfilePosts));

// Get followers (public)
router.get('/:id/followers', asyncHandler(profilesController.getFollowers));

// Follow profile (protected)
router.post('/:id/follow', authRequired, asyncHandler(profilesController.followProfile));

// Unfollow profile (protected)
router.delete('/:id/follow', authRequired, asyncHandler(profilesController.unfollowProfile));

// ===== EXTENDED PROFILES ROUTES (nouvelles fonctionnalités) =====

// 1️⃣ PRIVACY / CONFIDENTIALITÉ
router.put('/me/privacy', authRequired, validateRequest(privacySchema), asyncHandler(extendedController.updatePrivacy));
router.get('/me/privacy', authRequired, asyncHandler(extendedController.getPrivacy));

// 2️⃣ PREFERENCES / CONTENU
router.put('/me/preferences', authRequired, validateRequest(preferencesSchema), asyncHandler(extendedController.updatePreferences));
router.get('/me/preferences', authRequired, asyncHandler(extendedController.getPreferences));

// 3️⃣ DYNAMIC FIELDS / CHAMPS PERSONNALISÉS
router.get('/:id/fields', asyncHandler(extendedController.getFields));
router.put('/me/field', authRequired, validateRequest(dynamicFieldSchema), asyncHandler(extendedController.updateField));
router.put('/me/fields', authRequired, validateRequest(dynamicFieldsUpdateSchema), asyncHandler(extendedController.updateFields));
router.delete('/me/field/:fieldKey', authRequired, asyncHandler(extendedController.deleteField));
router.get('/definitions/fields', asyncHandler(extendedController.getFieldDefinitions));

// 4️⃣ REPUTATION & BADGES
router.get('/:id/reputation', asyncHandler(extendedController.getReputation));
router.get('/:id/badges', asyncHandler(extendedController.getBadges));
router.get('/:id/reputation/history', validateRequest(versionsSchema), asyncHandler(extendedController.getReputationHistory));

// 5️⃣ SEARCH AVANCÉE
router.get('/search/advanced', validateRequest(advancedSearchSchema), asyncHandler(extendedController.advancedSearch));
router.get('/search/quick', asyncHandler(extendedController.quickSearch));

// 6️⃣ VERSIONING & AUDIT
router.get('/:id/versions', validateRequest(versionsSchema), asyncHandler(extendedController.getVersionHistory));
router.get('/:id/versions/:fieldName', validateRequest(versionsSchema), asyncHandler(extendedController.getFieldHistory));
router.get('/versions/compare', asyncHandler(extendedController.compareVersions));

module.exports = router;
