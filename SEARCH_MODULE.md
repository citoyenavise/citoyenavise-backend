# Module SEARCH - Documentation Complète

**Statut:** ✅ Implémenté et prêt à tester  
**Date:** 2026-05-04  
**Architecture:** Recherche multi-type avec cache Redis

## 📋 Vue d'ensemble

Le module SEARCH permet de rechercher à travers tous les types de contenu de la plateforme:
- Posts
- Initiatives
- Articles
- Vidéos
- Profiles utilisateur

### Caractéristiques principales
- ✅ Recherche globale (tous les types)
- ✅ Recherche filtrée par type
- ✅ Filtrage par catégorie
- ✅ Tri par relevance/date/popularité
- ✅ Pagination
- ✅ Cache Redis (optionnel)
- ✅ Invalidation automatique via EventBus
- ✅ Recherche ILIKE (case-insensitive)

## 📁 Structure des fichiers

```
src/modules/search/
├── schema.js            # Zod validations
├── service.js           # SearchService (5 types + global)
├── controller.js        # HTTP handlers
├── routes.js            # Route definitions
└── index.js             # Module export { routes, init }
```

## 📍 Routes API

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| **GET** | `/api/v1/search?q=...` | Optional | Recherche globale |
| **GET** | `/api/v1/search/posts?q=...` | Optional | Posts uniquement |
| **GET** | `/api/v1/search/initiatives?q=...` | Optional | Initiatives uniquement |
| **GET** | `/api/v1/search/articles?q=...` | Optional | Articles uniquement |
| **GET** | `/api/v1/search/videos?q=...` | Optional | Vidéos uniquement |
| **GET** | `/api/v1/search/profiles?q=...` | Optional | Profiles uniquement |
| **POST** | `/api/v1/search/reindex` | Required | Invalider cache |
| **POST** | `/api/v1/search/reindex/:type` | Required | Invalider cache type spécifique |

## 📊 Format des réponses

### Paramètres de recherche

```javascript
q: string              // Obligatoire (min 1 char)
type?: string          // 'post' | 'initiative' | 'article' | 'video' | 'profile' (optionnel = globale)
category?: string      // Filtrer par catégorie
page: number           // Default 1
limit: number          // Default 10, max 50
sort: string           // 'relevance' | 'date' | 'popularity' (default 'relevance')
```

### Réponse Search

```json
{
  "success": true,
  "timestamp": "2026-05-04T10:00:00.000Z",
  "data": [
    {
      "id": "uuid",
      "type": "post",
      "title": "Title here",
      "excerpt": "First 200 chars of content...",
      "createdAt": "2026-05-04T10:00:00.000Z",
      "popularity": 42,
      "author": {
        "id": "user-uuid",
        "username": "john_doe",
        "avatar": "https://..."
      },
      "metadata": {
        "category": "politics",
        "tags": ["civique", "politique"]
      }
    }
  ],
  "error": null,
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "pages": 15
  }
}
```

## 🔄 Types de résultats normalisés

### Post Result
```javascript
{
  type: "post",
  title: string,
  excerpt: string (200 chars max),
  popularity: likes_count,
  metadata: { category, tags }
}
```

### Initiative Result
```javascript
{
  type: "initiative",
  title: string,
  excerpt: string (200 chars max),
  popularity: supporters_count,
  metadata: { category, status, latitude, longitude }
}
```

### Article Result
```javascript
{
  type: "article",
  title: string,
  excerpt: string (200 chars max),
  popularity: views_count,
  metadata: { category, status }
}
```

### Video Result
```javascript
{
  type: "video",
  title: string,
  excerpt: string (200 chars max),
  popularity: views_count,
  metadata: { category, duration, thumbnailUrl }
}
```

### Profile Result
```javascript
{
  type: "profile",
  title: username,
  excerpt: bio (200 chars max),
  popularity: 0,
  metadata: { location, bio }
}
```

## 📝 Exemples d'utilisation

### Recherche globale

```bash
curl "http://localhost:3000/api/v1/search?q=démocratie&page=1&limit=10"
```

**Réponse:** Mélange de posts, initiatives, articles, vidéos, profiles

### Recherche par type

