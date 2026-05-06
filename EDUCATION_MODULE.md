# Module EDUCATION - Documentation

**Statut:** ✅ Implémentation terminée  
**Date:** 2026-05-04

## 📋 Vue d'ensemble

Le module EDUCATION fournit des contenus pédagogiques pour la plateforme Citoyenavise:

- **Videos** (9 endpoints) - Vidéos éducatives avec pagination, recherche, vues et likes
- **Articles** (6 endpoints) - Articles civiques avec gestion de version et publication
- **Quiz** (8 endpoints) - Quiz interactifs avec système de scoring et résultats

## 📁 Structure des fichiers

```
src/modules/education/
├── index.js                 ← Point d'entrée du module
├── videos/
│   ├── index.js
│   ├── schema.js           ← Schémas Zod
│   ├── service.js          ← Logique métier
│   ├── controller.js       ← Handlers HTTP
│   └── routes.js           ← Définitions des routes
├── articles/
│   ├── index.js
│   ├── schema.js
│   ├── service.js
│   ├── controller.js
│   └── routes.js
└── quiz/
    ├── index.js
    ├── schema.js
    ├── service.js
    ├── controller.js
    └── routes.js
```

## 🗄️ Schéma de base de données

Migration: `database/migrations/V006_education_module.sql`

### Tables

#### education_videos
```sql
- id (UUID) - clé primaire
- author_id (UUID) - référence à users
- title (VARCHAR 255)
- description (TEXT)
- url (VARCHAR 512) - URL de la vidéo
- category (VARCHAR 100)
- tags (TEXT[]) - array de tags
- duration_seconds (INT)
- thumbnail_url (VARCHAR 512)
- views_count (INT) - compteur de vues
- likes_count (INT) - intégration avec le module LIKES
- status (VARCHAR) - draft, published, archived
- created_at, updated_at, deleted_at (TIMESTAMP)
```

#### education_articles
```sql
- id (UUID)
- author_id (UUID)
- title (VARCHAR 255)
- content (TEXT) - contenu complet
- category (VARCHAR 100)
- tags (TEXT[])
- status (VARCHAR) - draft, published, archived
- version (INT) - versioning simple
- views_count (INT)
- likes_count (INT) - intégration avec LIKES
- published_at (TIMESTAMP)
- created_at, updated_at, deleted_at (TIMESTAMP)
```

#### education_quiz
```sql
- id (UUID)
- author_id (UUID)
- title (VARCHAR 255)
- description (TEXT)
- category (VARCHAR 100)
- difficulty (VARCHAR) - easy, medium, hard
- pass_score (INT) - score minimum pour réussir (0-100)
- tags (TEXT[])
- status (VARCHAR) - draft, published, archived
- attempts_count (INT) - total des tentatives
- created_at, updated_at, deleted_at (TIMESTAMP)
```

#### education_quiz_questions
```sql
- id (UUID)
- quiz_id (UUID)
- question_text (TEXT)
- question_type (VARCHAR) - multiple_choice, true_false, short_answer
- order_index (INT) - ordre d'affichage
- created_at, updated_at (TIMESTAMP)
```

#### education_quiz_answers
```sql
- id (UUID)
- question_id (UUID)
- answer_text (TEXT)
- is_correct (BOOLEAN)
- order_index (INT)
- created_at (TIMESTAMP)
```

#### education_quiz_results
```sql
- id (UUID)
- quiz_id (UUID)
- user_id (UUID)
- score (INT) - score obtenu
- max_score (INT) - score maximum (100)
- percentage (DECIMAL) - pourcentage
- passed (BOOLEAN) - a réussi?
- time_spent_seconds (INT)
- started_at, completed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

## 📍 Endpoints API

### VIDEOS (9 endpoints)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/education/videos` | ✅ | Créer une vidéo |
| GET | `/education/videos` | ❌ | Lister les vidéos (paginated) |
| GET | `/education/videos/:id` | ❌ | Obtenir une vidéo |
| PUT | `/education/videos/:id` | ✅ | Mettre à jour une vidéo |
| DELETE | `/education/videos/:id` | ✅ | Supprimer une vidéo |

