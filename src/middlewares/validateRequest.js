/**
 * Validate Request middleware wrapper with smart schema detection
 */
const validateRequestCore = require("../core/middleware/validateRequest");

module.exports = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      // Déterminer si le schema a des wrappers (.body, .query)
      const schemaShape = schema.shape || schema._def?.schema?.shape || {};
      
      let dataToValidate = req[source];
      let schemaToUse = schema;

      // Si le schema a un wrapper pour la source demandée
      if (schemaShape[source]) {
        schemaToUse = schemaShape[source];
        // dataToValidate reste inchangé (req.body, req.query, etc.)
      }

      // Valider
      const validation = schemaToUse.safeParse(dataToValidate);

      if (!validation.success) {
        const fieldErrors = validation.error.flatten().fieldErrors;
        const logger = require("../core/utils/logger");
        logger.warn("Validation failed", {
          meta: { source, errors: fieldErrors },
        });
        
        const { AppError } = require("../core/middleware/errorHandler");
        return next(AppError.validationError("Validation failed", fieldErrors));
      }

      // Ajouter les données validées
      req.validated = validation.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};
