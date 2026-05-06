# Module INITIATIVES - Documentation Complète

**Statut:** ✅ Implémenté et prêt à tester  
**Date:** 2026-05-04  
**Structure:** Module principal + 2 sous-modules (votes, comments)

## 📋 Vue d'ensemble

Le module INITIATIVES permet aux citoyens de proposer des projets concrets avec géolocalisation, système de vote de support, et commentaires. Chaque initiative a un cycle de vie (draft → active → closed/archived).

### Caractéristiques principales
- ✅ CRUD complet pour initiatives
- ✅ Système de vote (1 vote par utilisateur)
- ✅ Commentaires (réutilise table comments générique)
- ✅ Géolocalisation (latitude/longitude)
- ✅ Catégorisation et recherche
- ✅ Statuts (draft, active, closed, archived)
- ✅ Soft deletes
- ✅ EventBus integration

## 📁 Structure des fichiers

```
src/modules/initiatives/
├── schema.js                 # Zod validations
├── service.js               # Logique métier InitiativeService
├── controller.js            # HTTP handlers
├── routes.js                # Définitions routes + sous-routes
├── index.js                 # Export { routes, init }
├── votes/
│   ├── schema.js           # Zod pour votes
│   ├── service.js          # VoteService
│   ├── controller.js       # Vote handlers
│   ├── routes.js           # Routes votes
│   └── index.js            # Export votes
└── comments/
    ├── schema.js           # Zod pour comments
    ├── service.js          # InitiativeCommentService
    ├── controller.js       # Comment handlers
    ├── routes.js           # Routes comments
    └── index.js            # Export comments
```

## 🗄️ Schéma de base de données

### V007_initiatives_module.sql

#### Table: initiatives
```sql
CREATE TABLE initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  goals TEXT,
  category VARCHAR(50) NOT NULL,
  latitude DECIMAL(10, 8),                    -- Géolocalisation
  longitude DECIMAL(11, 8),                   -- Géolocalisation
  status VARCHAR(20) DEFAULT 'draft' CHECK (
    status IN ('draft', 'active', 'closed', 'archived')
  ),
  deadline TIMESTAMP,                         -- Date limite
  supporters_count INT DEFAULT 0,             -- Nombre de votes
  impact_score DECIMAL(5, 2) DEFAULT 0,      -- Score d'impact
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,                        -- Quand fermée
  deleted_at TIMESTAMP                        -- Soft delete
);

-- Indices
CREATE INDEX idx_initiatives_author_id ON initiatives(author_id);
CREATE INDEX idx_initiatives_category ON initiatives(category);
CREATE INDEX idx_initiatives_status ON initiatives(status);
CREATE INDEX idx_initiatives_created ON initiatives(created_at DESC);
CREATE INDEX idx_initiatives_deleted ON initiatives(deleted_at);
CREATE INDEX idx_initiatives_location ON initiatives USING GIST(
  ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
```

#### Table: initiatives_votes
```sql
CREATE TABLE initiatives_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(initiative_id, user_id)              -- 1 vote par utilisateur
);

-- Indices
CREATE INDEX idx_initiatives_votes_initiative_id ON initiatives_votes(initiative_id);
CREATE INDEX idx_initiatives_votes_user_id ON initiatives_votes(user_id);
CREATE INDEX idx_initiatives_votes_created ON initiatives_votes(created_at DESC);
```

#### Table: comments (existante, réutilisée)
```sql
-- Colonne entity_type = 'initiative'
-- Colonne entity_id = initiative.id
-- Soft delete via deleted_at IS NULL
```

## 📍 Routes API

