/**
 * Initialiser la base de données (run once)
 * Usage: node src/database/init.js
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../core/services/database');
const logger = require('../core/utils/logger');

async function initDatabase() {
  const client = await pool.connect();

  try {
    logger.info('Initializing database...');

    // Lire le schéma
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Exécuter le schéma
    await client.query(schema);

    logger.info('✅ Database initialized successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Database initialization failed', { meta: { error: err.message, stack: err.stack } });
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDatabase();
