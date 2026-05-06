/**
 * Controller Videos - Gestion des requêtes HTTP
 */

const VideoService = require('./service');
const { AppError } = require('../../../core/middleware/errorHandler');

class VideoController {
  /**
   * POST /education/videos
   * Créer une vidéo
   */
  static async create(req, res) {
    // Les données validées sont dans req.validated (via middleware validateRequest)
    const video = await VideoService.createVideo(req.validated, req.user.userId);
    res.apiCreated(video);
  }

  /**
   * GET /education/videos
   * Lister les vidéos avec pagination et filtres
   */
  static async list(req, res) {
    // Récupérer les filtres depuis req.query
    const filters = {
      page: req.query.page ? parseInt(req.query.page, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 20,
      q: req.query.q || null,
      category: req.query.category || null,
      sort: req.query.sort || 'latest',
    };

    // Appeler le service
    const result = await VideoService.getVideos(filters);

    // Répondre via helper API
    res.apiSuccess({
      items: result.items,
      pagination: result.pagination,
    });
  }

  /**
   * GET /education/videos/:id
   * Récupérer une vidéo par ID
   */
  static async getOne(req, res) {
    const { id } = req.params;

    // Appeler le service
    const video = await VideoService.getVideoById(id);

    // Gérer l'erreur
    if (!video) {
      throw AppError.notFound('Video not found');
    }

    // Répondre via helper API
    res.apiSuccess(video);
  }

  /**
   * PUT /education/videos/:id
   * Mettre à jour une vidéo
   */
  static async update(req, res) {
    const { id } = req.params;

    // Les données validées sont dans req.validated (via middleware validateRequest)
    const updatedVideo = await VideoService.updateVideo(id, req.validated, req.user.userId);

    // Répondre via helper API
    res.apiSuccess(updatedVideo);
  }

  /**
   * DELETE /education/videos/:id
   * Supprimer une vidéo
   */
  static async remove(req, res) {
    const { id } = req.params;

    // Appeler le service (AppError est jeté si non autorisé)
    await VideoService.deleteVideo(id, req.user.userId);

    // Répondre via helper API
    res.apiSuccess({ message: 'Video deleted' });
  }
}

module.exports = VideoController;
