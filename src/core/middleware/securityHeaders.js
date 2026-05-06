/**
 * Middleware de sécurité headers additionnels
 * Complète Helmet avec des headers custom
 */

const logger = require('../utils/logger');

/**
 * Ajouter tous les headers de sécurité recommandés
 */
function securityHeaders(req, res, next) {
  // Déjà géré par Helmet:
  // - X-Frame-Options: DENY
  // - X-Content-Type-Options: nosniff
  // - X-XSS-Protection: 0 (CSP is better)
  // - Strict-Transport-Security
  // - Content-Security-Policy

  // Headers additionnels:

  // Referrer Policy (déjà dans Helmet)
  // res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy (remplace Feature-Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  );

  // Expect-CT: expect Certificate Transparency
  res.setHeader('Expect-CT', 'max-age=86400, enforce');

  // Server header removal (fait par Helmet aussi)
  // res.removeHeader('Server');
  // res.removeHeader('X-Powered-By');

  // Public-Key-Pins (HPKP) — optionnel, peut casser production
  // res.setHeader('Public-Key-Pins', '...');

  // X-Request-ID: déjà ajouté par requestLogger
  // res.setHeader('X-Request-ID', req.requestId);

  // Cache-Control par défaut pour API (pas de cache)
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
}

module.exports = securityHeaders;
