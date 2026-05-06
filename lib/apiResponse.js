/**
 * API Response helpers wrapper
 */
const { ResponseFormatter } = require("../src/core/middleware/responseFormatter");

exports.apiSuccess = (res, data, meta = {}) => {
  const response = ResponseFormatter.SUCCESS(data, meta);
  return res.status(200).json(response);
};

exports.apiCreated = (res, data, meta = {}) => {
  const response = ResponseFormatter.CREATED(data, meta);
  return res.status(201).json(response);
};

exports.apiError = (res, message, code = "SERVER_ERROR", statusCode = 500) => {
  const response = ResponseFormatter.ERROR(message, code, statusCode);
  return res.status(statusCode).json(response);
};

exports.apiPaginated = (res, data, total, page = 1, limit = 20) => {
  const response = ResponseFormatter.PAGINATED(data, total, page, limit);
  return res.status(200).json(response);
};
