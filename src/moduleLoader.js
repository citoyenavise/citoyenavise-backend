/**
 * Module Loader - Charge dynamiquement les routes des modules
 *
 * Architecture :
 * - CORE : modules critiques pour MVP (9 modules)
 * - STANDBY : modules "À implémenter" (18 modules, commentés)
 * - DEPRECATED : modules à supprimer ultérieurement
 */

const fs = require('fs');
const path = require('path');
const logger = require('./core/utils/logger');

/**
 * Modules CORE — Actifs pour MVP
 * Production-ready et dépendances claires
 */
const coreModules = {
  auth: '/api/v1/auth',
  users: '/api/v1/users',
  profiles: '/api/v1/profiles',
  posts: '/api/v1/posts',
  ideas: '/api/v1/ideas',
  likes: '/api/v1/likes',
  comments: '/api/v1/comments',
  popular_system: '/api/v1/popular',
  search: '/api/v1/search',
  map: '/api/v1/map',
  education: '/api/v1/education',
  initiatives: '/api/v1/initiatives',
  admin: '/api/v1/admin',
  analytics: '/api/v1/analytics',
  reports: '/api/v1/reports',
};

/**
 * Modules STANDBY — À implémenter (commentés)
 * Désactivés pour réduire complexité et clarifier architecture
 * À réactiver quand implémentés (>80 lignes de code réel)
 *
 * Timeline d'implémentation prévisionnelle :
 * - follow, comments, moderation : 2-4 semaines
 * - notifications, admin : 4-6 semaines
 * - groups, influence_system, public_dashboard : 6-8 semaines
 * - reste : post-MVP
 */
const standbyModules = {
  // PHASE 1 (social + safety, 2-4 semaines)
  // follow: '/api/v1/follow',
  // moderation: '/api/v1/moderation',

  // PHASE 2 (notifications + admin, 4-6 semaines)
  // notifications: '/api/v1/notifications',
  // admin: '/api/v1/admin',

  // PHASE 3 (features avancées, 6-8 semaines)
  // groups: '/api/v1/groups',
  // influence_system: '/api/v1/influence',
  // public_dashboard: '/api/v1/dashboard',

  // POST-MVP (nice-to-have)
  // friends: '/api/v1/friends',
  // programmes: '/api/v1/programmes',
  // establishments: '/api/v1/establishments',
  // official_pages: '/api/v1/official-pages',
  // content: '/api/v1/content',
  // cms: '/api/v1/cms',
  // webhooks: '/api/v1/webhooks',
  // analytics: '/api/v1/analytics',
  // ai_mascot: '/api/v1/ai',
  // homepage: '/api/v1/homepage',
};

/**
 * Combiner configurations (pour compatibilité et audit)
 */
const allModuleRoutes = {
  ...coreModules,
  ...standbyModules,
};

/**
 * Vérifier la complétude d'un module
 * = avoir service.js avec contenu réel (pas juste "À implémenter")
 */
function isModuleComplete(modulePath, moduleName) {
  const serviceFile = path.join(modulePath, 'service.js');

  if (!fs.existsSync(serviceFile)) {
    return { complete: false, reason: 'service.js missing' };
  }

  try {
    const content = fs.readFileSync(serviceFile, 'utf-8');

    // Vérifier si c'est un stub vide ("À implémenter")
    if (content.includes('À implémenter') && content.split('\n').length < 15) {
      return { complete: false, reason: 'stub empty (À implémenter)' };
    }

    // Vérifier qu'il y a au moins du code réel (>100 lignes)
    const lineCount = content.split('\n').length;
    if (lineCount < 50) {
      return { complete: false, reason: `minimal code (${lineCount} lines)` };
    }

    return { complete: true };
  } catch (err) {
    return { complete: false, reason: `read error: ${err.message}` };
  }
}

/**
 * Charger les routes des modules CORE uniquement
 * + vérifier la complétude
 */
