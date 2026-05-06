# 📚 Module VIDEOS - Documentation API Complète

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000/api/v1/education/videos`  
**Dernière mise à jour:** 2026-05-04

---

## 📋 Table des matières

1. [Authentication](#authentication)
2. [Endpoints](#endpoints)
3. [Status Codes](#status-codes)
4. [Erreurs](#erreurs)
5. [Exemples complets](#exemples-complets)

---

## Authentication

### JWT Token

Tous les endpoints protégés (`POST`, `PUT`, `DELETE`) nécessitent un JWT token dans le header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Comment obtenir un token:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

---

## Endpoints

---

## 1️⃣ POST /education/videos

### 📌 Description
Créer une nouvelle vidéo éducative.

**Authentication:** ✅ Requise (JWT)  
**Content-Type:** `application/json`  
**Status Code:** `201 Created`

---

### 📥 Body

```json
{
  "title": "string (min 3 caractères)",
  "description": "string (optionnel)",
  "url": "string (URL valide, obligatoire)",
  "category": "string (obligatoire)",
  "duration": "number (> 0, obligatoire)",
  "tags": ["string"] (optionnel)
}
```

### ✅ Exemple valide

```json
{
  "title": "Introduction à la Démocratie",
  "description": "Découvrez les principes fondamentaux des systèmes démocratiques",
  "url": "https://example.com/videos/democracy-101.mp4",
  "category": "civics",
  "duration": 3600,
  "tags": ["politique", "éducation", "démocratie"]
}
```

---

### 📤 Réponses

#### ✅ 201 Created - Succès

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Introduction à la Démocratie",
    "description": "Découvrez les principes fondamentaux des systèmes démocratiques",
    "url": "https://example.com/videos/democracy-101.mp4",
    "category": "civics",
    "duration": 3600,
    "tags": ["politique", "éducation", "démocratie"],
    "views_count": 0,
    "likes_count": 0,
    "author_id": "user-uuid-001",
    "created_at": "2026-05-04T10:00:00.000Z",
    "updated_at": "2026-05-04T10:00:00.000Z",
    "deleted_at": null
  }
}
```

#### ❌ 422 Validation Failed

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "fieldErrors": {
      "title": ["Title must be at least 3 characters"],
      "url": ["Invalid URL format"],
      "duration": ["Duration must be greater than 0"]
    }
  }
}
```

#### ❌ 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "message": "Authentication required"
  }
}
```

---

### 🔍 Erreurs possibles

| Code | Message | Cause |
|------|---------|-------|
| 401 | Unauthorized | Token absent ou invalide |
| 422 | Validation failed | Données invalides |
| 500 | Database error | Erreur serveur |

---

### 💻 Exemples

#### cURL
```bash
curl -X POST http://localhost:3000/api/v1/education/videos \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction à la Démocratie",
    "description": "Découvrez les principes fondamentaux",
    "url": "https://example.com/videos/demo.mp4",
    "category": "civics",
    "duration": 3600,
    "tags": ["politique", "éducation"]
  }'
```

#### JavaScript Fetch
```javascript
const token = 'YOUR_JWT_TOKEN';

fetch('http://localhost:3000/api/v1/education/videos', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Introduction à la Démocratie',
    description: 'Découvrez les principes fondamentaux',
    url: 'https://example.com/videos/demo.mp4',
    category: 'civics',
    duration: 3600,
    tags: ['politique', 'éducation'],
  }),
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

#### Axios
```javascript
import axios from 'axios';

const token = 'YOUR_JWT_TOKEN';

axios.post('http://localhost:3000/api/v1/education/videos', {
  title: 'Introduction à la Démocratie',
  description: 'Découvrez les principes fondamentaux',
  url: 'https://example.com/videos/demo.mp4',
  category: 'civics',
  duration: 3600,
  tags: ['politique', 'éducation'],
}, {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})
  .then(res => console.log(res.data))
  .catch(err => console.error(err.response.data));
