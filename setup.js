#!/usr/bin/env node

/**
 * Setup Script — Initialiser la base de données
 *
 * Usage:
 *   npm run setup        # Setup complet
 *   npm run setup:db     # Setup DB uniquement
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: `${__dirname}/.env` });
const migrationRunner = require('./src/database/migrationRunner');
const logger = require('./src/core/utils/logger');

async function setupDatabase() {
  try {
    logger.info('🔧 Setup base de données...');

    // Initialiser les migrations
    const pending = await migrationRunner.getPendingMigrations();

    if (pending.length === 0) {
      logger.info('✅ Base de données déjà initialisée');
      return;
    }

    logger.info(`📋 Exécution ${pending.length} migrations en attente...`);

    const results = await migrationRunner.runPendingMigrations();

    logger.info(`✅ Base de données initialisée (${results.length} migrations)`);
  } catch (err) {
    logger.error('❌ Erreur setup', { meta: { error: err.message, stack: err.stack } });
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2] || 'full';

  try {
    switch (command) {
      case 'db':
      case 'setup:db':
        await setupDatabase();
        break;

      case 'full':
      case 'setup':
      default:
        await setupDatabase();
        logger.info('✅ Setup complet terminé');
        logger.info('');
        logger.info('Prochaines étapes:');
        logger.info('  npm run dev                 # Lancer le serveur');
        logger.info('  npm run migrate:status      # Vérifier status migrations');
        logger.info('');
        break;
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur', err.message);
    process.exit(1);
  }
}

main();
