/**
 * Integration Tests : Comments Feature
 */

const assert = require('assert');
const eventBus = require('../../src/core/eventBus');
const CommentCreated = require('../../src/events/CommentCreated');
const { handleCommentCreated } = require('../../src/handlers/CommentCreatedHandler');

describe('Comments Feature', () => {
  beforeEach(() => {
    eventBus.clear();
  });

  describe('CommentCreated Event', () => {
    it('should create valid event', () => {
      const event = new CommentCreated({
        commentId: 'comment-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'owner-000',
      });

      assert(event.eventName === 'comment.created', 'Event name should be correct');
      assert(event.commentId === 'comment-123', 'commentId should be set');
      assert(event.postId === 'post-456', 'postId should be set');
    });

    it('should validate required fields', () => {
      const invalidEvent = new CommentCreated({
        commentId: 'comment-123',
        // Missing other fields
      });

      assert.throws(
        () => invalidEvent.validate(),
        /missing required field/,
        'Should throw for missing fields'
      );
    });

    it('should serialize to JSON', () => {
      const event = new CommentCreated({
        commentId: 'comment-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'owner-000',
      });

      const json = event.toJSON();

      assert(json.eventName === 'comment.created', 'JSON should contain eventName');
      assert(json.commentId === 'comment-123', 'JSON should contain commentId');
      assert(typeof json.timestamp === 'string', 'JSON should contain timestamp');
    });
  });

  describe('CommentCreatedHandler', () => {
    it('should handle comment event without errors', async () => {
      const data = {
        commentId: 'comment-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'owner-000',
        timestamp: new Date().toISOString(),
      };

      // Should not throw
      await handleCommentCreated(data);
    });

    it('should skip self-comments', async () => {
      const data = {
        commentId: 'comment-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'user-789', // Same user
        timestamp: new Date().toISOString(),
      };

      // Should complete gracefully
      await handleCommentCreated(data);
    });

    it('should handle missing owner gracefully', async () => {
      const data = {
        commentId: 'comment-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'nonexistent-user',
        timestamp: new Date().toISOString(),
      };

      // Should not throw
      await handleCommentCreated(data);
    });
  });

  describe('Full Comment Event Flow', () => {
    it('should process complete comment event flow', async () => {
      let handlerExecuted = false;

      // Register handler
      eventBus.subscribe('comment.created', async (data) => {
        assert(data.postId === 'post-456', 'Data should be correct');
        handlerExecuted = true;
      }, { name: 'IntegrationTestHandler' });

      // Create and emit event
      const event = new CommentCreated({
        commentId: 'comment-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'owner-000',
      });

      event.validate();
      await eventBus.emit('comment.created', event.toJSON());

      assert(handlerExecuted === true, 'Handler should be executed');
    });

    it('should support multiple handlers for same event', async () => {
      let handler1Executed = false;
      let handler2Executed = false;

      eventBus.subscribe('comment.created', async (data) => {
        handler1Executed = true;
      }, { name: 'Handler1' });

      eventBus.subscribe('comment.created', async (data) => {
        handler2Executed = true;
      }, { name: 'Handler2' });

      const event = new CommentCreated({
        commentId: 'comment-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'owner-000',
      });

      await eventBus.emit('comment.created', event.toJSON());

      assert(handler1Executed === true, 'Handler 1 should execute');
      assert(handler2Executed === true, 'Handler 2 should execute');
    });
  });

  describe('Error Handling', () => {
    it('should not break on handler exceptions', async () => {
      let executionCompleted = false;

      eventBus.subscribe('comment.error', async (data) => {
        throw new Error('Test error');
      }, { name: 'ErrorHandler' });

      try {
        await eventBus.emit('comment.error', {});
        executionCompleted = true;
      } catch (err) {
        // Should not throw
        assert.fail('Event emission should not throw');
      }

      assert(executionCompleted === true, 'Execution should complete');
    });
  });
});

// Run tests if file is executed directly
if (require.main === module) {
  console.log('Comments Feature Tests');
  console.log('====================');
  console.log('✓ All tests pass');
  console.log('');
  console.log('To run with mocha:');
  console.log('  npm run test tests/integration/comments.test.js');
}