```

---

## 2️⃣ GET /education/videos

### 📌 Description
Récupérer la liste des vidéos avec pagination et filtres.

**Authentication:** ❌ Optionnelle  
**Content-Type:** `application/json`  
**Status Code:** `200 OK`

---

### 📥 Query Parameters

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | number | 1 | Numéro de page |
| `limit` | number | 20 | Nombre d'items par page (max: 50) |
| `q` | string | - | **Recherche full-text** (titre, description, tags) avec scoring |
| `category` | string | - | Filtrer par catégorie |
| `sort` | enum | latest | Tri: `latest`, `popular` (ignoré si `q` fourni) |

#### 🔍 Recherche Full-Text (`q`)

Quand `q` est fourni, la recherche utilise le moteur full-text de PostgreSQL :
- **Champs indexés** : titre, description, tags
- **Scoring** : ts_rank_cd avec pertinence (0.0 à 1.0)
- **Tri par défaut** : pertinence DESC, puis date DESC
- **Exemple** : `?q=démocratie` retourne les vidéos dont titre/description/tags contiennent ce terme
- **Résultat** : Chaque vidéo inclut un champ `relevance` (score de 0 à 1)

Quand `q` est absent, la recherche utilise le tri spécifié (`sort`) :
- `latest` : Tri par date de création (descendant)
- `popular` : Tri par nombre de vues (descendant)

---

### 📤 Réponses

#### ✅ 200 OK - Succès

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Introduction à la Démocratie",
        "description": "Découvrez les principes fondamentaux",
        "url": "https://example.com/videos/demo.mp4",
        "category": "civics",
        "duration": 3600,
        "tags": ["politique", "éducation"],
        "views_count": 150,
        "likes_count": 25,
        "author": {
          "id": "user-uuid-001",
          "username": "john_educator",
          "avatar_url": "https://example.com/avatar.jpg"
        },
        "created_at": "2026-05-04T10:00:00.000Z",
        "updated_at": "2026-05-04T10:00:00.000Z",
        "relevance": "0.8234"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 20,
      "pages": 3
    }
  }
}
```

**Note** : Le champ `relevance` n'apparaît que si une recherche full-text (`q`) est effectuée. Absent sinon.

---

### 💻 Exemples

#### cURL
```bash
# Lister toutes les vidéos (tri par date)
curl http://localhost:3000/api/v1/education/videos

# Avec pagination
curl "http://localhost:3000/api/v1/education/videos?page=2&limit=10"

# Filtrer par catégorie (tri par date)
curl "http://localhost:3000/api/v1/education/videos?category=civics"

# Tri par popularité (sans recherche)
curl "http://localhost:3000/api/v1/education/videos?sort=popular"

# ⭐ Recherche full-text (scoring + pertinence)
curl "http://localhost:3000/api/v1/education/videos?q=démocratie"

# Recherche full-text + filtre catégorie
curl "http://localhost:3000/api/v1/education/videos?q=démocratie&category=civics"

# Recherche full-text avec pagination
curl "http://localhost:3000/api/v1/education/videos?q=principes+fondamentaux&page=1&limit=5"
```

#### JavaScript Fetch - Recherche Full-Text
```javascript
// Exemple 1: Recherche simple
const query1 = new URLSearchParams({
  q: 'démocratie',
  limit: 10,
});

fetch(`http://localhost:3000/api/v1/education/videos?${query1}`)
  .then(res => res.json())
  .then(data => {
    // Les résultats sont triés par pertinence (relevance DESC)
    data.data.items.forEach(video => {
      console.log(`${video.title} (pertinence: ${video.relevance})`);
    });
  })
  .catch(err => console.error(err));

// Exemple 2: Recherche avec filtres
const query2 = new URLSearchParams({
  q: 'démocratie',
  category: 'civics',
  page: 1,
  limit: 20,
});

