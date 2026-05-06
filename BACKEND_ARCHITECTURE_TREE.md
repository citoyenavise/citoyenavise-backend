# 🏗️ ARCHITECTURE COMPLÈTE BACKEND — Arborescence Détaillée

## 📌 Vue Générale

```
backend/
├── ENTRYPOINT & BOOTSTRAP (2 files)
├── CONFIG & SETUP (3 files)
├── src/
│   ├── CORE / SOCLE (Infrastructure partagée)
│   ├── modules/ (10 CORE + 17 STANDBY)
│   ├── events/ (Événements système)
│   └── handlers/ (Réacteurs d'événements)
├── database/
│   ├── Migrations
│   └── Schema
├── tests/
└── Configuration files
```

---

## 🚀 ENTRYPOINT & BOOTSTRAP

### Point d'Entrée Principal

```
backend/
├── server.js ⭐ ⭐ ⭐ ENTRYPOINT PRIMAIRE
│   └─ 110 lignes
│   ├─ require('./src/app') → Express app
│   ├─ require('./src/config') → Environment validation
│   ├─ app.listen(PORT) → Start server
│   ├─ WebSocket initialization
│   ├─ Cache & Database warmup
│   ├─ Event handler registration
│   │   ├─ eventBus.subscribe('like.added', handleLikeAdded)
│   │   └─ eventBus.subscribe('comment.created', handleCommentCreated)
│   └─ Graceful shutdown handlers (SIGTERM, SIGINT)
│
├── setup.js ⭐ ⭐ BOOTSTRAP SCRIPT
│   └─ Database setup (dev environment)
│   ├─ Run migrations
│   ├─ Seed initial data (optional)
│   └─ Initialize indices
│
└── package.json ⭐ DÉPENDANCES
    ├─ Node: >=18.0.0
    ├─ Dependencies:
    │   ├─ express: 4.18.2 (HTTP framework)
    │   ├─ pg: 8.11.0 (PostgreSQL client)
    │   ├─ redis: 4.6.10 (Cache + rate-limit)
    │   ├─ ws: 8.14.2 (WebSocket)
    │   ├─ bcrypt: 5.1.1 (Password hashing)
    │   ├─ jsonwebtoken: 9.1.2 (JWT)
    │   ├─ zod: 3.22.4 (Input validation)
    │   ├─ winston: 3.11.0 (Logging)
    │   ├─ helmet: 7.1.0 (Security headers)
    │   ├─ cors: 2.8.5
    │   ├─ compression: 1.7.4
    │   ├─ express-rate-limit: 7.1.5
    │   └─ Other utilities
    └─ Scripts:
        ├─ start: node server.js
        ├─ dev: nodemon server.js
        ├─ test: jest
        └─ setup: node setup.js
```

---

## ⚙️ CONFIG & SETUP INFRASTRUCTURE

