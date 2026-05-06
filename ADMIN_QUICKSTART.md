# Module ADMIN - Guide de démarrage rapide

## ✅ Pré-requis

- [x] Node.js 18+
- [x] PostgreSQL (données)
- [x] Admin user avec role 'admin' ou 'moderator'
- [x] JWT token valide (admin)
- [x] Serveur backend démarré (`npm start`)

## 🚀 Installation

### 1. Le module est automatiquement chargé

Vérifier dans les logs:
```
✅ CORE module loaded: admin → /api/v1/admin
```

### 2. Créer un utilisateur admin (si nécessaire)

```bash
# Connexion en tant qu'admin existant
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123"
  }' | jq -r '.data.accessToken'

# Ou modifier le rôle d'un utilisateur existant via la base de données
psql -U postgres -d citoyenavise_db -c "UPDATE users SET role = 'admin' WHERE email = 'user@example.com';"
```

Sauvegarder le token: `TOKEN=votre_token_ici`

## 🧪 Tests API

### 1. Vérifier l'accès admin

```bash
curl http://localhost:3000/api/v1/admin/me \
  -H "Authorization: Bearer $TOKEN"
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "username": "admin_user",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### 2. Gestion des utilisateurs

#### Lister tous les utilisateurs

```bash
# Page 1 (défaut)
curl http://localhost:3000/api/v1/admin/users \
  -H "Authorization: Bearer $TOKEN"

# Avec pagination
curl "http://localhost:3000/api/v1/admin/users?page=2&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

#### Obtenir un utilisateur

```bash
curl "http://localhost:3000/api/v1/admin/users/USER_UUID" \
  -H "Authorization: Bearer $TOKEN"
```

#### Changer le rôle d'un utilisateur

```bash
# Promouvoir en moderator
curl -X PUT http://localhost:3000/api/v1/admin/users/USER_UUID/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "moderator"
  }'

# Rétrograder en user
curl -X PUT http://localhost:3000/api/v1/admin/users/USER_UUID/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user"
  }'

# Promouvoir en admin
curl -X PUT http://localhost:3000/api/v1/admin/users/USER_UUID/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin"
  }'
```

### 3. Bannissement d'utilisateurs

#### Bannir un utilisateur

```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/USER_UUID/ban \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Violation of community guidelines - spam and harassment detected"
  }'
```

**Validation:** raison min 10 cars, max 500

#### Débannir un utilisateur

```bash
curl -X PUT http://localhost:3000/api/v1/admin/users/USER_UUID/unban \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Suppression de contenu

#### Supprimer un post

```bash
curl -X DELETE http://localhost:3000/api/v1/admin/posts/POST_UUID \
  -H "Authorization: Bearer $TOKEN"
```

#### Supprimer un article

```bash
curl -X DELETE http://localhost:3000/api/v1/admin/articles/ARTICLE_UUID \
  -H "Authorization: Bearer $TOKEN"
```

#### Supprimer une vidéo

```bash
curl -X DELETE http://localhost:3000/api/v1/admin/videos/VIDEO_UUID \
  -H "Authorization: Bearer $TOKEN"
```

#### Supprimer un commentaire

```bash
curl -X DELETE http://localhost:3000/api/v1/admin/comments/COMMENT_UUID \
  -H "Authorization: Bearer $TOKEN"
```

#### Supprimer une initiative

```bash
curl -X DELETE http://localhost:3000/api/v1/admin/initiatives/INITIATIVE_UUID \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Gestion des initiatives

#### Fermer une initiative

```bash
curl -X PUT http://localhost:3000/api/v1/admin/initiatives/INITIATIVE_UUID/close \
  -H "Authorization: Bearer $TOKEN"
```

**Statut devient:** `closed`

### 6. Statistiques système

#### Voir les statistiques globales

```bash
curl http://localhost:3000/api/v1/admin/stats/overview \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2026-05-04T10:00:00.000Z",
  "data": {
    "users": 250,
    "posts": 1200,
    "initiatives": 45,
    "comments": 3500
  }
}
```

## 🔐 Erreurs courantes

### Erreur: "Admin access required"
- Cause: Vous n'êtes pas admin/moderator
- Solution: Changer votre rôle en admin ou moderator
```bash
# En tant qu'admin existant:
psql -U postgres -d citoyenavise_db -c "UPDATE users SET role = 'admin' WHERE id = 'YOUR_USER_ID';"
```

