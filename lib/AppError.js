/**
 * AppError wrapper - Export de la classe AppError
 */
const { AppError } = require("../src/core/middleware/errorHandler");

// Support pour le pattern AppError(message, statusCode)
class AppErrorCompat extends AppError {
  constructor(messageOrCode, statusCode = 500) {
    super(messageOrCode, statusCode);
  }
}

module.exports = AppErrorCompat;
