/**
 * Connection pool PostgreSQL
 */

const { Pool } = require('pg');
const config = require('../../config');
const logger = require('../utils/logger');

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: config.DB_POOL_SIZE,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

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
