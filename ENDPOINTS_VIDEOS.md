# Module VIDEOS - Endpoints Implémentés

**Base URL:** `/api/v1/education/videos`

---

## 1️⃣ POST /education/videos
**Créer une vidéo**

**Authentification:** `authRequired` (JWT token)

**Request Body:**
```json
{
  "title": "Introduction to Democracy",
  "description": "Learn the basics of democratic systems",
  "url": "https://example.com/video.mp4",
  "category": "civics",
  "duration": 3600,
  "tags": ["politics", "education", "basics"],
  "thumbnailUrl": "https://example.com/thumb.jpg"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Introduction to Democracy",
    "description": "Learn the basics of democratic systems",
    "url": "https://example.com/video.mp4",
    "category": "civics",
    "duration": 3600,
    "tags": ["politics", "education", "basics"],
    "thumbnailUrl": "https://example.com/thumb.jpg",
    "viewsCount": 0,
    "likesCount": 0,
    "author": { "id": "user-uuid", "username": "john_doe" },
    "createdAt": "2026-05-04T10:00:00Z",
    "updatedAt": "2026-05-04T10:00:00Z"
  }
}
```

---

## 2️⃣ GET /education/videos
**Lister toutes les vidéos avec pagination et filtres**

**Authentification:** `authOptional` (public)

**Query Parameters:**
- `page` (int, default=1): Numéro de page
- `limit` (int, default=20, max=50): Nombre d'items par page
- `search` (string, optional): Rechercher dans titre/description
- `category` (string, optional): Filtrer par catégorie
- `sort` (enum, default='latest'): [latest, popular, trending]

**Example:**
```
GET /api/v1/education/videos?page=1&limit=20&category=civics&search=democracy&sort=latest
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "Introduction to Democracy",
        "description": "Learn the basics...",
        "url": "https://example.com/video.mp4",
        "category": "civics",
        "duration": 3600,
        "tags": ["politics", "education"],
        "thumbnailUrl": "https://example.com/thumb.jpg",
        "viewsCount": 150,
        "likesCount": 25,
        "author": { "username": "john_doe", "avatarUrl": "..." },
        "createdAt": "2026-05-04T10:00:00Z"
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

---

## 3️⃣ GET /education/videos/:id
**Récupérer une vidéo par ID**

**Authentification:** `authOptional` (public)

**Path Parameters:**
- `id` (uuid, required): UUID de la vidéo

**Example:**
```
GET /api/v1/education/videos/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Introduction to Democracy",
    "description": "Learn the basics of democratic systems",
    "url": "https://example.com/video.mp4",
    "category": "civics",
    "duration": 3600,
    "tags": ["politics", "education", "basics"],
    "thumbnailUrl": "https://example.com/thumb.jpg",
    "viewsCount": 151,
    "likesCount": 25,
    "status": "published",
    "author": {
      "id": "user-uuid",
      "username": "john_doe",
      "avatarUrl": "https://example.com/avatar.jpg"
    },
    "createdAt": "2026-05-04T10:00:00Z",
    "updatedAt": "2026-05-04T10:00:00Z"
  }
}
```

**Note:** Les vues sont incrémentées automatiquement à chaque appel.

---

## 4️⃣ PUT /education/videos/:id
**Mettre à jour une vidéo**

**Authentification:** `authRequired` (JWT token)

**Path Parameters:**
- `id` (uuid, required): UUID de la vidéo

**Request Body (tous les champs sont optionnels):**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "url": "https://example.com/new-video.mp4",
  "category": "civics",
  "duration": 3700,
  "tags": ["politics", "updated"],
  "thumbnailUrl": "https://example.com/new-thumb.jpg",
  "status": "draft"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Title",
    "description": "Updated description",
    "url": "https://example.com/new-video.mp4",
    "category": "civics",
    "duration": 3700,
    "tags": ["politics", "updated"],
    "thumbnailUrl": "https://example.com/new-thumb.jpg",
    "viewsCount": 151,
    "likesCount": 25,
    "status": "draft",
    "author": { "id": "user-uuid", "username": "john_doe" },
    "createdAt": "2026-05-04T10:00:00Z",
    "updatedAt": "2026-05-04T11:30:00Z"
  }
}
```

**Validation Errors (422 Unprocessable Entity):**
- Seul l'auteur peut mettre à jour la vidéo
- Les champs doivent respecter les constraints Zod

---

## 5️⃣ DELETE /education/videos/:id
**Supprimer une vidéo (soft delete)**

**Authentification:** `authRequired` (JWT token)

**Path Parameters:**
- `id` (uuid, required): UUID de la vidéo

**Example:**
```
DELETE /api/v1/education/videos/550e8400-e29b-41d4-a716-446655440000
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Video deleted"
  }
}
```

**Validation Errors (401/403/404):**
- `401 Unauthorized`: Token absent ou invalide
- `403 Forbidden`: Seul l'auteur peut supprimer la vidéo
- `404 Not Found`: La vidéo n'existe pas

---

## Error Responses

### 422 Validation Failed
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "fieldErrors": {
      "title": ["String must contain at least 3 character(s)"],
      "duration": ["Number must be greater than 0"]
    }
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "message": "Not authorized to update this video"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "message": "Video not found"
  }
}
```

---

## Testing with cURL

### Create Video
```bash
curl -X POST http://localhost:3000/api/v1/education/videos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Demo Video",
    "description": "A demo video",
    "url": "https://example.com/video.mp4",
    "category": "civics",
    "duration": 3600,
    "tags": ["demo"]
  }'
```

### List Videos
```bash
curl "http://localhost:3000/api/v1/education/videos?page=1&limit=20&category=civics"
```

### Get Video
```bash
curl http://localhost:3000/api/v1/education/videos/{id}
```

### Update Video
```bash
curl -X PUT http://localhost:3000/api/v1/education/videos/{id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'
```

### Delete Video
```bash
curl -X DELETE http://localhost:3000/api/v1/education/videos/{id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Module VIDEOS — Endpoints implémentés et testables ! ✅**
