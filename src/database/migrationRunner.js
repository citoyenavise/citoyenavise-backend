/**
 * Migration Runner — Gère les évolutions de schéma DB
 *
 * Utilisation:
 *   npm run migrate              # Exécuter les migrations pending
 *   npm run migrate:status       # Voir le status des migrations
 *   npm run migrate:rollback     # Rollback dernière migration (si possible)
 */

const fs = require('fs');
const path = require('path');
const { pool } = require('../core/services/database');
const logger = require('../core/utils/logger');

class MigrationRunner {
  constructor() {
    this.migrationsPath = path.join(__dirname, '../database/migrations');
  }

  /**
   * Obtenir la liste des migrations SQL
   */
  getMigrations() {
    try {
      const files = fs.readdirSync(this.migrationsPath)
        .filter(f => f.match(/^V\d+_.*\.sql$/))
        .sort();

      return files.map(file => {
        const match = file.match(/^V(\d+)_(.*)\.sql$/);
        return {
          version: parseInt(match[1]),
          name: match[2],
          file,
          path: path.join(this.migrationsPath, file),
        };
      });
    } catch (err) {
      logger.error('Erreur lecture migrations', { meta: { error: err.message } });
      return [];
    }
  }

  /**
   * Obtenir les migrations déjà exécutées
   */
  async getExecutedMigrations(client) {
    try {
      const result = await client.query(`
        SELECT version_number FROM schema_versions
        ORDER BY version_number
      `);
      return result.rows.map(r => r.version_number);
    } catch (err) {
      // Table n'existe pas encore = première migration
      return [];
    }
  }

  /**
   * Obtenir les migrations en attente
   */
  async getPendingMigrations() {
    const client = await pool.connect();
    try {
      const migrations = this.getMigrations();
      const executed = await this.getExecutedMigrations(client);
      return migrations.filter(m => !executed.includes(m.version));
    } finally {
      client.release();
    }
  }

  /**
   * Exécuter une migration
   */
  async runMigration(migration) {
    const client = await pool.connect();
    const startTime = Date.now();

    try {
      logger.info(`Exécution migration: ${migration.file}`);

      // Lire le fichier SQL
      const sql = fs.readFileSync(migration.path, 'utf-8');

      // Exécuter
      await client.query(sql);

      const executionTime = Date.now() - startTime;

      logger.info(`✅ Migration complétée: ${migration.file} (${executionTime}ms)`);

      return {
        success: true,
        version: migration.version,
        executionTime,
      };
    } catch (err) {
      logger.error(`❌ Migration échouée: ${migration.file}`, {
        meta: { error: err.message },
      });
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Exécuter toutes les migrations en attente
   */
  async runPendingMigrations() {
    const pending = await this.getPendingMigrations();

    if (pending.length === 0) {
      logger.info('✅ Base de données à jour - aucune migration en attente');
      return [];
    }

    logger.info(`📋 ${pending.length} migrations en attente`);

    const results = [];
    for (const migration of pending) {
      try {
        const result = await this.runMigration(migration);
        results.push(result);
      } catch (err) {
        logger.error(`Migration échouée - arrêt`, { meta: { error: err.message } });
        throw err;
      }
    }

    logger.info(`✅ Toutes les migrations (${results.length}) exécutées avec succès`);
    return results;
  }

  /**
   * Afficher le status
   */
  async showStatus() {
    const migrations = this.getMigrations();
    const client = await pool.connect();
    try {
      const executed = await this.getExecutedMigrations(client);

      console.log('\n📊 Status des migrations:\n');
      console.log('Version | Status    | Description');
      console.log('--------|-----------|------------------');

      for (const m of migrations) {
        const status = executed.includes(m.version) ? '✅ Applied' : '⏳ Pending';
        console.log(`V${m.version.toString().padStart(3, '0')}   | ${status.padEnd(9)} | ${m.name}`);
      }

      console.log(`\nTotal: ${migrations.length} migrations (${executed.length} appliquées)`);
      console.log('');
    } finally {
      client.release();
    }
  }

  /**
   * Initialiser les migrations depuis schema.sql existant
   * (backward compatibility)
   */
  async initFromSchemaSQL() {
    const schemaPath = path.join(__dirname, '../database/schema.sql');

    if (!fs.existsSync(schemaPath)) {
      logger.warn('schema.sql non trouvé - impossible initialiser migrations');
      return;
    }

    const client = await pool.connect();
    try {
      const executed = await this.getExecutedMigrations(client);

      if (executed.length > 0) {
        logger.info('Migrations déjà initialisées');
        return;
      }

      logger.info('Initialisation depuis schema.sql...');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      await client.query(schema);

      logger.info('✅ Schema.sql appliqué');
    } catch (err) {
      logger.error('Erreur initialisation schema', { meta: { error: err.message } });
      throw err;
    } finally {
      client.release();
    }
  }
}

// Singleton
const runner = new MigrationRunner();

module.exports = runner;
