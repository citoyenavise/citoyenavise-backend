# 📊 Vue Complète du Codebase — Citoyenavise Backend

## 🎯 Résumé Exécutif

**Production System Snapshot:**
- **10 modules CORE** actifs (3931 lignes de logique métier)
- **17 modules STANDBY** inactifs (850 lignes de stubs)
- **53 endpoints API** fonctionnels
- **2 événements** en production (like.added, comment.created)
- **7299 lignes totales** (core infrastructure + modules)
- **Status**: Système vivant avec utilisateurs actifs

---

## 📁 Structure Complète de Fichiers

```
backend/
├── server.js                           (110 lignes) ← ENTRYPOINT
│   ├─ app.listen()
│   ├─ WebSocket initialization
│   ├─ Cache warmup
│   ├─ Event handler registration (like.added, comment.created)
│   └─ Graceful shutdown handlers
│
├── src/
│   ├── app.js                          (230 lignes) ← EXPRESS APP
│   │   ├─ Middleware stack
│   │   ├─ Security (helmet, CORS, CSP)
│   │   ├─ Rate limiting
│   │   ├─ Error handler
│   │   └─ moduleLoader.loadRoutes() call
│   │
│   ├── config.js                       (66 lignes) ← ENV CONFIG
│   │   ├─ Database URL
│   │   ├─ JWT secrets
│   │   ├─ Redis config
│   │   ├─ Port/host
│   │   └─ validation() method
│   │
│   ├── moduleLoader.js                 (240 lignes) ← DYNAMIC MODULE LOADING
│   │   ├─ coreModules definition (10 entries)
│   │   │   ├─ auth      → /api/v1/auth
│   │   │   ├─ users     → /api/v1/users
│   │   │   ├─ profiles  → /api/v1/profiles
│   │   │   ├─ posts     → /api/v1/posts
│   │   │   ├─ ideas     → /api/v1/ideas
│   │   │   ├─ comments  → /api/v1/comments
│   │   │   ├─ likes     → /api/v1/likes
│   │   │   ├─ search    → /api/v1/search
│   │   │   ├─ popular_system → /api/v1/popular
│   │   │   └─ map       → /api/v1/map
│   │   ├─ standbyModules definition (17 entries, commented out)
│   │   └─ loadRoutes() function
│   │
│   ├── core/                           (2454 lignes) ← INFRASTRUCTURE PARTAGÉE
│   │   │
│   │   ├── eventBus.js                 (140 lignes)
│   │   │   ├─ class EventBus extends EventEmitter
│   │   │   ├─ subscribe(eventName, handler, options)
│   │   │   ├─ async emit(eventName, data)
│   │   │   ├─ unsubscribe()
│   │   │   ├─ getHandlers()
│   │   │   └─ Error isolation via try-catch wrapper
│   │   │
│   │   ├── middleware/                 (868 lignes) ← 8 FILES
│   │   │   ├─ auth.js              ← JWT validation, req.userId injection
│   │   │   ├─ errorHandler.js      ← AppError exception handling
│   │   │   ├─ rateLimit.js         ← Redis-backed rate limiting
│   │   │   ├─ cors.js              ← CORS configuration
│   │   │   ├─ requestLogger.js     ← Winston logging
│   │   │   ├─ helmetConfig.js      ← Security headers
│   │   │   ├─ validation.js        ← Zod error handling
│   │   │   └─ errorCatcher.js      ← Async error wrapper
│   │   │
│   │   ├── services/                  (931 lignes) ← 5 FILES
│   │   │   ├─ database.js          ← Pg pool, query execution
│   │   │   ├─ cache.js             ← Redis client wrapper
│   │   │   ├─ databaseOptimization.js ← Pool warmup, connection tuning
│   │   │   ├─ optimization.js      ← Query result caching
│   │   │   └─ errorHandler.js      ← AppError class definition
│   │   │
│   │   ├── utils/                     (173 lignes) ← 3 FILES
│   │   │   ├─ jwt.js               ← Token generation/verification
│   │   │   ├─ logger.js            ← Winston configuration
│   │   │   └─ password.js          ← Bcrypt hashing/comparison
│   │   │
│   │   ├── websocket/                 (225 lignes)
│   │   │   └─ server.js            ← WebSocket real-time server
│   │   │
│   │   └── constants/                 (117 lignes)
│   │       ├─ categories.js
│   │       ├─ errors.js
│   │       └─ roles.js
│   │
│   ├── modules/                        (4781 lignes) ← 27 MODULES
│   │   │
│   │   ├── [CORE MODULES - 10]
│   │   │
│   │   ├── auth/                       (391 lignes total, service: 271)
│   │   │   ├─ controller.js           ← register, login, refresh, logout, me
│   │   │   ├─ service.js              ← registerUser, loginUser, refreshToken
│   │   │   ├─ routes.js               ← 5 endpoints
│   │   │   ├─ validation.js           ← Zod schemas (email, password)
│   │   │   └─ index.js                ← exports
│   │   │
│   │   ├── users/                      (184 lignes total, service: 118)
│   │   │   ├─ controller.js           ← getUser, updateUser, deleteUser
│   │   │   ├─ service.js              ← CRUD operations
│   │   │   ├─ routes.js               ← 3 endpoints
│   │   │   ├─ validation.js
│   │   │   └─ index.js
│   │   │
│   │   ├── profiles/                   (446 lignes total, service: 307)
│   │   │   ├─ controller.js           ← list, get, create, update, followers
│   │   │   ├─ service.js              ← Profile + follow logic
│   │   │   ├─ routes.js               ← 8 endpoints
│   │   │   ├─ validation.js
│   │   │   └─ index.js
│   │   │
│   │   ├── posts/                      (509 lignes total, service: 375)
│   │   │   ├─ controller.js           ← list, get, create, update, delete, flag, like
│   │   │   ├─ service.js              ← LARGEST SERVICE (375 lines)
│   │   │   ├─ routes.js               ← 8 endpoints
│   │   │   ├─ validation.js
│   │   │   └─ index.js
│   │   │
│   │   ├── ideas/                      (648 lignes total, service: 327)
│   │   │   ├─ controller.js           ← listIdeas, getIdea, createIdea, etc
│   │   │   ├─ service.js              ← Idea-specific logic
│   │   │   ├─ routes.js               ← 8 endpoints (multiline routes)
│   │   │   ├─ validation.js
│   │   │   └─ index.js
│   │   │
│   │   ├── comments/                   (457 lignes total, service: 246)
│   │   │   ├─ controller.js           ← createComment, getComment, updateComment, delete
│   │   │   ├─ service.js              ← EMITS EVENT: comment.created
│   │   │   ├─ routes.js               ← 5 endpoints
│   │   │   ├─ validation.js
│   │   │   └─ index.js
│   │   │
│   │   ├── likes/                      (316 lignes total, service: 190)
│   │   │   ├─ controller.js           ← likePost, unlikePost, getLikes, checkLike
│   │   │   ├─ service.js              ← EMITS EVENT: like.added
│   │   │   ├─ routes.js               ← 4 endpoints
│   │   │   ├─ validation.js
│   │   │   └─ index.js
│   │   │
│   │   ├── search/                     (352 lignes total, service: 159)
│   │   │   ├─ controller.js           ← search, searchPosts, searchUsers
│   │   │   ├─ service.js              ← Full-text search logic
│   │   │   ├─ routes.js               ← 3 endpoints
│   │   │   └─ index.js
│   │   │
│   │   ├── popular_system/             (352 lignes total, service: 163)
│   │   │   ├─ controller.js           ← getPopular, getTrends, getStats
│   │   │   ├─ service.js              ← Trending algorithm
│   │   │   ├─ routes.js               ← 4 endpoints (multiline)
│   │   │   └─ index.js
│   │   │
│   │   ├── map/                        (276 lignes total, service: 165)
│   │   │   ├─ controller.js           ← getNodes, createNode, updateNode, deleteNode
│   │   │   ├─ service.js              ← Geolocation CRUD
│   │   │   ├─ routes.js               ← 4 endpoints (admin-only)
│   │   │   ├─ validation.js
│   │   │   └─ index.js
│   │   │
│   │   ├── [STANDBY MODULES - 17]
│   │   │
│   │   ├── admin/                      (50 lignes total, service: 8)
│   │   ├── ai_mascot/                  (50 lignes total, service: 8)
│   │   ├── analytics/                  (50 lignes total, service: 8)
│   │   ├── cms/                        (50 lignes total, service: 8)
│   │   ├── content/                    (50 lignes total, service: 8)
│   │   ├── establishments/             (50 lignes total, service: 8)
│   │   ├── follow/                     (50 lignes total, service: 8)
│   │   ├── friends/                    (50 lignes total, service: 8)
│   │   ├── groups/                     (50 lignes total, service: 8)
│   │   ├── homepage/                   (50 lignes total, service: 8)
│   │   ├── influence_system/           (50 lignes total, service: 8)
│   │   ├── moderation/                 (50 lignes total, service: 8)
│   │   ├── notifications/              (50 lignes total, service: 8)
│   │   ├── official_pages/             (50 lignes total, service: 8)
│   │   ├── programmes/                 (50 lignes total, service: 8)
│   │   ├── public_dashboard/           (50 lignes total, service: 8)
│   │   └── webhooks/                   (50 lignes total, service: 8)
│   │
│   ├── events/                         (116 lignes) ← EVENT DEFINITIONS
│   │   ├─ LikeAdded.js                 (59 lignes)
│   │   │  ├─ constructor({likeId, postId, userId, postOwnerId, timestamp})
│   │   │  ├─ validate()
│   │   │  └─ toJSON()
│   │   │
│   │   ├─ CommentCreated.js            (38 lignes)
│   │   │  ├─ constructor({commentId, postId, userId, postOwnerId, timestamp})
│   │   │  ├─ validate()
│   │   │  └─ toJSON()
│   │   │
│   │   └─ index.js                     (19 lignes) ← exports all events
│   │
│   └── handlers/                       (180 lignes) ← EVENT HANDLERS
│       ├─ LikeAddedHandler.js          (106 lignes)
│       │  ├─ async handleLikeAdded(data)
│       │  ├─ Skip self-likes (line 39)
│       │  ├─ UPDATE users.updated_at (lines 47-53)
│       │  ├─ Error isolation (lines 83-95)
│       │  └─ logger.info(...)
│       │
│       ├─ CommentCreatedHandler.js     (54 lignes)
│       │  ├─ async handleCommentCreated(data)
│       │  ├─ Skip self-comments
│       │  ├─ UPDATE users.updated_at
│       │  └─ Error isolation
│       │
│       └─ index.js                     (20 lignes) ← exports all handlers
│
├── database/                           (232 lignes)
│   ├── init.js                         (35 lignes)
│   ├── migrationRunner.js              (197 lignes)
│   │
│   └── migrations/
│       ├── V001_initial_schema.sql     ← users, profiles, posts tables
│       ├── V002_authentication.sql     ← JWT tokens, sessions
│       ├── V003_posts_enhancements.sql ← flags, categories
│       ├── V004_likes_table.sql        ← likes with UPSERT
│       └── V005_comments_table.sql     ← comments with soft deletes
│
├── tests/
│   └── integration/
│       ├── events.test.js              (200 lignes)
│       ├── comments.test.js            (200 lignes)
│       └── [other test files]
│
├── logs/                               ← Winston logger output
│
├── package.json                        ← Dependencies (see section 4)
│
├── docker-compose.yml                  ← PostgreSQL + Redis services
│
└── .env.example                        ← Environment template

TOTAL STRUCTURE: ~7299 lignes
```

