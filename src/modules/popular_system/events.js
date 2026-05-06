/**
 * Popular System — Integration EventBus
 * Écoute les événements de likes et commentaires pour mettre à jour les scores
 * et invalider le cache Redis
 */

const { PopularService } = require('./service');
const logger = require('../../core/utils/logger');

/**
 * Enregistrer les listeners EventBus
 * À appeler lors de l'initialisation du système
 */
function setupEventListeners(eventBus) {
  if (!eventBus) {
    logger.warn('EventBus not available, popular system cache will not auto-invalidate');
    return;
  }

  // ===== LIKE EVENTS =====
  eventBus.on('like.added', async (data) => {
    try {
      const { postId } = data;
      if (!postId) return;

      logger.debug('Event: like.added', { meta: { postId } });

      // Recalculer le score du post
      await PopularService.recalculatePopularityScore(postId);

      // Invalider le cache pour toutes les ranges (le post est maintenant potentiellement plus populaire)
      await PopularService.invalidatePopularCache();
    } catch (err) {
      logger.error('Error handling like.added event', { meta: { error: err.message } });
    }
  });

  eventBus.on('like.removed', async (data) => {
    try {
      const { postId } = data;
      if (!postId) return;

      logger.debug('Event: like.removed', { meta: { postId } });

      // Recalculer le score du post
      await PopularService.recalculatePopularityScore(postId);

      // Invalider le cache
      await PopularService.invalidatePopularCache();
    } catch (err) {
      logger.error('Error handling like.removed event', { meta: { error: err.message } });
    }
  });

  // ===== COMMENT EVENTS =====
  eventBus.on('comment.created', async (data) => {
    try {
      const { postId } = data;
      if (!postId) return;

      logger.debug('Event: comment.created', { meta: { postId } });

      // Incrémenter comments_count et recalculer le score
      await PopularService.updateCommentsCount(postId, 1);

      // Invalider le cache
      await PopularService.invalidatePopularCache();
    } catch (err) {
      logger.error('Error handling comment.created event', { meta: { error: err.message } });
    }
  });

  eventBus.on('comment.deleted', async (data) => {
    try {
      const { postId } = data;
      if (!postId) return;

      logger.debug('Event: comment.deleted', { meta: { postId } });

      // Décrémenter comments_count et recalculer le score
      await PopularService.updateCommentsCount(postId, -1);

      // Invalider le cache
      await PopularService.invalidatePopularCache();
    } catch (err) {
      logger.error('Error handling comment.deleted event', { meta: { error: err.message } });
    }
  });

  // ===== POST EVENTS =====
  eventBus.on('post.created', async (data) => {
    try {
      const { postId } = data;
      if (!postId) return;

      logger.debug('Event: post.created', { meta: { postId } });

      // Initialiser popularity_score (devrait déjà être 0, mais on s'assure)
      await PopularService.recalculatePopularityScore(postId);

      // Invalider le cache puisqu'un nouveau post est disponible
      await PopularService.invalidatePopularCache();
    } catch (err) {
      logger.error('Error handling post.created event', { meta: { error: err.message } });
    }
  });

  logger.info('Popular System EventBus listeners registered');
}

module.exports = { setupEventListeners };