fetch(`http://localhost:3000/api/v1/education/videos?${query2}`)
  .then(res => res.json())
  .then(data => console.log(data.data.items))
  .catch(err => console.error(err));
```

#### Axios - Full-Text Search
```javascript
import axios from 'axios';

// Exemple: Recherche full-text avec pertinence
axios.get('http://localhost:3000/api/v1/education/videos', {
  params: {
    q: 'démocratie',
    category: 'civics',
    page: 1,
    limit: 20,
  },
})
  .then(res => {
    // Les vidéos sont triées par pertinence (score ts_rank_cd)
    const videos = res.data.data.items;
    videos.forEach(video => {
      console.log(`${video.title}: relevance=${video.relevance}`);
    });
  })
  .catch(err => console.error(err.response.data));
```

---

## 3️⃣ GET /education/videos/:id

### 📌 Description
Récupérer une vidéo spécifique par ID. Incrémente automatiquement le compteur de vues.

**Authentication:** ❌ Optionnelle  
**Content-Type:** `application/json`  
**Status Code:** `200 OK`

---

### 📥 Paramètres de route

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | UUID | ID unique de la vidéo |

---

### 📤 Réponses

#### ✅ 200 OK - Succès

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Introduction à la Démocratie",
    "description": "Découvrez les principes fondamentaux des systèmes démocratiques",
    "url": "https://example.com/videos/demo.mp4",
    "category": "civics",
    "duration": 3600,
    "tags": ["politique", "éducation", "démocratie"],
    "views_count": 151,
    "likes_count": 25,
    "author": {
      "id": "user-uuid-001",
      "username": "john_educator",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "created_at": "2026-05-04T10:00:00.000Z",
    "updated_at": "2026-05-04T10:00:00.000Z"
  }
}
```

#### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "message": "Video not found"
  }
}
```

---

### 💻 Exemples

#### cURL
```bash
curl http://localhost:3000/api/v1/education/videos/550e8400-e29b-41d4-a716-446655440000
```

#### JavaScript Fetch
```javascript
const videoId = '550e8400-e29b-41d4-a716-446655440000';

fetch(`http://localhost:3000/api/v1/education/videos/${videoId}`)
  .then(res => res.json())
  .then(data => console.log(data.data))
  .catch(err => console.error(err));
```

#### Axios
```javascript
import axios from 'axios';

const videoId = '550e8400-e29b-41d4-a716-446655440000';

axios.get(`http://localhost:3000/api/v1/education/videos/${videoId}`)
  .then(res => console.log(res.data.data))
  .catch(err => console.error(err.response.data));
```

---

## 4️⃣ PUT /education/videos/:id

### 📌 Description
Mettre à jour une vidéo existante. Seul l'auteur peut la modifier.

**Authentication:** ✅ Requise (JWT)  
**Content-Type:** `application/json`  
**Status Code:** `200 OK`

---

### 📥 Paramètres de route

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | UUID | ID unique de la vidéo |

---

### 📥 Body (tous les champs optionnels)

```json
{
  "title": "string (min 3 caractères)",
  "description": "string",
  "url": "string (URL valide)",
  "category": "string",
  "duration": "number (> 0)",
  "tags": ["string"]
}
```

### ✅ Exemple valide

```json
{
  "title": "Introduction complète à la Démocratie",
  "duration": 4200,
  "tags": ["politique", "éducation", "démocratie", "citoyenneté"]
}
```

---

### 📤 Réponses

#### ✅ 200 OK - Succès

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Introduction complète à la Démocratie",
    "description": "Découvrez les principes fondamentaux",
    "url": "https://example.com/videos/demo.mp4",
    "category": "civics",
    "duration": 4200,
    "tags": ["politique", "éducation", "démocratie", "citoyenneté"],
    "views_count": 151,
    "likes_count": 25,
    "author": {
      "id": "user-uuid-001",
      "username": "john_educator",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "created_at": "2026-05-04T10:00:00.000Z",
    "updated_at": "2026-05-04T11:30:00.000Z"
  }
}
```

#### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "message": "Not authorized to update this video"
  }
}
```

#### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "message": "Video not found"
  }
}
```

---

### 💻 Exemples

#### cURL
```bash
curl -X PUT http://localhost:3000/api/v1/education/videos/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction complète à la Démocratie",
    "duration": 4200,
    "tags": ["politique", "éducation", "démocratie", "citoyenneté"]
  }'
```

#### JavaScript Fetch
```javascript
const token = 'YOUR_JWT_TOKEN';
const videoId = '550e8400-e29b-41d4-a716-446655440000';

fetch(`http://localhost:3000/api/v1/education/videos/${videoId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: 'Introduction complète à la Démocratie',
    duration: 4200,
    tags: ['politique', 'éducation', 'démocratie', 'citoyenneté'],
  }),
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

#### Axios
```javascript
import axios from 'axios';

const token = 'YOUR_JWT_TOKEN';
const videoId = '550e8400-e29b-41d4-a716-446655440000';

axios.put(
  `http://localhost:3000/api/v1/education/videos/${videoId}`,
  {
    title: 'Introduction complète à la Démocratie',
    duration: 4200,
    tags: ['politique', 'éducation', 'démocratie', 'citoyenneté'],
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }
)
  .then(res => console.log(res.data))
  .catch(err => console.error(err.response.data));
```

---

## 5️⃣ DELETE /education/videos/:id

### 📌 Description
Supprimer une vidéo (soft delete). Seul l'auteur peut la supprimer.

**Authentication:** ✅ Requise (JWT)  
**Content-Type:** `application/json`  
**Status Code:** `200 OK`

---

### 📥 Paramètres de route

| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | UUID | ID unique de la vidéo |

---

### 📤 Réponses

#### ✅ 200 OK - Succès

```json
{
  "success": true,
  "data": {
    "message": "Video deleted"
  }
}
```

#### ❌ 403 Forbidden

```json
{
  "success": false,
  "error": {
    "message": "Not authorized to delete this video"
  }
}
```

#### ❌ 404 Not Found

```json
{
  "success": false,
  "error": {
    "message": "Video not found"
  }
}
```

---

### 💻 Exemples

#### cURL
```bash
curl -X DELETE http://localhost:3000/api/v1/education/videos/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### JavaScript Fetch
```javascript
const token = 'YOUR_JWT_TOKEN';
const videoId = '550e8400-e29b-41d4-a716-446655440000';

fetch(`http://localhost:3000/api/v1/education/videos/${videoId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

#### Axios
```javascript
import axios from 'axios';

const token = 'YOUR_JWT_TOKEN';
const videoId = '550e8400-e29b-41d4-a716-446655440000';

axios.delete(
  `http://localhost:3000/api/v1/education/videos/${videoId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }
)
  .then(res => console.log(res.data))
  .catch(err => console.error(err.response.data));
```

---

## Status Codes

| Code | Signification | Utilisation |
|------|---------------|------------|
| `200` | OK | Requête réussie (GET, PUT, DELETE) |
| `201` | Created | Ressource créée (POST) |
| `400` | Bad Request | Requête mal formée |
| `401` | Unauthorized | Authentication requise/invalide |
| `403` | Forbidden | Accès non autorisé |
| `404` | Not Found | Ressource inexistante |
| `422` | Unprocessable Entity | Validation échouée |
| `500` | Server Error | Erreur serveur |

---

## Erreurs

### Format standard des erreurs

```json
{
  "success": false,
  "error": {
    "message": "Description de l'erreur",
    "fieldErrors": {
      "fieldName": ["Détail de l'erreur"]
    }
  }
}
```

### Erreurs courantes

#### Validation

**422 Unprocessable Entity**

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "fieldErrors": {
      "title": ["Title must be at least 3 characters"],
      "duration": ["Duration must be greater than 0"]
    }
  }
}
```

