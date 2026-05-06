const { createInitiativeSchema, updateInitiativeSchema, listInitiativeSchema, closeInitiativeSchema } = require('./schema');
const initiativeService = require('./service');
const AppError = require('../../core/errors');

class InitiativeController {
  async create(req, res, next) {
    try {
      const validated = createInitiativeSchema.safeParse(req.body);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const initiative = await initiativeService.create(validated.data, req.user.userId);
      return res.apiCreated('Initiative created successfully', initiative);
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const validated = listInitiativeSchema.safeParse(req.query);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const result = await initiativeService.list(validated.data);
      return res.apiPaginated('Initiatives retrieved successfully', result.data, result.meta);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const initiative = await initiativeService.getById(req.params.id);
      return res.apiSuccess('Initiative retrieved successfully', initiative);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const validated = updateInitiativeSchema.safeParse(req.body);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const initiative = await initiativeService.update(req.params.id, validated.data, req.user.userId);
      return res.apiUpdated('Initiative updated successfully', initiative);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await initiativeService.delete(req.params.id, req.user.userId);
      return res.apiDeleted('Initiative deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async close(req, res, next) {
    try {
      const validated = closeInitiativeSchema.safeParse(req.body);
      if (!validated.success) {
        throw AppError.validationError('Validation failed', validated.error.flatten().fieldErrors);
      }

      const initiative = await initiativeService.close(req.params.id, req.user.userId, validated.data.status);
      return res.apiUpdated('Initiative closed successfully', initiative);
    } catch (error) {
      next(error);
    }
  }

  async getStats(req, res, next) {
    try {
      const stats = await initiativeService.getStats(req.params.id);
      return res.apiSuccess('Initiative stats retrieved successfully', stats);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InitiativeController();
