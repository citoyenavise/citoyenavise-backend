/**
 * Connection pool PostgreSQL
 */

const { Pool } = require('pg');
const config = require('../../config');
const logger = require('../utils/logger');

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_SIZE, 10) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: 'citoyenavise_backend',
};

// SSL configuration pour Render PostgreSQL
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com')) {
  poolConfig.ssl = {
    rejectUnauthorized: false,
  };
}

// Log DATABASE_URL for debugging
if (!process.env.DATABASE_URL) {
  logger.error('❌ DATABASE_URL is NOT defined!');
} else {
  const hostMatch = process.env.DATABASE_URL.match(/@([^:/]+)/);
  const host = hostMatch ? hostMatch[1] : 'unknown';
  logger.info(`✅ Database URL configured`, {
    meta: { host, isRender: host.includes('render.com') },
  });
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { meta: { error: err } });
});

pool.on('connect', () => {
  logger.debug('Database connected');
});

/**
 * Query helper avec logging et slow query detection
 */
async function query(text, params = []) {
  const startTime = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - startTime;

    // Slow query threshold: 300ms (configurable)
    const slowThreshold = parseInt(process.env.SLOW_QUERY_MS || '300', 10);
    if (duration > slowThreshold) {
      logger.warn('Slow query detected', {
        meta: {
          query: text.substring(0, 200),  // First 200 chars only
          duration,
          rowCount: result.rowCount,
          slowThreshold,
        },
      });
    }

    return result;
  } catch (err) {
    logger.error('Database query error', {
      meta: {
        query: text.substring(0, 200),
        error: err.message,
        duration: Date.now() - startTime,
      },
    });
    throw err;
  }
}

/**
 * Transaction helper
 */
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Health check
 */
async function healthCheck() {
  try {
    const result = await query('SELECT NOW()');
    return { ok: true, timestamp: result.rows[0].now };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

module.exports = {
  pool,
  query,
  transaction,
  healthCheck,
};
