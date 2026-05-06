/**
 * Event Handler — Like Added
 * Notifie le propriétaire du post quand quelqu'un like son post
 */

const notificationsService = require('../modules/notifications/service');

module.exports = {
  async handleLikeAdded(event) {
    const { postOwnerId, userId, postId } = event;

    // Ne pas notifier l'utilisateur lui-même
    if (postOwnerId === userId) return;

    await notificationsService.createNotification({
      userId: postOwnerId,
      type: 'like',
      payload: { postId },
    });
  },
};
