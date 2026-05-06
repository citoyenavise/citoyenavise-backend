/**
 * Démarrage du serveur
 */

const config = require('./src/config');
const app = require('./src/app');
const logger = require('./src/core/utils/logger');
const cache = require('./src/core/services/cache');
const databaseOptimization = require('./src/core/services/databaseOptimization');
const WebSocketServer = require('./src/core/websocket/server');

// Valider config
try {
  config.validate();
} catch (err) {
  logger.error('Configuration error', { meta: { error: err.message } });
  process.exit(1);
}

const PORT = config.PORT;

// Initialize services (cache, database pool warming)
(async () => {
  try {
    // P8: Cache warming au démarrage
    await cache.connect();
    // Warm up database connection pool for faster first requests
    await databaseOptimization.warmupPool();
    logger.info('Database pool warmed up successfully');
  } catch (err) {
    logger.warn('Startup service initialization warning', { meta: { error: err.message } });
    // Non-fatal: continue startup even if warming fails
  }
})();

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server started on port ${PORT}`, {
    meta: {
      environment: config.NODE_ENV,
      apiUrl: config.API_URL,
      frontendUrl: config.FRONTEND_URL,
    }
  });
});

// Initialize WebSocket server
const wsServer = new WebSocketServer(server);
wsServer.attach();

// Export for use in other modules
global.wsServer = wsServer;

// Initialize event handlers (event-driven reactions)
// Note: Module-level init() functions are called by moduleLoader.loadRoutes()
(() => {
  try {
    const eventBus = require('./src/core/eventBus');
    const { handleLikeAdded } = require('./src/handlers/LikeAddedHandler');
    const { handleCommentCreated } = require('./src/handlers/CommentCreatedHandler');

    // Register handlers
    eventBus.subscribe('like.added', handleLikeAdded, { name: 'LikeAddedHandler' });
    eventBus.subscribe('comment.created', handleCommentCreated, { name: 'CommentCreatedHandler' });

    const handlers = eventBus.getHandlers();
    logger.info('Event handlers initialized', {
      meta: {
        totalEvents: Object.keys(handlers).length,
        events: Object.keys(handlers),
      },
    });
  } catch (err) {
    logger.error('Failed to initialize event handlers', {
      meta: { error: err.message, stack: err.stack },
    });
    // Non-fatal: continue server startup even if event system fails
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await wsServer.shutdown();
  await cache.disconnect();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await wsServer.shutdown();
  await cache.disconnect();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Unhandled errors
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { meta: { error: err.message, stack: err.stack } });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { meta: { reason, promise } });
  process.exit(1);
});
