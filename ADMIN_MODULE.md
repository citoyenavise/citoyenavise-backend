# Module ADMIN - Documentation Complète

**Statut:** ✅ Implémenté et prêt à tester  
**Date:** 2026-05-04  
**Architecture:** Panel d'administration avec gestion des utilisateurs et contenu

## 📋 Vue d'ensemble

Le module ADMIN fournit une interface d'administration pour:
- Gérer les utilisateurs (lister, voir détails, changer rôle, bannir/débannir)
- Supprimer du contenu (posts, articles, vidéos, commentaires)
- Fermer/gérer les initiatives
- Voir les statistiques globales

### Caractéristiques principales
- ✅ Gestion complète des utilisateurs
- ✅ Système de rôles (user, moderator, admin)
- ✅ Bannissement d'utilisateurs
- ✅ Suppression de contenu
- ✅ Fermeture d'initiatives
- ✅ Statistiques système
- ✅ EventBus integration
- ✅ Soft deletes sur tout le contenu

## 📁 Structure des fichiers

```
src/modules/admin/
├── schema.js            # Zod validations
├── service.js           # AdminService
├── controller.js        # HTTP handlers
├── routes.js            # Route definitions
└── index.js             # Module export { routes, init }
```

## 📍 Routes API

Tous les endpoints sont **protégés** (authRequired + admin/moderator role)

### Authentification Admin
```
Base URL: /api/v1/admin
Headers: Authorization: Bearer TOKEN
Role required: 'admin' ou 'moderator'
```

### Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| **GET** | `/me` | Info utilisateur actuel |
| **GET** | `/users` | Lister les utilisateurs |
| **GET** | `/users/:id` | Détail utilisateur |
| **PUT** | `/users/:id/role` | Changer le rôle |
| **PUT** | `/users/:id/ban` | Bannir utilisateur |
| **PUT** | `/users/:id/unban` | Débannir utilisateur |
| **DELETE** | `/posts/:id` | Supprimer post |
| **DELETE** | `/articles/:id` | Supprimer article |
| **DELETE** | `/videos/:id` | Supprimer vidéo |
| **DELETE** | `/comments/:id` | Supprimer commentaire |
| **PUT** | `/initiatives/:id/close` | Fermer initiative |
| **DELETE** | `/initiatives/:id` | Supprimer initiative |
| **GET** | `/stats/overview` | Statistiques globales |

## 📊 Format des réponses

### Lister utilisateurs

**Request:**
```bash
curl http://localhost:3000/api/v1/admin/users?page=1&limit=20 \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-05-04T10:00:00.000Z",
  "data": [
    {
      "id": "user-uuid",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "banned": false,
      "ban_reason": null,
      "created_at": "2026-05-01T10:00:00.000Z",
      "updated_at": "2026-05-04T10:00:00.000Z"
    }
  ],
  "error": null,
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

### Obtenir utilisateur

```bash
curl http://localhost:3000/api/v1/admin/users/user-uuid \
  -H "Authorization: Bearer TOKEN"
```

### Changer le rôle

```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/user-uuid/role \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "moderator"
  }'
```

**Rôles disponibles:** `user`, `moderator`, `admin`

### Bannir un utilisateur

```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/user-uuid/ban \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Violation of community guidelines - spam content"
  }'
```

**Validation:** reason min 10 chars, max 500

### Débannir un utilisateur

```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/user-uuid/unban \
  -H "Authorization: Bearer TOKEN"
```

### Supprimer du contenu

```bash
# Supprimer post
curl -X DELETE http://localhost:3000/api/v1/admin/posts/post-uuid \
  -H "Authorization: Bearer TOKEN"

# Supprimer article
curl -X DELETE http://localhost:3000/api/v1/admin/articles/article-uuid \
  -H "Authorization: Bearer TOKEN"

# Supprimer vidéo
curl -X DELETE http://localhost:3000/api/v1/admin/videos/video-uuid \
  -H "Authorization: Bearer TOKEN"