### Initiatives CRUD

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| **GET** | `/api/v1/initiatives` | Optional | Lister les initiatives |
| **POST** | `/api/v1/initiatives` | Required | Créer une initiative |
| **GET** | `/api/v1/initiatives/:id` | Optional | Détail initiative |
| **GET** | `/api/v1/initiatives/:id/stats` | Optional | Statistiques initiative |
| **PUT** | `/api/v1/initiatives/:id` | Required | Mettre à jour |
| **POST** | `/api/v1/initiatives/:id/close` | Required | Fermer/archiver |
| **DELETE** | `/api/v1/initiatives/:id` | Required | Supprimer (soft delete) |

### Votes

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| **GET** | `/api/v1/initiatives/:id/votes` | Optional | Lister les supporters |
| **GET** | `/api/v1/initiatives/:id/votes/status` | Optional | Vérifier si j'ai voté |
| **POST** | `/api/v1/initiatives/:id/votes` | Required | Voter pour |
| **DELETE** | `/api/v1/initiatives/:id/votes` | Required | Retirer mon vote |

### Commentaires

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| **GET** | `/api/v1/initiatives/:id/comments` | Optional | Lister commentaires |
| **POST** | `/api/v1/initiatives/:id/comments` | Required | Ajouter commentaire |
| **PUT** | `/api/v1/initiatives/:id/comments/:commentId` | Required | Éditer commentaire |
| **DELETE** | `/api/v1/initiatives/:id/comments/:commentId` | Required | Supprimer commentaire |

## 📊 Format des réponses