**Paramètres de liste:**
- `page` (default: 1)
- `limit` (default: 20, max: 50)
- `search` (optionnel) - recherche par titre
- `category` (optionnel)
- `sort` - 'latest' (default), 'popular'

**Exemple de réponse:**
```json
{
  "success": true,
  "timestamp": "2026-05-04T20:00:00Z",
  "data": [
    {
      "id": "uuid",
      "title": "Introduction à la politique",
      "description": "...",
      "url": "https://youtube.com/...",
      "category": "politique",
      "tags": ["civique", "éducation"],
      "durationSeconds": 1200,
      "viewsCount": 150,
      "likesCount": 25,
      "author": {
        "username": "educateur",
        "avatarUrl": "..."
      },
      "createdAt": "2026-05-04T..."
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### ARTICLES (6 endpoints)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/education/articles` | ✅ | Créer un article |
| GET | `/education/articles` | ❌ | Lister les articles |
| GET | `/education/articles/:id` | ❌ | Obtenir un article |
| PUT | `/education/articles/:id` | ✅ | Mettre à jour/publier |
| DELETE | `/education/articles/:id` | ✅ | Supprimer |

**Pour publier un article:**
```json
{
  "status": "published"
}
```

### QUIZ (8 endpoints)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/education/quiz` | ✅ | Créer un quiz |
| GET | `/education/quiz` | ❌ | Lister les quiz |
| GET | `/education/quiz/:id` | ❌ | Obtenir un quiz (avec questions/réponses) |
| POST | `/education/quiz/:id/questions` | ✅ | Ajouter une question |
| POST | `/education/quiz/questions/:questionId/answers` | ✅ | Ajouter une réponse |
| POST | `/education/quiz/:id/submit` | ✅ | Soumettre les réponses |
| GET | `/education/quiz/:id/results` | ✅ | Voir mes résultats |
| DELETE | `/education/quiz/:id` | ✅ | Supprimer |

**Soumettre un quiz:**
```json
{
  "answers": [
    {
      "questionId": "uuid",
      "selectedAnswerId": "uuid"
    }
  ],
  "timeSpentSeconds": 1200
}
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "score": 85,
    "maxScore": 100,
    "percentage": 85,
    "passed": true,
    "timeSpentSeconds": 1200,
    "completedAt": "2026-05-04T20:00:00Z"
  }
}
```

## 🔄 Intégrations EventBus

Le module émet les événements suivants:

### video.created
```javascript
eventBus.emit('video.created', {
  videoId: string,
  title: string,
  authorId: string,
  timestamp: ISO8601
})
```

### article.published
```javascript
eventBus.emit('article.published', {
  articleId: string,
  authorId: string,
  timestamp: ISO8601
})
```

### quiz.completed
```javascript
eventBus.emit('quiz.completed', {
  quizId: string,
  userId: string,
  score: number,
  passed: boolean,
  timestamp: ISO8601
})
```

## 🔗 Intégrations avec d'autres modules

### LIKES
- `education_videos.likes_count` - nombre de likes sur les vidéos
- `education_articles.likes_count` - nombre de likes sur les articles
- À intégrer: endpoint `POST /api/v1/education/videos/:id/like`

### USERS
- `author_id` référence les users
- Récupère `username` et `avatar_url` via un JOIN avec profiles

### NOTIFICATIONS
- Émettre des notifications quand:
  - Un utilisateur like une vidéo/article de l'utilisateur
  - Un nouveau commentaire sur une vidéo/article
  - Un utilisateur soumet un quiz

## ✅ Fonctionnalités implémentées

### Videos
- ✅ CRUD complet
- ✅ Pagination avec recherche
- ✅ Compteur de vues (incrémenté à chaque GET)
- ✅ Catégories et tags
- ✅ Soft delete
- ✅ Validation Zod stricte
- ✅ EventBus: video.created

