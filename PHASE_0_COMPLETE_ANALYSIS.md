# 📊 PHASE 0 — ANALYSE COMPLÈTE BACKEND CITOYENAVISE
**Tout en un seul fichier pour Copilot/Claude sur iPhone**

**Date**: 2026-05-04  
**Status**: ✅ Phase 0 Complète + Validée Humainement  
**Total Lignes Code**: 7299  

---

## 🎯 RÉSUMÉ EXÉCUTIF (Lire en premier)

### Architecture Réelle
- **10 modules CORE** actifs en production (3931 lignes)
- **17 modules STANDBY** désactivés (850 lignes)
- **53 endpoints API** fonctionnels
- **2 événements** implémentés + 3 à ajouter
- **7299 lignes totales** code backend

### Validation Humaine ✅
- ✅ 10 modules CORE = vrais modules du produit
- ✅ 53 endpoints = tous en production
- ✅ Classification modules = correcte
- ✅ Aucun module manquant

### Prochaines Étapes
- Phase 1: Migration TypeScript incrémentale (10 semaines)
- Zéro downtime, backward compatible
- Module par module (auth, users, profiles, etc.)

---

## 📁 ARBORESCENCE COMPLÈTE

### ENTRYPOINT

```
backend/
├── server.js ⭐⭐⭐ (110 lignes)
│   ├─ ENTRYPOINT primaire
│   ├─ Charge app
│   ├─ Init cache + DB
│   ├─ Enregistre event handlers
│   ├─ Startup WebSocket
│   └─ Graceful shutdown
│
├── package.json
│   ├─ Node >=18.0.0
│   ├─ Dependencies: express, pg, redis, ws, bcrypt, jwt, zod, winston
│   ├─ Scripts: start, dev, test, setup
│   └─ Dev: jest, nodemon, supertest
│
└── setup.js
    └─ Bootstrap database (dev)
```

### SRC/ - APPLICATION

```
src/
├── app.js ⭐⭐ (230 lignes)
│   ├─ Express application
│   ├─ Middleware stack:
│   │   ├─ helmet (security)
│   │   ├─ cors
│   │   ├─ compression
│   │   ├─ bodyParser
│   │   ├─ requestLogger
│   │   ├─ responseFormatter
│   │   ├─ authOptional
│   │   └─ rateLimit
│   ├─ moduleLoader.loadRoutes(app) ← Load 10 CORE modules
│   ├─ Health checks: /health, /ready
│   ├─ Swagger docs: /api/docs
│   └─ Global error handler
│
├── config.js ⭐ (66 lignes)
│   ├─ DATABASE_URL, REDIS_URL
│   ├─ JWT_SECRET, JWT_EXPIRY
│   ├─ CORS_ORIGIN, FRONTEND_URL
│   ├─ NODE_ENV, LOG_LEVEL
│   ├─ SENTRY_DSN (monitoring)
│   └─ validate() → Check env vars
│
└── moduleLoader.js ⭐⭐ (241 lignes)
    ├─ Définit coreModules (10)
    ├─ Définit standbyModules (17)
    ├─ loadRoutes(app)
    │   ├─ For each module:
    │   │   ├─ require(routes.js)
    │   │   ├─ app.use(path, routes)
    │   │   └─ Log startup
    │   └─ Return stats
    ├─ getModuleStatus()
    └─ isModuleComplete()
```

### CORE/ - INFRASTRUCTURE PARTAGÉE (2454 lignes)

#### Middleware (868 lignes)

```
src/core/middleware/
│
├── auth.js ⭐⭐⭐ CRITICAL
│   ├─ authRequired → Verify JWT, inject req.userId, 401 if invalid
│   └─ authOptional → Try to extract userId, no error if missing
│
├── errorHandler.js ⭐⭐ CRITICAL
│   ├─ class AppError(message, statusCode)
│   ├─ errorHandler(err, req, res, next)
│   ├─ asyncHandler(fn) → Wrap async handlers
│   └─ notFound (404)
│
├── rateLimit.js
│   ├─ getGlobalLimiter() → 100 req/15min per IP
│   ├─ getAuthLimiter() → 5 fails/15min
│   ├─ getRateLimiter(limit, window) → Custom
│   └─ Redis-backed
│
├── requestLogger.js
│   ├─ Generate requestId
│   ├─ Log request metadata
│   └─ Winston integration
│
├── responseFormatter.js
│   ├─ Standardize: {success, data, error, meta}
│   └─ res.json() wrapper
│
├── securityHeaders.js
│   ├─ X-Content-Type-Options: nosniff
│   ├─ X-Frame-Options: DENY
│   └─ Security headers
│
├── timeout.js
│   └─ 10s request timeout
│
└── validation.js
    └─ Zod error handling
```

