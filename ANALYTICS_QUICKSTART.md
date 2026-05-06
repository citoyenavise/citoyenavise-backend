# Module ANALYTICS - Guide de démarrage rapide

## ✅ Pré-requis

- [x] Node.js 18+
- [x] PostgreSQL
- [x] Redis (optionnel, caching)
- [x] Serveur backend démarré (`npm start`)

## 🚀 Installation

### 1. Appliquer la migration SQL

```bash
# Option 1: Via npm script
npm run migrate

# Option 2: Directement avec psql
psql -U postgres -d citoyenavise_db -f database/migrations/V008_analytics_module.sql

# Option 3: Via l'outil de migration
node src/database/migrationRunner.js
```

### 2. Le module est automatiquement chargé

Vérifier dans les logs:
```
✅ CORE module loaded: analytics → /api/v1/analytics
```

## 🧪 Tests API

### 1. Tracker un événement (Public)

#### View événement
```bash
curl -X POST http://localhost:3000/api/v1/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "view",
    "targetId": "post-uuid-here",
    "metadata": {
      "scrollDepth": 0.75,
      "timeSpent": 30000
    }
  }'
```

#### Search événement
```bash
curl -X POST http://localhost:3000/api/v1/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "search",
    "metadata": {
      "query": "démocratie",
      "results": 150,
      "category": "politics"
    }
  }'
```

#### Initiative view
```bash
curl -X POST http://localhost:3000/api/v1/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "initiative_view",
    "targetId": "initiative-uuid"
  }'
```

#### Video view
```bash
curl -X POST http://localhost:3000/api/v1/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video_view",
    "targetId": "video-uuid",
    "metadata": {
      "duration": 1200,
      "watched": 850
    }
  }'
```

#### Article view
```bash
curl -X POST http://localhost:3000/api/v1/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "article_view",
    "targetId": "article-uuid"
  }'
```

#### Click événement
```bash
curl -X POST http://localhost:3000/api/v1/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "click",
    "metadata": {
      "element": "share-button",
      "target": "twitter"
    }
  }'
```

### 2. Obtenir les statistiques (Admin)

**D'abord, obtenir un token admin:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123"
  }' | jq -r '.data.accessToken'

# Sauvegarder le token
TOKEN=votre_token_ici
```

**Récupérer les stats:**
```bash
# Dernières 24 heures
curl "http://localhost:3000/api/v1/analytics/stats?range=24h" \
  -H "Authorization: Bearer $TOKEN"

# Dernières 7 jours (défaut)
curl "http://localhost:3000/api/v1/analytics/stats" \
  -H "Authorization: Bearer $TOKEN"

# Derniers 30 jours
curl "http://localhost:3000/api/v1/analytics/stats?range=30d" \
  -H "Authorization: Bearer $TOKEN"

# Tous les temps
curl "http://localhost:3000/api/v1/analytics/stats?range=all" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "views": 1250,
    "searches": 340,
    "initiatives": 45,
    "videos": 120,
    "articles": 85
  }
}
```

## 🎯 Workflows complets

### Workflow 1: Tracker les interactions utilisateur (Frontend)

```javascript
// 1. Utilisateur voit un post
fetch('/api/v1/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'view',
    targetId: postId,
    metadata: {
      scrollDepth: calculateScrollDepth(),
      timeSpent: Date.now() - pageLoadTime
    }
  })
})

// 2. Utilisateur clique sur "partager"
fetch('/api/v1/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'click',
    metadata: {
      element: 'share-button',
      target: 'twitter'
    }
  })
})

// 3. Utilisateur effectue une recherche
fetch('/api/v1/analytics/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'search',
    metadata: {
      query: userSearchQuery,
      filters: appliedFilters
    }
  })
})
```

### Workflow 2: Admin vérifie les statistiques

```bash
# 1. Se connecter en tant qu'admin
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"AdminPassword123"}' | jq -r '.data.accessToken')

# 2. Voir les stats de cette semaine
curl http://localhost:3000/api/v1/analytics/stats?range=7d \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Voir les stats du mois
curl http://localhost:3000/api/v1/analytics/stats?range=30d \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Workflow 3: Tracker les vues d'initiative

```bash
# Utilisateur voit une initiative
curl -X POST http://localhost:3000/api/v1/analytics/track \
  -H "Content-Type: application/json" \
  -d '{
    "type": "initiative_view",
    "targetId": "'$INITIATIVE_UUID'"
  }'

# Admin voit combien ont vu les initiatives (dans les stats)
curl http://localhost:3000/api/v1/analytics/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.data.initiatives'
```

## 🔍 Vérifier les données en base

```bash
# Voir tous les événements
psql -U postgres -d citoyenavise_db -c "SELECT type, COUNT(*) FROM analytics_events GROUP BY type;"

# Voir les événements récents
psql -U postgres -d citoyenavise_db -c "SELECT type, target_id, created_at FROM analytics_events ORDER BY created_at DESC LIMIT 10;"

# Compter les vues par jour
psql -U postgres -d citoyenavise_db -c "
SELECT DATE(created_at), COUNT(*) as views 
FROM analytics_events 
WHERE type = 'view' 
GROUP BY DATE(created_at) 
ORDER BY DATE DESC;
"

# Compter les recherches
psql -U postgres -d citoyenavise_db -c "SELECT COUNT(*) as searches FROM analytics_events WHERE type = 'search';"
```

## 🚨 Erreurs courantes

### Erreur: "Admin access required"
- Cause: Token n'est pas admin/moderator
- Solution: Se connecter avec un user admin

### Erreur: 422 Validation failed
- Cause: Données ne correspondent pas au schéma
- Vérifications:
  - `type` doit être dans: view, click, search, initiative_view, video_view, article_view
  - `targetId` (si fourni) doit être UUID valide
  - `range` doit être: 24h, 7d, 30d, all

### Erreur: "Table does not exist"
- Cause: Migration V008 n'a pas été appliquée
- Solution: `npm run migrate` ou appliquer manuellement

## 📊 Monitoring

### Voir la tendance des vues

```bash
# Script de monitoring
while true; do
  STATS=$(curl -s http://localhost:3000/api/v1/analytics/stats?range=24h \
    -H "Authorization: Bearer $TOKEN")
  VIEWS=$(echo $STATS | jq '.data.views')
  echo "Views (24h): $VIEWS - $(date)"
  sleep 300  # Toutes les 5 minutes
done
```

## ✨ Points clés

✅ **Tracking public** - Pas besoin de JWT  
✅ **Stats admin-only** - Authentification requise  
✅ **Cache Redis** - 60 secondes TTL  
✅ **Invalidation automatique** - Via EventBus  
✅ **Métadonnées flexibles** - JSONB storage  
✅ **Soft deletes** - User ID nullable  

## 🎯 Prochaines étapes

1. **Frontend Integration**
   - Tracker les vues de pages
   - Tracker les clicks importants
   - Tracker les recherches

2. **Advanced Analytics**
   - User funnels
   - Cohort analysis
   - Conversion tracking

3. **Real-time Dashboard**
   - WebSocket pour live stats
   - Charts et graphs
   - Alert thresholds

---

**Module ANALYTICS prêt pour utilisation! 📊**

Voir [ANALYTICS_MODULE.md](./ANALYTICS_MODULE.md) pour documentation complète.