### Erreur: "User not found"
- Cause: L'UUID utilisateur n'existe pas
- Solution: Vérifier l'UUID dans la base de données

### Erreur: 422 Validation failed
- Cause: Les données ne correspondent pas au schéma
- Vérifications:
  - `role` doit être: 'user', 'moderator', 'admin'
  - `reason` (ban) doit avoir 10-500 caractères
  - `limit` ne doit pas dépasser 100

### Erreur: "Unauthorized"
- Cause: Token JWT invalide ou expiré
- Solution: Se reconnecter pour obtenir un nouveau token

## 🔍 Vérifier les données en base

```bash
# Lister les utilisateurs et leurs rôles
psql -U postgres -d citoyenavise_db -c "SELECT id, username, email, role, banned FROM users LIMIT 10;"

# Lister les utilisateurs bannis
psql -U postgres -d citoyenavise_db -c "SELECT id, username, banned, ban_reason FROM users WHERE banned = true;"

# Compter les posts (non supprimés)
psql -U postgres -d citoyenavise_db -c "SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL;"

# Compter les commentaires (non supprimés)
psql -U postgres -d citoyenavise_db -c "SELECT COUNT(*) FROM comments WHERE deleted_at IS NULL;"

# Voir les initiatives (non supprimées)
psql -U postgres -d citoyenavise_db -c "SELECT COUNT(*) FROM initiatives WHERE deleted_at IS NULL;"
```

## 🎯 Workflows compllets

### Workflow 1: Modérer un utilisateur spam

```bash
# 1. Voir les posts de l'utilisateur
curl "http://localhost:3000/api/v1/posts?author=USER_UUID" \
  -H "Authorization: Bearer $TOKEN"

# 2. Supprimer les posts problématiques
curl -X DELETE http://localhost:3000/api/v1/admin/posts/POST_UUID \
  -H "Authorization: Bearer $TOKEN"

# 3. Bannir l'utilisateur
curl -X PUT http://localhost:3000/api/v1/admin/users/USER_UUID/ban \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Spam content - multiple violation reports from community members"
  }'

# 4. Vérifier que le ban est appliqué
curl "http://localhost:3000/api/v1/admin/users/USER_UUID" \
  -H "Authorization: Bearer $TOKEN"
```

### Workflow 2: Promouvoir un modérateur

```bash
# 1. Lister les utilisateurs
curl "http://localhost:3000/api/v1/admin/users?limit=50" \
  -H "Authorization: Bearer $TOKEN"

# 2. Trouver l'utilisateur à promouvoir
MODERATOR_UUID="..."

# 3. Changer le rôle
curl -X PUT http://localhost:3000/api/v1/admin/users/$MODERATOR_UUID/role \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "moderator"
  }'
```

### Workflow 3: Supprimer du contenu problématique

```bash
# Supprimer un post
curl -X DELETE http://localhost:3000/api/v1/admin/posts/POST_UUID \
  -H "Authorization: Bearer $TOKEN"

# Supprimer tous les commentaires sur ce post
curl -X DELETE http://localhost:3000/api/v1/admin/comments/COMMENT_UUID \
  -H "Authorization: Bearer $TOKEN"

# Vérifier les statistiques
curl http://localhost:3000/api/v1/admin/stats/overview \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 Monitoring

### Vérifier les stats toutes les heures

```bash
# Script pour monitoring
while true; do
  echo "=== Stats $(date) ==="
  curl -s http://localhost:3000/api/v1/admin/stats/overview \
    -H "Authorization: Bearer $TOKEN" | jq '.data'
  sleep 3600  # Wait 1 hour
done
```

## ✨ Points clés

✅ **Authentification:** JWT token requis  
✅ **Rôles:** admin, moderator ont accès  
✅ **Soft delete:** Aucune suppression définitive  
✅ **Événements:** Tous les actions émises via EventBus  
✅ **Validation:** Zod sur tous les inputs  

---

**Module ADMIN prêt pour administration! 👨‍💼**

Voir [ADMIN_MODULE.md](./ADMIN_MODULE.md) pour documentation complète.