#### Services (931 lignes)

```
src/core/services/
│
├── database.js ⭐⭐⭐ CRITICAL
│   ├─ Pool PostgreSQL connection
│   ├─ query(sql, params) → Parameterized (SQL injection safe)
│   ├─ transaction(callback)
│   │   └─ BEGIN → COMMIT/ROLLBACK
│   ├─ healthCheck() → Liveness probe
│   └─ Pool config: min 2, max 20, idle 30s
│
├── cache.js
│   ├─ Redis client
│   ├─ get(key), set(key, value, ttl)
│   ├─ delete(key), invalidate(pattern)
│   └─ Used by: profiles, popular_system, search
│
├── databaseOptimization.js
│   ├─ warmupPool() → Pre-connect on startup
│   └─ Connection tuning
│
├── queryCache.js
│   └─ Cache expensive query results
│
└── tokenBlacklist.js
    ├─ Blacklist JWT tokens (Redis)
    └─ TTL-based expiry
```

#### Utils (173 lignes)

```
src/core/utils/
│
├── jwt.js
│   ├─ generateTokens(userId)
│   │   ├─ accessToken (15 min)
│   │   └─ refreshToken (7 days)
│   ├─ verifyToken(token)
│   └─ decodeToken(token)
│
├── logger.js
│   ├─ Winston configuration
│   ├─ Levels: info, warn, error, debug
│   ├─ Transport: console + file
│   └─ Rotation: daily
│
└── password.js
    ├─ hashPassword(pwd) → bcrypt (ROUNDS=12)
    └─ comparePassword(plain, hash) → boolean
```

#### Event Bus (140 lignes)

```
src/core/eventBus.js ⭐⭐
├─ class EventBus extends EventEmitter
├─ subscribe(eventName, handler, {name})
│   ├─ Register async handler
│   ├─ Error isolation (try-catch wrapper)
│   └─ Return unsubscribe function
├─ async emit(eventName, data)
│   ├─ Fire handlers in parallel
│   ├─ Non-blocking (Promise.all)
│   └─ Errors logged, don't throw
├─ getHandlers() → Debug info
└─ Handlers: like.added, comment.created
```

#### WebSocket (225 lignes)

```
src/core/websocket/server.js
├─ WebSocketServer class
├─ attach() → Attach to HTTP server
├─ broadcast(postId, data) → Real-time update
├─ Event types: post_created, comment_created, like_update
└─ Connection pool management
```

### MODULES (10 CORE)

#### Structure Standard
```
module/
├── controller.js    → HTTP handlers
├── service.js       → Business logic
├── routes.js        → Route definitions
├── validation.js    → Zod schemas (if needed)
├── schema.js        → DB schema (if needed)
└── index.js         → Export router
```

#### 10 Modules CORE

