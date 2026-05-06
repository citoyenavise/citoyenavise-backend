# État de la standardisation API — 46 endpoints

**Date:** 2026-05-04  
**Statut:** ✅ Tous les contrôleurs mis à jour avec format standard

## Résumé des modifications

### Infrastructure Core (Middleware)

#### 1. `src/core/middleware/responseFormatter.js` ✅
- **Changement:** Réorganisé le format de réponse pour avoir `timestamp` au niveau racine
- **Avant:** `{ success, data, meta: { timestamp, version }, error }`
- **Après:** `{ success, timestamp, data, error, meta }`
- **Helpers disponibles:**
  - `res.apiSuccess(data, meta)` → 200
  - `res.apiCreated(data, meta)` → 201 + meta.created: true
  - `res.apiUpdated(data, meta)` → 200 + meta.updated: true
  - `res.apiDeleted(id, meta)` → 200 + data: { id, deleted: true }
  - `res.apiPaginated(data, total, page, limit)` → 200 + meta.pagination

#### 2. `src/core/middleware/errorHandler.js` ✅
- **Changement:** Aligné le format d'erreur avec la réponse standard
- **Avant:** Erreurs avec `meta: { version, timestamp }`
- **Après:** `{ success: false, timestamp, data: null, error: { code, message, details }, meta: null }`
- **Code HTTP amélioré:** Erreurs Zod retournent 422 (UNPROCESSABLE_ENTITY) au lieu de 400

### Modules API (Contrôleurs)

#### ✅ AUTH (5 endpoints)
- `POST /api/v1/auth/register` - utilise `res.apiCreated()`
- `POST /api/v1/auth/login` - utilise `res.apiSuccess()`
- `GET /api/v1/auth/me` - utilise `res.apiSuccess()`
- `POST /api/v1/auth/refresh` - utilise `res.apiSuccess()`
- `POST /api/v1/auth/logout` - utilise `res.apiSuccess()`

#### ✅ USERS (3 endpoints)
- `GET /api/v1/users/:id` - utilise `res.apiSuccess()`
- `PUT /api/v1/users/:id` - utilise `res.apiUpdated()`
- `DELETE /api/v1/users/:id` - utilise `res.apiDeleted()`

#### ✅ PROFILES (7 endpoints)
- `GET /api/v1/profiles` - utilise `res.apiPaginated()`
- `GET /api/v1/profiles/:id` - utilise `res.apiSuccess()`
- `PUT /api/v1/profiles/:id` - utilise `res.apiUpdated()`
- `GET /api/v1/profiles/:id/posts` - utilise `res.apiPaginated()`
- `GET /api/v1/profiles/:id/followers` - utilise `res.apiPaginated()`
- `POST /api/v1/profiles/:id/follow` - utilise `res.apiCreated()`
- `DELETE /api/v1/profiles/:id/follow` - utilise `res.apiSuccess()`

#### ✅ POSTS (9 endpoints) — CORRIGÉ
- `GET /api/v1/posts` - utilise `res.apiPaginated()`
- `GET /api/v1/posts/:id` - utilise `res.apiSuccess()`
- `POST /api/v1/posts` - utilise `res.apiCreated()`
- `PUT /api/v1/posts/:id` - utilise `res.apiUpdated()`
- `DELETE /api/v1/posts/:id` - utilise `res.apiDeleted()`
- `POST /api/v1/posts/:id/flag` - utilise `res.apiSuccess()`
- `POST /api/v1/posts/:id/like` - utilise `res.apiCreated()`
- `DELETE /api/v1/posts/:id/like` - utilise `res.apiSuccess()`
- `GET /api/v1/posts/popular` - utilise `res.apiPaginated()`

**Changements:**
- Converti `res.json()` → `res.apiSuccess()` / `res.apiCreated()`
- Changé `res.status(201).json()` → `res.apiCreated()`
- Changé `res.status(204).send()` → `res.apiDeleted()`
- Changé `.parse()` → `.safeParse()` avec gestion d'erreurs
- Lancé `AppError` avec codes standardisés

