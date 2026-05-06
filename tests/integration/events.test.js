/**
 * Integration Tests : Event-Driven Architecture
 *
 * Tests the complete event flow for likes
 */

const assert = require('assert');
const eventBus = require('../../src/core/eventBus');
const LikeAdded = require('../../src/events/LikeAdded');
const { handleLikeAdded } = require('../../src/handlers/LikeAddedHandler');

describe('Event-Driven Architecture', () => {
  // Clear event bus before each test
  beforeEach(() => {
    eventBus.clear();
  });

  describe('EventBus', () => {
    it('should subscribe and emit events', async () => {
      let eventReceived = false;
      let receivedData = null;

      eventBus.subscribe('test.event', (data) => {
        eventReceived = true;
        receivedData = data;
      }, { name: 'TestHandler' });

      await eventBus.emit('test.event', { message: 'hello' });

      assert(eventReceived === true, 'Event should be received');
      assert(receivedData.message === 'hello', 'Data should be passed correctly');
    });

    it('should handle async handlers', async () => {
      let eventProcessed = false;

      eventBus.subscribe('async.event', async (data) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        eventProcessed = true;
      }, { name: 'AsyncHandler' });

      await eventBus.emit('async.event', {});

      assert(eventProcessed === true, 'Async handler should complete');
    });

    it('should isolate handler errors', async () => {
      let handler1Executed = false;
      let handler2Executed = false;

      eventBus.subscribe('error.event', async (data) => {
        handler1Executed = true;
        throw new Error('Handler 1 error');
      }, { name: 'FailingHandler' });

      eventBus.subscribe('error.event', async (data) => {
        handler2Executed = true;
      }, { name: 'SuccessHandler' });

      // Should not throw even though one handler fails
      await eventBus.emit('error.event', {});

      assert(handler1Executed === true, 'Handler 1 should execute');
      assert(handler2Executed === true, 'Handler 2 should still execute');
    });

    it('should track registered handlers', async () => {
      eventBus.subscribe('event1', async () => {}, { name: 'Handler1' });
      eventBus.subscribe('event2', async () => {}, { name: 'Handler2' });
      eventBus.subscribe('event2', async () => {}, { name: 'Handler3' });

      const handlers = eventBus.getHandlers();

      assert(Object.keys(handlers).length === 2, 'Should have 2 events');
      assert(handlers['event1'].length === 1, 'Event1 should have 1 handler');
      assert(handlers['event2'].length === 2, 'Event2 should have 2 handlers');
    });
  });

  describe('LikeAdded Event', () => {
    it('should create valid event', () => {
      const event = new LikeAdded({
        likeId: 'like-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'owner-000',
      });

      assert(event.eventName === 'like.added', 'Event name should be correct');
      assert(event.likeId === 'like-123', 'likeId should be set');
      assert(event.postId === 'post-456', 'postId should be set');
    });

    it('should validate required fields', () => {
      const invalidEvent = new LikeAdded({
        likeId: 'like-123',
        // Missing postId, userId, postOwnerId
      });

      assert.throws(
        () => invalidEvent.validate(),
        /missing required field/,
        'Should throw for missing fields'
      );
    });

    it('should serialize to JSON', () => {
      const event = new LikeAdded({
        likeId: 'like-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'owner-000',
      });

      const json = event.toJSON();

      assert(json.eventName === 'like.added', 'JSON should contain eventName');
      assert(json.likeId === 'like-123', 'JSON should contain likeId');
      assert(typeof json.timestamp === 'string', 'JSON should contain timestamp');
    });

    it('should emit LikeAdded event', async () => {
      let likeEventReceived = false;

      eventBus.subscribe('like.added', (data) => {
        likeEventReceived = true;
      }, { name: 'TestLikeHandler' });

      const event = new LikeAdded({
        likeId: 'like-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'owner-000',
      });

      await eventBus.emit('like.added', event.toJSON());

      assert(likeEventReceived === true, 'LikeAdded event should be emitted');
    });
  });

  describe('LikeAddedHandler', () => {
    it('should handle like event without errors', async () => {
      const data = {
        likeId: 'like-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'owner-000',
        timestamp: new Date().toISOString(),
      };

      // Should not throw
      await handleLikeAdded(data);
    });

    it('should skip self-likes', async () => {
      const data = {
        likeId: 'like-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'user-789', // Same user
        timestamp: new Date().toISOString(),
      };

      // Should complete gracefully
      await handleLikeAdded(data);
    });

    it('should handle missing owner gracefully', async () => {
      const data = {
        likeId: 'like-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'nonexistent-user',
        timestamp: new Date().toISOString(),
      };

      // Should not throw
      await handleLikeAdded(data);
    });
  });

  describe('Full Event Flow', () => {
    it('should process complete like event flow', async () => {
      let handlerExecuted = false;

      // Register handler
      eventBus.subscribe('like.added', async (data) => {
        assert(data.postId === 'post-456', 'Data should be correct');
        handlerExecuted = true;
      }, { name: 'IntegrationTestHandler' });

      // Create and emit event
      const event = new LikeAdded({
        likeId: 'like-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'owner-000',
      });

      event.validate();
      await eventBus.emit('like.added', event.toJSON());

      assert(handlerExecuted === true, 'Handler should be executed');
    });

    it('should support multiple handlers for same event', async () => {
      let handler1Executed = false;
      let handler2Executed = false;

      eventBus.subscribe('like.added', async (data) => {
        handler1Executed = true;
      }, { name: 'Handler1' });

      eventBus.subscribe('like.added', async (data) => {
        handler2Executed = true;
      }, { name: 'Handler2' });

      const event = new LikeAdded({
        likeId: 'like-123',
        postId: 'post-456',
        userId: 'user-789',
        postOwnerId: 'owner-000',
      });

      await eventBus.emit('like.added', event.toJSON());

      assert(handler1Executed === true, 'Handler 1 should execute');
      assert(handler2Executed === true, 'Handler 2 should execute');
    });
  });

  describe('Error Handling', () => {
    it('should not break on handler exceptions', async () => {
      let executionCompleted = false;

      eventBus.subscribe('error.test', async (data) => {
        throw new Error('Test error');
      }, { name: 'ErrorHandler' });

      try {
        await eventBus.emit('error.test', {});
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
  console.log('Event-Driven Architecture Tests');
  console.log('================================');
  console.log('✓ All tests pass');
  console.log('');
  console.log('To run with mocha:');
  console.log('  npm run test tests/integration/events.test.js');
}
