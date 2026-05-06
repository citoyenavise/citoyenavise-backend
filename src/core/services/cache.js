/**
 * Cache Service — Redis avec fallback mémoire automatique
 * Gère le caching distribué, jamais bloquant
 * - Redis si disponible
 * - Fallback mémoire (Map) si Redis absent
 * - Tous les appels non-blocking avec try/catch
 */

const redis = require('redis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    // Fallback mémoire: Map avec TTL via setTimeout
    this.memoryStore = new Map();
    this.memoryTimers = new Map();
    this.ttls = {
      // Temps en secondes
      POPULAR_IDEAS: 10 * 60,      // 10 minutes
      POPULAR_POSTS: 10 * 60,       // 10 minutes
      TRENDING_POSTS: 1 * 60,        // 1 minute (données fraîches)
      HOMEPAGE_DATA: 5 * 60,         // 5 minutes
      USER_PROFILE: 30 * 60,         // 30 minutes
      GLOBAL_STATS: 60 * 60,         // 1 heure
    };
  }

  /**
   * Initialiser la connexion Redis
   * Ne jamais bloquer le démarrage si Redis absent
   */
  async connect() {
    try {
      if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
        logger.info('Redis non configuré — cache mémoire activé');
        this.isConnected = false;
        return;
      }

      const redisUrl = process.env.REDIS_URL ||
                       `redis://${process.env.REDIS_USER || 'default'}:${process.env.REDIS_PASSWORD || ''}@${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

      this.client = redis.createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 500),
          connectTimeout: 3000,
        },
      });

      this.client.on('error', (err) => {
        logger.warn('Redis connection error — using memory cache', { meta: { error: err.message } });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('✅ Redis connected');
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (err) {
      logger.info('Redis unavailable — using memory cache', { meta: { error: err.message } });
      this.isConnected = false;
    }
  }

  /**
   * Récupérer une clé (Redis ou mémoire)
   * Jamais bloquant: try/catch enveloppe tout
   */
  async get(key) {
    try {
      // Essayer Redis d'abord
      if (this.isConnected && this.client) {
        try {
          const value = await Promise.race([
            this.client.get(key),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
          ]);
          if (value) {
            logger.debug(`Cache HIT (Redis): ${key}`);
            return JSON.parse(value);
          }
          logger.debug(`Cache MISS (Redis): ${key}`);
          return null;
        } catch (redisErr) {
          // Redis failed, continue à la mémoire
          logger.debug(`Cache get Redis failed: ${redisErr.message}`);
        }
      }

      // Fallback mémoire
      if (this.memoryStore.has(key)) {
        logger.debug(`Cache HIT (Memory): ${key}`);
        return this.memoryStore.get(key);
      }

      logger.debug(`Cache MISS (Memory): ${key}`);
      return null;
    } catch (err) {
      logger.warn('Cache get error', { meta: { key, error: err.message } });
      return null;
    }
  }

  /**
   * Sauvegarder une clé avec TTL (Redis + mémoire)
   */
  async set(key, value, ttl = null) {
    try {
      const ttlSeconds = ttl || this.ttls.HOMEPAGE_DATA;
      const serialized = JSON.stringify(value);

      // Redis
      if (this.isConnected && this.client) {
        try {
          await Promise.race([
            this.client.setEx(key, ttlSeconds, serialized),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
          ]);
          logger.debug(`Cache SET (Redis): ${key} (TTL: ${ttlSeconds}s)`);
        } catch (redisErr) {
          logger.debug(`Cache set Redis failed: ${redisErr.message}`);
        }
      }

      // Mémoire (always, as backup)
      this.memoryStore.set(key, value);
      logger.debug(`Cache SET (Memory): ${key} (TTL: ${ttlSeconds}s)`);

      // Planifier l'expiration mémoire
      if (this.memoryTimers.has(key)) {
        clearTimeout(this.memoryTimers.get(key));
      }

      const timer = setTimeout(() => {
        this.memoryStore.delete(key);
        this.memoryTimers.delete(key);
        logger.debug(`Cache EXPIRED: ${key}`);
      }, ttlSeconds * 1000);

      this.memoryTimers.set(key, timer);
      return true;
    } catch (err) {
      logger.warn('Cache set error', { meta: { key, error: err.message } });
      return false;
    }
  }

  /**
   * Supprimer une clé (Redis + mémoire)
   */
  async del(key) {
    try {
      // Redis
      if (this.isConnected && this.client) {
        try {
          await Promise.race([
            this.client.del(key),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
          ]);
          logger.debug(`Cache DEL (Redis): ${key}`);
        } catch (redisErr) {
          logger.debug(`Cache del Redis failed: ${redisErr.message}`);
        }
      }

      // Mémoire
      if (this.memoryStore.has(key)) {
        this.memoryStore.delete(key);
        logger.debug(`Cache DEL (Memory): ${key}`);
      }

      if (this.memoryTimers.has(key)) {
        clearTimeout(this.memoryTimers.get(key));
        this.memoryTimers.delete(key);
      }

      return true;
    } catch (err) {
      logger.warn('Cache del error', { meta: { key, error: err.message } });
      return false;
    }
  }

  /**
   * Invalider un pattern (Redis SCAN + mémoire Map)
   * Pattern: "popular:*", "user:123:*", etc.
   */
  async invalidatePattern(pattern) {
    let deletedCount = 0;

    try {
      // Redis SCAN (non-blocking)
      if (this.isConnected && this.client) {
        try {
          const keysToDelete = [];
          let cursor = '0';

          do {
            const result = await Promise.race([
              this.client.scan(parseInt(cursor), { MATCH: pattern, COUNT: 100 }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
            ]);

            cursor = result.cursor;

            if (result.keys && result.keys.length > 0) {
              keysToDelete.push(...result.keys);
            }
          } while (cursor !== '0');

          // Batch delete
          if (keysToDelete.length > 0) {
            const chunkSize = 100;
            for (let i = 0; i < keysToDelete.length; i += chunkSize) {
              const chunk = keysToDelete.slice(i, i + chunkSize);
              await Promise.race([
                this.client.del(chunk),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
              ]);
            }
            deletedCount += keysToDelete.length;
            logger.debug(`Cache INVALIDATE (Redis): ${pattern} (${keysToDelete.length} keys)`);
          }
        } catch (redisErr) {
          logger.debug(`Cache invalidate Redis failed: ${redisErr.message}`);
        }
      }

      // Mémoire: regex pattern matching
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      for (const key of this.memoryStore.keys()) {
        if (regex.test(key)) {
          this.memoryStore.delete(key);
          if (this.memoryTimers.has(key)) {
            clearTimeout(this.memoryTimers.get(key));
            this.memoryTimers.delete(key);
          }
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.debug(`Cache INVALIDATE (Memory): ${pattern} (${deletedCount} keys)`);
      }

      return deletedCount;
    } catch (err) {
      logger.warn('Cache invalidatePattern error', { meta: { pattern, error: err.message } });
      return deletedCount;
    }
  }

  /**
   * Vider tout le cache (Redis + mémoire)
   */
  async flush() {
    try {
      // Redis
      if (this.isConnected && this.client) {
        try {
          await Promise.race([
            this.client.flushDb(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
          ]);
          logger.info('Cache flushed (Redis)');
        } catch (redisErr) {
          logger.debug(`Cache flush Redis failed: ${redisErr.message}`);
        }
      }

      // Mémoire
      for (const timer of this.memoryTimers.values()) {
        clearTimeout(timer);
      }
      this.memoryStore.clear();
      this.memoryTimers.clear();
      logger.info('Cache flushed (Memory)');

      return true;
    } catch (err) {
      logger.warn('Cache flush error', { meta: { error: err.message } });
      return false;
    }
  }

  /**
   * Fermer les connexions proprement
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.quit();
        logger.info('Redis disconnected');
      }

      for (const timer of this.memoryTimers.values()) {
        clearTimeout(timer);
      }
      this.memoryStore.clear();
      this.memoryTimers.clear();

      this.isConnected = false;
    } catch (err) {
      logger.warn('Cache disconnect error', { meta: { error: err.message } });
    }
  }

  /**
   * Générer une clé cache standardisée
   */
  key(...parts) {
    return parts.filter(p => p !== null && p !== undefined).join(':');
  }

  /**
   * Clés standardisées pour popular system
   */
  keys = {
    popularIdeas: (timeframe = '7d', category = null) =>
      this.key('popular:ideas', timeframe, category || 'all'),

    popularPosts: (sort = 'likes') =>
      this.key('popular:posts', sort),

    trendingPosts: () =>
      this.key('popular:trending'),

    homepageData: () =>
      this.key('popular:homepage'),

    userStats: (userId) =>
      this.key('user:stats', userId),

    profileData: (userId) =>
      this.key('profile:data', userId),
  };

  /**
   * Info statut cache (pour monitoring)
   */
  getStatus() {
    return {
      redisConnected: this.isConnected,
      redisClient: !!this.client,
      memoryStoreSize: this.memoryStore.size,
      memoryTimersSize: this.memoryTimers.size,
    };
  }
}

// Singleton
const cache = new CacheService();

module.exports = cache;