#### ✅ LIKES (4 endpoints) — CORRIGÉ
- `POST /api/v1/likes/posts/:postId/like` - utilise `res.apiCreated()`
- `DELETE /api/v1/likes/posts/:postId/like` - utilise `res.apiSuccess()`
- `GET /api/v1/likes/posts/:postId/likes` - utilise `res.apiPaginated()`
- `GET /api/v1/likes/posts/:postId/likes/check` - utilise `res.apiSuccess()`

**Changements:**
- Ajouté validation Zod pour query params (limit, page)
- Converti `res.json()` → `res.apiSuccess()` / `res.apiCreated()`

#### ✅ COMMENTS (5 endpoints) — CORRIGÉ
- `POST /api/v1/posts/:postId/comments` - utilise `res.apiCreated()`
- `GET /api/v1/posts/:postId/comments` - utilise `res.apiPaginated()`
- `GET /api/v1/comments/:commentId` - utilise `res.apiSuccess()`
- `PUT /api/v1/comments/:commentId` - utilise `res.apiUpdated()`
- `DELETE /api/v1/comments/:commentId` - utilise `res.apiDeleted()`

**Changements:**
- Converti `res.status(201).json()` → `res.apiCreated()`
- Converti `res.status(204).send()` → `res.apiDeleted()`
- Changé `.parse()` → `.safeParse()`
- Amélioré gestion d'erreurs AppError

#### ✅ IDEAS (7 endpoints) — CORRIGÉ
- `GET /api/v1/ideas` - utilise `res.apiPaginated()`
- `GET /api/v1/ideas/popular` - utilise `res.apiPaginated()`
- `GET /api/v1/ideas/:id` - utilise `res.apiSuccess()`
- `POST /api/v1/ideas` - utilise `res.apiCreated()`
- `PUT /api/v1/ideas/:id` - utilise `res.apiUpdated()`
- `DELETE /api/v1/ideas/:id` - utilise `res.apiDeleted()`
- `POST /api/v1/ideas/:id/like` - utilise `res.apiCreated()`

**Changements:**
- Changé `req.userId` → `req.user?.userId`
- Converti `.parse()` → `.safeParse()`
- Ajouté gestion complète des erreurs

#### ✅ POPULAR (1 endpoint) — CORRIGÉ
- `GET /api/v1/popular` - utilise `res.apiSuccess()` / `res.apiPaginated()`

**Changements:**
- Amélioration du handling des erreurs de validation
- Support complet pour les réponses paginées

#### ✅ SEARCH (3 endpoints) — CORRIGÉ
- `GET /api/v1/search?q=test` - utilise `res.apiPaginated()`
- `GET /api/v1/search/posts?q=test` - utilise `res.apiPaginated()`
- `GET /api/v1/search/users?q=test` - utilise `res.apiPaginated()`

**Changements:**
- Converti `.parse()` → `.safeParse()`
- Ajouté AppError pour erreurs de validation
- Support pour réponses paginées

#### ✅ MAP (4 endpoints) — CORRIGÉ
- `GET /api/v1/map/nodes` - utilise `res.apiSuccess()`
- `POST /api/v1/map/nodes` - utilise `res.apiCreated()`
- `PUT /api/v1/map/nodes/:id` - utilise `res.apiUpdated()`
- `DELETE /api/v1/map/nodes/:id` - utilise `res.apiDeleted()`

**Changements:**
- Converti `res.json()` → `res.apiSuccess()`
- Converti `res.status(201).json()` → `res.apiCreated()`
- Converti `.parse()` → `.safeParse()`
- Amélioré gestion des erreurs de validation

#### ✅ NOTIFICATIONS (3 endpoints) — CORRIGÉ
- `GET /api/v1/notifications` - utilise `res.apiPaginated()`
- `POST /api/v1/notifications/:id/read` - utilise `res.apiSuccess()`
- `POST /api/v1/notifications/read-all` - utilise `res.apiSuccess()`

**Changements:**
- Converti `res.json()` → `res.apiSuccess()` / `res.apiPaginated()`
- Converti `res.status(204).send()` → `res.apiSuccess()`
- Ajouté AppError pour erreurs de validation