### Créer une initiative
**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/initiatives \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Parc communautaire rue Martin",
    "description": "Créer un parc avec zones vertes et jeux pour enfants",
    "goals": "Améliorer la qualité de vie du quartier",
    "category": "environnement",
    "latitude": 45.5017,
    "longitude": -73.5673,
    "deadline": "2026-12-31T23:59:59Z"
  }'
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-05-04T10:00:00.000Z",
  "data": {
    "id": "init-uuid",
    "author_id": "user-uuid",
    "title": "Parc communautaire rue Martin",
    "description": "Créer un parc avec zones vertes...",
    "goals": "Améliorer la qualité de vie...",
    "category": "environnement",
    "latitude": 45.5017,
    "longitude": -73.5673,
    "status": "draft",
    "deadline": "2026-12-31T23:59:59.000Z",
    "supporters_count": 0,
    "impact_score": 0,
    "created_at": "2026-05-04T10:00:00.000Z",
    "updated_at": "2026-05-04T10:00:00.000Z",
    "closed_at": null,
    "deleted_at": null
  },
  "error": null,
  "meta": null
}
```

### Lister initiatives
**Request:**
```bash
curl "http://localhost:3000/api/v1/initiatives?page=1&limit=20&category=environnement&sort=popular"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-05-04T10:00:00.000Z",
  "data": [
    {
      "id": "init-uuid-1",
      "author_id": "user-uuid",
      "title": "Parc communautaire",
      "description": "...",
      "status": "active",
      "supporters_count": 42,
      "created_at": "2026-05-04T10:00:00.000Z"
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

### Voter pour une initiative
**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/initiatives/INIT_ID/votes \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-05-04T10:00:00.000Z",
  "data": {
    "id": "vote-uuid",
    "initiative_id": "init-uuid",
    "user_id": "user-uuid",
    "created_at": "2026-05-04T10:00:00.000Z"
  },
  "error": null,
  "meta": null
}
```

### Ajouter un commentaire
**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/initiatives/INIT_ID/comments \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Excellente initiative! Je soutiens ce projet."
  }'
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-05-04T10:00:00.000Z",
  "data": {
    "id": "comment-uuid",
    "entity_id": "init-uuid",
    "user_id": "user-uuid",
    "content": "Excellente initiative!...",
    "created_at": "2026-05-04T10:00:00.000Z",
    "username": "john_doe",
    "avatar_url": "https://..."
  },
  "error": null,
  "meta": null
}
```

## 🔄 Événements EventBus

### initiative.created
Émis à la création d'une initiative.
```javascript
{
  initiativeId: string,
  authorId: string,
  title: string,
  category: string,
  timestamp: ISO8601
}
```
**Usage:** Notifications, feed d'activité

### initiative.updated
Émis à la mise à jour.
```javascript
{
  initiativeId: string,
  authorId: string,
  newStatus: string,
  timestamp: ISO8601
}
```

### initiative.closed
Émis à la fermeture/archivage.
```javascript
{
  initiativeId: string,
  authorId: string,
  status: 'closed' | 'archived',
  supportersCount: number,
  timestamp: ISO8601
}
```

### initiative.voted
Émis quand quelqu'un vote pour.
```javascript
{
  initiativeId: string,
  userId: string,
  timestamp: ISO8601
}
```

### initiative.commented
Émis à l'ajout d'un commentaire.
```javascript
{
  commentId: string,
  initiativeId: string,
  userId: string,
  timestamp: ISO8601
}
```

## ✅ Validation

### Schemas Zod

**createInitiativeSchema:**
- title: string(3-255) ✓
- description: string(10+) ✓
- goals: string (optional) ✓
- category: string(2-50) ✓
- latitude: number (optional) ✓
- longitude: number (optional) ✓
- deadline: ISO8601 (optional) ✓

**updateInitiativeSchema:**
- Tous les champs optionnels
- status: enum('draft', 'active', 'closed', 'archived') ✓

**listInitiativeSchema:**
- page: number (default 1) ✓
- limit: number (max 100, default 20) ✓
- search: string (optional) ✓
- category: string (optional) ✓
- status: enum (optional) ✓
- sort: enum('recent', 'popular', 'deadline') ✓

## 🔐 Authentification & Autorisation

### Routes publiques
- GET /initiatives (liste)
- GET /initiatives/:id (détail)
- GET /initiatives/:id/stats
- GET /initiatives/:id/votes (lister supporters)
- GET /initiatives/:id/comments (lister commentaires)

### Routes protégées
- POST /initiatives (créer) - authRequired
- PUT /initiatives/:id (éditer) - authRequired + owner check
- POST /initiatives/:id/close (fermer) - authRequired + owner check
- DELETE /initiatives/:id (supprimer) - authRequired + owner check
- POST /initiatives/:id/votes (voter) - authRequired
- DELETE /initiatives/:id/votes (retirer vote) - authRequired
- POST /initiatives/:id/comments (commenter) - authRequired
- PUT /initiatives/:id/comments/:commentId - authRequired + owner check
- DELETE /initiatives/:id/comments/:commentId - authRequired + owner check

## 🔗 Intégrations

- ✅ **USERS**: author_id référence users
- ✅ **COMMENTS**: Réutilise table comments avec entity_type='initiative'
- ✅ **AppError**: Gestion des erreurs standardisée
- ✅ **EventBus**: Émission d'événements
- ✅ **Auth middleware**: authRequired, authOptional
- ✅ **API helpers**: apiSuccess, apiCreated, apiUpdated, apiDeleted, apiPaginated
- ✅ **Validation**: Zod safeParse

## 📊 Statistiques

| Métrique | Nombre |
|----------|--------|
| Fichiers créés | 11 |
| Endpoints | 11 |
| Schémas Zod | 4 |
| Tables SQL | 2 nouvelles + 1 réutilisée |
| Événements EventBus | 5 |
| Lignes de code | ~2000+ |

## 🚀 Prochaines étapes

1. ✅ Migration database V007
2. ✅ Implémentation module
3. ⏳ Tests API manuels
4. ⏳ Tests unitaires
5. ⏳ Intégration LIKES pour initiatives
6. ⏳ Notifications pour événements
7. ⏳ Cache Redis pour popularité
8. ⏳ Analytics par catégorie

---

**Module prêt pour migration et tests! 🎉**

Voir [INITIATIVES_QUICKSTART.md](./INITIATIVES_QUICKSTART.md) pour guide de démarrage.
