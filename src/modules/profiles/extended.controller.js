/**
 * Profiles Extended Controller — Handlers pour les 7 nouvelles fonctionnalités
 */

const { PrivacyService } = require('./privacy.service');
const { ReputationService } = require('./reputation.service');
const { DynamicFieldsService } = require('./dynamicfields.service');
const { PreferencesService } = require('./preferences.service');
const { ProfileSearchService } = require('./search.service');
const { ProfileVersioningService } = require('./versioning.service');
const { AppError } = require('../../core/middleware/errorHandler');

// ===== PRIVACY HANDLERS =====
exports.updatePrivacy = async (req, res, next) => {
  try {
    const result = await PrivacyService.updatePrivacy(req.user.id, req.body);
    res.apiSuccess(result, 'Privacy settings updated');
  } catch (err) {
    next(err);
  }
};

exports.getPrivacy = async (req, res, next) => {
  try {
    const result = await PrivacyService.getPrivacy(req.user.id);
    res.apiSuccess(result);
  } catch (err) {
    next(err);
  }
};

// ===== REPUTATION HANDLERS =====
exports.getReputation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reputation = await ReputationService.getReputation(id);
    const badges = await ReputationService.getBadges(id);

    res.apiSuccess({
      score: reputation,
      badges,
    });
  } catch (err) {
    next(err);
  }
};

exports.getBadges = async (req, res, next) => {
  try {
    const { id } = req.params;
    const badges = await ReputationService.getBadges(id);
    res.apiSuccess(badges);
  } catch (err) {
    next(err);
  }
};

exports.getReputationHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await ReputationService.getReputationEvents(id, limit, offset);
    res.apiSuccess({
      events: result.events,
      pagination: {
        total: result.total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ===== DYNAMIC FIELDS HANDLERS =====
exports.getFields = async (req, res, next) => {
  try {
    const { id } = req.params;
    const viewerId = req.user?.id;
    const fields = await DynamicFieldsService.getFields(id, viewerId);
    res.apiSuccess(fields);
  } catch (err) {
    next(err);
  }
};

exports.updateField = async (req, res, next) => {
  try {
    const { fieldKey, fieldValue, visibility } = req.body;
    const result = await DynamicFieldsService.updateField(req.user.id, fieldKey, fieldValue, visibility);

    // Log la modification
    await ProfileVersioningService.logChange(req.user.id, `field:${fieldKey}`, null, fieldValue, req.user.id);

    res.apiSuccess(result);
  } catch (err) {
    next(err);
  }
};

exports.updateFields = async (req, res, next) => {
  try {
    const { fields } = req.body;
    const result = await DynamicFieldsService.updateFields(req.user.id, fields);

    // Log les modifications
    for (const field of fields) {
      await ProfileVersioningService.logChange(req.user.id, `field:${field.fieldKey}`, null, field.fieldValue, req.user.id);
    }

    res.apiSuccess(result);
  } catch (err) {
    next(err);
  }
};

exports.deleteField = async (req, res, next) => {
  try {
    const { fieldKey } = req.params;
    await DynamicFieldsService.deleteField(req.user.id, fieldKey);

    // Log la suppression
    await ProfileVersioningService.logChange(req.user.id, `field:${fieldKey}`, null, null, req.user.id);

    res.apiSuccess({ message: 'Field deleted' });
  } catch (err) {
    next(err);
  }
};

exports.getFieldDefinitions = async (req, res, next) => {
  try {
    const definitions = await DynamicFieldsService.getFieldDefinitions();
    res.apiSuccess(definitions);
  } catch (err) {
    next(err);
  }
};

// ===== PREFERENCES HANDLERS =====
exports.updatePreferences = async (req, res, next) => {
  try {
    const result = await PreferencesService.updatePreferences(req.user.id, req.body);
    res.apiSuccess(result);
  } catch (err) {
    next(err);
  }
};

exports.getPreferences = async (req, res, next) => {
  try {
    const result = await PreferencesService.getPreferences(req.user.id);
    res.apiSuccess(result);
  } catch (err) {
    next(err);
  }
};

// ===== SEARCH HANDLERS =====
exports.advancedSearch = async (req, res, next) => {
  try {
    const filters = {
      q: req.query.q,
      location: req.query.location,
      badges: req.query.badges,
      reputationMin: req.query.reputationMin ? parseInt(req.query.reputationMin, 10) : 0,
      categories: req.query.categories,
      verifiedOnly: req.query.verifiedOnly === 'true',
      sort: req.query.sort || 'recent',
      page: req.query.page ? parseInt(req.query.page, 10) : 1,
      limit: req.query.limit ? Math.min(parseInt(req.query.limit, 10), 100) : 20,
      viewerId: req.user?.id,
    };

    const result = await ProfileSearchService.advancedSearch(filters);
    res.apiSuccess(result);
  } catch (err) {
    next(err);
  }
};

exports.quickSearch = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      throw new AppError('Query must be at least 2 characters', 400);
    }

    const results = await ProfileSearchService.quickSearch(q);
    res.apiSuccess(results);
  } catch (err) {
    next(err);
  }
};

// ===== VERSIONING HANDLERS =====
exports.getVersionHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await ProfileVersioningService.getVersionHistory(id, limit, offset);
    res.apiSuccess(result);
  } catch (err) {
    next(err);
  }
};

exports.getFieldHistory = async (req, res, next) => {
  try {
    const { id, fieldName } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await ProfileVersioningService.getFieldHistory(id, fieldName, limit, offset);
    res.apiSuccess(result);
  } catch (err) {
    next(err);
  }
};

exports.compareVersions = async (req, res, next) => {
  try {
    const { v1, v2 } = req.query;
    const result = await ProfileVersioningService.compareVersions(v1, v2);
    res.apiSuccess(result);
  } catch (err) {
    next(err);
  }
};
