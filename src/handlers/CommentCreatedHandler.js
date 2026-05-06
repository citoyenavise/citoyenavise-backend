/**
 * Event Handler — Comment Created
 * Notifie le propriétaire du post quand quelqu'un commente son post
 */

const notificationsService = require('../modules/notifications/service');

module.exports = {
  async handleCommentCreated(event) {
    const { postOwnerId, commentAuthorId, postId } = event;

    // Ne pas notifier l'utilisateur lui-même
    if (postOwnerId === commentAuthorId) return;

    await notificationsService.createNotification({
      userId: postOwnerId,
      type: 'comment',
      payload: { postId },
    });
  },
};
