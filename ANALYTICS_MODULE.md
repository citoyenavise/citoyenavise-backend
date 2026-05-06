# Module ANALYTICS - Documentation Complète

**Statut:** ✅ Implémenté et prêt à tester  
**Date:** 2026-05-04  
**Architecture:** Event tracking avec caching Redis

## 📋 Vue d'ensemble

Le module ANALYTICS fournit:
- Tracking d'événements utilisateur (views, clicks, searches, etc.)
- Statistiques globales avec filtrage par période
- Cache Redis pour performances
- Admin-only stats dashboard

### Caractéristiques principales
- ✅ Tracking public (pas d'auth requise)
- ✅ 6 types d'événements
- ✅ Métadonnées JSONB flexibles
- ✅ Statistiques avec ranges (24h, 7d, 30d, all)
- ✅ Cache Redis automatique (60s TTL)
- ✅ Admin-only stats endpoint
- ✅ EventBus invalidation
- ✅ Soft deletes via user_id nullable

## 📁 Structure des fichiers

```
src/modules/analytics/
├── schema.js            # Zod validations
├── service.js           # AnalyticsService
├── controller.js        # HTTP handlers
├── routes.js            # Route definitions
└── index.js             # Module export { routes, init }

database/migrations/
└── V008_analytics_module.sql
```

## 📍 Routes API

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| **POST** | `/api/v1/analytics/track` | Optional | Tracker un événement |
| **GET** | `/api/v1/analytics/stats` | Required* | Statistiques (admin) |

*Admin/moderator role required

## 📊 Format des réponses

### Track Event (Public)

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "post_view",
    "targetId": "post-uuid",
    "metadata": {
      "referrer": "search",
      "device": "mobile"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-05-04T10:00:00.000Z",
  "data": {
    "id": "event-uuid",
    "type": "post_view",
    "target_id": "post-uuid",
    "metadata": {
      "referrer": "search",
      "device": "mobile"
    },
    "created_at": "2026-05-04T10:00:00.000Z",
    "user_id": null
  }
}
```

### Get Stats (Admin)

**Request:**
```bash
curl "http://localhost:3000/api/v1/analytics/stats?range=7d" \
  -H "Authorization: Bearer TOKEN"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-05-04T10:00:00.000Z",
  "data": {
    "views": 1250,
    "searches": 340,
    "initiatives": 45,
    "videos": 120,
    "articles": 85
  }
}
```

## 🎯 Types d'événements

| Type | Description | Exemple |
|------|-------------|---------|
| `view` | Vue générale | Page view |
| `click` | Clic sur un élément | Button click |
| `search` | Recherche effectuée | Search query |
| `initiative_view` | Vue d'une initiative | Initiative detail |
| `video_view` | Vue d'une vidéo | Video watch |
| `article_view` | Vue d'un article | Article read |

## 📈 Ranges de temps

| Range | Jours | Utilisation |
|-------|-------|-------------|
| `24h` | 1 | Statistiques quotidiennes |
| `7d` | 7 | Rapport hebdomadaire (défaut) |
| `30d` | 30 | Rapport mensuel |
| `all` | 3650 | Tous les temps |

## 🗄️ Structure database

### Table: analytics_events
```sql
analytics_events (
  id UUID PRIMARY KEY,
  type VARCHAR(50),                -- view, click, search, etc.
  target_id UUID,                  -- ID de la ressource (post, video, etc.)
  metadata JSONB,                  -- Données flexibles
  user_id UUID REFERENCES users,   -- Utilisateur (nullable)
  ip_address INET,                 -- Optionnel: IP
  user_agent TEXT,                 -- Optionnel: User agent
  created_at TIMESTAMP
)
```

### Table: analytics_summary (optionnel)
```sql
analytics_summary (
  id UUID PRIMARY KEY,
  range VARCHAR(10),               -- 24h, 7d, 30d, all
  total_views INT,
  total_searches INT,
  initiative_views INT,
  video_views INT,
  article_views INT,
  calculated_at TIMESTAMP,
  UNIQUE(range)
)
```

## 🔐 Authentification

- **POST /track** - Public (authOptional)
- **GET /stats** - Admin only (authRequired + role check)

## ✅ Validation

### trackEventSchema
- `type`: enum (view, click, search, initiative_view, video_view, article_view) ✓
- `targetId`: UUID (optional) ✓
- `metadata`: record<string, any> (optional) ✓

### statsQuerySchema
- `range`: enum (24h, 7d, 30d, all) default '7d' ✓

## 🔄 Événements & Cache

### Cache Invalidation

Cache invalidated when:
```javascript
eventBus.on('post.created', invalidate)
eventBus.on('post.updated', invalidate)
eventBus.on('initiative.created', invalidate)
eventBus.on('initiative.updated', invalidate)
eventBus.on('video.created', invalidate)
eventBus.on('video.updated', invalidate)
eventBus.on('article.created', invalidate)
eventBus.on('article.updated', invalidate)
```

### Cache Pattern
```
Key: analytics:{range}
TTL: 60 seconds
Value: { views, searches, initiatives, videos, articles }
```

## 💡 Cas d'utilisation

### Frontend: Tracker une vue de post
```javascript
// Après que l'utilisateur voit un post
fetch('/api/v1/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'view',
    targetId: postId,
    metadata: {
      scrollDepth: 0.75,
      timeSpent: 30000
    }
  })
})
```

### Frontend: Tracker une recherche
```javascript
// Après une recherche
fetch('/api/v1/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'search',
    metadata: {
      query: 'démocratie',
      results: 150,
      filters: { category: 'politics' }
    }
  })
})
```

### Admin: Voir les statistiques
```bash
# 7 derniers jours
curl http://localhost:3000/api/v1/analytics/stats?range=7d \
  -H "Authorization: Bearer TOKEN"

# 30 derniers jours
curl http://localhost:3000/api/v1/analytics/stats?range=30d \
  -H "Authorization: Bearer TOKEN"

# Tout le temps
curl http://localhost:3000/api/v1/analytics/stats?range=all \
  -H "Authorization: Bearer TOKEN"
```

## 🚀 Améliorations futures

1. **User Segmentation**
   - Stats par type d'utilisateur
   - Behavior funnels
   - Cohort analysis

2. **Real-time Analytics**
   - WebSocket pour live stats
   - Real-time dashboards
   - Alert thresholds

3. **Advanced Metrics**
   - Session tracking
   - Flow analysis
   - Conversion tracking

4. **Data Export**
   - CSV/JSON export
   - Scheduled reports
   - Email delivery

5. **Visualization**
   - Charts et graphs
   - Heatmaps
   - Timeline views

## 📋 Checklist

- [x] Schema validation
- [x] Service layer
- [x] Controller layer
- [x] Routes définies
- [x] Admin middleware
- [x] EventBus cache invalidation
- [x] Migration SQL
- [x] Redis caching
- [x] Error handling
- [ ] Tests API manuels
- [ ] Frontend integration
- [ ] Advanced analytics
- [ ] Dashboard UI

---

**Module ANALYTICS implémenté et prêt! 📊**

Voir [ANALYTICS_QUICKSTART.md](./ANALYTICS_QUICKSTART.md) pour guide de démarrage.
