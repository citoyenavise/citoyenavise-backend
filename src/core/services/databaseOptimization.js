/**
 * Database Optimization Service
 * - Connection pool warming
 * - Index strategy + audit
 * - Performance tuning
 */

const logger = require('../utils/logger');
const { pool, query } = require('./database');

class DatabaseOptimizationService {
  /**
   * Warm up connection pool at startup
   * Pré-crée min connections pour éviter latency au démarrage
   */
  async warmupPool() {
    try {
      const minConnections = 3;  // Créer au moins 3 connections
      const connections = [];

      logger.info('Database: Warming up connection pool...', {
        meta: { minConnections }
      });

      for (let i = 0; i < minConnections; i++) {
        try {
          const client = await pool.connect();
          connections.push(client);
          logger.debug(`Database: Pool connection ${i + 1}/${minConnections} created`);
        } catch (err) {
          logger.warn(`Database: Failed to create connection ${i + 1}`, {
            meta: { error: err.message }
          });
        }
      }

      // Relâcher les connections (elles retournent au pool)
      connections.forEach(client => client.release());

      logger.info('Database: Pool warmup complete', {
        meta: { createdConnections: connections.length }
      });

      return connections.length > 0;
    } catch (err) {
      logger.error('Database: Pool warmup error', { meta: { error: err.message } });
      return false;
    }
  }

  /**
   * Audit des indexes existants
   * Retourne list d'indexes + taille + utilisation
   */
  async auditIndexes() {
    try {
      const result = await query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          indexdef,
          idx_scan as scan_count,
          idx_tup_read as tuples_read,
          idx_tup_fetch as tuples_fetched
        FROM pg_indexes
        NATURAL JOIN pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY idx_scan DESC
      `);

      logger.info('Database: Index audit complete', {
        meta: { indexCount: result.rows.length }
      });

      return result.rows;
    } catch (err) {
      logger.error('Database: Index audit error', { meta: { error: err.message } });
      return [];
    }
  }

  /**
   * Identifier les indexes inutilisés
   */
  async findUnusedIndexes() {
    try {
      const result = await query(`
        SELECT
          schemaname,
          tablename,
          indexname,
          idx_scan
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
          AND idx_scan = 0
          AND indexname NOT LIKE 'pg_toast%'
        ORDER BY pg_relation_size(indexrelid) DESC
      `);

      logger.warn('Database: Unused indexes found', {
        meta: { count: result.rows.length }
      });

      return result.rows;
    } catch (err) {
      logger.error('Database: Find unused indexes error', { meta: { error: err.message } });
      return [];
    }
  }

  /**
   * Identifier les tables sans indexes (sauf petites)
   */
  async findMissingIndexes() {
    try {
      const result = await query(`
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables
        WHERE schemaname = 'public'
          AND NOT EXISTS (
            SELECT 1
            FROM pg_indexes
            WHERE pg_indexes.schemaname = pg_tables.schemaname
              AND pg_indexes.tablename = pg_tables.tablename
          )
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `);

      logger.warn('Database: Tables without indexes', {
        meta: { count: result.rows.length }
      });

      return result.rows;
    } catch (err) {
      logger.error('Database: Find missing indexes error', { meta: { error: err.message } });
      return [];
    }
  }

  /**
   * Analyser table bloat + dead tuples
   */
  async analyzeBloat() {
    try {
      const result = await query(`
        SELECT
          schemaname,
          tablename,
          round(100 * live_tuples / (live_tuples + dead_tuples), 2) as live_ratio,
          live_tuples,
          dead_tuples,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_stat_user_tables
        WHERE schemaname = 'public'
          AND (live_tuples + dead_tuples) > 0
        ORDER BY dead_tuples DESC
        LIMIT 10
      `);

      logger.info('Database: Bloat analysis', {
        meta: { tablesAnalyzed: result.rows.length }
      });

      return result.rows;
    } catch (err) {
      logger.error('Database: Bloat analysis error', { meta: { error: err.message } });
      return [];
    }
  }

  /**
   * Vacuum + Analyze recommandés
   */
  async recommendVacuum() {
    try {
      const bloat = await this.analyzeBloat();
      const recommendations = [];

      bloat.forEach(table => {
        if (table.live_ratio < 80) {
          recommendations.push({
            table: `${table.schemaname}.${table.tablename}`,
            deadTuples: table.dead_tuples,
            action: 'VACUUM ANALYZE',
            reason: `Low live ratio: ${table.live_ratio}%`,
          });
        }
      });

      if (recommendations.length > 0) {
        logger.warn('Database: Vacuum recommended', {
          meta: { count: recommendations.length, tables: recommendations }
        });
      }

      return recommendations;
    } catch (err) {
      logger.error('Database: Recommend vacuum error', { meta: { error: err.message } });
      return [];
    }
  }

  /**
   * Index strategy recommendations
   */
  getIndexStrategy() {
    return {
      description: 'Database Index Strategy for Citoyen Avisé',
      principles: [
        'Index les colonnes utilisées en WHERE clauses',
        'Index les colonnes utilisées en JOIN ON',
        'Index les colonnes utilisées en ORDER BY (si queries lentes)',
        'Éviter indexes sur petites tables',
        'Compound indexes si queries multiples colonnes',
      ],
      recommendations: [
        {
          table: 'users',
          indexes: [
            'email (UNIQUE)',
            'deleted_at (WHERE deleted_at IS NULL)',
          ]
        },
        {
          table: 'profiles',
          indexes: [
            'user_id (UNIQUE)',
            'province',
          ]
        },
        {
          table: 'posts',
          indexes: [
            'user_id',
            'category',
            'status',
            'created_at DESC',
            'deleted_at (WHERE deleted_at IS NULL)',
            'Compound: (user_id, created_at DESC)',
          ]
        },
        {
          table: 'likes',
          indexes: [
            'user_id',
            'post_id',
            'Compound UNIQUE: (user_id, post_id)',
          ]
        },
        {
          table: 'follows',
          indexes: [
            'follower_id',
            'following_id',
            'Compound UNIQUE: (follower_id, following_id)',
          ]
        },
        {
          table: 'map_nodes',
          indexes: [
            'profile_id (UNIQUE)',
            'province',
            'SPATIAL: geom (PostGIS)',
          ]
        },
      ],
      maintenanceSchedule: {
        daily: ['VACUUM ANALYZE (autovacuum handles)',],
        weekly: ['ANALYZE pour stats',],
        monthly: ['Full VACUUM si bloat > 20%',],
      }
    };
  }
}

// Singleton
const dbOptimization = new DatabaseOptimizationService();

module.exports = dbOptimization;
