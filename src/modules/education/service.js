/**
 * Education Service - Coordonne les contenus pédagogiques
 * (vidéos, articles, quiz)
 */

const { query } = require('../../core/services/database');
const cache = require('../../core/services/cache');
const AppError = require('../../core/errors');
const logger = require('../../core/utils/logger');

class EducationService {
  /**
   * Récupérer les statistiques du module education
   */
  async getModuleStats() {
    try {
      const cacheKey = 'education:stats';
      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const articlesCount = await query(
        'SELECT COUNT(*) as count FROM education_articles WHERE deleted_at IS NULL'
      );
      const videosCount = await query(
        'SELECT COUNT(*) as count FROM education_videos WHERE deleted_at IS NULL'
      );
      const quizCount = await query(
        'SELECT COUNT(*) as count FROM education_quiz WHERE deleted_at IS NULL'
      );

      const stats = {
        articles: Number(articlesCount.rows[0]?.count || 0),
        videos: Number(videosCount.rows[0]?.count || 0),
        quiz: Number(quizCount.rows[0]?.count || 0),
        totalContent:
          Number(articlesCount.rows[0]?.count || 0) +
          Number(videosCount.rows[0]?.count || 0) +
          Number(quizCount.rows[0]?.count || 0),
        lastUpdated: new Date().toISOString(),
      };

      await cache.set(cacheKey, stats, 3600);
      return stats;
    } catch (error) {
      logger.error('EducationService.getModuleStats error', {
        meta: { error: error.message },
      });
      throw AppError.databaseError('Failed to fetch education stats');
    }
  }

  /**
   * Vérifier la santé du module
   */
  async healthCheck() {
    try {
      const result = await query(
        'SELECT COUNT(*) as count FROM education_articles LIMIT 1'
      );
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('EducationService.healthCheck error', {
        meta: { error: error.message },
      });
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = new EducationService();