### Articles
- ✅ CRUD complet
- ✅ Recherche full-text (titre + contenu)
- ✅ Système de versioning simple (colonne version)
- ✅ Gestion du statut (draft → published)
- ✅ Compteur de vues
- ✅ EventBus: article.published

### Quiz
- ✅ CRUD quiz + questions + réponses
- ✅ Système de scoring automatique
- ✅ Calcul du pourcentage
- ✅ Validation pass_score
- ✅ Historique des résultats par utilisateur
- ✅ Calcul du temps passé
- ✅ EventBus: quiz.completed

## 📊 Validation Zod

Tous les inputs sont validés avec Zod:

**createVideoSchema**
- title: string, min 3, max 255
- description: string (optionnel)
- url: valid URL
- category: string, min 2
- tags: array de strings
- durationSeconds: integer positif (optionnel)
- thumbnailUrl: valid URL (optionnel)

**createArticleSchema**
- title: string, min 5, max 255
- content: string, min 20, max 50000
- category: string (optionnel)
- tags: array (optionnel)

**createQuizSchema**
- title: string, min 5, max 255
- description: string (optionnel)
- category: string (optionnel)
- difficulty: 'easy' | 'medium' | 'hard' (default: medium)
- passScore: 0-100 (default: 70)
- tags: array (optionnel)

## 🚀 Utilisation

### Créer une vidéo
```bash
curl -X POST http://localhost:3000/api/v1/education/videos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction à la démocratie",
    "description": "Une vidéo pour comprendre les bases",
    "url": "https://youtube.com/watch?v=xxx",
    "category": "politique",
    "tags": ["civique", "éducation"],
    "durationSeconds": 1200
  }'
```

### Lister les vidéos
```bash
curl http://localhost:3000/api/v1/education/videos?page=1&limit=20&search=démocratie
```

### Soumettre un quiz
```bash
curl -X POST http://localhost:3000/api/v1/education/quiz/quiz-id/submit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "questionId": "q1-uuid",
        "selectedAnswerId": "a2-uuid"
      },
      {
        "questionId": "q2-uuid",
        "selectedAnswerId": "a4-uuid"
      }
    ],
    "timeSpentSeconds": 1200
  }'
```

## 🔐 Authentification

- Endpoints GET (lister, détail) - **Publics** ❌
- Endpoints POST/PUT/DELETE - **Protégés** ✅
- Seul l'auteur peut modifier/supprimer son contenu

## ⚡ Optimisations futures

1. **Redis cache**
   - Cache des vidéos populaires
   - Cache des articles récents
   - Cache des résultats de quiz

2. **Likes integration**
   - Ajouter les routes de like pour vidéos/articles
   - Utiliser le module LIKES existant

3. **Commentaires**
   - Permettre des commentaires sur vidéos/articles
   - Utiliser le module COMMENTS

4. **Notifications**
   - Émettre des notifications pour les événements
   - Intégrer avec le module NOTIFICATIONS

5. **Analytics**
   - Statistiques par catégorie
   - Taux de réussite des quiz
   - Engagement metrics

## 📝 Notes

- Tous les contrôleurs utilisent les helpers standardisés (`apiSuccess`, `apiCreated`, etc.)
- Tous les errors utilisent `AppError` avec codes normalisés
- Tous les inputs sont validés avec `safeParse()`
- Les soft deletes sont utilisés (colonne `deleted_at`)
- EventBus est utilisé pour la communication entre modules
- Les transactions PostgreSQL sont utilisées pour les opérations critiques

## 🧪 Tests

À implémenter:
- Tests unitaires pour chaque service
- Tests d'intégration pour les routes
- Tests de validation Zod

## 🔄 État de développement

| Aspect | Statut | Notes |
|--------|--------|-------|
| Migration SQL | ✅ | V006 créée |
| Schémas Zod | ✅ | Complets et validés |
| Services | ✅ | Logique métier complète |
| Controllers | ✅ | Tous les endpoints |
| Routes | ✅ | Auth correcte |
| EventBus | ✅ | Émissions configurées |
| Tests | ⏳ | À faire |
| Documentation | ✅ | Ce fichier |