```bash
# Posts uniquement
curl "http://localhost:3000/api/v1/search/posts?q=politique&category=civique&sort=popular"

# Initiatives uniquement
curl "http://localhost:3000/api/v1/search/initiatives?q=parc&sort=date"

# Articles uniquement
curl "http://localhost:3000/api/v1/search/articles?q=démocratie"

# Vidéos uniquement
curl "http://localhost:3000/api/v1/search/videos?q=education"

# Profiles uniquement
curl "http://localhost:3000/api/v1/search/profiles?q=john"
```

### Filtrage avancé

```bash
# Recherche + catégorie + tri
curl "http://localhost:3000/api/v1/search?q=climat&type=initiative&category=environnement&sort=popularity&limit=20"

# Pagination
curl "http://localhost:3000/api/v1/search?q=politique&page=2&limit=50"
```

### Invalidation du cache (protected)

```bash
curl -X POST http://localhost:3000/api/v1/search/reindex \
  -H "Authorization: Bearer TOKEN"

# Invalider un type spécifique
curl -X POST http://localhost:3000/api/v1/search/reindex/post \
  -H "Authorization: Bearer TOKEN"
```

## 🔐 Authentification

- Routes publiques (GET /search*) - `authOptional`
- Routes de maintenance (POST /reindex) - `authRequired`

## ✅ Validation

### searchQuerySchema
- `q`: string (min 1, max 255) ✓
- `type`: enum('post', 'initiative', 'article', 'video', 'profile') optional ✓
- `category`: string optional ✓
- `page`: number (min 1, default 1) ✓
- `limit`: number (min 1, max 50, default 10) ✓
- `sort`: enum('relevance', 'date', 'popularity', default 'relevance') ✓

### reindexSchema
- `type`: enum('post', 'initiative', 'article', 'video', 'profile', 'all') default 'all' ✓

## 🔄 Événements & Cache

### Cache Invalidation

La recherche intègre le caching Redis automatique. Le cache est invalidé quand:

- `post.created` | `post.updated` | `post.deleted` → Invalide cache
- `initiative.created` | `initiative.updated` | `initiative.closed` → Invalide cache
- `article.created` | `article.updated` → Invalide cache
- `video.created` | `video.updated` → Invalide cache
- `user.updated` → Invalide cache

### Avantages du caching
- ✅ Réduit les requêtes DB
- ✅ Accélère les résultats
- ✅ Automatiquement invalidé
- ✅ TTL 60 secondes

## 🗄️ Requêtes SQL utilisées

### Recherche sur Posts
```sql
SELECT p.id, p.title, p.content, p.category, p.user_id, p.likes_count,
       p.created_at, p.tags, u.username, p.avatar_url
FROM posts p
LEFT JOIN users u ON p.user_id = u.id
WHERE p.deleted_at IS NULL
  AND (p.title ILIKE '%query%' OR p.content ILIKE '%query%')
  AND (category = $1 OR category IS NULL)
ORDER BY ... (date | popularity | relevance)
LIMIT $limit OFFSET $offset
```

### Pattern similaire pour:
- `initiatives` table
- `education_articles` table
- `education_videos` table
- `users` + `user_profiles` (pour profiles)

## 🚨 Limitations actuelles

- ❌ Pas de full-text search ranking (utilise ILIKE)
- ❌ Pas de fuzzy search (typos)
- ❌ Pas de suggestions
- ❌ Pas de facettes

## 🚀 Améliorations futures

1. **Full-text search ranking**
   - Utiliser PostgreSQL `ts_rank()` pour meilleur scoring
   - Pondérer title > content

2. **Fuzzy search**
   - Tolérer les typos avec `pg_trgm`
   - Distance Levenshtein

3. **Facettes**
   - Compter par type, catégorie
   - Afficher dans réponse

4. **Suggestions**
   - Autocomplete pendant la saisie
   - Termes populaires

5. **Semantic search**
   - Embeddings vectoriels
   - Recherche par sens (pas juste keywords)

## 📋 Checklist

- [x] Implémentation service.js
- [x] Implémentation controller.js
- [x] Routes définies
- [x] Zod validation
- [x] AppError intégration
- [x] EventBus cache invalidation
- [x] Documentation
- [ ] Tests API manuels
- [ ] Tests unitaires (optionnel)
- [ ] Performance tuning

## 🧪 Tests manuels

Voir [SEARCH_QUICKSTART.md](./SEARCH_QUICKSTART.md)

---

**Module SEARCH implémenté et prêt! 🔍**