```
backend/src/
│
├── app.js ⭐ ⭐ ⭐ EXPRESS APPLICATION
│   └─ 230 lignes
│   ├─ Middleware stack (ordered):
│   │   ├─ helmet (security headers)
│   │   ├─ cors (cross-origin)
│   │   ├─ compression (gzip)
│   │   ├─ express.json({ limit: '1mb' })
│   │   ├─ requestLogger (Winston)
│   │   ├─ responseFormatter (standardize API responses)
│   │   ├─ readTimeout (10s default)
│   │   ├─ authOptional (for public routes)
│   │   ├─ rateLimit (global: 100 req/15min)
│   │   ├─ rateLimit (per-endpoint: auth, posts, etc)
│   │   └─ Swagger docs (/api/docs)
│   ├─ Health checks:
│   │   ├─ GET /health (liveness probe)
│   │   └─ GET /ready (readiness probe + cache/db check)
│   ├─ Internal monitoring:
│   │   └─ GET /api/internal/modules (module status)
│   ├─ moduleLoader.loadRoutes(app) ← Load all CORE modules
│   ├─ 404 handler (notFound)
│   ├─ Sentry integration (if SENTRY_DSN)
│   └─ Global error handler (MUST be last)
│
├── config.js ⭐ ENVIRONMENT & CONFIGURATION
│   └─ 66 lignes
│   ├─ Database:
│   │   ├─ DATABASE_URL
│   │   ├─ DB_POOL_SIZE
│   │   └─ DB_TIMEOUT
│   ├─ Redis:
│   │   ├─ REDIS_URL
│   │   └─ REDIS_PASSWORD
│   ├─ Security:
│   │   ├─ JWT_SECRET
│   │   ├─ JWT_EXPIRY
│   │   ├─ BCRYPT_ROUNDS
│   │   └─ TOKEN_BLACKLIST_TTL
│   ├─ CORS:
│   │   ├─ CORS_ORIGIN
│   │   └─ FRONTEND_URL
│   ├─ Monitoring:
│   │   ├─ SENTRY_DSN
│   │   ├─ LOG_LEVEL
│   │   └─ NODE_ENV
│   └─ validate() → Check all required env vars
│
└── moduleLoader.js ⭐ ⭐ DYNAMIC MODULE LOADING
    └─ 241 lignes
    ├─ coreModules definition (10 modules):
    │   ├─ auth → /api/v1/auth
    │   ├─ users → /api/v1/users
    │   ├─ profiles → /api/v1/profiles
    │   ├─ posts → /api/v1/posts
    │   ├─ ideas → /api/v1/ideas
    │   ├─ comments → /api/v1/comments
    │   ├─ likes → /api/v1/likes
    │   ├─ search → /api/v1/search
    │   ├─ popular_system → /api/v1/popular
    │   └─ map → /api/v1/map
    ├─ standbyModules (17 commented modules)
    ├─ loadRoutes(app) function:
    │   ├─ For each CORE module:
    │   │   ├─ Check routes.js exists
    │   │   ├─ Verify service.js is complete (>50 lines)
    │   │   ├─ require(routes.js)
    │   │   └─ app.use(routePath, routes)
    │   └─ Log startup summary
    ├─ getModuleStatus() → Return {core, standby, all}
    └─ isModuleComplete() → Verify service.js has real code
```

---

## 🔌 CORE / SOCLE INFRASTRUCTURE

### Répertoire: `src/core/` (2454 lignes)

La couche infrastructure partagée par TOUS les modules.

