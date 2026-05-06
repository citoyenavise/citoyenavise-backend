/**
 * Validation & Sanitization Middleware
 * Valide et nettoie tous les inputs (body, params, query)
 */

const { z } = require('zod');
const xss = require('xss');
const logger = require('../utils/logger');

/**
 * Sanitize une string contre XSS
 * @param {string} str
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  // XSS filter simple
  return xss(str, {
    whiteList: {},  // No HTML allowed
    stripIgnoredTag: true,
  });
}

/**
 * Récursivement sanitize un objet (strings seulement)
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return typeof obj === 'string' ? sanitizeString(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Middleware: Valide req body contre Zod schema
 * Usage: app.post('/endpoint', validateBody(MySchema), handler)
 *
 * @param {z.ZodType} schema - Zod schema
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      // Sanitize d'abord
      req.body = sanitizeObject(req.body);

      // Valider contre schema
      const validated = schema.parse(req.body);
      req.validatedBody = validated;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        logger.warn('Validation error', {
          meta: {
            path: req.path,
            issues: err.issues.map(i => ({
              field: i.path.join('.'),
              message: i.message,
            })),
          },
        });

        return res.status(400).json({
          error: 'Validation failed',
          issues: err.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }

      next(err);
    }
  };
}

/**
 * Middleware: Valide params URL
 * @param {z.ZodType} schema
 */
function validateParams(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.validatedParams = validated;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid parameters',
          issues: err.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      next(err);
    }
  };
}

/**
 * Middleware: Valide query string
 * @param {z.ZodType} schema
 */
function validateQuery(schema) {
  return (req, res, next) => {
    try {
      // Sanitize query
      req.query = sanitizeObject(req.query);

      const validated = schema.parse(req.query);
      req.validatedQuery = validated;
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          issues: err.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      next(err);
    }
  };
}

/**
 * Limiter taille request (en complément à express.json limit)
 * @param {number} maxBytes - Max size in bytes
 */
function limitRequestSize(maxBytes = 1024 * 1024) {  // 1MB default
  return (req, res, next) => {
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        res.status(413).json({ error: 'Request entity too large' });
        req.socket.destroy();
      }
    });
    next();
  };
}

module.exports = {
  sanitizeString,
  sanitizeObject,
  validateBody,
  validateParams,
  validateQuery,
  limitRequestSize,
};