---

## 🔌 Modules CORE vs STANDBY

### CORE Modules (10) — Production-Ready

| Module | Route | Service | Lines | Status | Critical |
|--------|-------|---------|-------|--------|----------|
| auth | /api/v1/auth | 271 | 391 | ✅ Production | 🔴 YES |
| users | /api/v1/users | 118 | 184 | ✅ Production | 🔴 YES |
| profiles | /api/v1/profiles | 307 | 446 | ✅ Production | 🟠 IMPORTANT |
| posts | /api/v1/posts | 375 | 509 | ✅ Production | 🔴 YES |
| ideas | /api/v1/ideas | 327 | 648 | ✅ Production | 🟠 IMPORTANT |
| comments | /api/v1/comments | 246 | 457 | ✅ Production | 🟠 IMPORTANT |
| likes | /api/v1/likes | 190 | 316 | ✅ Production | 🟠 IMPORTANT |
| search | /api/v1/search | 159 | 352 | ✅ Production | 🟠 USEFUL |
| popular_system | /api/v1/popular | 163 | 352 | ✅ Production | 🟠 USEFUL |
| map | /api/v1/map | 165 | 276 | ✅ Production | 🟠 USEFUL |

**Total: 3931 lignes**

### STANDBY Modules (17) — Disabled Stubs