```
src/core/
│
├── 📚 CONSTANTS
│   ├── constants/
│   │   ├── roles.js (117 lignes total)
│   │   │   ├─ ROLES = { ADMIN, MODERATOR, USER, GUEST }
│   │   │   └─ Role-based access control constants
│   │   ├── categories.js
│   │   │   ├─ POST_CATEGORIES
│   │   │   └─ IDEA_CATEGORIES
│   │   └── errors.js
│   │       ├─ ERROR_CODES
│   │       └─ ERROR_MESSAGES
│
├── 🔐 MIDDLEWARE (868 lignes — 8 files)
│   │
│   ├── auth.js ⭐ ⭐ ⭐ CRITICAL
│   │   ├─ authRequired middleware
│   │   │   ├─ Verify JWT token from Authorization header
│   │   │   ├─ Extract userId from token
│   │   │   ├─ Inject req.userId
│   │   │   └─ Throw 401 if invalid
│   │   │
│   │   └─ authOptional middleware
│   │       ├─ Try to extract userId
│   │       ├─ req.userId = userId || null
│   │       └─ Continue (no 401)
│   │
│   ├── errorHandler.js ⭐ ⭐ CRITICAL
│   │   ├─ class AppError(message, statusCode)
│   │   ├─ errorHandler(err, req, res, next)
│   │   │   ├─ Check if err is AppError
│   │   │   ├─ Return {success: false, error: message}
│   │   │   └─ Log error with requestId
│   │   ├─ asyncHandler(fn) → Wrap async route handlers
│   │   └─ notFound (404 handler)
│   │
│   ├── rateLimit.js
│   │   ├─ getGlobalLimiter()
│   │   │   └─ 100 req/15min per IP
│   │   ├─ getAuthLimiter()
│   │   │   └─ 5 failed attempts/15min (reset on success)
│   │   ├─ getRateLimiter(limit, window, options)
│   │   │   └─ Custom per-endpoint limiter
│   │   └─ Redis-backed for distributed systems
│   │
│   ├── requestLogger.js
│   │   ├─ Generate requestId (for tracing)
│   │   ├─ Log request metadata (method, path, user)
│   │   └─ Winston structured logging
│   │
│   ├── responseFormatter.js
│   │   ├─ Standardize all API responses:
│   │   │   {
│   │   │     "success": true/false,
│   │   │     "data": {...},
│   │   │     "error": null/string,
│   │   │     "meta": {...}
│   │   │   }
│   │   └─ res.json() wrapper
│   │
│   ├── securityHeaders.js
│   │   ├─ X-Content-Type-Options: nosniff
│   │   ├─ X-Frame-Options: DENY
│   │   ├─ X-XSS-Protection: 1; mode=block
│   │   └─ Additional security headers
│   │
│   ├── timeout.js
│   │   ├─ readTimeout middleware
│   │   └─ 10s request timeout (prevents hangs)
│   │
│   └── validation.js
│       ├─ validateWithZod(schema)
│       ├─ Error handling for Zod validation failures
│       └─ Uniform error response format
│
├── 💾 SERVICES (931 lignes — 5 files)
│   │
│   ├── database.js ⭐ ⭐ ⭐ CRITICAL
│   │   ├─ Pool connection to PostgreSQL
│   │   ├─ query(sql, params)
│   │   │   ├─ Parameterized queries (SQL injection safe)
│   │   │   └─ Return { rows, rowCount }
│   │   ├─ transaction(callback)
│   │   │   ├─ BEGIN → callback(client) → COMMIT
│   │   │   ├─ On error: ROLLBACK
│   │   │   └─ ACID guarantees
│   │   ├─ healthCheck()
│   │   │   └─ Check DB connectivity (liveness probe)
│   │   └─ Connection pooling:
│   │       ├─ min: 2 connections
│   │       ├─ max: 20 connections
│   │       └─ idleTimeoutMillis: 30000
│   │
│   ├── cache.js
│   │   ├─ Redis client wrapper
│   │   ├─ connect()
│   │   ├─ get(key)
│   │   ├─ set(key, value, ttl)
│   │   ├─ delete(key)
│   │   ├─ invalidate(pattern)
│   │   └─ Used by: profiles, popular_system, search
│   │
│   ├── databaseOptimization.js
│   │   ├─ warmupPool()
│   │   │   └─ Pre-connect N connections on startup
│   │   └─ Connection tuning
│   │
│   ├── queryCache.js
│   │   ├─ Cache expensive query results
│   │   └─ Invalidate on mutations
│   │
│   └── tokenBlacklist.js
│       ├─ Blacklist revoked JWT tokens
│       ├─ Redis-backed TTL
│       └─ Check on protected routes
│
├── 🔧 UTILS (173 lignes — 3 files)
│   │
│   ├── jwt.js
│   │   ├─ generateTokens(userId)
│   │   │   ├─ Create accessToken (15 min expiry)
│   │   │   ├─ Create refreshToken (7 days expiry)
│   │   │   └─ Use JWT_SECRET from config
│   │   ├─ verifyToken(token)
│   │   │   ├─ Verify signature
│   │   │   ├─ Check expiry
│   │   │   └─ Return payload {userId, iat, exp}
│   │   └─ decodeToken(token) → Get payload without verify
│   │
│   ├── logger.js
│   │   ├─ Winston configuration
│   │   ├─ Structured logging:
│   │   │   ├─ logger.info(message, {meta: {...}})
│   │   │   ├─ logger.warn()
│   │   │   ├─ logger.error()
│   │   │   └─ logger.debug()
│   │   ├─ Log transport:
│   │   │   ├─ Console (development)
│   │   │   ├─ File logs/app.log (production)
│   │   │   └─ Rotation daily
│   │   └─ requestId correlation
│   │
│   └── password.js
│       ├─ hashPassword(password) → bcrypt hash (BCRYPT_ROUNDS=12)
│       └─ comparePassword(plaintext, hash) → boolean
│
├── 🌐 WEBSOCKET (225 lignes)
│   │
│   └── websocket/server.js
│       ├─ WebSocketServer class
│       ├─ attach() → Attach to HTTP server
│       ├─ broadcast(postId, data)
│       │   ├─ Send real-time update to all connected clients
│       │   └─ Used by: posts, comments, likes modules
│       ├─ Connection pool management
│       ├─ Event types:
│       │   ├─ post_created
│       │   ├─ post_updated
│       │   ├─ comment_created
│       │   ├─ like_update
│       │   └─ etc.
│       └─ shutdown() → Graceful disconnection
│
├── 📡 EVENT BUS (140 lignes)
│   │
│   └── eventBus.js ⭐ ⭐ IMPORTANT
│       ├─ class EventBus extends EventEmitter
│       ├─ subscribe(eventName, handler, {name})
│       │   ├─ Register async handler
│       │   ├─ Error isolation (try-catch wrapper)
│       │   └─ Return unsubscribe function
│       ├─ async emit(eventName, data)
│       │   ├─ Fire all handlers in parallel
│       │   ├─ Return promise (non-blocking)
│       │   └─ Errors logged but don't throw
│       ├─ unsubscribe(eventName, handlerName)
│       ├─ getHandlers() → Debug info
│       └─ Current events:
│           ├─ like.added
│           └─ comment.created
│
└── 🔍 SWAGGER (swagger.js)
    └─ OpenAPI 3.0 documentation
        ├─ Auto-generate from routes
        ├─ /api/docs endpoint
        └─ Interactive Swagger UI
```

