/**
 * Configuration centralisée
 */

require('dotenv').config({ path: `${__dirname}/../.env` });

module.exports = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  API_URL: process.env.API_URL || 'http://localhost:5000',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database
  DATABASE_URL: process.env.DATABASE_URL,
  DB_POOL_SIZE: parseInt(process.env.DB_POOL_SIZE, 10) || 10,

  // JWT — MUST be different!
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,  // NO FALLBACK!
  JWT_EXPIRY_ACCESS: process.env.JWT_EXPIRY_ACCESS || '24h',
  JWT_EXPIRY_REFRESH: process.env.JWT_EXPIRY_REFRESH || '7d',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // CORS
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),

  // PostGIS
  POSTGIS_ENABLED: process.env.POSTGIS_ENABLED === 'true',

  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN || null,

  // Features
  isDevelopment: () => module.exports.NODE_ENV === 'development',
  isProduction: () => module.exports.NODE_ENV === 'production',
  isTest: () => module.exports.NODE_ENV === 'test',

  // Validation stricte
  validate: () => {
    const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0 && !module.exports.isTest()) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }

    // Vérifier que JWT_SECRET !== JWT_REFRESH_SECRET
    if (!module.exports.isTest() &&
        process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_SECRET and JWT_REFRESH_SECRET MUST be different!');
    }

    // Vérifier longueur minimum secrets (>= 32 chars)
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }
    if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
      throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
    }

    return true;
  }
};
