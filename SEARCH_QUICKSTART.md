# Module SEARCH - Guide de démarrage rapide

## ✅ Pré-requis

- [x] Node.js 18+
- [x] PostgreSQL (avec données)
- [x] Module EDUCATION, INITIATIVES, POSTS implémentés
- [x] Serveur backend démarré (`npm start`)

## 🚀 Installation

### 1. Le module est automatiquement chargé

Vérifier dans les logs au démarrage:
```
✅ CORE module loaded: search → /api/v1/search
```

### 2. Vérifier les données

S'assurer d'avoir des données dans:
- `posts` table
- `initiatives` table
- `education_articles` table
- `education_videos` table
- `users` table

## 🧪 Tests API

### 0. Obtenir un token (optionnel - search est public)

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }' | jq -r '.data.accessToken'
```

### 1. Recherche globale (tous les types)

**Requête simple:**
```bash
curl "http://localhost:3000/api/v1/search?q=politique"

# Avec paramètres avancés
curl "http://localhost:3000/api/v1/search?q=politique&page=1&limit=10&sort=date"

# Avec tri par popularité
curl "http://localhost:3000/api/v1/search?q=démocratie&sort=popularity"

# Avec pagination
curl "http://localhost:3000/api/v1/search?q=politique&page=2&limit=20"
```

**Réponse attendue:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "post",
      "title": "Title",
      "excerpt": "First 200 chars...",
      "createdAt": "2026-05-04T...",
      "popularity": 42,
      "author": {
        "id": "user-uuid",
        "username": "john",
        "avatar": "https://..."
      },
      "metadata": {
        "category": "politics",
        "tags": ["civique"]
      }
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "pages": 15
  }
}
```

### 2. Recherche par type de contenu

#### Rechercher dans les POSTS
```bash
curl "http://localhost:3000/api/v1/search/posts?q=démocratie"

# Avec catégorie
curl "http://localhost:3000/api/v1/search/posts?q=politique&category=civique"

# Avec tri
curl "http://localhost:3000/api/v1/search/posts?q=politique&sort=popular"
```

#### Rechercher dans les INITIATIVES
```bash
curl "http://localhost:3000/api/v1/search/initiatives?q=parc"

# Avec catégorie
curl "http://localhost:3000/api/v1/search/initiatives?q=environnement&category=environnement"

# Trier par date (plus récent d'abord)
curl "http://localhost:3000/api/v1/search/initiatives?q=projet&sort=date"

# Trier par popularité (plus de supporters)
curl "http://localhost:3000/api/v1/search/initiatives?q=initiative&sort=popularity"
```

#### Rechercher dans les ARTICLES
```bash
curl "http://localhost:3000/api/v1/search/articles?q=éducation"

# Avec catégorie
curl "http://localhost:3000/api/v1/search/articles?q=politique&category=civique"
```

#### Rechercher dans les VIDÉOS
```bash
curl "http://localhost:3000/api/v1/search/videos?q=démocratie"

# Avec catégorie
curl "http://localhost:3000/api/v1/search/videos?q=politique&category=civique"
```

#### Rechercher dans les PROFILES
```bash
curl "http://localhost:3000/api/v1/search/profiles?q=john"

# Recherche par username ou bio
curl "http://localhost:3000/api/v1/search/profiles?q=citoyen"
```

### 3. Paramètres avancés

#### Pagination
```bash
# Page 1 (défaut)
curl "http://localhost:3000/api/v1/search?q=politique&limit=10"

# Page 2
curl "http://localhost:3000/api/v1/search?q=politique&page=2&limit=10"

# Page 5 avec 50 par page
curl "http://localhost:3000/api/v1/search?q=politique&page=5&limit=50"
```

#### Tri
```bash
# Par date (défaut) - plus récent d'abord
curl "http://localhost:3000/api/v1/search?q=politique&sort=date"

# Par popularité - plus de likes/vues
curl "http://localhost:3000/api/v1/search?q=politique&sort=popularity"

# Par relevance (cas général) - défaut pour global
curl "http://localhost:3000/api/v1/search?q=politique&sort=relevance"
```