---

## 📦 MODULES (10 CORE + 17 STANDBY)

### Pattern de Module

```
module/
├── controller.js    (HTTP request handlers)
├── service.js       (Business logic)
├── routes.js        (Route definitions)
├── validation.js    (Zod schemas - if needed)
├── schema.js        (DB schema - if needed)
└── index.js         (Export routes)
```

### CORE MODULES (Actifs)

```
src/modules/
│
├── 🔐 auth/ ⭐ ⭐ ⭐ (391 lignes, service: 271)
│   ├─ controller.js
│   │   ├─ register(req, res)
│   │   ├─ login(req, res)
│   │   ├─ refresh(req, res) → New access token
│   │   ├─ logout(req, res) → Blacklist token
│   │   └─ me(req, res) → Current user
│   │
│   ├─ service.js
│   │   ├─ registerUser(email, password, name)
│   │   │   ├─ Hash password with bcrypt
│   │   │   ├─ INSERT users (transaction)
│   │   │   ├─ INSERT profiles
│   │   │   ├─ Generate JWT tokens
│   │   │   └─ Return {user, accessToken, refreshToken}
│   │   │
│   │   ├─ loginUser(email, password)
│   │   │   ├─ Find user by email
│   │   │   ├─ Compare password with hash
│   │   │   ├─ Check token blacklist
│   │   │   └─ Generate tokens
│   │   │
│   │   ├─ refreshToken(refreshToken)
│   │   │   ├─ Verify refresh token
│   │   │   ├─ Generate new access token
│   │   │   └─ Return accessToken
│   │   │
│   │   ├─ logout(token)
│   │   │   └─ Add token to blacklist (Redis)
│   │   │
│   │   └─ validateEmail(email) → Zod validation
│   │
│   ├─ routes.js
│   │   ├─ POST /register
│   │   ├─ POST /login
│   │   ├─ POST /refresh
│   │   ├─ POST /logout (authRequired)
│   │   └─ GET /me (authRequired)
│   │
│   ├─ validation.js
│   │   ├─ registerSchema
│   │   ├─ loginSchema
│   │   └─ refreshSchema
│   │
│   └─ index.js
│       └─ exports router
│
├── 👤 users/ ⭐ ⭐ (184 lignes, service: 118)
│   ├─ User profile CRUD
│   ├─ service.js: getUser, updateUser, deleteUser
│   ├─ controller.js: HTTP handlers
│   └─ routes.js:
│       ├─ GET /:id
│       ├─ PUT /:id (authRequired)
│       └─ DELETE /:id (authRequired, ownership check)
│
├── 👨‍💼 profiles/ ⭐ ⭐ (446 lignes, service: 307)
│   ├─ Public profile display
│   ├─ Follow system
│   ├─ service.js:
│   │   ├─ getProfile(id)
│   │   ├─ listProfiles(limit, offset)
│   │   ├─ createProfile(userId, name, bio)
│   │   ├─ updateProfile(userId, data)
│   │   ├─ followUser(userId, targetId)
│   │   ├─ unfollowUser(userId, targetId)
│   │   └─ getFollowers(userId)
│   └─ routes.js:
│       ├─ GET / (list profiles)
│       ├─ GET /:id
│       ├─ POST / (authRequired, create profile)
│       ├─ PUT /:id (authRequired, update)
│       ├─ GET /:id/posts
│       ├─ GET /:id/followers
│       ├─ POST /:id/follow (authRequired)
│       └─ DELETE /:id/follow (authRequired)
│
├── 📝 posts/ ⭐ ⭐ (509 lignes, service: 375)
│   ├─ Main content creation/reading
│   ├─ Like/unlike inline (not via likes module)
│   ├─ service.js: (LARGEST SERVICE - 375 lines)
│   │   ├─ listPosts(limit, offset, filters)
│   │   ├─ getPost(id)
│   │   ├─ createPost(userId, title, content, category)
│   │   │   ├─ INSERT posts (transaction)
│   │   │   ├─ UPDATE users.posts_count++
│   │   │   ├─ Invalidate cache
│   │   │   ├─ WebSocket broadcast
│   │   │   └─ (NO event emitted)
│   │   ├─ updatePost(id, data)
│   │   ├─ deletePost(id)
│   │   ├─ flagPost(id, reason)
│   │   ├─ likePost(userId, postId) [inline]
│   │   ├─ unlikePost(userId, postId) [inline]
│   │   └─ getPostStats(id)
│   └─ routes.js:
│       ├─ GET / (list)
│       ├─ GET /:id
│       ├─ POST / (authRequired)
│       ├─ PUT /:id (authRequired, ownership)
│       ├─ DELETE /:id (authRequired, ownership)
│       ├─ POST /:id/flag
│       ├─ POST /:id/like (authRequired) [inline]
│       └─ DELETE /:id/like (authRequired) [inline]
│
├── 💡 ideas/ ⭐ ⭐ (648 lignes, service: 327)
│   ├─ Specialized post type (type='idea' in posts table)
│   ├─ service.js:
│   │   ├─ listIdeas(limit, offset, filters)
│   │   ├─ getIdea(id)
│   │   ├─ createIdea(userId, title, description, category)
│   │   ├─ updateIdea(id, data)
│   │   ├─ deleteIdea(id)
│   │   ├─ flagIdea(id, reason)
│   │   ├─ unflagIdea(id)
│   │   ├─ getIdeaStats(id) → votes, comments, etc.
│   │   └─ Ideas are posts where type='idea'
│   └─ routes.js:
│       ├─ GET / (listIdeas)
│       ├─ GET /:id (getIdea)
│       ├─ POST / (createIdea, authRequired)
│       ├─ GET /stats (getIdeaStats)
│       ├─ PUT /:id (updateIdea, authRequired)
│       ├─ DELETE /:id (deleteIdea, authRequired)
│       ├─ POST /:id/flag (flagIdea)
│       └─ DELETE /:id/flag (unflagIdea)
│
├── 💬 comments/ ⭐ ⭐ (457 lignes, service: 246)
│   ├─ User discussions on posts
│   ├─ EMITS EVENT: comment.created
│   ├─ service.js:
│   │   ├─ createComment(postId, userId, content)
│   │   │   ├─ Verify post exists
│   │   │   ├─ INSERT comments (transaction)
│   │   │   ├─ UPDATE posts.replies_count++
│   │   │   ├─ EMIT 'comment.created' event
│   │   │   └─ Return comment data
│   │   ├─ getComment(id)
│   │   ├─ getCommentsByPost(postId, limit, offset)
│   │   ├─ updateComment(id, content)
│   │   ├─ deleteComment(id) → Soft delete
│   │   └─ getCommentStats(postId)
│   └─ routes.js:
│       ├─ POST / (authRequired)
│       ├─ GET /posts/:postId/comments
│       ├─ GET /:commentId
│       ├─ PATCH /:commentId (authRequired, ownership)
│       └─ DELETE /:commentId (authRequired, ownership)
│
├── 👍 likes/ ⭐ ⭐ (316 lignes, service: 190)
│   ├─ Engagement metrics (alternative to post.likePost)
│   ├─ EMITS EVENT: like.added
│   ├─ service.js:
│   │   ├─ likePost(userId, postId)
│   │   │   ├─ UPSERT likes
│   │   │   ├─ UPDATE posts.likes_count++
│   │   │   ├─ Cache invalidate
│   │   │   ├─ WebSocket broadcast
│   │   │   └─ EMIT 'like.added' event
│   │   ├─ unlikePost(userId, postId)
│   │   ├─ getLikes(postId, limit, offset)
│   │   ├─ checkLike(userId, postId) → {liked: boolean}
│   │   └─ getLikeStats(postId)
│   └─ routes.js:
│       ├─ POST / (authRequired) → like
│       ├─ DELETE /:postId (authRequired) → unlike
│       ├─ GET /posts/:postId/likes (list)
│       └─ GET /posts/:postId/likes/check (check if liked)
│
├── 🔍 search/ ⭐ (352 lignes, service: 159)
│   ├─ Full-text search across posts & users
│   ├─ service.js:
│   │   ├─ searchAll(query, limit, offset)
│   │   │   └─ Search in posts.title, posts.content, users.name
│   │   ├─ searchPosts(query, limit, offset)
│   │   └─ searchUsers(query, limit, offset)
│   └─ routes.js:
│       ├─ GET / (search all)
│       ├─ GET /posts (search posts)
│       └─ GET /users (search users)
│
├── 📊 popular_system/ ⭐ (352 lignes, service: 163)
│   ├─ Trending posts algorithm
│   ├─ Popular categories
│   ├─ service.js:
│   │   ├─ getPopularPosts(limit) → Trending algorithm
│   │   ├─ getTrends(timeWindow) → Hourly/daily trends
│   │   ├─ getPopularCategories()
│   │   └─ getStats() → System-wide stats
│   └─ routes.js:
│       ├─ GET / (getPopularPosts)
│       ├─ GET /stats (getStats)
│       ├─ GET /trends (getTrends)
│       └─ GET /categories (getPopularCategories)
│
└── 🗺️ map/ ⭐ (276 lignes, service: 165)
    ├─ Geolocation nodes (admin-only)
    ├─ service.js:
    │   ├─ getMapNodes(filters)
    │   ├─ createNode(data) [admin only]
    │   ├─ updateNode(id, data) [admin only]
    │   ├─ deleteNode(id) [admin only]
    │   └─ Map visualization
    └─ routes.js:
        ├─ GET /nodes
        ├─ POST /nodes (requireRole: admin)
        ├─ PUT /nodes/:id (requireRole: admin)
        └─ DELETE /nodes/:id (requireRole: admin)

### STANDBY MODULES (17 - Désactivés, stubs)

```
src/modules/
├── admin/ (50 lignes)
├── ai_mascot/ (50 lignes)
├── analytics/ (50 lignes)
├── cms/ (50 lignes)
├── content/ (50 lignes)
├── establishments/ (50 lignes)
├── follow/ (50 lignes) [Note: profiles has built-in follow]
├── friends/ (50 lignes)
├── groups/ (50 lignes)
├── homepage/ (50 lignes)
├── influence_system/ (50 lignes)
├── moderation/ (50 lignes)
├── notifications/ (50 lignes)
├── official_pages/ (50 lignes)
├── programmes/ (50 lignes)
├── public_dashboard/ (50 lignes)
└── webhooks/ (50 lignes)

