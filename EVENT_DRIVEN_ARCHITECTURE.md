# 📡 EVENT-DRIVEN ARCHITECTURE — Citoyenavise.org

## Overview

Citoyenavise.org utilise une **architecture événementielle légère** pour :
- Découpler la logique métier de la logique réactive
- Permettre des réactions asynchrones sans bloquer les opérations critiques
- Simplifier l'ajout de nouvelles features sans modifier le code existant

### Principe

```
User Action → Service → EVENT EMITTED → Handlers React Asynchronously
                                              ↓
                                      (score update, notifications, etc.)
```

**Important** : Les handlers sont asynchrones et isolés. Un handler qui échoue n'affecte pas l'action principale.

---

## Architecture

```
src/
├── core/
│   └── eventBus.js                  # Central event hub (singleton)
│
├── events/
│   ├── LikeAdded.js                 # Event definition (data + validation)
│   └── index.js                     # Event registry
│
├── handlers/
│   ├── LikeAddedHandler.js          # Reaction to LikeAdded event
│   └── index.js                     # Handler registry
│
└── modules/
    └── likes/
        └── service.js               # Emits events (modified)
```

---

## Components

### 1. EventBus (`core/eventBus.js`)

Central event hub using Node.js EventEmitter pattern.

```javascript
const eventBus = require('./src/core/eventBus');

// Subscribe to an event
eventBus.subscribe('like.added', async (data) => {
  // Handle event
}, { name: 'MyHandler' });

// Emit an event
await eventBus.emit('like.added', { userId, postId, ... });

// Get handlers status (for monitoring)
const handlers = eventBus.getHandlers();
```

**Features** :
- ✅ Async handler support
- ✅ Error isolation (one handler failure ≠ stop others)
- ✅ Logging for debugging
- ✅ Handler registry for monitoring

### 2. Events (`events/`)

Event definitions with validation.

```javascript
// events/LikeAdded.js
class LikeAdded {
  constructor(data) {
    this.eventName = 'like.added';
    this.likeId = data.likeId;
    this.postId = data.postId;
    this.userId = data.userId;
    this.postOwnerId = data.postOwnerId;
    this.timestamp = data.timestamp || new Date().toISOString();
  }

  validate() {
    // Validation logic
  }

  toJSON() {
    // Serialization for logging/queuing
  }
}
```

**Why separate classes?**
- Type clarity
- Validation logic
- Documentation (event shape)
- Future: serialization for event sourcing/auditing

### 3. Handlers (`handlers/`)

Reactions to events. Pure functions that can be tested independently.

```javascript
// handlers/LikeAddedHandler.js
async function handleLikeAdded(data) {
  const { likeId, postId, userId, postOwnerId, timestamp } = data;

  // Reaction logic:
  // 1. Update post owner's score
  // 2. Log interaction
  // 3. Optionally send notification
}

module.exports = {
  handleLikeAdded,
  eventName: 'like.added',
};
```

