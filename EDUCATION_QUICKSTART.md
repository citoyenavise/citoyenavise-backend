# Module EDUCATION - Guide de démarrage rapide

## ✅ Pré-requis

- [x] Node.js 18+
- [x] PostgreSQL
- [x] npm ou yarn
- [x] Token JWT valide (pour tester les routes protégées)

## 🚀 Installation

### 1. Appliquer la migration SQL

```bash
# Option 1: Via npm script (si configuré)
npm run migrate

# Option 2: Directement avec psql
psql -U postgres -d citoyenavise_db -f database/migrations/V006_education_module.sql

# Option 3: Via l'outil de migration du projet
node src/database/migrationRunner.js
```

### 2. Vérifier l'intégration du module

Le module est automatiquement chargé par `moduleLoader.js` (c'est déjà fait! ✅)

Vérifier dans `src/moduleLoader.js`:
```javascript
const coreModules = {
  // ...
  education: '/api/v1/education',
};
```

### 3. Démarrer l'application

```bash
npm start
# Ou en développement:
npm run dev

# Vous devriez voir dans les logs:
# ✅ CORE module loaded: education → /api/v1/education
```

## 🧪 Tests API

### 1. Vérifier le statut du module

```bash
curl http://localhost:3000/api/v1/education
```

**Réponse attendue:**
```json
{
  "success": true,
  "timestamp": "2026-05-04T20:00:00.000Z",
  "data": {
    "name": "education",
    "status": "active",
    "submodules": ["videos", "articles", "quiz"]
  },
  "error": null,
  "meta": null
}
```

## 📹 Tests VIDEOS

### Créer une vidéo (auth required)

```bash
curl -X POST http://localhost:3000/api/v1/education/videos \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Introduction à la démocratie",
    "description": "Une vidéo éducative sur les bases de la démocratie",
    "url": "https://youtube.com/watch?v=dQw4w9WgXcQ",
    "category": "politique",
    "tags": ["civique", "éducation", "démocratie"],
    "durationSeconds": 1200,
    "thumbnailUrl": "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg"
  }'
```

### Lister les vidéos

```bash
# Tous les vidéos
curl http://localhost:3000/api/v1/education/videos

# Avec pagination
curl http://localhost:3000/api/v1/education/videos?page=1&limit=10

# Avec recherche
curl http://localhost:3000/api/v1/education/videos?search=démocratie

# Avec filtres
curl http://localhost:3000/api/v1/education/videos?category=politique&sort=popular
```

### Obtenir une vidéo

```bash
curl http://localhost:3000/api/v1/education/videos/VIDEO_ID
```

### Mettre à jour une vidéo (auth required)

```bash
curl -X PUT http://localhost:3000/api/v1/education/videos/VIDEO_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Titre mis à jour",
    "status": "published"
  }'
```

### Supprimer une vidéo (auth required)

```bash
curl -X DELETE http://localhost:3000/api/v1/education/videos/VIDEO_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📄 Tests ARTICLES

### Créer un article (auth required)

```bash
curl -X POST http://localhost:3000/api/v1/education/articles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Les fondamentaux du système politique canadien",
    "content": "Cet article explore les bases du système politique canadien, including...",
    "category": "politique",
    "tags": ["Canada", "gouvernement", "civique"]
  }'
```

### Lister les articles

```bash
# Tous les articles
curl http://localhost:3000/api/v1/education/articles

# Avec recherche full-text
curl http://localhost:3000/api/v1/education/articles?search=système
```

### Publier un article (auth required)

```bash
curl -X PUT http://localhost:3000/api/v1/education/articles/ARTICLE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "published"
  }'
```

## 🎯 Tests QUIZ

### Créer un quiz (auth required)

```bash
curl -X POST http://localhost:3000/api/v1/education/quiz \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Quiz: La Démocratie Canadienne",
    "description": "Testez vos connaissances sur le système démocratique canadien",
    "category": "politique",
    "difficulty": "medium",
    "passScore": 70,
    "tags": ["quiz", "Canada", "civique"]
  }'
```

### Ajouter une question (auth required)

```bash
QUIZ_ID="quiz-uuid-here"

curl -X POST http://localhost:3000/api/v1/education/quiz/$QUIZ_ID/questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "questionText": "Quel est le nombre de chambres au parlement canadien?",
    "questionType": "multiple_choice",
    "orderIndex": 0
  }'
```

### Ajouter des réponses (auth required)

```bash
QUESTION_ID="question-uuid-here"

# Réponse 1 (correcte)
curl -X POST http://localhost:3000/api/v1/education/quiz/questions/$QUESTION_ID/answers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answerText": "2 (Chambre des communes et Sénat)",
    "isCorrect": true,
    "orderIndex": 0
  }'

# Réponse 2 (incorrecte)
curl -X POST http://localhost:3000/api/v1/education/quiz/questions/$QUESTION_ID/answers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answerText": "3",
    "isCorrect": false,
    "orderIndex": 1
  }'

# Réponse 3 (incorrecte)
curl -X POST http://localhost:3000/api/v1/education/quiz/questions/$QUESTION_ID/answers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answerText": "1",
    "isCorrect": false,
    "orderIndex": 2
  }'