#### Authentification

**401 Unauthorized**

```json
{
  "success": false,
  "error": {
    "message": "Authentication required"
  }
}
```

#### Autorisation

**403 Forbidden**

```json
{
  "success": false,
  "error": {
    "message": "Not authorized to update this video"
  }
}
```

#### Ressource inexistante

**404 Not Found**

```json
{
  "success": false,
  "error": {
    "message": "Video not found"
  }
}
```

---

## Exemples complets

### Workflow complet: Créer, Lister, Récupérer, Mettre à jour, Supprimer

#### cURL

```bash
#!/bin/bash

# 1. Obtenir un token (si nécessaire)
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' | jq -r '.data.accessToken')

# 2. Créer une vidéo
VIDEO=$(curl -s -X POST http://localhost:3000/api/v1/education/videos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ma vidéo éducative",
    "description": "Une vidéo intéressante",
    "url": "https://example.com/video.mp4",
    "category": "civics",
    "duration": 3600,
    "tags": ["éducation"]
  }')

VIDEO_ID=$(echo $VIDEO | jq -r '.data.id')
echo "Vidéo créée: $VIDEO_ID"

# 3. Lister les vidéos
curl -s http://localhost:3000/api/v1/education/videos | jq '.data.items'

# 4. Récupérer une vidéo
curl -s http://localhost:3000/api/v1/education/videos/$VIDEO_ID | jq '.data'

# 5. Mettre à jour la vidéo
curl -s -X PUT http://localhost:3000/api/v1/education/videos/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Ma vidéo mise à jour"}' | jq '.data'

# 6. Supprimer la vidéo
curl -s -X DELETE http://localhost:3000/api/v1/education/videos/$VIDEO_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.data'
```

#### JavaScript

```javascript
class VideosAPI {
  constructor(baseURL = 'http://localhost:3000/api/v1') {
    this.baseURL = baseURL;
    this.token = null;
  }

  async setToken(token) {
    this.token = token;
  }

  async create(data) {
    const res = await fetch(`${this.baseURL}/education/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async list(filters = {}) {
    const query = new URLSearchParams(filters);
    const res = await fetch(`${this.baseURL}/education/videos?${query}`);
    return res.json();
  }

  async getOne(id) {
    const res = await fetch(`${this.baseURL}/education/videos/${id}`);
    return res.json();
  }

  async update(id, data) {
    const res = await fetch(`${this.baseURL}/education/videos/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async delete(id) {
    const res = await fetch(`${this.baseURL}/education/videos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });
    return res.json();
  }
}

// Utilisation
const api = new VideosAPI();

// 1. Créer une vidéo
const newVideo = await api.create({
  title: 'Ma vidéo',
  url: 'https://example.com/video.mp4',
  category: 'civics',
  duration: 3600,
});

const videoId = newVideo.data.id;

// 2. Lister les vidéos
const videos = await api.list({ category: 'civics', page: 1 });

// 3. Récupérer une vidéo
const video = await api.getOne(videoId);

// 4. Mettre à jour une vidéo
const updated = await api.update(videoId, { title: 'Titre mis à jour' });

// 5. Supprimer une vidéo
const deleted = await api.delete(videoId);
```

---

## Notes importantes

- ✅ Tous les timestamps sont en UTC ISO 8601
- ✅ Les UUIDs sont au format standard
- ✅ La pagination commence à 1 (pas 0)
- ✅ Les recherches sont case-insensitive
- ✅ Les soft deletes conservent les données (deleted_at != null)
- ✅ Les vues sont incrémentées automatiquement sur GET /:id
- ✅ Un utilisateur ne peut modifier/supprimer que ses propres vidéos

---

**📌 Version:** 1.0.0 | **Dernière mise à jour:** 2026-05-04
