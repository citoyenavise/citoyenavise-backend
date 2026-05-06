/**
 * Request logger middleware — ajoute requestId pour correlation
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  // Générer un ID unique pour cette requête
  const requestId = uuidv4();
  req.id = requestId;

  // Ajouter requestId à res.locals pour que les handlers y accèdent
  res.locals.requestId = requestId;

  // Logger la requête avec requestId
  logger.debug(`${req.method} ${req.path}`, {
    meta: {
      requestId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.userId,
    },
  });

  // Logger la réponse quand elle est envoyée
  const originalSend = res.send;
  res.send = function(data) {
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger[level](`${req.method} ${req.path} ${statusCode}`, {
      meta: {
        requestId,
        statusCode,
        responseSize: JSON.stringify(data).length,
        userId: req.user?.userId,
      },
    });

    return originalSend.call(this, data);
  };

  next();
}

module.exports = requestLogger;
