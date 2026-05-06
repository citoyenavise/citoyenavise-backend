/**
 * Events Index
 * Central registry of all application events
 *
 * Usage :
 *   const { LikeAdded } = require('./events');
 */

const LikeAdded = require('./LikeAdded');
const CommentCreated = require('./CommentCreated');

module.exports = {
  LikeAdded,
  CommentCreated,

  // Future events (to be implemented)
  // PostCreated: require('./PostCreated'),
  // UserFollowed: require('./UserFollowed'),
};