```
admin (8 lignes service)
ai_mascot (8 lignes service)
analytics (8 lignes service)
cms (8 lignes service)
content (8 lignes service)
establishments (8 lignes service)
follow (8 lignes service)
friends (8 lignes service)
groups (8 lignes service)
homepage (8 lignes service)
influence_system (8 lignes service)
moderation (8 lignes service)
notifications (8 lignes service)
official_pages (8 lignes service)
programmes (8 lignes service)
public_dashboard (8 lignes service)
webhooks (8 lignes service)
```

**Total: 850 lignes** (mostly boilerplate, no active implementation)

---

## 🌐 API Endpoints (53 Total)

### auth/ (5 endpoints)
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
```

### users/ (3 endpoints)
```
GET    /api/v1/users/:id
PUT    /api/v1/users/:id
DELETE /api/v1/users/:id
```

### profiles/ (8 endpoints)
```
GET    /api/v1/profiles
GET    /api/v1/profiles/:id
POST   /api/v1/profiles
PUT    /api/v1/profiles/:id
GET    /api/v1/profiles/:id/posts
GET    /api/v1/profiles/:id/followers
POST   /api/v1/profiles/:id/follow
DELETE /api/v1/profiles/:id/follow
```

### posts/ (8 endpoints)
```
GET    /api/v1/posts
GET    /api/v1/posts/:id
POST   /api/v1/posts
PUT    /api/v1/posts/:id
DELETE /api/v1/posts/:id
POST   /api/v1/posts/:id/flag
POST   /api/v1/posts/:id/like
DELETE /api/v1/posts/:id/like
```

### ideas/ (8 endpoints)
```
GET    /api/v1/ideas
GET    /api/v1/ideas/:id
POST   /api/v1/ideas
GET    /api/v1/ideas/stats
PUT    /api/v1/ideas/:id
DELETE /api/v1/ideas/:id
POST   /api/v1/ideas/:id/flag
DELETE /api/v1/ideas/:id/flag
```

### comments/ (5 endpoints)
```
POST   /api/v1/comments
GET    /api/v1/posts/:postId/comments
GET    /api/v1/comments/:commentId
PATCH  /api/v1/comments/:commentId
DELETE /api/v1/comments/:commentId
```

### likes/ (4 endpoints)
```
POST   /api/v1/likes
DELETE /api/v1/likes/:postId
GET    /api/v1/likes/posts/:postId/likes
GET    /api/v1/likes/posts/:postId/likes/check
```

### search/ (3 endpoints)
```
GET    /api/v1/search
GET    /api/v1/search/posts
GET    /api/v1/search/users
```

### popular_system/ (4 endpoints)
```
GET    /api/v1/popular
GET    /api/v1/popular/stats
GET    /api/v1/popular/trends
GET    /api/v1/popular/categories
```

### map/ (4 endpoints - admin-only)
```
GET    /api/v1/map/nodes
POST   /api/v1/map/nodes
PUT    /api/v1/map/nodes/:id
DELETE /api/v1/map/nodes/:id
```

---

## ⚡ Event System (5 Events Total)

### ✅ IMPLEMENTED (2 Events)

#### Event: like.added

**Emitted by**: `src/modules/likes/service.js` (line 75)

```javascript
eventBus.emit('like.added', {
  likeId: uuid,
  postId: uuid,
  userId: uuid,
  postOwnerId: uuid,
  timestamp: ISO8601
})
```

**Handled by**: `src/handlers/LikeAddedHandler.js`

```javascript
eventBus.subscribe('like.added', handleLikeAdded, { name: 'LikeAddedHandler' });
```

**Handler logic**:
- Skip if user likes their own post (self-like)
- UPDATE users.updated_at WHERE id = postOwnerId
- Log interaction
- Graceful error handling (no rethrow)

**Registration**: `server.js` lines 61

---

#### Event: comment.created

**Emitted by**: `src/modules/comments/service.js` (line 60)

```javascript
eventBus.emit('comment.created', {
  commentId: uuid,
  postId: uuid,
  userId: uuid,
  postOwnerId: uuid,
  timestamp: ISO8601
})
```

**Handled by**: `src/handlers/CommentCreatedHandler.js`

```javascript
eventBus.subscribe('comment.created', handleCommentCreated, { name: 'CommentCreatedHandler' });
```

**Handler logic**:
- Skip if user comments on their own post
- UPDATE users.updated_at WHERE id = postOwnerId
- Log interaction
- Graceful error handling (no rethrow)

**Registration**: `server.js` lines 62

---

### ❌ TODO - Phase 1 (3 Events to Implement)

#### Event: post.created

**Should emit from**: `src/modules/posts/service.js`

```javascript
eventBus.emit('post.created', {
  postId: uuid,
  userId: uuid,
  title: string,
  type: 'post'|'idea',
  timestamp: ISO8601
})
```

**Potential handlers**:
- Analytics tracking
- Full-text search index update
- User activity logging
- Popular system trending update

---

#### Event: post.deleted

**Should emit from**: `src/modules/posts/service.js`

```javascript
eventBus.emit('post.deleted', {
  postId: uuid,
  userId: uuid,
  timestamp: ISO8601
})
```

**Potential handlers**:
- Cache invalidation
- Search index cleanup
- Analytics tracking
- Related comments cleanup (cascade)

---

#### Event: user.registered

**Should emit from**: `src/modules/auth/service.js`

```javascript
eventBus.emit('user.registered', {
  userId: uuid,
  email: string,
  timestamp: ISO8601
})
```

**Potential handlers**:
- Welcome email (future notifications module)
- Analytics tracking
- Default profile setup
- User activity logging

---

## 📦 Dependencies (package.json)

### Node Version
```json
"engines": {
  "node": ">=18.0.0"
}
```

### Core Dependencies
```json
{
  "express": "4.18.2",
  "pg": "8.11.0",
  "redis": "4.6.10",
  "bcrypt": "5.1.1",
  "jsonwebtoken": "9.1.2",
  "zod": "3.22.4",
  "ws": "8.14.2",
  "winston": "3.11.0",
  "helmet": "7.1.0",
  "cors": "2.8.5",
  "compression": "1.7.4",
  "express-rate-limit": "7.1.5",
  "rate-limit-redis": "4.1.2"
}
```

### Dev Dependencies
```json
{
  "jest": "^29.7.0",
  "supertest": "^6.3.3",
  "nodemon": "^3.0.2"
}
```

---

## 🔗 Dependencies Between Modules

### Direct Code Dependencies
```
NONE — Modules never import each other directly
```

### Database Schema Dependencies
```
comments → posts
  - comments.post_id FK → posts.id
  - UPDATE posts.replies_count += 1

