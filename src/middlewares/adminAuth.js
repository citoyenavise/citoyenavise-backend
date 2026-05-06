/**
 * Admin Auth Middleware — Permission checking
 */

const { hasPermission } = require('../modules/admin/permissions');
const AppError = require('../../lib/AppError');

function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Authentification requise', 401));
    }

    if (!hasPermission(req.user, permission)) {
      return next(new AppError('Permission insuffisante', 403));
    }

    next();
  };
}

module.exports = { requirePermission };