```
1. auth (391 lignes, service: 271) ⭐⭐⭐
   ├─ registerUser(email, pwd, name) → {user, tokens}
   ├─ loginUser(email, pwd) → {user, tokens}
   ├─ refreshToken(token) → {accessToken}
   ├─ logout(token) → Blacklist
   └─ Endpoints: POST /register, /login, /refresh, /logout, GET /me

2. users (184 lignes, service: 118) ⭐⭐
   ├─ getUser(id)
   ├─ updateUser(id, data)
   ├─ deleteUser(id)
   └─ Endpoints: GET /:id, PUT /:id, DELETE /:id (auth required)

3. profiles (446 lignes, service: 307) ⭐⭐
   ├─ getProfile(id)
   ├─ listProfiles(limit, offset)
   ├─ followUser(userId, targetId)
   ├─ unfollowUser(userId, targetId)
   └─ Endpoints: GET /, GET /:id, POST /, PUT /:id, follow/unfollow

4. posts (509 lignes, service: 375) ⭐⭐⭐ LARGEST
   ├─ listPosts(limit, offset, filters)
   ├─ getPost(id)
   ├─ createPost(title, content, category)
   │   ├─ INSERT posts (transaction)
   │   ├─ UPDATE users.posts_count++
   │   ├─ Cache invalidate
   │   ├─ WebSocket broadcast
   │   └─ NO event emitted
   ├─ updatePost(id, data)
   ├─ deletePost(id)
   ├─ flagPost(id, reason)
   ├─ likePost(userId, postId) [inline]
   ├─ unlikePost(userId, postId) [inline]
   └─ Endpoints: 8 endpoints

5. ideas (648 lignes, service: 327) ⭐⭐
   ├─ Specialized post type (type='idea' in posts table)
   ├─ listIdeas(limit, offset, filters)
   ├─ getIdea(id)
   ├─ createIdea(title, description, category)
   ├─ updateIdea(id, data)
   ├─ deleteIdea(id)
   ├─ flagIdea(id, reason)
   ├─ getIdeaStats(id)
   └─ Endpoints: 8 endpoints

6. comments (457 lignes, service: 246) ⭐⭐ + EVENT
   ├─ createComment(postId, userId, content)
   │   ├─ Verify post exists
   │   ├─ INSERT comments (transaction)
   │   ├─ UPDATE posts.replies_count++
   │   └─ EMIT 'comment.created' event ← ASYNC, non-blocking
   ├─ getComment(id)
   ├─ getCommentsByPost(postId, limit, offset)
   ├─ updateComment(id, content)
   ├─ deleteComment(id) → Soft delete
   └─ Endpoints: 5 endpoints

7. likes (316 lignes, service: 190) ⭐⭐ + EVENT
   ├─ likePost(userId, postId)
   │   ├─ UPSERT likes
   │   ├─ UPDATE posts.likes_count++
   │   ├─ Cache invalidate
   │   ├─ WebSocket broadcast
   │   └─ EMIT 'like.added' event ← ASYNC, non-blocking
   ├─ unlikePost(userId, postId)
   ├─ getLikes(postId, limit, offset)
   ├─ checkLike(userId, postId) → {liked: bool}
   └─ Endpoints: 4 endpoints

8. search (352 lignes, service: 159)
   ├─ searchAll(query, limit, offset)
   │   └─ Search posts + users
   ├─ searchPosts(query, limit, offset)
   ├─ searchUsers(query, limit, offset)
   └─ Endpoints: 3 endpoints

9. popular_system (352 lignes, service: 163)
   ├─ getPopularPosts(limit) → Trending algorithm
   ├─ getTrends(timeWindow) → Hourly/daily
   ├─ getPopularCategories()
   ├─ getStats() → System-wide stats
   └─ Endpoints: 4 endpoints

10. map (276 lignes, service: 165)
    ├─ getMapNodes(filters)
    ├─ createNode(data) [admin only]
    ├─ updateNode(id, data) [admin only]
    ├─ deleteNode(id) [admin only]
    └─ Endpoints: 4 endpoints

TOTAL CORE: 3931 lignes
TOTAL ENDPOINTS: 53 actifs
```

#### 17 Modules STANDBY (Désactivés)

```
admin, ai_mascot, analytics, cms, content, establishments, follow,
friends, groups, homepage, influence_system, moderation, notifications,
official_pages, programmes, public_dashboard, webhooks

Chacun: 50 lignes (stub: "À implémenter")
├─ controller.js (vide)
├─ service.js (8 lignes stub)
├─ routes.js (vide)
├─ schema.js (vide)
└─ index.js (export empty)

⏸️ Raison: Réduire complexité, clarifier architecture
🚀 À réactiver quand implémentés (>80 lignes code réel)
```

### EVENTS & HANDLERS

```
src/events/ (116 lignes)
├── LikeAdded.js (59 lignes)
│   ├─ class LikeAdded({likeId, postId, userId, postOwnerId, timestamp})
│   ├─ validate()
│   └─ toJSON()
│
├── CommentCreated.js (38 lignes)
│   ├─ class CommentCreated({commentId, postId, userId, postOwnerId, timestamp})
│   ├─ validate()
│   └─ toJSON()
│
└── index.js
    └─ exports {LikeAdded, CommentCreated}

src/handlers/ (180 lignes)
├── LikeAddedHandler.js (106 lignes)
│   ├─ async handleLikeAdded(data)
│   ├─ Skip if self-like
│   ├─ UPDATE users.updated_at
│   ├─ Log interaction
│   └─ Error isolation (graceful)
│
├── CommentCreatedHandler.js (54 lignes)
│   ├─ async handleCommentCreated(data)
│   ├─ Skip if self-comment
│   ├─ UPDATE users.updated_at
│   └─ Error isolation
│
└── index.js
    └─ exports handlers

Registration: server.js lines 61-62
├─ eventBus.subscribe('like.added', handleLikeAdded)
└─ eventBus.subscribe('comment.created', handleCommentCreated)
```

