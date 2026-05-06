const { query } = require('../../core/services/database');
const cache = require('../../core/services/cache');
const AppError = require('../../core/errors');
const logger = require('../../core/utils/logger');

const RANGE = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
  'all': 3650,
};

class AnalyticsService {
  async track({ type, targetId, metadata }) {
    try {
      const result = await query(
        `INSERT INTO analytics_events (type, target_id, metadata, created_at)
         VALUES ($1, $2, $3, NOW())
         RETURNING *`,
        [type, targetId || null, metadata ? JSON.stringify(metadata) : null]
      );

      if (!result.rows[0]) {
        throw AppError.databaseError('Failed to track event');
      }

      // Invalidate cache
      try {
        await this.invalidateCache();
      } catch (err) {
        logger.warn('Failed to invalidate analytics cache', { meta: { error: err.message } });
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('AnalyticsService.track error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to track event');
    }
  }

  async getStats(range) {
    try {
      const cacheKey = `analytics:${range}`;

      // Try cache first
      try {
        const cached = await cache.get(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (err) {
        logger.warn('Failed to get cached analytics', { meta: { error: err.message } });
      }

      // Calculate since date
      const days = RANGE[range] || 7;
      const since = new Date(Date.now() - days * 86400000);

      // Get all stats in parallel
      const [viewsResult, searchesResult, initiativesResult, videosResult, articlesResult] = await Promise.all([
        query(
          `SELECT COUNT(*) as count FROM analytics_events
           WHERE type = $1 AND created_at >= $2`,
          ['view', since.toISOString()]
        ),
        query(
          `SELECT COUNT(*) as count FROM analytics_events
           WHERE type = $1 AND created_at >= $2`,
          ['search', since.toISOString()]
        ),
        query(
          `SELECT COUNT(*) as count FROM analytics_events
           WHERE type = $1 AND created_at >= $2`,
          ['initiative_view', since.toISOString()]
        ),
        query(
          `SELECT COUNT(*) as count FROM analytics_events
           WHERE type = $1 AND created_at >= $2`,
          ['video_view', since.toISOString()]
        ),
        query(
          `SELECT COUNT(*) as count FROM analytics_events
           WHERE type = $1 AND created_at >= $2`,
          ['article_view', since.toISOString()]
        ),
      ]);

      const result = {
        views: parseInt(viewsResult.rows[0].count, 10),
        searches: parseInt(searchesResult.rows[0].count, 10),
        initiatives: parseInt(initiativesResult.rows[0].count, 10),
        videos: parseInt(videosResult.rows[0].count, 10),
        articles: parseInt(articlesResult.rows[0].count, 10),
      };

      // Cache result (60 seconds TTL)
      try {
        await cache.set(cacheKey, result, 60);
      } catch (err) {
        logger.warn('Failed to cache analytics', { meta: { error: err.message } });
      }

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('AnalyticsService.getStats error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to fetch analytics');
    }
  }

  async invalidateCache() {
    try {
      await cache.invalidatePattern('analytics:*');
    } catch (error) {
      logger.warn('Failed to invalidate analytics cache', { meta: { error: error.message } });
    }
  }

  async getOptimizationReport() {
    try {
      const problems = [];

      // Check signup problems
      const signupProblems = await this.getSignupProblems();
      problems.push(...signupProblems);

      // Check idea creation problems
      const ideaProblems = await this.getIdeaCreationProblems();
      problems.push(...ideaProblems);

      // Check interaction problems
      const interactionProblems = await this.getInteractionProblems();
      problems.push(...interactionProblems);

      // Check map problems
      const mapProblems = await this.getMapProblems();
      problems.push(...mapProblems);

      // Sort by severity
      const sorted = problems.sort((a, b) => {
        const order = { CRITICAL: 0, IMPORTANT: 1, MINOR: 2 };
        return order[a.severity] - order[b.severity];
      });

      return {
        problems: sorted,
        summary: {
          critical: sorted.filter((p) => p.severity === 'CRITICAL'),
          important: sorted.filter((p) => p.severity === 'IMPORTANT'),
          minor: sorted.filter((p) => p.severity === 'MINOR'),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('getOptimizationReport error', { meta: { error: error.message } });
      throw AppError.databaseError('Failed to generate optimization report');
    }
  }

  async getSignupProblems() {
    try {
      const totalStart = await this.countEvents('SIGNUP_START');
      const totalSuccess = await this.countEvents('SIGNUP_SUCCESS');
      const totalError = await this.countEvents('SIGNUP_ERROR');

      if (totalStart === 0) return [];

      const successRate = totalSuccess / totalStart;
      const errorRate = totalError / totalStart;
      const problems = [];

      if (successRate < 0.4) {
        problems.push({
          id: 'signup-flow-blocking',
          area: 'SIGNUP',
          label: 'Inscription bloque une majorité d\'utilisateurs',
          severity: 'CRITICAL',
          evidence: { totalStart, totalSuccess, successRate },
          suggestion: 'Réduire le nombre de champs, simplifier le formulaire.',
          impact: 'Augmente le nombre d\'utilisateurs actifs.',
        });
      } else if (successRate < 0.7) {
        problems.push({
          id: 'signup-flow-friction',
          area: 'SIGNUP',
          label: 'Inscription crée une friction notable',
          severity: 'IMPORTANT',
          evidence: { totalStart, totalSuccess, successRate },
          suggestion: 'Clarifier les labels et messages d\'erreur.',
          impact: 'Réduit l\'abandon au moment clé d\'entrée.',
        });
      }

      if (errorRate > 0.2) {
        problems.push({
          id: 'signup-errors-high',
          area: 'SIGNUP',
          label: 'Taux d\'erreurs élevé lors de l\'inscription',
          severity: 'IMPORTANT',
          evidence: { totalStart, totalError, errorRate },
          suggestion: 'Afficher des messages d\'erreur explicites.',
          impact: 'Diminue la frustration et les abandons.',
        });
      }

      return problems;
    } catch (error) {
      logger.warn('getSignupProblems error', { meta: { error: error.message } });
      return [];
    }
  }

  async getIdeaCreationProblems() {
    try {
      const openCount = await this.countEvents('IDEA_CREATE_OPEN');
      const submitCount = await this.countEvents('IDEA_CREATE_SUBMIT');
      const errorCount = await this.countEvents('IDEA_CREATE_ERROR');

      if (openCount === 0) return [];

      const completionRate = submitCount / openCount;
      const errorRate = errorCount / openCount;
      const problems = [];

      if (completionRate < 0.3) {
        problems.push({
          id: 'idea-creation-blocking',
          area: 'IDEA_CREATION',
          label: 'Création d\'idée trop difficile ou incomprise',
          severity: 'CRITICAL',
          evidence: { openCount, submitCount, completionRate },
          suggestion: 'Ajouter un placeholder clair, un exemple d\'idée.',
          impact: 'Augmente directement le volume d\'idées créées.',
        });
      } else if (completionRate < 0.6) {
        problems.push({
          id: 'idea-creation-friction',
          area: 'IDEA_CREATION',
          label: 'Friction notable dans la création d\'idée',
          severity: 'IMPORTANT',
          evidence: { openCount, submitCount, completionRate },
          suggestion: 'Réorganiser les champs, ajouter une barre de progression.',
          impact: 'Fluidifie l\'action principale.',
        });
      }

      if (errorRate > 0.15) {
        problems.push({
          id: 'idea-creation-errors',
          area: 'IDEA_CREATION',
          label: 'Beaucoup d\'erreurs lors de la création d\'idée',
          severity: 'IMPORTANT',
          evidence: { openCount, errorCount, errorRate },
          suggestion: 'Afficher les erreurs au plus près des champs.',
          impact: 'Réduit les abandons au moment de publier.',
        });
      }

      return problems;
    } catch (error) {
      logger.warn('getIdeaCreationProblems error', { meta: { error: error.message } });
      return [];
    }
  }

  async getInteractionProblems() {
    try {
      const likeCount = await this.countEvents('LIKE_CLICK');

      if (likeCount === 0) {
        return [{
          id: 'no-likes',
          area: 'INTERACTION',
          label: 'Les utilisateurs n\'interagissent pas (aucun like)',
          severity: 'IMPORTANT',
          evidence: { likeCount },
          suggestion: 'Rendre le bouton de soutien plus visible.',
          impact: 'Crée un signal social minimal.',
        }];
      }

      return [];
    } catch (error) {
      logger.warn('getInteractionProblems error', { meta: { error: error.message } });
      return [];
    }
  }

  async getMapProblems() {
    try {
      const openCount = await this.countEvents('MAP_OPEN');
      const interactionCount = await this.countEvents('MAP_INTERACTION');

      if (openCount === 0) {
        return [{
          id: 'map-not-used',
          area: 'MAP',
          label: 'La carte n\'est quasiment jamais ouverte',
          severity: 'IMPORTANT',
          evidence: { openCount },
          suggestion: 'Déplacer la carte derrière un onglet.',
          impact: 'Évite de sur-optimiser une feature non utilisée.',
        }];
      }

      const interactionRate = interactionCount / openCount;
      if (interactionRate < 0.3) {
        return [{
          id: 'map-not-understood',
          area: 'MAP',
          label: 'La carte est ouverte mais peu utilisée',
          severity: 'IMPORTANT',
          evidence: { openCount, interactionCount, interactionRate },
          suggestion: 'Ajouter un texte explicatif sur la carte.',
          impact: 'Transforme une vue passive en outil utile.',
        }];
      }

      return [];
    } catch (error) {
      logger.warn('getMapProblems error', { meta: { error: error.message } });
      return [];
    }
  }

  async countEvents(type) {
    try {
      const result = await query(
        `SELECT COUNT(*) as count FROM analytics_events WHERE type = $1`,
        [type]
      );
      return parseInt(result.rows[0]?.count || 0, 10);
    } catch (error) {
      logger.warn(`countEvents error for type ${type}`, { meta: { error: error.message } });
      return 0;
    }
  }
}

module.exports = new AnalyticsService();
