# 📊 ANALYSE DE L'ARCHITECTURE RÉELLE — Citoyenavise Backend

## RÉSUMÉ EXÉCUTIF

✅ **10 modules CORE fonctionnels en production**
- auth (271 lignes) - Login/register avec JWT
- users (118 lignes) - Profils utilisateurs
- profiles (307 lignes) - Infos publiques
- posts (375 lignes) - Posts/ideas création/lecture
- ideas (327 lignes) - Spécialisation posts
- comments (246 lignes) - Commentaires avec events
- likes (190 lignes) - Likes avec events
- popular_system (163 lignes) - Trending
- search (159 lignes) - Full-text search
- map (165 lignes) - Géolocalisation

❌ **17 modules STANDBY (stubs vides, 8 lignes chacun)**
- follow, notifications, admin, moderation, groups, influence_system, etc.

---

## 1. DÉPENDANCES CRITIQUES À PRÉSERVER

### 🔴 Services Core (EXTRÊME CRITICITÉ)

```javascript
core/services/database.js
  ├─ Connection pool (Postgres)
  ├─ Query execution (parameterized)
  ├─ Transaction support (ACID)
  └─ Utilisé par: TOUS les 10 modules
  
core/middleware/auth.js
  ├─ JWT validation
  ├─ req.userId injection
  ├─ Token blacklist
  └─ Utilisé par: Toutes routes protégées
  
core/eventBus.js
  ├─ like.added event
  ├─ comment.created event
  ├─ Async handler support
  └─ Utilisé par: likes, comments
  
core/websocket/server.js
  ├─ Real-time broadcast
  ├─ Connection pool
  └─ Utilisé par: posts, likes, comments
```

### 🟠 Flux de données critiques

```
comments → posts
  UPDATE posts.replies_count WHERE id = comment.post_id

likes → posts
  UPDATE posts.likes_count WHERE id = like.post_id

ideas → posts
  Colonne spécialisée, même table posts

Users table:
  ← profiles (1:1)
  ← posts (1:many)
  ← likes (1:many)
  ← comments (1:many)
```

---

## 2. STRUCTURE PHYSIQUE RÉELLE

### Arborescence en production

```
backend/
├── server.js                  ← Entrypoint
│                              - Load app
│                              - Init cache + DB pool
│                              - Register event handlers
│                              - Start WebSocket
│
├── src/
│   ├── app.js                 ← Express app
│   │                           - middleware stack
│   │                           - call moduleLoader
│   │                           - error handler
│   │
│   ├── config.js              ← ENV vars
│   ├── moduleLoader.js        ← Dynamic module loading
│   │                           - Load 10 CORE modules
│   │                           - Load routes
│   │
│   ├── core/                  ← Shared infrastructure
│   │   ├── eventBus.js        (100 lignes)
│   │   ├── middleware/        (auth, errorHandler, rateLimit, etc)
│   │   ├── services/          (database, cache, optimization)
│   │   ├── utils/             (logger, jwt, password utils)
│   │   ├── websocket/         (server.js)
│   │   └── constants/         (roles, categories)
│   │
│   ├── modules/               ← Feature modules (10 CORE)
│   │   ├── auth/
│   │   │   ├── controller.js
│   │   │   ├── service.js     (271 lines)
│   │   │   ├── routes.js
│   │   │   ├── validation.js
│   │   │   └── index.js       (exports routes)
│   │   │
│   │   ├── users/
│   │   │   ├── controller.js
│   │   │   ├── service.js     (118 lines)
│   │   │   └── ...
│   │   │
│   │   ├── posts/
│   │   │   ├── service.js     (375 lines - biggest)
│   │   │   └── ...
│   │   │
│   │   ├── comments/
│   │   │   ├── service.js     (246 lines)
│   │   │   ├── emit: comment.created
│   │   │   └── ...
│   │   │
│   │   ├── likes/
│   │   │   ├── service.js     (190 lines)
│   │   │   ├── emit: like.added
│   │   │   └── ...
│   │   │
│   │   ├── profiles/, ideas/, popular_system/, search/, map/
│   │   │
│   │   └── [17 STANDBY stubs - 8 lines each]
│   │
│   ├── events/                ← Event definitions
│   │   ├── LikeAdded.js       (40 lines)
│   │   ├── CommentCreated.js  (40 lines)
│   │   └── index.js           (exports)
│   │
│   └── handlers/              ← Event handlers
│       ├── LikeAddedHandler.js    (50 lines)
│       ├── CommentCreatedHandler.js (50 lines)
│       └── index.js           (exports)
│
├── database/
│   ├── migrations/            (V001...V005)
│   └── schema.sql
│
└── tests/
    ├── integration/
    │   ├── events.test.js     (200 lines)
    │   └── comments.test.js   (200 lines)
```

---

## 3. FLUX DE REQUÊTES RÉELS (En production)

### Authentification (Critique)

```
POST /api/v1/auth/register
  → auth.controller.register()
     → validation (zod)
     → auth.service.registerUser()
        → bcrypt.hash(password, BCRYPT_ROUNDS)
        → db.query('INSERT users')  [TRANSACTION]
        → db.query('INSERT profiles')
        → JWT token generation
  Response: { user, accessToken, refreshToken }
```

### Création de post (Critique)

```
POST /api/v1/posts
  → middleware.authRequired ✓
  → posts.controller.createPost()
     → validation (zod)
     → posts.service.createPost()
        → db.transaction (ACID)
           │
           ├─ INSERT posts
           ├─ UPDATE users.posts_count++
           ├─ cache.invalidate('posts:*')
           │
           └─ global.wsServer.broadcast(postId, {
              type: 'post_created',
              data: { ... }
           })
  Response: { success: true, data: post }
  ⚠️ NO EVENT EMITTED
```