### DATABASE

```
database/
├── schema.sql
│   ├─ CREATE TABLE users
│   │   ├─ id UUID PRIMARY KEY
│   │   ├─ email VARCHAR UNIQUE
│   │   ├─ password_hash VARCHAR
│   │   ├─ created_at, updated_at
│   │   └─ INDEX: email
│   │
│   ├─ CREATE TABLE profiles
│   │   ├─ id UUID, user_id FK
│   │   ├─ name, bio, avatar_url
│   │   └─ INDEX: user_id
│   │
│   ├─ CREATE TABLE posts
│   │   ├─ id UUID, user_id FK
│   │   ├─ title TEXT, content TEXT
│   │   ├─ type: 'post' | 'idea'
│   │   ├─ likes_count, replies_count (denormalized)
│   │   ├─ status, is_flagged, deleted_at
│   │   └─ INDICES: user_id, created_at, status, deleted_at
│   │
│   ├─ CREATE TABLE comments
│   │   ├─ id UUID, post_id FK, user_id FK
│   │   ├─ content TEXT
│   │   ├─ deleted_at (soft delete)
│   │   └─ INDICES: post_id, user_id, created_at
│   │
│   └─ CREATE TABLE likes
│       ├─ id UUID, post_id FK, user_id FK
│       ├─ UNIQUE(post_id, user_id)
│       └─ INDICES: post_id, user_id
│
├── migrations/
│   ├─ V001_initial_schema.sql
│   ├─ V002_authentication.sql
│   ├─ V003_posts_enhancements.sql
│   ├─ V004_likes_table.sql
│   └─ V005_comments_table.sql
│
├── init.js (35 lignes)
│   └─ Database initialization
│
└── migrationRunner.js (197 lignes)
    ├─ Run migrations on startup
    ├─ Track applied migrations
    └─ Error handling
```

---

## 🔐 SECURITY & DEPENDENCIES

### Authentication Flow
```
1. POST /register
   ├─ Validate email/password (Zod)
   ├─ Hash password (bcrypt, ROUNDS=12)
   ├─ INSERT users + profiles (transaction)
   └─ Generate JWT tokens (accessToken: 15min, refreshToken: 7 days)

2. POST /login
   ├─ Find user by email
   ├─ Compare password hash
   ├─ Check token blacklist
   └─ Generate JWT tokens

3. Protected Routes
   ├─ middleware/auth.js: authRequired
   ├─ Verify JWT from Authorization header
   ├─ Extract userId
   ├─ Inject req.userId
   └─ Throw 401 if invalid
```

### Critical Dependencies
```
database.js
  ├─ Used by: ALL 10 modules
  └─ Impact if broken: Total outage

auth.js middleware
  ├─ Used by: All protected routes
  └─ Impact if broken: Security breach

eventBus.js
  ├─ Used by: likes, comments
  └─ Impact if broken: Features degrade (handlers don't run)

app.js + moduleLoader.js
  ├─ Route registration
  └─ Impact if broken: API non-responsive
```

---

## ⚡ EVENT FLOW (Real Example)

### User Likes Post

```
1. POST /api/v1/likes
2. middleware/auth.js → req.userId injected ✓
3. likes/controller.js → likesController.likePost()
4. likes/validation.js (Zod) ✓
5. likes/service.js → likePost(userId, postId)
   ├─ db.transaction START
   │   ├─ UPSERT likes
   │   ├─ UPDATE posts.likes_count++
   │   ├─ cache.invalidate('popular:*')
   │   └─ global.wsServer.broadcast(postId, {type: 'like_update'})
   ├─ db.transaction COMMIT
   │
   └─ EMIT EVENT: 'like.added'
       ├─ eventBus.emit('like.added', {
       │     likeId, postId, userId, postOwnerId, timestamp
       │   })
       │
       ├─ ASYNC (non-blocking, Promise-based)
       │
       └─ server.js listener catches event
           └─ LikeAddedHandler.handleLikeAdded(data)
               ├─ Skip if self-like
               ├─ UPDATE users.updated_at WHERE id=postOwnerId
               ├─ logger.info(...)
               └─ Catch errors (no rethrow)

6. Response sent immediately: {success: true, data: {liked: true}}
7. Handler continues in background (async)
```

