/**
 * Ideas Controller — Version standardisée
 * Gestion des idées civiques (créer, lister, liker, popularité)
 */

const { z } = require('zod');
const service = require('./service');
const { AppError, asyncHandler } = require('../../core/middleware/errorHandler');

// Schémas de validation
const createIdeaSchema = z.object({
  title: z.string().min(5).max(255),
  content: z.string().min(20).max(5000),
  category: z.string().min(2).max(50),
});

const listSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
  category: z.string().optional(),
  sort: z.enum(['latest', 'popular', 'trending']).default('latest'),
});

module.exports = {
  /**
   * Lister les idées
   * GET /api/v1/ideas?limit=20&page=1&category=elections&sort=latest
   */
  listIdeas: async (req, res) => {
    const params = listSchema.safeParse(req.query);
    if (!params.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Invalid query parameters',
        params.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const userId = req.user?.userId || null;
    const ideas = await service.listIdeas({
      ...params.data,
      userId,
    });

    if (ideas.data && Array.isArray(ideas.data)) {
      res.apiPaginated(ideas.data, ideas.meta.total, ideas.meta.page, ideas.meta.limit);
    } else {
      res.apiSuccess(ideas);
    }
  },

  /**
   * Obtenir une idée spécifique
   * GET /api/v1/ideas/:id
   */
  getIdea: async (req, res) => {
    const idea = await service.getIdea(req.params.id, req.user?.userId);
    if (!idea) {
      throw new AppError('NOT_FOUND', 404, 'Idea not found');
    }
    res.apiSuccess(idea);
  },

  /**
   * Créer une idée
   * POST /api/v1/ideas
   */
  createIdea: async (req, res) => {
    const validated = createIdeaSchema.safeParse(req.body);
    if (!validated.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Validation failed',
        validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const idea = await service.createIdea({
      ...validated.data,
      userId: req.user.userId,
    });

    res.apiCreated(idea);
  },

  /**
   * Modifier une idée
   * PUT /api/v1/ideas/:id
   */
  updateIdea: async (req, res) => {
    const validated = createIdeaSchema.partial().safeParse(req.body);
    if (!validated.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        422,
        'Validation failed',
        validated.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }))
      );
    }

    const idea = await service.updateIdea(req.params.id, validated.data, req.user.userId);
    if (!idea) {
      throw new AppError('NOT_FOUND', 404, 'Idea not found');
    }

    res.apiUpdated(idea);
  },

  /**
   * Supprimer une idée
   * DELETE /api/v1/ideas/:id
   */
  deleteIdea: async (req, res) => {
    await service.deleteIdea(req.params.id, req.user.userId);
    res.apiDeleted(req.params.id);
  },

  /**
   * Liker une idée
   * POST /api/v1/ideas/:id/like
   */
  likeIdea: async (req, res) => {
    const idea = await service.likeIdea(req.params.id, req.user.userId);
    res.apiCreated({ liked: true, idea });
  },

  /**
   * Retirer un like
   * DELETE /api/v1/ideas/:id/like
   */
  unlikeIdea: async (req, res) => {
    const idea = await service.unlikeIdea(req.params.id, req.userId);
    res.json(idea);
  },

  /**
   * Idées populaires
   * GET /api/v1/ideas/popular?limit=10&category=elections
   */
  getPopularIdeas: async (req, res) => {
    const { limit = 10, category } = req.query;

    const ideas = await service.getPopularIdeas({
      limit: Math.min(parseInt(limit), 50),
      category: category || null,
    });

    res.json(ideas);
  },
};
