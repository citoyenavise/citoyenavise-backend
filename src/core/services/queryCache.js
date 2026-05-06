/**
 * Query Cache Service — Caching des resultats de requêtes
 * Réduit les requêtes DB répétitives (N+1 queries)
 */

const cache = require('./cache');
const logger = require('../utils/logger');

class QueryCacheService {
  constructor() {
    this.defaultTTL = 5 * 60;  // 5 minutes default
    this.cacheKey = 'query';
  }

  /**
   * Générer clé unique pour une requête
   * @param {string} query - SQL query
   * @param {array} params - Query parameters
   * @param {string} scope - Optional scope (user-specific cache)
   */
  _generateKey(query, params = [], scope = null) {
    // Hash simple: first 50 chars + params count
    const queryHash = query.substring(0, 50).replace(/\s+/g, ' ');
    const paramHash = params.length > 0
      ? Buffer.from(JSON.stringify(params)).toString('base64').substring(0, 20)
      : 'noparams';

    const scopeKey = scope ? `:${scope}` : '';
    return cache.key(this.cacheKey, queryHash, paramHash) + scopeKey;
  }

  /**
   * Récupérer resultats cachés d'une requête
   * @param {string} query - SQL query
   * @param {array} params - Parameters
   * @param {string} scope - Optional scope
   */
  async getQueryResult(query, params = [], scope = null) {
    if (!cache.isConnected) return null;

    try {
      const key = this._generateKey(query, params, scope);
      const cached = await cache.get(key);

      if (cached) {
        logger.debug('Query cache HIT', {
          meta: { query: query.substring(0, 50), scope }
        });
      }

      return cached;
    } catch (err) {
      logger.error('Query cache get error', { meta: { error: err.message } });
      return null;
    }
  }

  /**
   * Sauvegarder resultats en cache
   * @param {string} query - SQL query
   * @param {array} params - Parameters
   * @param {object} result - Query result from DB
   * @param {number} ttl - TTL en secondes (optional)
   * @param {string} scope - Optional scope
   */
  async setQueryResult(query, params = [], result, ttl = null, scope = null) {
    if (!cache.isConnected) return false;

    try {
      const key = this._generateKey(query, params, scope);
      const cacheTTL = ttl || this.defaultTTL;

      await cache.set(key, result, cacheTTL);

      logger.debug('Query cache SET', {
        meta: {
          query: query.substring(0, 50),
          ttl: cacheTTL,
          scope
        }
      });

      return true;
    } catch (err) {
      logger.error('Query cache set error', { meta: { error: err.message } });
      return false;
    }
  }

  /**
   * Invalider cache pour une requête
   * @param {string} query
   * @param {array} params
   * @param {string} scope
   */
  async invalidateQuery(query, params = [], scope = null) {
    if (!cache.isConnected) return false;

    try {
      const key = this._generateKey(query, params, scope);
      await cache.del(key);

      logger.debug('Query cache INVALIDATE', {
        meta: { query: query.substring(0, 50) }
      });

      return true;
    } catch (err) {
      logger.error('Query cache invalidate error', { meta: { error: err.message } });
      return false;
    }
  }

  /**
   * Invalider toutes les requêtes d'un scope (ex: user:123)
   * Pattern-based invalidation
   */
  async invalidateScope(scope) {
    if (!cache.isConnected || !scope) return 0;

    try {
      const pattern = cache.key(this.cacheKey, '*') + `:${scope}`;
      const invalidated = await cache.invalidatePattern(pattern);

      logger.debug('Query cache invalidate scope', {
        meta: { scope, count: invalidated }
      });

      return invalidated;
    } catch (err) {
      logger.error('Query cache invalidate scope error', { meta: { error: err.message } });
      return 0;
    }
  }

  /**
   * Invalider tous les caches de requêtes (flush complet)
   */
  async invalidateAll() {
    if (!cache.isConnected) return false;

    try {
      const pattern = cache.key(this.cacheKey, '*');
      await cache.invalidatePattern(pattern);

      logger.info('Query cache ALL invalidated');
      return true;
    } catch (err) {
      logger.error('Query cache invalidate all error', { meta: { error: err.message } });
      return false;
    }
  }
}

// Singleton
const queryCache = new QueryCacheService();

module.exports = queryCache;