likes → posts
  - likes.post_id FK → posts.id
  - UPDATE posts.likes_count += 1

ideas → posts
  - ideas is a subtype (same table, type='idea')
```

### Core Infrastructure Dependencies
```
ALL modules depend on:
  - core/services/database.js (query execution)
  - core/middleware/auth.js (JWT validation)
  - core/utils/logger.js (Winston logging)

SELECT modules depend on:
  - comments → core/eventBus.js
  - likes → core/eventBus.js
  - posts → core/websocket/server.js
  - comments → core/websocket/server.js
  - likes → core/websocket/server.js
  - profiles → core/services/cache.js
  - popular_system → core/services/cache.js
```

---

## 🚀 Request Flow Examples

### Flow 1: User Registration (auth/register)

```
1. POST /api/v1/auth/register
2. app.js middleware stack
   - helmet, cors, compression, rateLimit, bodyParser
3. moduleLoader routes
   - Route: auth/routes.js
4. Controller: auth/controller.js → authController.register()
5. Validation: auth/validation.js (Zod)
6. Service: auth/service.js → registerUser()
   - bcrypt.hash(password)
   - db.transaction START
     - INSERT users
     - INSERT profiles
   - db.transaction COMMIT
   - Generate JWT tokens
7. Response: { user, accessToken, refreshToken }
8. server.js continues (no events)
```

### Flow 2: User Likes Post (likes/likePost)

```
1. POST /api/v1/likes
2. app.js middleware stack
3. middleware/auth.js → req.userId injected
4. moduleLoader routes
   - Route: likes/routes.js
