/**
 * Rate limiting avec Redis-backed store
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const cache = require('../services/cache');

let globalLimiter;
let authLimiter;

/**
 * Initialiser les limiters (appeler après que Redis soit connecté)
 */
function initLimiters() {
  // Utiliser le client Redis du cache
  const redisClient = cache.client;

  if (!redisClient) {
    // Fallback à en-memory si Redis n'est pas disponible
    return createInMemoryLimiters();
  }

  // Global limiter: 100 requêtes par IP par 15 minutes
  globalLimiter = rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:global:',
    }),
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Auth limiter: 5 tentatives par IP par 15 minutes, skip si succès
  authLimiter = rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:auth:',
    }),
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Créer limiters en-memory (fallback)
 */
function createInMemoryLimiters() {
  globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });

  authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Obtenir les limiters (initialiser si nécessaire)
 */
function getLimiters() {
  if (!globalLimiter) {
    initLimiters();
  }
  return { globalLimiter, authLimiter };
}

/**
 * Créer un rate limiter custom (réutilisable)
 * @param {number} max - Max requests
 * @param {string} windowMs - Window size (e.g., "15min", "1hour")
 * @param {object} options - Options additionnelles (keyPrefix, skip, message, keyGenerator)
 */
function getRateLimiter(max, windowMs = '15min', options = {}) {
  const windowMap = {
    '1min': 1 * 60 * 1000,
    '5min': 5 * 60 * 1000,
    '15min': 15 * 60 * 1000,
    '1hour': 60 * 60 * 1000,
  };

  const actualWindowMs = windowMap[windowMs] || 15 * 60 * 1000;
  const redisClient = cache.client;
  // IMPORTANT: keyPrefix doit être unique par endpoint pour éviter les collisions
  const keyPrefix = options.keyPrefix || `rl:custom:${max}:`;

  if (redisClient && cache.isConnected) {
    return rateLimit({
      store: new RedisStore({
        client: redisClient,
        prefix: keyPrefix,
      }),
      windowMs: actualWindowMs,
      max,
      skip: options.skip || undefined,
      keyGenerator: options.keyGenerator || undefined,
      message: options.message || 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  // Fallback en-memory
  return rateLimit({
    windowMs: actualWindowMs,
    max,
    keyGenerator: options.keyGenerator || undefined,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Créer un rate limiter par user_id (pour les routes authentifiées)
 * @param {number} max - Max requests par user
 * @param {string} windowMs - Window size
 * @param {object} options - Options additionnelles
 */
function getUserRateLimiter(max, windowMs = '15min', options = {}) {
  const keyPrefix = options.keyPrefix || `rl:user:${max}:`;
  return getRateLimiter(max, windowMs, {
    ...options,
    keyPrefix,
    keyGenerator: (req) => {
      if (req.user?.userId) {
        return `user:${req.user.userId}`;
      }
      return req.ip;
    },
  });
}

module.exports = {
  initLimiters,
  getLimiters,
  getGlobalLimiter: () => getLimiters().globalLimiter,
  getAuthLimiter: () => getLimiters().authLimiter,
  getRateLimiter,
  getUserRateLimiter,
};
