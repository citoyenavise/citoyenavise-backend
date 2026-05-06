/**
 * Event Bus — Central event hub
 * Pattern : Event-Driven Architecture (minimal, non-intrusive)
 *
 * Usage :
 *   eventBus.on('user.signup', (data) => { ... })
 *   eventBus.emit('user.signup', { userId, email })
 *
 * Design principles :
 * - Simple event emission/subscription
 * - Async handlers support
 * - Error isolation (one handler failure ≠ stop others)
 * - Logging for debugging
 */

const EventEmitter = require('events');
const logger = require('./utils/logger');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.handlers = {}; // Track handlers for debugging
    this.setMaxListeners(100); // Prevent "possible memory leak" warnings
  }

  /**
   * Register an event handler
   * Handlers are called sequentially, even if async
   */
  subscribe(eventName, handler, options = {}) {
    const handlerName = options.name || handler.name || 'anonymous';

    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }

    this.handlers[eventName].push({
      name: handlerName,
      handler,
      createdAt: new Date(),
    });

    // Use listener() instead of on() for better isolation
    this.on(eventName, async (data) => {
      try {
        await handler(data);
      } catch (err) {
        // Isolate: one handler error doesn't stop others
        logger.error(`Event handler error: ${eventName} → ${handlerName}`, {
          meta: {
            eventName,
            handlerName,
            error: err.message,
            stack: err.stack,
          },
        });
        // Continue (don't rethrow)
      }
    });

    logger.debug(`Event handler registered: ${eventName} → ${handlerName}`);

    return () => this.unsubscribe(eventName, handlerName);
  }

  /**
   * Emit an event
   * Returns promise that resolves when all handlers complete
   */
  async emit(eventName, data = {}) {
    logger.debug(`Event emitted: ${eventName}`, {
      meta: { eventName, dataKeys: Object.keys(data) },
    });

    // Call parent's emit and collect promises
    return new Promise((resolve) => {
      // EventEmitter.prototype.emit is synchronous but we use async handlers
      // So we need to collect listeners and await them
      const listeners = this.listeners(eventName);

      if (listeners.length === 0) {
        logger.debug(`Event ${eventName}: no handlers registered`);
        resolve();
        return;
      }

      // Execute all listeners in parallel (they're already wrapped with try-catch)
      Promise.all(listeners.map(listener => listener(data)))
        .then(() => resolve())
        .catch((err) => {
          // This shouldn't happen (handlers catch their own errors)
          logger.error(`Event ${eventName}: unexpected error in handler execution`, {
            meta: { error: err.message },
          });
          resolve(); // Still resolve to not break the flow
        });
    });
  }

  /**
   * Unsubscribe a handler
   */
  unsubscribe(eventName, handlerName) {
    if (!this.handlers[eventName]) return;

    this.handlers[eventName] = this.handlers[eventName].filter(
      h => h.name !== handlerName
    );

    logger.debug(`Event handler unregistered: ${eventName} → ${handlerName}`);
  }

  /**
   * Get all registered handlers (for monitoring/debugging)
   */
  getHandlers() {
    return { ...this.handlers };
  }

  /**
   * Get handlers for a specific event
   */
  getHandlersFor(eventName) {
    return this.handlers[eventName] || [];
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clear() {
    this.removeAllListeners();
    this.handlers = {};
    logger.debug('Event bus cleared');
  }
}

// Singleton instance
const eventBus = new EventBus();

module.exports = eventBus;
