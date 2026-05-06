/**
 * Token Blacklist Service — Revocation système
 * Maintient une blacklist de tokens révoqués en Redis
 * Utilisé pour logout immédiat + invalidation de tokens compromis
 *
 * Failure mode: En production, fail-secure (rejeter les tokens si Redis down)
 * En développement, fail-open (accepter les tokens si Redis down)
 */

const cache = require('./cache');
const logger = require('../utils/logger');
const config = require('../../config');

// En production: fail-secure (rejeter les tokens si Redis down)
// En développement: fail-open (accepter les tokens si Redis down)
const FAIL_SECURE = process.env.TOKEN_BLACKLIST_FAIL_SECURE !== 'false' && config.isProduction();

class TokenBlacklistService {
  /**
   * Révoquer un token (ajouter à blacklist)
   * @param {string} token - Le token JWT
   * @param {number} expiresIn - Seconds until token expiry (from now)
   * @returns {Promise<boolean>}
   */
  async revokeToken(token, expiresIn = 86400) {
    if (!token || !cache.isConnected) {
      logger.warn('TokenBlacklist: Cannot revoke - Redis unavailable');
      return false;
    }

    try {
      // Créer une clé unique pour ce token
      const key = this._getBlacklistKey(token);

      // Ajouter à la blacklist avec TTL = expiration du token
      await cache.set(key, { revokedAt: Date.now() }, expiresIn);

      logger.info('TokenBlacklist: Token revoked', {
        meta: { token: token.substring(0, 20) + '...' }
      });

      return true;
    } catch (err) {
      logger.error('TokenBlacklist: Revoke error', { meta: { error: err.message } });
      return false;
    }
  }

  /**
   * Vérifier si un token est révoqué
   * @param {string} token - Le token JWT
   * @returns {Promise<boolean>} - true = token est revoqué ou Redis down (fail-secure)
   */
  async isRevoked(token) {
    if (!token) {
      return true;
    }

    if (!cache.isConnected) {
      // Si Redis down:
      // - Fail-secure (production): retourner true (rejeter le token)
      // - Fail-open (dev): retourner false (accepter le token)
      const failBehavior = FAIL_SECURE ? 'REJECT' : 'ACCEPT';
      logger.warn('TokenBlacklist: Cannot check - Redis unavailable', {
        meta: { failBehavior, isProduction: config.isProduction() }
      });
      return FAIL_SECURE; // true en prod (rejeter), false en dev (accepter)
    }

    try {
      const key = this._getBlacklistKey(token);
      const isBlacklisted = await cache.get(key);

      if (isBlacklisted) {
        logger.warn('TokenBlacklist: Token is revoked', {
          meta: { token: token.substring(0, 20) + '...' }
        });
      }

      return !!isBlacklisted;
    } catch (err) {
      logger.error('TokenBlacklist: Check error', { meta: { error: err.message } });
      // En cas d'erreur: utiliser la stratégie fail-secure/fail-open
      return FAIL_SECURE;
    }
  }

  /**
   * Révoquer tous les tokens d'un user (logout global)
   * Pattern: blacklist:user:{userId}:*
   * @param {string} userId - UUID de l'utilisateur
   * @returns {Promise<boolean>}
   */
  async revokeAllUserTokens(userId) {
    if (!userId || !cache.isConnected) {
      return false;
    }

    try {
      const pattern = this._getUserTokensPattern(userId);
      const invalidated = await cache.invalidatePattern(pattern);

      logger.info('TokenBlacklist: All user tokens revoked', {
        meta: { userId, count: invalidated }
      });

      return true;
    } catch (err) {
      logger.error('TokenBlacklist: Revoke all error', { meta: { error: err.message } });
      return false;
    }
  }

  /**
   * Révoquer tokens par adresse IP (après suspicion compromise)
   * @param {string} ipAddress - Adresse IP
   * @returns {Promise<boolean>}
   */
  async revokeTokensByIp(ipAddress) {
    if (!ipAddress || !cache.isConnected) {
      return false;
    }

    try {
      const pattern = `blacklist:ip:${ipAddress}:*`;
      const invalidated = await cache.invalidatePattern(pattern);

      logger.warn('TokenBlacklist: All IP tokens revoked', {
        meta: { ipAddress, count: invalidated }
      });

      return true;
    } catch (err) {
      logger.error('TokenBlacklist: Revoke by IP error', { meta: { error: err.message } });
      return false;
    }
  }

  /**
   * Générer clé unique pour un token
   * Format: blacklist:token:{hash}
   * @private
   */
  _getBlacklistKey(token) {
    // Hash du token (première + dernière 20 chars pour sécu)
    const hash = this._hashToken(token);
    return cache.key('blacklist', 'token', hash);
  }

  /**
   * Pattern pour tokens d'un user
   * @private
   */
  _getUserTokensPattern(userId) {
    return cache.key('blacklist', 'user', userId, '*');
  }

  /**
   * Hash simplifié du token (pour clé)
   * @private
   */
  _hashToken(token) {
    if (!token || token.length < 40) {
      return token;
    }
    // Utiliser base64 du début + fin du token
    const start = Buffer.from(token.substring(0, 20)).toString('base64').substring(0, 10);
    const end = Buffer.from(token.substring(-20)).toString('base64').substring(0, 10);
    return `${start}_${end}`;
  }
}

// Singleton
const tokenBlacklist = new TokenBlacklistService();

module.exports = tokenBlacklist;