Chacun contient:
├── controller.js (stub)
├── service.js (stub: "À implémenter")
├── routes.js (stub: empty routes)
├── schema.js (empty)
└── index.js (export empty router)

⏸️ Raison: Réduire la complexité et clarifier l'architecture
🚀 À réactiver quand implémentés (>80 lignes de code réel)
```

---

## ⚡ EVENTS & HANDLERS

```
src/events/ (116 lignes)
│
├── LikeAdded.js (59 lignes)
│   ├─ class LikeAdded
│   ├─ constructor({likeId, postId, userId, postOwnerId, timestamp})
│   ├─ validate() → Check required fields
│   └─ toJSON() → Serializable form
│
├── CommentCreated.js (38 lignes)
│   ├─ class CommentCreated
│   ├─ constructor({commentId, postId, userId, postOwnerId, timestamp})
│   ├─ validate()
│   └─ toJSON()
│
└── index.js (19 lignes)
    └─ exports {LikeAdded, CommentCreated}

src/handlers/ (180 lignes)
│
├── LikeAddedHandler.js (106 lignes)
│   ├─ async handleLikeAdded(data)
│   ├─ Skip if self-like (userId === postOwnerId)
│   ├─ UPDATE users.updated_at WHERE id = postOwnerId
│   ├─ Log interaction
│   ├─ Graceful error isolation (catch, don't rethrow)
│   └─ Async, non-blocking
│
├── CommentCreatedHandler.js (54 lignes)
│   ├─ async handleCommentCreated(data)
│   ├─ Skip if self-comment
│   ├─ UPDATE users.updated_at
│   ├─ Log
│   └─ Error isolation
│
└── index.js (20 lignes)
    └─ exports handlers

Registration: server.js lines 61-62
├─ eventBus.subscribe('like.added', handleLikeAdded, {name: 'LikeAddedHandler'})
└─ eventBus.subscribe('comment.created', handleCommentCreated, {name: 'CommentCreatedHandler'})
```

---

## 💾 DATABASE

```
database/
│
├── schema.sql
│   ├─ CREATE TABLE users
│   │   ├─ id UUID PRIMARY KEY
│   │   ├─ email VARCHAR UNIQUE
│   │   ├─ password_hash VARCHAR
│   │   ├─ created_at, updated_at
│   │   └─ Indices: email
│   │
│   ├─ CREATE TABLE profiles
│   │   ├─ id UUID PRIMARY KEY
│   │   ├─ user_id UUID FK → users
│   │   ├─ name, bio, avatar_url
│   │   └─ Indices: user_id
│   │
│   ├─ CREATE TABLE posts
│   │   ├─ id UUID PRIMARY KEY
│   │   ├─ user_id UUID FK → users
│   │   ├─ title TEXT, content TEXT
│   │   ├─ type: 'post' | 'idea'
│   │   ├─ category VARCHAR
│   │   ├─ likes_count, replies_count (denormalized)
│   │   ├─ status, is_flagged, deleted_at (soft delete)
│   │   └─ Indices: user_id, created_at DESC, status, deleted_at
│   │
│   ├─ CREATE TABLE comments
│   │   ├─ id UUID PRIMARY KEY
│   │   ├─ post_id UUID FK → posts
│   │   ├─ user_id UUID FK → users
│   │   ├─ content TEXT
│   │   ├─ deleted_at (soft delete)
│   │   └─ Indices: post_id, user_id, created_at DESC
│   │
│   ├─ CREATE TABLE likes
│   │   ├─ id UUID PRIMARY KEY
│   │   ├─ post_id UUID FK → posts
│   │   ├─ user_id UUID FK → users
│   │   ├─ UNIQUE(post_id, user_id) → One like per post per user
│   │   └─ Indices: post_id, user_id
│   │
│   └─ Autres tables: sessions, follows, etc.
│
├── migrations/
│   ├─ V001_initial_schema.sql (Create base tables)
│   ├─ V002_authentication.sql (JWT + sessions)
│   ├─ V003_posts_enhancements.sql (Flags, categories)
│   ├─ V004_likes_table.sql (Likes with UPSERT)
│   └─ V005_comments_table.sql (Comments + soft deletes)
│
├── init.js (35 lignes)
│   └─ Database initialization (dev env setup)
│
└── migrationRunner.js (197 lignes)
    ├─ Run migrations on startup
    ├─ Track applied migrations
    ├─ Rollback support (optional)
    └─ Error handling
```

---

## 🧪 TESTS

```
tests/
│
├── setup.js
│   └─ Jest configuration
│
├── integration/
│   ├─ auth.test.js
│   │   ├─ Register + login flow
│   │   ├─ JWT token validation
│   │   └─ Token refresh/logout
│   │
│   ├─ comments.test.js (200 lignes)
│   │   ├─ Comment CRUD
│   │   ├─ Event emission on create
│   │   ├─ Reply count increment
│   │   └─ Permission checks
│   │
│   └─ events.test.js (200 lignes)
│       ├─ Event creation & validation
│       ├─ Handler error isolation
│       ├─ Event flow end-to-end
│       └─ Multiple handlers per event
│
└── unit/
    ├─ errorHandler.test.js
    ├─ jwt.test.js
    └─ validation.test.js
```

---

## 📋 CONFIG FILES

```
backend/
│
├── package.json
│   ├─ Dependencies (express, pg, redis, etc.)
│   ├─ Dev dependencies (jest, nodemon, etc.)
│   └─ Scripts: start, dev, test, setup
│
├── .eslintrc.js
│   └─ ESLint configuration
│
├── jest.config.js
│   └─ Jest testing framework config
│
└── .gitignore
    ├─ node_modules/
    ├─ .env
    ├─ logs/
    └─ etc.
```

---

## 🔄 FLUX DE DÉMARRAGE (Startup Flow)

```
1. npm start
   ↓
2. server.js (ENTRYPOINT)
   ├─ require('./src/app')
   ├─ require('./src/config') → config.validate()
   ├─ cache.connect() → Redis
   ├─ databaseOptimization.warmupPool() → Pg pool warm
   ├─ app.listen(PORT)
   │  ├─ app.js middleware stack
   │  ├─ moduleLoader.loadRoutes(app)
   │  │  ├─ For each coreModules:
   │  │  │  ├─ require(routes.js)
   │  │  │  └─ app.use(path, routes)
   │  │  └─ Log startup summary
   │  └─ Server listening on PORT
   │
   ├─ wsServer = new WebSocketServer(server)
   ├─ wsServer.attach()
   │  └─ WebSocket server ready
   │
   └─ Register event handlers:
      ├─ eventBus.subscribe('like.added', handleLikeAdded)
      ├─ eventBus.subscribe('comment.created', handleCommentCreated)
      └─ Log: "Event handlers initialized"

3. Ready! Server accepts requests
   ├─ Health check: GET /health ✓
   ├─ Readiness check: GET /ready ✓
   ├─ All 10 CORE modules loaded ✓
   └─ All 53 endpoints available ✓
```

---

## 🎯 RÉSUMÉ ARCHITECTURE

| Section | Fichiers | Lignes | Rôle |
|---------|----------|--------|------|
| **ENTRYPOINT** | server.js + setup.js | 110 + 50 | Bootstrap & startup |
| **CONFIG** | app.js, config.js, moduleLoader.js | 536 | Express app + config + module loading |
| **CORE/SOCLE** | middleware/ + services/ + utils/ + eventBus | 2454 | Infrastructure partagée |
| **MODULES CORE** | 10 modules × 4-5 files | 3931 | Business logic (production) |
| **MODULES STANDBY** | 17 modules × 5 files | 850 | Stubs (disabled) |
| **DATABASE** | migrations/ + init.js + schema.sql | 232 | Schema + migrations |
| **EVENTS** | events/ + handlers/ | 296 | Event system |
| **WEBSOCKET** | websocket/server.js | 225 | Real-time updates |
| **TESTS** | tests/ (integration + unit) | 400+ | Quality assurance |
| **TOTAL** | ~180 files | **~7300 lignes** | Complete backend system |

---

## ✅ Fichiers Clés pour Migration TypeScript

**À convertir (dans cet ordre):**

1. ✅ `server.js` (entrypoint)
2. ✅ `src/app.js` (Express)
3. ✅ `src/config.js` (config)
4. ✅ `src/moduleLoader.js` (module loading)
5. ✅ `src/core/services/database.js` (critical)
6. ✅ `src/core/middleware/auth.js` (critical)
7. ✅ `src/core/eventBus.js` (event system)
8. ✅ Modules CORE (1 par semaine)
9. ✅ `src/core/`tous les fichiers
10. ✅ Tests

---

**Document Version**: 1.0  
**Date**: 2026-05-04  
**Status**: Complete architecture overview ✅