**Design principles** :
- ✅ Async-safe
- ✅ Isolated (failures don't break main flow)
- ✅ Idempotent (safe to replay)
- ✅ Testable (no side effects on main operation)
- ✅ Single responsibility

---

## Current Implementation: LikeAdded

### Flow

```
User clicks "Like"
  ↓
POST /api/v1/likes/:postId
  ↓
likes.controller.likePost()
  ↓
likes.service.likePost()
  ├─ Transaction: INSERT into likes table
  ├─ UPDATE posts.likes_count
  ├─ Cache invalidation
  ├─ WebSocket broadcast (real-time UI update)
  │
  └─ EMIT EVENT: 'like.added'
      ↓
      EventBus.emit('like.added', { likeId, postId, userId, postOwnerId, ... })
          ↓
          ↓ (asynchronous, non-blocking)
          ↓
          LikeAddedHandler
              ├─ Update post owner's score
              └─ Log interaction
                  (failures don't affect response to user)

Response sent to user ✓ (DB updated, cache invalidated, UI notified)
```

---

## How to Add a New Event

### Step 1: Define the Event

Create `src/events/MyEvent.js`:

```javascript
class MyEvent {
  constructor(data) {
    this.eventName = 'my.event';
    this.field1 = data.field1;
    this.field2 = data.field2;
    // ... data
  }

  validate() {
    if (!this.field1) throw new Error('field1 required');
    return true;
  }

  toJSON() {
    return { eventName: this.eventName, field1: this.field1, ... };
  }
}

module.exports = MyEvent;
```

Register in `src/events/index.js`:

```javascript
module.exports = {
  LikeAdded: require('./LikeAdded'),
  MyEvent: require('./MyEvent'),  // ← Add here
};
```

### Step 2: Implement Handler(s)

Create `src/handlers/MyEventHandler.js`:

```javascript
const logger = require('../core/utils/logger');

async function handleMyEvent(data) {
  try {
    // Reaction logic
    logger.info('MyEventHandler: processed');
  } catch (err) {
    logger.error('MyEventHandler: failed', { meta: { error: err.message } });
    // Don't rethrow - let eventBus catch it
  }
}

module.exports = {
  handleMyEvent,
  eventName: 'my.event',
};
```

Register in `src/handlers/index.js`:

```javascript
module.exports = {
  LikeAddedHandler: require('./LikeAddedHandler'),
  MyEventHandler: require('./MyEventHandler'),  // ← Add here
};
```

### Step 3: Register Handler in server.js

In `server.js`, in the event handlers initialization section:

```javascript
(() => {
  const eventBus = require('./src/core/eventBus');
  const { handleLikeAdded } = require('./src/handlers/LikeAddedHandler');
  const { handleMyEvent } = require('./src/handlers/MyEventHandler');  // ← Add

  // Register handlers
  eventBus.subscribe('like.added', handleLikeAdded, { name: 'LikeAddedHandler' });
  eventBus.subscribe('my.event', handleMyEvent, { name: 'MyEventHandler' });  // ← Add

  logger.info('Event handlers initialized', { ... });
})();
```

### Step 4: Emit Event from Service

In the appropriate service (e.g., `src/modules/mymodule/service.js`):

```javascript
const eventBus = require('../../core/eventBus');
const MyEvent = require('../../events/MyEvent');

async function myAction(data) {
  // ... business logic ...

  // Emit event
  const event = new MyEvent({
    field1: value1,
    field2: value2,
  });

  eventBus.emit('my.event', event.toJSON()).catch(err => {
    logger.warn('Event emission failed', { meta: { error: err.message } });
  });

  return result;
}
```

---

## Testing

### Unit Test Example

```javascript
// tests/handlers/LikeAddedHandler.test.js
const { handleLikeAdded } = require('../../src/handlers/LikeAddedHandler');

describe('LikeAddedHandler', () => {
  it('should handle like event', async () => {
    const data = {
      likeId: 'uuid-1',
      postId: 'uuid-2',
      userId: 'uuid-3',
      postOwnerId: 'uuid-4',
      timestamp: new Date().toISOString(),
    };

    // Should not throw
    await handleLikeAdded(data);
  });

  it('should skip self-likes', async () => {
    const data = {
      likeId: 'uuid-1',
      postId: 'uuid-2',
      userId: 'uuid-3',
      postOwnerId: 'uuid-3',  // Same user
      timestamp: new Date().toISOString(),
    };

    // Should complete gracefully
    await handleLikeAdded(data);
  });
});
```

### Integration Test Example

```javascript
// tests/integration/likes.event.test.js
const eventBus = require('../../src/core/eventBus');
const likesService = require('../../src/modules/likes/service');

describe('Like Event Flow', () => {
  before(() => {
    eventBus.clear(); // Clean slate
  });

  it('should emit like.added event', async () => {
    let eventReceived = false;

    eventBus.subscribe('like.added', () => {
      eventReceived = true;
    }, { name: 'TestHandler' });

    // Trigger like action
    await likesService.likePost('post-123', 'user-456');

    // Wait for async handlers
    await new Promise(resolve => setTimeout(resolve, 100));

    assert(eventReceived === true, 'Event should be emitted');
  });
});
```

---

## Monitoring

### Check Event Status

```bash
# Get handler statistics
curl http://localhost:5000/api/internal/events

# Expected response:
{
  "status": "operational",
  "handlers": {
    "like.added": [
      { "name": "LikeAddedHandler", "createdAt": "2026-05-03T..." }
    ]
  },
  "totalHandlers": 1,
  "totalEvents": 1
}
```

### Logs

```
[INFO] Event handlers initialized { totalEvents: 1, events: ['like.added'] }
[DEBUG] Event emitted: like.added { eventName: 'like.added', dataKeys: ['likeId', ...] }
[INFO] LikeAddedHandler: processing { likeId: '...', postId: '...', ... }
[INFO] LikeAddedHandler: owner score updated
```

---

## Error Handling

### Handler Failures

If a handler fails:
```javascript
try {
  await handler(data);
} catch (err) {
  logger.error('Event handler error', { meta: { error: err.message } });
  // Continue - don't rethrow
}
```

**Result** :
- User still gets successful response ✓
- Like is still recorded in DB ✓
- Handler error is logged ✓
- Other handlers still execute ✓

### Event Emission Failures

If event emission fails (rare):
```javascript
eventBus.emit('like.added', event).catch(err => {
  logger.warn('Event emission failed', { meta: { error: err.message } });
  // Continue - don't break the main flow
});
```

---

## Performance Characteristics

### Latency Impact

```
Traditional (synchronous handler) :
  User action → Service → Handler → Response
  Total time : ~500ms (if handler is slow)

Event-driven (async handler) :
  User action → Service → Response ✓ (~50ms)
               ↓ (parallel)
             Handler (~400ms, asynchronously)
  User sees response immediately ✓
```

### Memory

- EventBus singleton : ~1 KB
- Handler registry : ~100 bytes per handler
- Event objects : ~500 bytes per instance

**No memory leaks** if handlers are unsubscribed properly (see `unsubscribe()`)

---

## Future Extensions

### 1. Persistent Event Log (Event Sourcing)

```javascript
// Store all events in a table for audit trail
const eventLog = await query(
  `INSERT INTO event_log (event_name, data, timestamp)
   VALUES ($1, $2, $3)`,
  [event.eventName, JSON.stringify(event), now]
);
```

### 2. Dead Letter Queue

```javascript
// Capture failed events for retry
if (handlerFailed) {
  await queue.push('dead-letter', event, { attempts: 3 });
}
```

### 3. Event Replaying

```javascript
// Replay past events (for testing, recovery)
const pastEvents = await query('SELECT * FROM event_log WHERE date > ?');
for (const event of pastEvents) {
  await eventBus.emit(event.event_name, event.data);
}
```

### 4. Webhooks

```javascript
// Send events to external services
eventBus.subscribe('like.added', async (data) => {
  await fetch('https://webhook.example.com', {
    method: 'POST',
    body: JSON.stringify(data),
  });
});
```

---

## Troubleshooting

### Handler Not Firing

```bash
# 1. Check if handler is registered
curl http://localhost:5000/api/internal/events
# Should show handler in response

# 2. Check logs
grep "Event handler registered" logs/*.log

# 3. Verify event is being emitted
grep "Event emitted:" logs/*.log

# 4. Check handler for errors
grep "Event handler error" logs/*.log
```

### Handler Errors

```javascript
// Enable detailed logging
logger.level = 'debug';

// Check handler logs
grep "LikeAddedHandler" logs/*.log
```

### Performance Issues

```javascript
// Monitor handler execution time
const start = Date.now();
await handler(data);
const duration = Date.now() - start;

if (duration > 100) {
  logger.warn('Slow handler', { duration });
}
```

---

## Best Practices

✅ **DO** :
- Keep handlers pure (no side effects on inputs)
- Use try-catch inside handlers
- Log errors gracefully
- Make handlers idempotent (safe to replay)
- Validate event data before processing
- Test handlers independently

❌ **DON'T** :
- Emit events from handlers (avoid event cascades)
- Make handlers block the main operation
- Ignore handler errors (log them!)
- Store handlers' state (use injected dependencies)
- Make assumptions about handler execution order

---

## Summary

| Aspect | Details |
|--------|---------|
| **Pattern** | Observer / EventEmitter |
| **Event Bus** | `core/eventBus.js` (singleton) |
| **Events** | `events/` (classes with validation) |
| **Handlers** | `handlers/` (pure async functions) |
| **Registration** | `server.js` (on startup) |
| **Error Handling** | Isolated (failures in handlers don't break main flow) |
| **Async** | Yes (non-blocking) |
| **Scalability** | Ready for webhooks, event sourcing, replay |
| **Testing** | Simple (handlers are pure functions) |

---

## Quick Start

1. **Create event** : `events/MyEvent.js`
2. **Create handler** : `handlers/MyEventHandler.js`
3. **Register in server.js**
4. **Emit from service** : `eventBus.emit('my.event', data)`
5. **Test** : `handlers are pure, events are validated`

Done! 🎉
