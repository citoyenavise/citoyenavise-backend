/**
 * Request Timeout Middleware
 * Empêche les requêtes de pendre indéfiniment
 */

const logger = require('../utils/logger');

/**
 * Créer un middleware de timeout
 * @param {number} ms - Timeout en millisecondes
 */
function timeoutMiddleware(ms = 30000) {  // 30s default
  return (req, res, next) => {
    let timeoutId;

    // Définir timeout sur la réponse
    const originalSend = res.send;
    res.send = function (data) {
      clearTimeout(timeoutId);
      return originalSend.call(this, data);
    };

    // Si la requête est déjà complétée, ne pas ajouter timeout
    if (res.headersSent) {
      return next();
    }

    // Timeout: envoyer 408 Request Timeout
    timeoutId = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          meta: {
            path: req.path,
            method: req.method,
            userId: req.user?.id,
            timeout: ms,
          },
        });

        res.status(408).json({
          error: 'Request timeout',
          timeout: ms,
        });
      }
    }, ms);

    // Cleanup si réponse avant timeout
    req.on('end', () => clearTimeout(timeoutId));
    res.on('finish', () => clearTimeout(timeoutId));

    next();
  };
}

/**
 * Timeout spécifique pour les requêtes de lecture (query)
 * Généralement plus court que les écritures
 */
const readTimeout = timeoutMiddleware(10000);  // 10s

/**
 * Timeout pour requêtes d'écriture
 * Plus long pour les opérations coûteuses
 */
const writeTimeout = timeoutMiddleware(30000);  // 30s

/**
 * Timeout court pour les endpoints critiques
 */
const fastTimeout = timeoutMiddleware(5000);  // 5s

module.exports = {
  timeoutMiddleware,
  readTimeout,
  writeTimeout,
  fastTimeout,
};
