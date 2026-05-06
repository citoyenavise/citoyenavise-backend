const routes = require('./routes');
const { eventBus } = require('../../core/eventBus');
const service = require('./service');

function registerRoutes(app) {
  app.use('/api/v1/analytics', routes);
}

function init() {
  // Invalidate cache when content is created/updated
  const invalidate = () => service.invalidateCache();

  eventBus.on('post.created', invalidate);
  eventBus.on('post.updated', invalidate);
  eventBus.on('initiative.created', invalidate);
  eventBus.on('initiative.updated', invalidate);
  eventBus.on('video.created', invalidate);
  eventBus.on('video.updated', invalidate);
  eventBus.on('article.created', invalidate);
  eventBus.on('article.updated', invalidate);
}

module.exports = {
  routes: registerRoutes,
  init,
  name: 'analytics',
};
