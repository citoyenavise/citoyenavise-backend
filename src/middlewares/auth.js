/**
 * Auth middleware wrapper
 */
const { authRequired } = require("../core/middleware/auth");

module.exports = authRequired;
