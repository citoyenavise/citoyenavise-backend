/**
 * Middleware de validation Zod
 * Valide req.body, req.query, ou req.params contre un schema Zod
 */

const { AppError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Crée un middleware de validation
 * @param {z.ZodSchema} schema - Schema Zod à valider
 * @param {string} source - 'body' | 'query' | 'params' (défaut: 'body')
 * @returns {Function} Middleware Express
 */
function validateRequest(schema, source = 'body') {
  return (req, res, next) => {
    const dataToValidate = req[source];

    const validation = schema.safeParse(dataToValidate);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      logger.warn('Validation failed', {
        meta: { source, errors: fieldErrors },
      });
      return next(
        AppError.validationError('Validation failed', fieldErrors)
      );
    }

    // Ajouter les données validées à la requête
    req.validated = validation.data;
    next();
  };
}

module.exports = validateRequest;