---

## 📊 CODE STATISTICS

```
Component               Files  Lines    Purpose
─────────────────────────────────────────────────────
app.js, config.js, moduleLoader.js  3    536     Core setup
middleware/ (8 files)               8    868     Request handling
services/ (5 files)                 5    931     Infrastructure
utils/ (3 files)                    3    173     Utilities
eventBus.js                         1    140     Event system
constants/ (3 files)                3    117     Constants
websocket/ (1 file)                 1    225     Real-time
─────────────────────────────────────────────────────
TOTAL CORE/SOCLE                         2454    Shared infrastructure

auth/                               5    391     User management
users/                              4    184     User CRUD
profiles/                           5    446     Public profiles
posts/                              4    509     Main content
ideas/                              5    648     Specialized posts
comments/                           5    457     Discussions + EVENT
likes/                              5    316     Engagement + EVENT
search/                             4    352     Discovery
popular_system/                     4    352     Trending
map/                                4    276     Geolocation
─────────────────────────────────────────────────────
TOTAL CORE MODULES (10)        45   3931    Business logic

admin/, ai_mascot/, etc. (17)  85    850     Stubs (disabled)
─────────────────────────────────────────────────────
TOTAL MODULES                  130   4781    

database/ (migrations, init, runner) 3    232    DB infrastructure
events/ (3 files)                    3    116    Event definitions
handlers/ (3 files)                  3    180    Event handlers
tests/ (integration + unit)          6    400+   Quality assurance
─────────────────────────────────────────────────────
GRAND TOTAL                         ~180   7300  Complete backend
```

---

## ✅ VALIDATION RESULTS (Phase 0.2)

### Confirmé par l'utilisateur

| Question | Réponse | Status |
|----------|---------|--------|
| 10 modules CORE = vrais modules? | OUI | ✅ |
| 53 endpoints tous actifs? | OUI | ✅ |
| Événements complets? | NON - 3 manquent | ⚠️ |
| Modules manquants? | NON | ✅ |
| Classification correcte? | OUI | ✅ |

### Événements à Implémenter

```
Phase 1 TODO:
├─ post.created
│   └─ Emitted from posts/service.js on POST /posts
│   └─ Handlers: analytics, search index, trending
│
├─ post.deleted
│   └─ Emitted from posts/service.js on DELETE /posts/:id
│   └─ Handlers: cache cleanup, search index cleanup
│
└─ user.registered
    └─ Emitted from auth/service.js on registerUser()
    └─ Handlers: welcome email (future), analytics
```

---

## 🚀 PHASE 1 TIMELINE (10 semaines)

### Approche: TypeScript Migration Incrémentale

```
Week 1: auth module
  ├─ Create auth.ts versions
  ├─ New tsconfig.json
  ├─ Run JS + TS in parallel
  └─ Test + swap routes when ready

Weeks 2-4: users, profiles, posts, ideas, comments, likes
  └─ 1 module per week (same pattern)

Weeks 5-7: search, popular_system, map + core infrastructure
  ├─ Modernize moduleLoader
  ├─ Convert core/ middleware + services

Weeks 8-9: Event system + 3 new events
  ├─ Refactor eventBus.js
  ├─ Implement post.created, post.deleted, user.registered
  └─ Create handlers for all events

Week 10: Testing, validation, deployment
  └─ All tests passing, zero downtime
```

### Constraints
```
✅ Live system with active users
✅ Zero downtime (parallel JS+TS, swap when tested)
✅ Backward compatible (all 53 endpoints must work)
✅ Database schema stable (no breaking migrations)
✅ Event handlers must remain non-blocking
```

---

## 📞 Contact & Questions

Pour des détails complets, consultez les fichiers séparés:
- `COMPLETE_CODEBASE_VIEW.md` — Vue complète avec flux end-to-end
- `BACKEND_ARCHITECTURE_TREE.md` — Arborescence détaillée
- `PHASE_0.2_VALIDATION_RESULTS.md` — Résultats validation
- `PHASE_0.1_INVENTAIRE.txt` — Inventaire strict sans interprétation

---

**Généré**: 2026-05-04  
**Version**: 1.0  
**Status**: ✅ Prêt pour Phase 1 Planning
