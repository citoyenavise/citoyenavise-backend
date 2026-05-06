# Module INITIATIVES - Guide de démarrage rapide

## ✅ Pré-requis

- [x] Node.js 18+
- [x] PostgreSQL avec migration V007
- [x] Token JWT valide
- [x] Serveur backend démarré (`npm start`)

## 🚀 Installation

### 1. Appliquer la migration SQL

```bash
# Option 1: Via npm script
npm run migrate

# Option 2: Directement avec psql
psql -U postgres -d citoyenavise_db -f database/migrations/V007_initiatives_module.sql

# Option 3: Via l'outil de migration
node src/database/migrationRunner.js
```

### 2. Vérifier l'intégration du module

Le module est automatiquement chargé par `moduleLoader.js`. Vérifier dans les logs:
```
✅ CORE module loaded: initiatives → /api/v1/initiatives
```

### 3. Démarrer le serveur

```bash
npm start
# ou en développement
npm run dev
```

## 🧪 Tests API

### Obtenir un token JWT

```bash
# Enregistrer un utilisateur (si besoin)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "username": "testuser"
  }'

# Se connecter
RESPONSE=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')
echo "Token: $TOKEN"
```

Utiliser `YOUR_TOKEN=$TOKEN` ou `Authorization: Bearer $TOKEN` dans les requêtes.

## 📋 Tests INITIATIVES CRUD

### Créer une initiative (auth required)

```bash
curl -X POST http://localhost:3000/api/v1/initiatives \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Parc communautaire rue Martin",
    "description": "Créer un parc avec zones vertes et jeux pour enfants du quartier",
    "goals": "Améliorer la qualité de vie et créer un espace social",
    "category": "environnement",
    "latitude": 45.5017,
    "longitude": -73.5673,
    "deadline": "2026-12-31T23:59:59Z"
  }'
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "id": "INIT_UUID_1",
    "title": "Parc communautaire rue Martin",
    "status": "draft",
    "supporters_count": 0,
    "created_at": "2026-05-04T10:00:00.000Z"
  }
}
```

Sauvegarder l'ID: `INIT_ID=INIT_UUID_1`

### Lister les initiatives (public)

```bash
# Tous les initiatives
curl http://localhost:3000/api/v1/initiatives

# Avec pagination
curl http://localhost:3000/api/v1/initiatives?page=1&limit=10

# Filtrer par catégorie
curl http://localhost:3000/api/v1/initiatives?category=environnement

# Filtrer par status
curl http://localhost:3000/api/v1/initiatives?status=active

# Trier par popularité
curl http://localhost:3000/api/v1/initiatives?sort=popular

# Trier par deadline
curl http://localhost:3000/api/v1/initiatives?sort=deadline

# Rechercher
curl http://localhost:3000/api/v1/initiatives?search=parc
```

### Obtenir le détail d'une initiative (public)

```bash
curl http://localhost:3000/api/v1/initiatives/$INIT_ID
```

### Obtenir les statistiques (public)

```bash
curl http://localhost:3000/api/v1/initiatives/$INIT_ID/stats

# Réponse:
# {
#   "id": "INIT_ID",
#   "title": "...",
#   "supporters_count": 5,
#   "impact_score": 2.5,
#   "votes_count": 5,
#   "comments_count": 12
# }
```

### Mettre à jour une initiative (auth required + owner)

```bash
curl -X PUT http://localhost:3000/api/v1/initiatives/$INIT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Parc communautaire rue Martin - RÉNOVATION",
    "status": "active"
  }'
```

### Fermer une initiative (auth required + owner)

```bash
curl -X POST http://localhost:3000/api/v1/initiatives/$INIT_ID/close \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "closed"
  }'

# ou archiver
curl -X POST http://localhost:3000/api/v1/initiatives/$INIT_ID/close \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "archived"
  }'
```

### Supprimer une initiative (auth required + owner)

```bash
curl -X DELETE http://localhost:3000/api/v1/initiatives/$INIT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🗳️ Tests VOTES

### Voter pour une initiative (auth required)

```bash
curl -X POST http://localhost:3000/api/v1/initiatives/$INIT_ID/votes \
  -H "Authorization: Bearer YOUR_TOKEN"

# Réponse:
# {
#   "success": true,
#   "data": {
#     "id": "VOTE_UUID",
#     "initiative_id": "INIT_ID",
#     "user_id": "USER_ID",
#     "created_at": "2026-05-04T10:00:00.000Z"
#   }
# }
```

### Vérifier si j'ai voté (optionnel auth)

```bash
curl http://localhost:3000/api/v1/initiatives/$INIT_ID/votes/status \
  -H "Authorization: Bearer YOUR_TOKEN"

# Réponse:
# {
#   "success": true,
#   "data": {
#     "hasVoted": true
#   }
# }
```

### Lister les supporters (public)

```bash
# Page 1
curl http://localhost:3000/api/v1/initiatives/$INIT_ID/votes

# Avec pagination
curl "http://localhost:3000/api/v1/initiatives/$INIT_ID/votes?page=1&limit=20"

