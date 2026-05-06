/**
 * Popular System Module — Version optimisée pour 100k+ posts
 * Tri SQL, scoring pré-calculé, cache granulaire, event-driven updates
 */

const routes = require('./routes');
const { setupEventListeners } = require('./events');

module.exports = {
  name: 'popular',
  routes: (app) => {
    app.use('/api/v1/popular', routes);
  },
  init: () => {
    try {
      const { eventBus } = require('../../core/eventBus');
      setupEventListeners(eventBus);
    } catch (err) {
      const logger = require('../../core/utils/logger');
      logger.warn('Popular system init: could not setup event listeners', {
        meta: { error: err.message },
      });
    }
  },
};
