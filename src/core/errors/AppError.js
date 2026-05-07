const { AppError: BaseAppError } = require('../middleware/errorHandler');

class AppError extends BaseAppError {
  static databaseError(message = 'Database error') {
    return new AppError('DATABASE_ERROR', 500, message);
  }

  static validationError(message = 'Validation failed', details = null) {
    return new AppError('VALIDATION_ERROR', 422, message, details);
  }

  static notFound(message = 'Not found') {
    return new AppError('NOT_FOUND', 404, message);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError('UNAUTHORIZED', 401, message);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError('FORBIDDEN', 403, message);
  }

  static conflict(message = 'Conflict') {
    return new AppError('CONFLICT', 409, message);
  }

  static badRequest(message = 'Bad request') {
    return new AppError('BAD_REQUEST', 400, message);
  }
}

module.exports = AppError;
