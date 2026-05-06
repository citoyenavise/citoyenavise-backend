/**
 * Notifications — EventBus Triggers
 * Setup event listeners for all notification triggers
 */

const { eventBus } = require('../../core/eventBus');
const { NotificationsService } = require('./service');
const logger = require('../../core/utils/logger');

function setupNotificationTriggers() {
  if (!eventBus) {
    logger.warn('EventBus not available for notifications');
    return;
  }

  // Report resolved → notify reporter
  eventBus.on('report.resolved', async (data) => {
    try {
      const { reportId, userId, status, action } = data;
      await NotificationsService.create({
        userId,
        type: 'report_resolved',
        title: 'Your report was reviewed',
        message: `Report status: ${status}. Action: ${action || 'none'}`,
        data: { reportId, action },
      });
    } catch (err) {
      logger.error('Error notifying report resolution', { meta: { error: err.message } });
    }
  });

  // User banned → notify user
  eventBus.on('admin.user.banned', async (data) => {
    try {
      const { userId, reason } = data;
      await NotificationsService.create({
        userId,
        type: 'user_banned',
        title: 'Your account has been banned',
        message: `Reason: ${reason || 'No reason provided'}`,
        data: { reason },
      });
    } catch (err) {
      logger.error('Error notifying ban', { meta: { error: err.message } });
    }
  });

  // User unbanned → notify user
  eventBus.on('admin.user.unbanned', async (data) => {
    try {
      const { userId } = data;
      await NotificationsService.create({
        userId,
        type: 'user_unbanned',
        title: 'Your account has been restored',
        message: 'You can now access your account again.',
        data: {},
      });
    } catch (err) {
      logger.error('Error notifying unban', { meta: { error: err.message } });
    }
  });

  // Quiz attempt completed → notify user
  eventBus.on('quiz.attempt.completed', async (data) => {
    try {
      const { userId, quizId, score, total, percentage } = data;
      await NotificationsService.create({
        userId,
        type: 'quiz_completed',
        title: 'Quiz completed!',
        message: `You scored ${score}/${total} (${percentage.toFixed(1)}%)`,
        data: { quizId, score, total, percentage },
      });
    } catch (err) {
      logger.error('Error notifying quiz completion', { meta: { error: err.message } });
    }
  });

  // Initiative phase changed → notify followers
  eventBus.on('initiative.phase.changed', async (data) => {
    try {
      const { initiativeId, phase } = data;
      // Get followers from initiatives table or custom followers table
      // For now, just log
      logger.info('Initiative phase changed', { meta: { initiativeId, phase } });
    } catch (err) {
      logger.error('Error notifying phase change', { meta: { error: err.message } });
    }
  });

  logger.info('Notification event triggers configured');
}

module.exports = { setupNotificationTriggers };