### Like (avec event)

```
POST /api/v1/likes
  → middleware.authRequired ✓
  → likes.controller.likePost()
     → validation
     → likes.service.likePost()
        → db.transaction
           │
           ├─ INSERT likes (UPSERT)
           ├─ UPDATE posts.likes_count++
           ├─ cache.invalidate('popular:*')
           │
           └─ global.wsServer.broadcast(postId, {
              type: 'like_update'
           })
        │
        → ⚡ eventBus.emit('like.added', {
             commentId, postId, userId, postOwnerId
           })
           │ (async, non-blocking)
           │
           └─ server.js listener:
              LikeAddedHandler(data)
                → db.query('UPDATE users.updated_at')
                → logger.info(...)
  Response: { success: true, data: { liked: true } }
  ✅ EVENT EMITTED ASYNCHRONOUSLY
```

### Comment (avec event)

```
POST /api/v1/comments
  → middleware.authRequired ✓
  → comments.controller.createComment()
     → validation (zod)
     → comments.service.createComment()
        → Verify post exists
        → db.transaction
           │
           ├─ INSERT comments
           ├─ UPDATE posts.replies_count++
           │
           └─ ⚡ eventBus.emit('comment.created', {
                commentId, postId, userId, postOwnerId
              })
              │ (async)
              │
              └─ server.js listener:
                 CommentCreatedHandler(data)
                   → db.query('UPDATE users.updated_at')
                   → logger.info(...)
  Response: { success: true, data: comment }
  ✅ EVENT EMITTED ASYNCHRONOUSLY
```

---

## 4. POINTS DE RISQUE CRITIQUES

### 🔴 Si cassé = Site down

1. **core/services/database**
   - Connection pool broken → All queries fail
   - Transaction support broken → Data corruption
   - Impact: Total outage

2. **core/middleware/auth**
   - JWT validation broken → Auth bypass
   - Token injection broken → Users not identified
   - Impact: Security breach + feature loss

3. **app.js moduleLoader integration**
   - Module loading fails → Routes not registered
   - Middleware order wrong → Auth skipped
   - Impact: Total outage

### 🟠 Si cassé = Features degrade

1. **core/eventBus**
   - Event emission fails → Handlers don't react
   - User.updated_at not set → Minor impact (non-bloquant)
   - Impact: Features work but without side effects

2. **core/websocket**
   - Real-time broadcasts fail → UI needs refresh
   - Users don't see updates in real-time
   - Impact: UX degradation only

3. **core/services/cache**
   - Cache invalidation fails → Stale data
   - Cache miss → Slower page loads
   - Impact: Performance degradation

---

## 5. CE QUI MARCHE AUJOURD'HUI ✅

```
✅ User registration & login (JWT tokens)
✅ Post creation/deletion (transactions)
✅ Comments (with replies_count update)
✅ Likes (with likes_count update + event)
✅ Event emission (like.added, comment.created)
✅ Event handlers (async reactions)
✅ WebSocket real-time updates
✅ Database transactions (ACID)
✅ Cache invalidation
✅ Input validation (Zod)
✅ Error handling (AppError class)
✅ Logging (Winston)
✅ Security (bcrypt, JWT, helmet)
✅ Rate limiting
✅ CORS + CSP headers
```

---

## 6. DÉPENDANCES EXACTES ENTRE MODULES

### Imports directs entre modules?
```
❌ AUCUN
Les modules ne s'importent jamais entre eux
```

### Dépendances via database schema
```
comments → posts
  - INSERT comments with post_id FK
  - UPDATE posts.replies_count += 1
  
likes → posts
  - INSERT likes with post_id FK
  - UPDATE posts.likes_count += 1

ideas → posts
  - ideas est une subtype (same table posts, type='idea')
```

### Dépendances via core/
```
auth/
  - Utilise: database, jwt utils, bcrypt

users/
  - Utilise: database, auth middleware

posts/
  - Utilise: database, auth middleware, cache, websocket

comments/
  - Utilise: database, auth middleware, eventBus, websocket

likes/
  - Utilise: database, auth middleware, eventBus, websocket, cache

profiles/
  - Utilise: database, cache

popular_system/
  - Utilise: database, cache

search/
  - Utilise: database

map/
  - Utilise: database
```

---

## 7. VALIDATION POINTS (À VÉRIFIER AVEC VOUS)

```
□ Y a-t-il actuellement des utilisateurs en production?
□ Quel est le SLA? (99.9%, 99.99%?)
□ Downtime acceptable? (1 minute? 30 secondes?)
□ Y a-t-il staging environment?
□ Comment les deployments se font actuellement?
□ Y a-t-il des background jobs/cron tasks?
□ Y a-t-il des webhooks externes?
□ Qui a accès à la DB en production?
□ Existe-t-il des backups?
□ Quelle est la charge moyenne/peak?
```

---

## CONCLUSION

### ✅ À préserver SANS modification
1. core/services/database et toutes requêtes
2. core/middleware/auth et JWT flow
3. core/eventBus et event handlers
4. Tous les endpoints existants (API contract)
5. Database schema et migrations
6. Module structure (controller/service/routes/validation)

### ❌ À changer progressivement
1. JavaScript → TypeScript (module par module)
2. moduleLoader → Static imports
3. Single folder → Monorepo (optional, step by step)
4. app.js → app.ts
5. server.js → src/server.ts

### 🎯 Stratégie proposée
- **Phase 1**: Analyser et vérifier cette structure exacte
- **Phase 2**: Convertir 1 module en TypeScript (ex: auth)
- **Phase 3**: Convertir tous les modules (1 par 1)
- **Phase 4**: Refactorer app.js + server.js
- **Phase 5**: Restructurer en monorepo (optionnel)

**Chaque phase doit passer tests et être deployable.**