# Réponse:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "VOTE_UUID",
#       "user_id": "USER_UUID",
#       "username": "john_doe",
#       "avatar_url": "https://...",
#       "created_at": "2026-05-04T10:00:00.000Z"
#     }
#   ],
#   "meta": {
#     "total": 42,
#     "page": 1,
#     "limit": 20,
#     "pages": 3
#   }
# }
```

### Retirer mon vote (auth required)

```bash
curl -X DELETE http://localhost:3000/api/v1/initiatives/$INIT_ID/votes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 💬 Tests COMMENTAIRES

### Ajouter un commentaire (auth required)

```bash
curl -X POST http://localhost:3000/api/v1/initiatives/$INIT_ID/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Excellente initiative! Je soutiens ce projet pour le quartier."
  }'

# Réponse:
# {
#   "success": true,
#   "data": {
#     "id": "COMMENT_UUID",
#     "entity_id": "INIT_ID",
#     "user_id": "USER_ID",
#     "content": "Excellente initiative!...",
#     "created_at": "2026-05-04T10:00:00.000Z",
#     "username": "john_doe",
#     "avatar_url": "https://..."
#   }
# }
```

### Lister les commentaires (public)

```bash
# Récents
curl http://localhost:3000/api/v1/initiatives/$INIT_ID/comments

# Populaires
curl http://localhost:3000/api/v1/initiatives/$INIT_ID/comments?sort=popular

# Avec pagination
curl "http://localhost:3000/api/v1/initiatives/$INIT_ID/comments?page=1&limit=10"
```

### Éditer un commentaire (auth required + owner)

```bash
COMMENT_ID="comment-uuid-here"

curl -X PUT http://localhost:3000/api/v1/initiatives/$INIT_ID/comments/$COMMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Commentaire édité avec plus de détails..."
  }'
```

### Supprimer un commentaire (auth required + owner)

```bash
curl -X DELETE http://localhost:3000/api/v1/initiatives/$INIT_ID/comments/$COMMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Vérifier les données en base

```bash
# Initiatives
psql -U postgres -d citoyenavise_db -c "SELECT id, title, status, supporters_count, created_at FROM initiatives LIMIT 5;"

# Votes
psql -U postgres -d citoyenavise_db -c "SELECT initiative_id, user_id, created_at FROM initiatives_votes LIMIT 5;"

# Commentaires sur initiatives
psql -U postgres -d citoyenavise_db -c "SELECT * FROM comments WHERE entity_type = 'initiative' LIMIT 5;"
```

## 🔍 Exemples complets de workflows

### Workflow 1: Créer une initiative et la promouvoir

```bash
# 1. Créer
INIT=$(curl -s -X POST http://localhost:3000/api/v1/initiatives \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Projet écologique",
    "description": "Description du projet",
    "category": "environnement"
  }')
INIT_ID=$(echo $INIT | jq -r '.data.id')

# 2. Publier (status = active)
curl -X PUT http://localhost:3000/api/v1/initiatives/$INIT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'

# 3. Ajouter des supporters (voter)
curl -X POST http://localhost:3000/api/v1/initiatives/$INIT_ID/votes \
  -H "Authorization: Bearer $TOKEN2"

# 4. Voir les stats
curl http://localhost:3000/api/v1/initiatives/$INIT_ID/stats
```

### Workflow 2: Discussion sur une initiative

```bash
# 1. Lister initiatives actives
curl "http://localhost:3000/api/v1/initiatives?status=active&sort=popular"

# 2. Choisir une et commenter
INIT_ID="..."
curl -X POST http://localhost:3000/api/v1/initiatives/$INIT_ID/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Commentaire constructif..."}'

# 3. Voir les commentaires
curl http://localhost:3000/api/v1/initiatives/$INIT_ID/comments?sort=recent

# 4. Voter pour soutenir
curl -X POST http://localhost:3000/api/v1/initiatives/$INIT_ID/votes \
  -H "Authorization: Bearer $TOKEN"

# 5. Voir les supporters
curl http://localhost:3000/api/v1/initiatives/$INIT_ID/votes
```

## 🚨 Dépannage

### Erreur: "Initiative not found"
- Vérifier l'UUID de l'initiative
- Vérifier que l'initiative n'est pas supprimée (deleted_at IS NULL)

### Erreur: "You already support this initiative"
- Vous avez déjà voté pour cette initiative
- Retirer votre vote avec DELETE avant de voter à nouveau

### Erreur: "Not authorized to update this..."
- Vérifier que vous êtes l'auteur
- Vérifier que le token JWT est valide et correspond au user_id

### Erreur: "Table does not exist"
- Vérifier que migration V007 a été appliquée
- Run: `npm run migrate` ou appliquer manuellement

### Erreur 422 Validation failed
- Vérifier les types de données
- Vérifier que les strings obligatoires ne sont pas vides
- Vérifier les formats (UUID pour IDs, ISO8601 pour dates)

## 📚 Ressources

- [INITIATIVES_MODULE.md](./INITIATIVES_MODULE.md) - Documentation complète
- [database/migrations/V007_initiatives_module.sql](./database/migrations/V007_initiatives_module.sql) - Schéma database
- [src/modules/initiatives/](./src/modules/initiatives/) - Code source

## ✨ Prochaines étapes

1. **Tester complètement** tous les endpoints
2. **Intégrer les LIKES** pour initiatives
3. **Ajouter NOTIFICATIONS** pour créateurs
4. **Configurer REDIS** pour cache popularité
5. **Créer des TESTS** unitaires

---

**Module prêt à l'emploi! 🎉**