```

### Obtenir un quiz avec questions et réponses

```bash
curl http://localhost:3000/api/v1/education/quiz/QUIZ_ID
```

**Réponse incluant la structure:**
```json
{
  "success": true,
  "data": {
    "id": "quiz-id",
    "title": "Quiz: La Démocratie Canadienne",
    "passScore": 70,
    "questions": [
      {
        "id": "question-id",
        "questionText": "Quel est le nombre de chambres...",
        "questionType": "multiple_choice",
        "orderIndex": 0,
        "answers": [
          {
            "id": "answer-id",
            "answerText": "2 (Chambre des communes et Sénat)",
            "isCorrect": true,
            "orderIndex": 0
          },
          // ... autres réponses
        ]
      }
    ]
  }
}
```

### Soumettre les réponses (auth required)

```bash
QUIZ_ID="quiz-id"
QUESTION_ID_1="q1-id"
QUESTION_ID_2="q2-id"
ANSWER_ID_CORRECT_1="a1-id"
ANSWER_ID_CORRECT_2="a2-id"

curl -X POST http://localhost:3000/api/v1/education/quiz/$QUIZ_ID/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": [
      {
        "questionId": "'$QUESTION_ID_1'",
        "selectedAnswerId": "'$ANSWER_ID_CORRECT_1'"
      },
      {
        "questionId": "'$QUESTION_ID_2'",
        "selectedAnswerId": "'$ANSWER_ID_CORRECT_2'"
      }
    ],
    "timeSpentSeconds": 1200
  }'
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "score": 100,
    "maxScore": 100,
    "percentage": 100,
    "passed": true,
    "timeSpentSeconds": 1200,
    "completedAt": "2026-05-04T20:30:00.000Z"
  }
}
```

### Voir mes résultats (auth required)

```bash
curl http://localhost:3000/api/v1/education/quiz/QUIZ_ID/results \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔍 Obtenir un token JWT pour tester

Si vous avez un utilisateur enregistré:

```bash
# Enregistrer un utilisateur
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "username": "testuser"
  }'

# Se connecter pour obtenir un token
RESPONSE=$(curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }')

TOKEN=$(echo $RESPONSE | jq -r '.data.accessToken')
echo "Token: $TOKEN"
```

Ensuite, utiliser `YOUR_TOKEN=$TOKEN` dans les requêtes curl ci-dessus.

## 📊 Vérifier les données en base

```bash
# Vérifier les vidéos
psql -U postgres -d citoyenavise_db -c "SELECT id, title, author_id, created_at FROM education_videos LIMIT 5;"

# Vérifier les articles
psql -U postgres -d citoyenavise_db -c "SELECT id, title, author_id, status FROM education_articles LIMIT 5;"

# Vérifier les quiz
psql -U postgres -d citoyenavise_db -c "SELECT id, title, pass_score, attempts_count FROM education_quiz LIMIT 5;"

# Vérifier les résultats des quiz
psql -U postgres -d citoyenavise_db -c "SELECT user_id, quiz_id, score, passed FROM education_quiz_results LIMIT 5;"
```

## 🚨 Dépannage

### Erreur: "education" module not loaded

**Cause:** Le moduleLoader n'a pas trouvé le module

**Solution:**
1. Vérifier que `src/modules/education/` existe
2. Vérifier que `src/modules/education/index.js` exporte `{ routes, init }`
3. Vérifier que `education` est dans `coreModules` dans `moduleLoader.js`
4. Redémarrer le serveur

### Erreur: "Table does not exist"

**Cause:** La migration n'a pas été appliquée

**Solution:**
```bash
# Vérifier quelles migrations sont appliquées
psql -U postgres -d citoyenavise_db -c "SELECT * FROM schema_versions;"

# Appliquer la migration V006
npm run migrate
```

### Erreur: "Not authorized to update this..."

**Cause:** L'utilisateur n'est pas l'auteur

**Solution:**
- Vérifier que vous utilisez le token de l'utilisateur qui a créé la ressource
- Pour tester, créer votre propre vidéo/article/quiz

### Erreur 422 Validation failed

**Cause:** Les données envoyées ne respectent pas le schéma Zod

**Solution:**
- Vérifier les types de données
- Vérifier que les strings obligatoires ne sont pas vides
- Vérifier les formats (URL, etc.)

## 📚 Ressources

- [EDUCATION_MODULE.md](./EDUCATION_MODULE.md) - Documentation complète
- [EDUCATION_IMPLEMENTATION_SUMMARY.md](./EDUCATION_IMPLEMENTATION_SUMMARY.md) - Résumé technique
- [database/migrations/V006_education_module.sql](./database/migrations/V006_education_module.sql) - Schéma database

## ✨ Prochaines étapes

1. **Tester complètement** tous les endpoints
2. **Intégrer les LIKES** pour vidéos et articles
3. **Ajouter NOTIFICATIONS** pour les événements
4. **Configurer REDIS** pour le cache
5. **Créer des TESTS** unitaires et d'intégration

---

**Le module est prêt à l'emploi! 🎉**