5. Controller: likes/controller.js → likesController.likePost()
6. Validation: likes/validation.js (Zod)
7. Service: likes/service.js → likePost()
   - db.transaction START
     - INSERT/UPDATE likes (UPSERT)
     - UPDATE posts.likes_count++
     - cache.invalidate('popular:*')
     - global.wsServer.broadcast(postId, { type: 'like_update' })
   - db.transaction COMMIT
   - eventBus.emit('like.added', { likeId, postId, userId, postOwnerId, timestamp })
       ↓ ASYNC (non-blocking)
       ↓ server.js listener
       ↓ LikeAddedHandler.handleLikeAdded(data)
         - Skip if self-like
         - UPDATE users.updated_at
         - logger.info(...)
         - Catch errors silently
8. Response sent immediately: { success: true, data: { liked: true } }
9. Handler continues in background (async)
```

### Flow 3: User Comments on Post (comments/createComment)

```
1. POST /api/v1/comments
2. app.js middleware stack
3. middleware/auth.js → req.userId injected
4. moduleLoader routes
   - Route: comments/routes.js
5. Controller: comments/controller.js → commentsController.createComment()
6. Validation: comments/validation.js (Zod)
7. Service: comments/service.js → createComment()
   - Verify post exists
   - db.transaction START
     - INSERT comments
     - UPDATE posts.replies_count++
   - db.transaction COMMIT
   - eventBus.emit('comment.created', { commentId, postId, userId, postOwnerId, timestamp })
       ↓ ASYNC (non-blocking)
       ↓ server.js listener
       ↓ CommentCreatedHandler.handleCommentCreated(data)
         - Skip if self-comment
         - UPDATE users.updated_at
         - logger.info(...)
         - Catch errors silently
