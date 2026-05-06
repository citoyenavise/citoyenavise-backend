/**
 * Media Module
 */

const routes = require('./routes');

module.exports = {
  routes: (app) => {
    app.use('/api/v1/media', routes);
  },
};