function loadRoutes(app) {
  const modulesPath = path.join(__dirname, 'modules');

  const stats = {
    loaded: [],
    incomplete: [],
    missing: [],
    standby: Object.keys(standbyModules).length,
  };

  // Charger CORE modules
  Object.entries(coreModules).forEach(([moduleName, routePath]) => {
    const modulePath = path.join(modulesPath, moduleName);
    const routesFile = path.join(modulePath, 'routes.js');

    // Vérifier si le fichier routes.js existe
    if (!fs.existsSync(routesFile)) {
      stats.missing.push(moduleName);
      logger.error(`🔴 CORE module MISSING: ${moduleName} (routes.js not found)`, {
        meta: { path: routesFile },
      });
      return;
    }

    // Vérifier la complétude du module
    const completeness = isModuleComplete(modulePath, moduleName);
    if (!completeness.complete) {
      stats.incomplete.push({ name: moduleName, reason: completeness.reason });
      logger.warn(`⚠️ CORE module INCOMPLETE: ${moduleName} (${completeness.reason})`, {
        meta: { path: modulePath },
      });
    }

    // Charger le module
    try {
      const indexFile = path.join(modulePath, 'index.js');
      let moduleConfig = null;
      let routes = null;

      // Vérifier si le module a un index.js avec config (pattern moderne)
      if (fs.existsSync(indexFile)) {
        try {
          moduleConfig = require(indexFile);
          // Si index.js exporte un objet avec 'routes' fonction
          if (moduleConfig && typeof moduleConfig.routes === 'function') {
            // Utiliser le nouveau pattern { routes, init }
            moduleConfig.routes(app);
            stats.loaded.push(moduleName);
            logger.info(`✅ CORE module loaded: ${moduleName} → ${routePath}`);

            // Appeler init() s'il existe
            if (typeof moduleConfig.init === 'function') {
              try {
                moduleConfig.init();
                logger.debug(`📡 Module initialized: ${moduleName}`);
              } catch (initError) {
                logger.warn(`Module init warning for ${moduleName}`, {
                  meta: { error: initError.message },
                });
              }
            }
            return; // Pattern moderne utilisé avec succès
          }
        } catch (configError) {
          // Index.js existe mais n'est pas valide, continuer avec routes.js
          logger.debug(`Index.js not usable for ${moduleName}, trying routes.js`, {
            meta: { error: configError.message },
          });
        }
      }

      // Fallback: charger routes.js directement (pattern legacy)
      routes = require(routesFile);
      app.use(routePath, routes);
      stats.loaded.push(moduleName);
      logger.info(`✅ CORE module loaded: ${moduleName} → ${routePath}`);
    } catch (error) {
      stats.incomplete.push({ name: moduleName, reason: error.message });
      logger.error(`🔴 CORE module LOAD FAILED: ${moduleName}`, {
        meta: { error: error.message, stack: error.stack },
      });
    }
  });

  // Log startup summary
  logStartupSummary(stats, modulesPath);

  return stats;
}

/**
 * Afficher un résumé complet du startup
 */
function logStartupSummary(stats, modulesPath) {
  const horizontalLine = '═'.repeat(70);
  const separator = '─'.repeat(70);

  logger.info(`\n${horizontalLine}`);
  logger.info('MODULE LOADER STARTUP SUMMARY');
  logger.info(horizontalLine);

  // Modules actifs
  logger.info(`\n✅ CORE MODULES ACTIVE (${stats.loaded.length}/15):`);
  stats.loaded.forEach(m => logger.info(`   • ${m}`));

  // Modules en attente
  if (stats.standby > 0) {
    logger.info(`\n⏸️  STANDBY MODULES (${stats.standby} modules commentés):`);
    logger.info(`   These modules are temporarily disabled to reduce complexity.`);
    logger.info(`   They will be implemented in phases (see moduleLoader.js for timeline).`);
  }

  // Modules incomplets
  if (stats.incomplete.length > 0) {
    logger.warn(`\n⚠️  INCOMPLETE CORE MODULES (${stats.incomplete.length}):`);
    stats.incomplete.forEach(({ name, reason }) => {
      logger.warn(`   • ${name} — ${reason}`);
    });
  }

  // Modules manquants
  if (stats.missing.length > 0) {
    logger.error(`\n🔴 MISSING CORE MODULES (${stats.missing.length}):`);
    stats.missing.forEach(m => {
      logger.error(`   • ${m} — routes.js not found`);
    });
  }

  // Summary status
  logger.info(`\n${separator}`);
  if (stats.missing.length === 0 && stats.incomplete.length === 0) {
    logger.info('✅ SYSTEM STATUS: READY');
    logger.info(`   ${stats.loaded.length} core modules active`);
    logger.info(`   ${stats.standby} standby modules (disabled for MVP)`);
  } else {
    const issues = stats.missing.length + stats.incomplete.length;
    logger.error(`⚠️  SYSTEM STATUS: ${issues} ISSUE(S) DETECTED`);
    if (stats.missing.length > 0) {
      logger.error(`   - ${stats.missing.length} missing modules`);
    }
    if (stats.incomplete.length > 0) {
      logger.error(`   - ${stats.incomplete.length} incomplete modules`);
    }
  }
  logger.info(horizontalLine);
  logger.info('');
}

/**
 * Get list of all modules (for monitoring/admin tools)
 */
function getModuleStatus() {
  return {
    core: Object.keys(coreModules),
    standby: Object.keys(standbyModules),
    all: Object.keys(allModuleRoutes),
  };
}

module.exports = {
  loadRoutes,
  getModuleStatus,
  coreModules,
  allModuleRoutes,
  isModuleComplete,
};