8. Response sent immediately: { success: true, data: comment }
9. Handler continues in background (async)
```

---

## 🔐 Security & Authentication

### JWT Authentication

**Middleware**: `core/middleware/auth.js`

```javascript
// authRequired middleware
- Verify JWT token from Authorization header
- Inject req.userId into request
- Throw 401 if token invalid/expired
```

**Token Generation**: `core/utils/jwt.js`

```javascript
generateToken(userId, expiresIn)
- Uses process.env.JWT_SECRET
- Creates accessToken (15 minutes)
- Creates refreshToken (7 days)
```

**Password Hashing**: `core/utils/password.js`

```javascript
hashPassword(password)
- Uses bcrypt.hash(password, BCRYPT_ROUNDS)
- BCRYPT_ROUNDS = 12 (default)
```

---

## 💾 Database Schema

### Main Tables

**users**
```sql
id UUID PRIMARY KEY
email VARCHAR UNIQUE
password_hash VARCHAR
created_at TIMESTAMP
updated_at TIMESTAMP
```

**profiles**
```sql
id UUID PRIMARY KEY
user_id UUID FK → users.id
username VARCHAR
avatar_url TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

**posts** (base for ideas)
```sql
id UUID PRIMARY KEY
user_id UUID FK → users.id
title VARCHAR
content TEXT
type VARCHAR (post/idea)
likes_count INTEGER DEFAULT 0
replies_count INTEGER DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
```

**comments**
```sql
id UUID PRIMARY KEY
post_id UUID FK → posts.id
user_id UUID FK → users.id
content TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
deleted_at TIMESTAMP (soft delete)
```

