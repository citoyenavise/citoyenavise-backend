const routes = require('./routes');
const { eventBus } = require('../../core/eventBus');
const service = require('./service');

function registerRoutes(app) {
  app.use('/api/v1/search', routes);
}

function init() {
  // Listen to events from other modules to invalidate cache
  const invalidateCache = () => service.invalidateCache();

  // Posts events
  eventBus.on('post.created', invalidateCache);
  eventBus.on('post.updated', invalidateCache);
  eventBus.on('post.deleted', invalidateCache);

  // Initiatives events
  eventBus.on('initiative.created', invalidateCache);
  eventBus.on('initiative.updated', invalidateCache);
  eventBus.on('initiative.closed', invalidateCache);

  // Articles events
  eventBus.on('article.created', invalidateCache);
  eventBus.on('article.updated', invalidateCache);

  // Videos events
  eventBus.on('video.created', invalidateCache);
  eventBus.on('video.updated', invalidateCache);

  // Users events (profile updates)
  eventBus.on('user.updated', invalidateCache);
}

module.exports = {
  routes: registerRoutes,
  init,
  name: 'search',
};