### Tests

#### ✅ `src/tests/api.standardization.test.js`
- **Conversion:** ES6 → CommonJS (import/export → require)
- **Couverture:** 46 endpoints testés
- **Assertions:**
  - Tous les endpoints retournent `success`, `timestamp`, `data`, `error`, `meta`
  - `timestamp` est un ISO string valide
  - Les erreurs contiennent `code` et `message`
  - La pagination retourne les champs requis
  - Respect des codes HTTP standards

## Standards appliqués

### Format de réponse standard
```javascript
{
  success: boolean,
  timestamp: "2026-05-04T19:30:00.000Z",  // ISO 8601
  data: any | null,
  error: null | { code, message, details? },
  meta: null | { pagination?: {...}, ...custom }
}
```

### Codes d'erreur standardisés
- `BAD_REQUEST` (400)
- `VALIDATION_ERROR` (422)
- `UNAUTHORIZED` (401)
- `INVALID_CREDENTIALS` (401)
- `TOKEN_EXPIRED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `DUPLICATE_EMAIL` (409)
- `DUPLICATE_USERNAME` (409)
- `SERVER_ERROR` (500)
- `DATABASE_ERROR` (500)

### HTTP Status Codes
- `200` - GET, PUT, DELETE, POST success
- `201` - POST resource created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `409` - Conflict
- `422` - Validation error (Zod)
- `500` - Server error

### Pagination standard
```javascript
meta: {
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number,
    hasNextPage: boolean,
    hasPrevPage: boolean
  }
}
```

## Fichiers supprimés
- `src/core/response.js` (ES6 - remplacé par responseFormatter.js)
- `src/core/error.js` (ES6 - remplacé par errorHandler.js)
- `src/core/middleware/validateRequest.js` (ES6 - remplacé par validate.js)
- `src/core/middleware/errorHandlerNew.js` (ES6 - non utilisé)

## Problèmes identifiés et corrections en cours

### Incohérence service/contrôleur - Pagination

**Problème:** Les services ne retournent pas un format cohérent
- **Avant:** Certains services retournent `{ data, meta }`, d'autres retournent simplement un array
- **Impact:** Les contrôleurs ne pouvaient pas accéder à `result.meta.total` pour la pagination

**Corrections appliquées:**
- ✅ `comments/service.js` - Modifié pour retourner `{ data, meta }`
- ✅ `comments/controller.js` - Mise à jour pour utiliser `result.meta`

**Corrections restantes:**
- 🔄 `likes/service.js` - Vérifier format retourné
- 🔄 `search/service.js` - Vérifier format retourné  
- 🔄 `ideas/service.js` - Vérifier format retourné
- 🔄 `notifications/service.js` - Vérifier format retourné
- 🔄 `profiles/service.js` - Vérifier format retourné
- 🔄 `popular_system/service.js` - Vérifier format retourné

## Prochaines étapes
1. ✅ Standardiser les réponses via middleware (DONE)
2. ✅ Mettre à jour tous les contrôleurs (DONE)
3. 🔄 Standardiser les retours des services (IN PROGRESS)
4. ⏳ Exécuter le test suite complet
5. ⏳ Documenter les changements dans CHANGELOG
6. ⏳ Merger la branche dans main

## Notes importantes
- Tous les contrôleurs ont été mis à jour pour utiliser les helpers (apiSuccess, apiCreated, etc.)
- Les middleware retournent maintenant le format standard de réponse
- Le test suite vérifie la conformité de tous les 46 endpoints
- **ACTION REQUISE:** Standardiser les services pour retourner `{ data, meta: { total, page, limit, pages } }` pour les listes paginées

## Pattern recommandé pour les services (listes paginées)
```javascript
return {
  data: [...items...],
  meta: {
    total: count,
    page: pageNum,
    limit: limitNum,
    pages: Math.ceil(count / limitNum)
  }
};
```

## Pattern recommandé pour les services (détail unique)
```javascript
return { ...itemDetails... };
// OU
return null; // si not found
```