**likes**
```sql
id UUID PRIMARY KEY
post_id UUID FK → posts.id
user_id UUID FK → users.id
created_at TIMESTAMP
UNIQUE(post_id, user_id)
```

---

## 🧪 Testing Strategy

### Test File: tests/integration/events.test.js (200 lignes)

Tests cover:
- Event creation and validation
- Event serialization with toJSON()
- Handler error isolation
- Self-like skipping logic
- Self-comment skipping logic
- Full event flow (emit → handler execution)
- Multiple handlers per event
- Error resilience

### Test File: tests/integration/comments.test.js (200 lignes)

Tests cover:
- Comment CRUD operations
- Event emission on create
- Reply count increment
- Soft delete functionality
- Permission checks (user ownership)
- Transaction rollback on error

---

## 📊 Code Statistics

| Section | Lines | Purpose |
|---------|-------|---------|
| app.js + config.js + moduleLoader.js | 536 | Core express setup + dynamic loading |
| core/ (infrastructure) | 2454 | Middleware, services, utils |
| modules/ CORE | 3931 | Business logic (10 modules) |
| modules/ STANDBY | 850 | Disabled stubs (17 modules) |
| database/ | 232 | Migration infrastructure |
| events/ | 116 | Event definitions |
| handlers/ | 180 | Event handlers |
| **TOTAL** | **7299** | **Complete backend** |

---

## 🎯 Critical vs Nice-to-Have

### 🔴 CRITICAL (System Down if broken)
- core/services/database.js
- core/middleware/auth.js
- app.js moduleLoader integration

### 🟠 IMPORTANT (Features degrade)
- core/eventBus.js
- core/websocket/server.js
- core/services/cache.js

### 🟢 USEFUL (Nice to have)
- search, popular_system, map (non-blocking features)
- notifications, admin, analytics (future features, currently disabled)

---

## 📋 What Exists vs What Doesn't

### ✅ IMPLEMENTED
- User registration & JWT authentication
- Post CRUD with categories
- Ideas as specialized posts
- Comments with reactions
- Likes with event notifications
- Real-time updates via WebSocket
- Full-text search
- Trending/popular system
- Geolocation map nodes
- Database transactions (ACID)
- Rate limiting (Redis-backed)
- Input validation (Zod)
- Error handling (AppError wrapper)
- Logging (Winston structured logs)
- Security headers (Helmet)

### ❌ NOT IMPLEMENTED (Standby Modules)
- Notifications system (email/push)
- Admin dashboard
- Moderation tools
- User groups
- Friendship system
- Analytics dashboard
- Content management system
- AI mascot feature
- Influence system
- Webhooks
- Public dashboard

---

## 🔍 Validation Checklist

- [x] 10 CORE modules identified and analyzed
- [x] 17 STANDBY modules identified
- [x] 53 active endpoints documented
- [x] 2 event types (like.added, comment.created) confirmed
- [x] Event handlers registered in server.js
- [x] Database schema documented
- [x] All critical dependencies identified
- [x] No circular imports detected
- [x] Module loading pattern understood
- [x] Request flow traced end-to-end

---

## 🚀 Next Steps (Phase 0.2)

### VALIDATION REQUIRED

**For each CORE module, confirm:**
1. Is this module CRITICAL for the current product?
2. Is this module under ACTIVE development?
3. Are there users actively using this feature?

**Modules to validate:**
- [ ] auth — JWT-based user accounts
- [ ] users — User profile management
- [ ] profiles — Public profile display
- [ ] posts — Main content type
- [ ] ideas — Specialized posts
- [ ] comments — User discussions
- [ ] likes — Engagement metrics
- [ ] search — Content discovery
- [ ] popular_system — Trending content
- [ ] map — Geolocation features

**Questions:**
- Are all 53 endpoints in active use?
- Should any STANDBY modules be activated?
- Are there missing critical features not in this list?

---

**Document Version**: 1.0 (Snapshot of main branch)
**Last Updated**: 2026-05-04
**Generated**: COMPLETE_CODEBASE_VIEW.md