# Supprimer commentaire
curl -X DELETE http://localhost:3000/api/v1/admin/comments/comment-uuid \
  -H "Authorization: Bearer TOKEN"

# Supprimer initiative
curl -X DELETE http://localhost:3000/api/v1/admin/initiatives/initiative-uuid \
  -H "Authorization: Bearer TOKEN"
```

### Fermer une initiative

```bash
curl -X PUT http://localhost:3000/api/v1/admin/initiatives/initiative-uuid/close \
  -H "Authorization: Bearer TOKEN"
```

**Status devient:** `closed`

### Voir les statistiques

```bash
curl http://localhost:3000/api/v1/admin/stats/overview \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": 250,
    "posts": 1200,
    "initiatives": 45,
    "comments": 3500
  }
}
```

## 🔐 Authentification & Autorisation

### Middleware Admin

```javascript
router.use(authRequired);           // JWT token required
router.use(adminOnly);               // role === 'admin' ou 'moderator'
```

### Rôles

- **user** - Utilisateur normal (pas d'accès admin)
- **moderator** - Peut modérer le contenu
- **admin** - Accès complet

### Vérification

```
if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'moderator')) {
  throw AppError.forbidden('Admin access required');
}
```

## ✅ Validation

### paginationSchema
- `page`: number (min 1, default 1) ✓
- `limit`: number (min 1, max 100, default 20) ✓

### updateRoleSchema
- `role`: enum('user', 'moderator', 'admin') ✓

### banUserSchema
- `reason`: string (min 10, max 500) ✓

## 🔄 Événements EventBus

### admin.role.updated
```javascript
{
  userId: string,
  role: string,
  timestamp: ISO8601
}
```

### admin.user.banned
```javascript
{
  userId: string,
  reason: string,
  timestamp: ISO8601
}
```

### admin.user.unbanned
```javascript
{
  userId: string,
  timestamp: ISO8601
}
```

### admin.content.removed
```javascript
{
  table: string,
  id: string,
  timestamp: ISO8601
}
```

## 🗄️ Données manipulées

### Users Table
```sql
UPDATE users SET
  role = $1,                    -- Changer rôle
  banned = true/false,          -- Bannir/débannir
  ban_reason = $1,              -- Raison du ban
  updated_at = NOW()
WHERE id = $2
```

### Content Tables
```sql
UPDATE posts/articles/videos/comments/initiatives SET
  deleted_at = NOW()            -- Soft delete
WHERE id = $1
```

## 🚨 Limitations & Sécurité

✅ **Authentification:** JWT token requis  
✅ **Autorisation:** Role-based (admin/moderator)  
✅ **Soft deletes:** Aucune suppression physique  
✅ **Audit:** EventBus pour logging  
✅ **Validation:** Zod sur tous les inputs  

⚠️ **À noter:**
- Les actions admin ne sont pas audité (sauf via EventBus)
- Pas de pagination pour stats (compte simples)
- Pas d'historique des actions admin
- Pas de confirmation pour suppressions

## 🚀 Améliorations futures

1. **Audit Trail**
   - Logger toutes les actions admin
   - Table d'audit avec timestamps
   - Historique par admin

2. **Detailed Stats**
   - Breakdown par catégorie
   - Trends (30 jours, etc.)
   - Growth metrics

3. **Moderation Queue**
   - Reported content
   - Pending approvals
   - Review workflows

4. **Bulk Actions**
   - Mass delete
   - Mass ban
   - Role changes en masse

5. **Dashboard**
   - Graphiques
   - Real-time stats
   - Activity feeds

## 📋 Checklist

- [x] Schema validation
- [x] Service layer
- [x] Controller layer
- [x] Routes définies
- [x] Admin middleware
- [x] Role checks
- [x] EventBus integration
- [x] Soft deletes
- [x] Error handling
- [ ] Tests API manuels
- [ ] Audit logging
- [ ] Admin dashboard UI

---

**Module ADMIN implémenté et prêt! 👨‍💼**

Voir [ADMIN_QUICKSTART.md](./ADMIN_QUICKSTART.md) pour guide de démarrage.
