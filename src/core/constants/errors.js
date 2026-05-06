/**
 * Error Classes
 */

class BadRequest extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 400;
    this.name = 'BadRequest';
  }
}

class Unauthorized extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.statusCode = 401;
    this.name = 'Unauthorized';
  }
}

class Forbidden extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.statusCode = 403;
    this.name = 'Forbidden';
  }
}

class NotFound extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.statusCode = 404;
    this.name = 'NotFound';
  }
}

class Conflict extends Error {
  constructor(message = 'Conflict') {
    super(message);
    this.statusCode = 409;
    this.name = 'Conflict';
  }
}

class ValidationError extends Error {
  constructor(message, fields = {}) {
    super(message);
    this.statusCode = 422;
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

module.exports = {
  BadRequest,
  Unauthorized,
  Forbidden,
  NotFound,
  Conflict,
  ValidationError,
};