#### Catégorie
```bash
# Filtrer par catégorie (posts + initiatives + articles + vidéos)
curl "http://localhost:3000/api/v1/search?q=politique&category=civique"

curl "http://localhost:3000/api/v1/search/posts?q=système&category=politique"

curl "http://localhost:3000/api/v1/search/initiatives?q=développement&category=economie"
```

### 4. Maintenance (Protected)

**Invalider tout le cache:**
```bash
curl -X POST http://localhost:3000/api/v1/search/reindex \
  -H "Authorization: Bearer TOKEN"
```

**Invalider le cache d'un type:**
```bash
# Invalider seulement les posts
curl -X POST http://localhost:3000/api/v1/search/reindex/post \
  -H "Authorization: Bearer TOKEN"

# Invalider initiatives
curl -X POST http://localhost:3000/api/v1/search/reindex/initiative \
  -H "Authorization: Bearer TOKEN"

# Types: post, initiative, article, video, profile, all
```

## 🔍 Exemples complets de workflows

### Workflow 1: Recherche d'un projet spécifique

```bash
# L'utilisateur cherche "parc"
curl "http://localhost:3000/api/v1/search/initiatives?q=parc&sort=popularity"

# Résultats: initiatives avec "parc" dans titre/description
# Triées par nombre de supporters (plus haut d'abord)
```

### Workflow 2: Découvrir du contenu éducatif

```bash
# Chercher dans la catégorie éducation
curl "http://localhost:3000/api/v1/search?q=démocratie&category=civique&limit=20"

# Obtient: posts, articles, vidéos sur démocratie/civique
# Tous les types mélangés
```

### Workflow 3: Trouver un utilisateur

```bash
# Chercher un utilisateur
curl "http://localhost:3000/api/v1/search/profiles?q=john_doe"

# Résultats: profiles correspondant à "john_doe" en username ou bio
```

### Workflow 4: Recherche récente vs populaire

```bash
# Contenu le plus récent
curl "http://localhost:3000/api/v1/search?q=politique&sort=date"

# Contenu le plus populaire
curl "http://localhost:3000/api/v1/search?q=politique&sort=popularity"

# Contenu le plus pertinent (par défaut)
curl "http://localhost:3000/api/v1/search?q=politique&sort=relevance"
```

## 🚨 Dépannage

### Erreur: "Query is required"
- Vous n'avez pas fourni le paramètre `q`
- Solution: Ajouter `?q=votre_recherche`

### Erreur: 422 Validation failed
- Les paramètres ne correspondent pas au schéma
- Vérifications:
  - `limit` doit être ≤ 50
  - `page` doit être ≥ 1
  - `type` doit être dans: post, initiative, article, video, profile
  - `sort` doit être: relevance, date, popularity

### Résultats vides
- Vérifier que des données existent en base
- Vérifier l'orthographe de la recherche
- Essayer une recherche plus générale

### Cache non invalidé
- Le cache Redis est optionnel (fonctionne sans)
- L'invalidation via EventBus est automatique
- Forcer avec `POST /api/v1/search/reindex`

## 📊 Vérifier les données

```bash
# Vérifier les posts
psql -U postgres -d citoyenavise_db -c "SELECT COUNT(*) FROM posts WHERE deleted_at IS NULL;"

# Vérifier les initiatives
psql -U postgres -d citoyenavise_db -c "SELECT COUNT(*) FROM initiatives WHERE deleted_at IS NULL;"

# Vérifier les articles
psql -U postgres -d citoyenavise_db -c "SELECT COUNT(*) FROM education_articles WHERE deleted_at IS NULL;"

# Vérifier les vidéos
psql -U postgres -d citoyenavise_db -c "SELECT COUNT(*) FROM education_videos WHERE deleted_at IS NULL;"

# Vérifier les utilisateurs
psql -U postgres -d citoyenavise_db -c "SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;"
```

## 🎯 Points clés

✅ Recherche public (pas besoin de token)  
✅ ILIKE search (case-insensitive)  
✅ Résultats normalisés par type  
✅ Cache Redis automatique (optionnel)  
✅ Invalidation par EventBus  
✅ Pagination flexible  
✅ Tri personnalisable  
✅ Filtrage par catégorie  

---

**Module SEARCH prêt pour utilisation! 🔍**

Voir [SEARCH_MODULE.md](./SEARCH_MODULE.md) pour documentation complète.
