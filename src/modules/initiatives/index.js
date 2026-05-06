const initiativesRoutes = require('./routes');

function routes(app) {
  // Main initiatives routes
  app.use('/api/v1/initiatives', initiativesRoutes);
}

function init() {
  // No initialization required at startup
}

module.exports = {
  routes,
  init,
  name: 'initiatives',
  submodules: ['votes', 'comments'],
};
