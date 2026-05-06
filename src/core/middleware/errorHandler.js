/**
 * Middleware global de gestion d'erreurs
 */

const z = require('zod');
const logger = require('../utils/logger');

/**
 * Classe d'erreur applicative standardisée
 * Usage nouveau: AppError(code, statusCode, message, details)
 * Backward compat: AppError(message, statusCode) pour legacy code
 */
class AppError extends Error {
  constructor(codeOrMessage, statusCodeOrMessage = 500, messageOrDetails = null, details = null) {
    // Déterminer le pattern utilisé
    const errorCodes = [
      'VALIDATION_ERROR', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND', 'CONFLICT',
      'DUPLICATE_EMAIL', 'DUPLICATE_USERNAME', 'INVALID_CREDENTIALS', 'TOKEN_EXPIRED',
      'BAD_REQUEST', 'SERVER_ERROR', 'DATABASE_ERROR', 'RESOURCE_NOT_FOUND'
    ];

    let code, statusCode, message, finalDetails;

    // Pattern nouveau: AppError(code, statusCode, message, details)
    if (errorCodes.includes(codeOrMessage)) {
      code = codeOrMessage;
      statusCode = statusCodeOrMessage;
      message = messageOrDetails || code;
      finalDetails = details;
    } else {
      // Pattern legacy: AppError(message, statusCode, details)
      code = 'SERVER_ERROR';
      statusCode = statusCodeOrMessage;
      message = codeOrMessage;
      finalDetails = messageOrDetails;
    }

    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = finalDetails || {};
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de gestion d'erreurs — STANDARDISÉ
 */
function errorHandler(err, req, res, next) {
  // Gérer les erreurs de validation Zod
  if (err instanceof z.ZodError) {
    const issues = err.issues.map(issue => ({
      path: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));

    logger.warn('Validation error', {
      meta: {
        path: req.path,
        issues,
      },
    });

    return res.status(422).json({
      success: false,
      timestamp: new Date().toISOString(),
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: issues,
      },
      meta: null,
    });
  }

  // Gérer AppError
  let code = err.code || 'SERVER_ERROR';
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Log avec contexte
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  const logFn = logger[logLevel];

  logFn(`${code} - ${message}`, {
    meta: {
      code,
      statusCode,
      path: req.path,
      method: req.method,
      userId: req.user?.userId,
      requestId: req.requestId,
      ...(statusCode >= 500 && { stack: err.stack }),
    },
  });

  // Messages génériques en prod
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && statusCode >= 500) {
    message = 'An error occurred. Please try again later.';
    details = null;
  }

  res.status(statusCode).json({
    success: false,
    timestamp: new Date().toISOString(),
    data: null,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: null,
  });
}

/**
 * Middleware pour 404
 */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    timestamp: new Date().toISOString(),
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.path}`,
      details: null,
    },
    meta: null,
  });
}

/**
 * Wrapper pour les routes async (gère les erreurs automatiquement)
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  AppError,
  errorHandler,
  notFound,
  asyncHandler,
};
