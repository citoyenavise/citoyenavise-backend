/**
 * Middleware de validation Zod centralisé
 * Usage: router.post('/', validate(schema, 'body'), asyncHandler(controller.create))
 */

const { z } = require('zod');
const { AppError } = require('./errorHandler');

/**
 * Créer un middleware de validation pour query/body/params
 * @param {z.ZodSchema} schema - Schéma Zod
 * @param {string} source - 'body' | 'query' | 'params'
 * @returns {Function} Middleware Express
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    try {
      const data = source === 'query'
        ? req.query
        : source === 'params'
          ? req.params
          : req.body;

      const result = schema.safeParse(data);

      if (!result.success) {
        const details = result.error.issues.map(issue => ({
          path: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        }));

        throw new AppError(
          'VALIDATION_ERROR',
          400,
          'Validation failed',
          details
        );
      }

      // Ajouter données validées à req
      req.validated = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { validate };
