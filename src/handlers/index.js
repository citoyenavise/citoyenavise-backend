/**
 * Handlers Index
 * Central registry of all event handlers
 *
 * Each handler must be registered in server.js
 * Pattern :
 *   eventBus.subscribe('event.name', handler, { name: 'HandlerName' })
 */

const LikeAddedHandler = require('./LikeAddedHandler');
const CommentCreatedHandler = require('./CommentCreatedHandler');

module.exports = {
  LikeAddedHandler,
  CommentCreatedHandler,

  // Future handlers (to be implemented)
  // PostCreatedHandler: require('./PostCreatedHandler'),
  // UserFollowedHandler: require('./UserFollowedHandler'),
};
