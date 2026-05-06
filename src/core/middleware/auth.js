/**
 * Middleware d'authentification
 */

const { verifyToken, extractTokenFromHeader } = require('../utils/jwt');
const tokenBlacklist = require('../services/tokenBlacklist');
const logger = require('../utils/logger');

/**
 * Vérifie la présence et validité du JWT
 * Inclut vérification de la blacklist (token révoqué)
 */
async function authRequired(req, res, next) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      logger.warn('Auth: No token provided', { meta: { path: req.path, ip: req.ip } });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Vérifier si token est revoqué
    const isRevoked = await tokenBlacklist.isRevoked(token);
    if (isRevoked) {
      logger.warn('Auth: Token revoked', {
        meta: { path: req.path, userId: req.user?.id }
      });
      return res.status(401).json({ error: 'Token revoked' });
    }

    // Vérifier validité JWT
    let decoded;
    try {
      decoded = verifyToken(token, 'access');  // Expect access token
    } catch (err) {
      logger.warn('Auth: Token verification failed', {
        meta: { path: req.path, error: err.message }
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Attacher l'utilisateur au contexte
    req.user = decoded;
    req.token = token;  // Stocker token pour logout/revocation
    next();
  } catch (err) {
    logger.error('Auth: Unexpected error', { meta: { error: err.message } });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Vérifie que l'utilisateur a un rôle spécifique
 */
function requireRole(roleRequired) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role !== roleRequired && req.user.role !== 'admin') {
      logger.warn('Auth: Insufficient role', {
        meta: { userId: req.user.userId, required: roleRequired, actual: req.user.role }
      });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

/**
 * Optional auth - ne fail pas si pas de token
 * Mais vérifie la blacklist si token existe
 */
async function authOptional(req, res, next) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      // Vérifier si revoqué
      const isRevoked = await tokenBlacklist.isRevoked(token);
      if (!isRevoked) {
        const decoded = verifyToken(token);
        if (decoded) {
          req.user = decoded;
          req.token = token;
        }
      }
    }

    next();
  } catch (err) {
    logger.error('Auth Optional: Error', { meta: { error: err.message } });
    next();  // Silencieusement échouer pour optional auth
  }
}

module.exports = {
  authRequired,
  requireRole,
  authOptional,
};
