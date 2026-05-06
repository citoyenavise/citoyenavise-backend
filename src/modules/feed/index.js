/**
 * Feed Module — Smart feed with temporal scoring
 */

const routes = require('./routes');

module.exports = {
  routes: (app) => {
    app.use('/api/v1/feed', routes);
  },
};
