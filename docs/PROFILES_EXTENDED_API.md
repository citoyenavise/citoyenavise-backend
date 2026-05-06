# 🧑‍💼 Module PROFILES - Documentation API Étendue

**Version:** 2.0.0 (100% Plateforme)  
**Base URL:** `http://localhost:3000/api/v1/profiles`  
**Date:** 2026-05-05

---

## 📋 Table des matières

1. [Authentication](#authentication)
2. [Fonctionnalités Étendues (7)](#fonctionnalités-étendues)
3. [Privacy & Confidentialité](#privacy--confidentialité)
4. [Reputation & Badges](#reputation--badges)
5. [Dynamic Fields](#dynamic-fields)
6. [Preferences](#preferences)
7. [Advanced Search](#advanced-search)
8. [Versioning & Audit](#versioning--audit)

---

## Authentication

Tous les endpoints `/me/*` nécessitent un JWT token:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

Les endpoints publics (ex: `GET /profiles/:id`) ne nécessitent pas d'authentification.

---

## Fonctionnalités Étendues

### 7 Piliers de la Plateforme

| # | Fonctionnalité | Endpoints | Statut |
|---|---|---|---|
| 1 | Privacy/Confidentialité | PUT/GET `/me/privacy` | ✅ |
| 2 | Reputation/Badges | GET `/:id/reputation`, `/:id/badges` | ✅ |
| 3 | Dynamic Fields | PUT/GET `/:id/fields` | ✅ |
| 4 | Preferences | PUT/GET `/me/preferences` | ✅ |
| 5 | Search Avancée | GET `/search/advanced`, `/search/quick` | ✅ |
| 6 | Versioning/Audit | GET `/:id/versions` | ✅ |
| 7 | Extensibilité | Via `profile_fields` + `profile_field_definitions` | ✅ |

---

## Privacy / Confidentialité

### PUT /profiles/me/privacy

Mettre à jour les paramètres de confidentialité du profil.

**Authentication:** ✅ Requise

**Body:**
```json
{
  "profileVisibility": "public|private|followers",
  "showLocation": true|false,
  "showStats": true|false
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "profileVisibility": "public",
    "showLocation": true,
    "showStats": true,
    "updatedAt": "2026-05-05T10:30:00Z"
  }
}
```

**Visibilité Expliquée:**
- `public` → Accessible à tous
- `private` → Accessible seulement au propriétaire
- `followers` → Accessible aux followers uniquement

---

### GET /profiles/me/privacy

Récupérer les paramètres de confidentialité actuels.

**Authentication:** ✅ Requise

**Response 200:**
```json
{
  "success": true,
  "data": {
    "profileVisibility": "public",
    "showLocation": true,
    "showStats": true
  }
}
```

---

## Reputation & Badges

### GET /profiles/:id/reputation

Récupérer la réputation et badges d'un profil.

**Authentication:** ❌ Optionnelle

**Response 200:**
```json
{
  "success": true,
  "data": {
    "score": 450,
    "badges": [
      {
        "id": "uuid-1",
        "type": "contributor",
        "name": "Contributeur",
        "description": "Réputation >= 100",
        "iconUrl": "https://example.com/badge-contributor.png",
        "earnedAt": "2026-04-15T12:00:00Z"
      },
      {
        "id": "uuid-2",
        "type": "influencer",
        "name": "Influenceur",
        "description": "Réputation >= 500",
        "earnedAt": "2026-05-01T08:30:00Z"
      }
    ]
  }
}
```

---

### GET /profiles/:id/badges

Récupérer uniquement les badges.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "type": "contributor",
      "name": "Contributeur",
      "earnedAt": "2026-04-15T12:00:00Z"
    }
  ]
}
```

---

### GET /profiles/:id/reputation/history?page=1&limit=20

Historique des événements de réputation.

**Query Parameters:**
- `page` (optional): Numéro de page (défaut: 1)
- `limit` (optional): Items par page (défaut: 20, max: 100)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "eventType": "post_liked",
        "points": 5,
        "description": "Post liked by user",
        "sourceId": "post-uuid",
        "sourceType": "post",
        "createdAt": "2026-05-05T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 87,
      "page": 1,
      "limit": 20,
      "pages": 5
    }
  }
}
```

**Types d'événements:**
- `post_created` (+10 pts)
- `post_liked` (+5 pts)
- `comment_helpful` (+3 pts)
- `badge_earned` (+varies)

---

## Dynamic Fields

### GET /profiles/definitions/fields

Récupérer toutes les définitions de champs disponibles.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "fieldKey": "professional_title",
      "fieldName": "Titre Professionnel",
      "fieldType": "text",
      "fieldDescription": "Votre titre/poste",
      "isVisibleInProfile": true,
      "isSearchable": true,
      "displayOrder": 1
    },
    {
      "id": "uuid-2",
      "fieldKey": "company",
      "fieldName": "Entreprise",
      "fieldType": "text",
      "isVisibleInProfile": true,
      "isSearchable": true,
      "displayOrder": 2
    }
  ]
}
```

---

### GET /profiles/:id/fields

Récupérer les champs dynamiques d'un profil.

**Query:** Respecte la visibilité des champs

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "fieldKey": "professional_title",
      "fieldName": "Titre Professionnel",
      "fieldType": "text",
      "fieldValue": "Développeur Senior",
      "visibility": "public"
    }
  ]
}
```

---

### PUT /profiles/me/field

Ajouter ou mettre à jour un champ dynamique.

**Authentication:** ✅ Requise

**Body:**
```json
{
  "fieldKey": "professional_title",
  "fieldValue": "Développeur Senior",
  "visibility": "public|private|followers"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "fieldKey": "professional_title",
    "fieldValue": "Développeur Senior",
    "visibility": "public"
  }
}
```

---

### PUT /profiles/me/fields

Mettre à jour plusieurs champs à la fois.

**Body:**
```json
{
  "fields": [
    {
      "fieldKey": "professional_title",
      "fieldValue": "Développeur Senior",
      "visibility": "public"
    },
    {
      "fieldKey": "company",
      "fieldValue": "TechCorp Inc.",
      "visibility": "followers"
    }
  ]
}
```

---

### DELETE /profiles/me/field/:fieldKey

Supprimer un champ dynamique.

**Authentication:** ✅ Requise

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Field deleted"
  }
}
```

---

## Preferences

### PUT /profiles/me/preferences

Mettre à jour les préférences de contenu.

**Authentication:** ✅ Requise

**Body:**
```json
{
  "preferredCategories": ["civics", "education", "environment"],
  "hideMaturityContent": false,
  "language": "fr",
  "notificationFrequency": "daily",
  "emailNotifications": true,
  "pushNotifications": true,
  "showInDiscovery": true,
  "allowMessages": true
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "profileId": "user-uuid",
    "preferredCategories": ["civics", "education"],
    "hideMaturityContent": false,
    "language": "fr",
    "notificationFrequency": "daily",
    "emailNotifications": true,
    "pushNotifications": true,
    "showInDiscovery": true,
    "allowMessages": true,
    "updatedAt": "2026-05-05T10:30:00Z"
  }
}
```

---

### GET /profiles/me/preferences

Récupérer les préférences actuelles.

**Authentication:** ✅ Requise

**Response 200:** (même format que PUT)

---

## Advanced Search

### GET /profiles/search/advanced

Recherche avancée avec full-text search et filtres multiples.

**Query Parameters:**
```
q=démocratie                    # Full-text search
location=Montréal              # Localisation
badges=contributor,influencer  # Filtrer par badges (virgule-séparés)
reputationMin=100              # Score de réputation minimum
categories=civics,education    # Catégories d'intérêt (virgule-séparés)
verifiedOnly=true              # Seulement les profils vérifiés
sort=relevance|reputation|recent (défaut: recent)
page=1                         # Pagination
limit=20                       # Items par page
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid-1",
        "userId": "user-uuid-1",
        "username": "jean_civique",
        "bio": "Passionné par la démocratie et le civisme",
        "avatarUrl": "https://example.com/avatar.jpg",
        "location": "Montréal, QC",
        "reputationScore": 450,
        "isVerified": true,
        "createdAt": "2026-03-15T08:00:00Z",
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

**Note:** Le champ `relevance` n'apparaît que si `q` est fourni.

---

### GET /profiles/search/quick?q=term

Recherche rapide pour autocomplete.

**Query:**
- `q` (required): Terme de recherche (min 2 caractères)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "userId": "user-uuid-1",
      "username": "jean_civique",
      "avatarUrl": "https://example.com/avatar.jpg",
      "isVerified": true
    }
  ]
}
```

---

## Versioning & Audit

### GET /profiles/:id/versions?page=1&limit=20

Récupérer l'historique complet des modifications d'un profil.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "version-uuid-1",
        "fieldName": "bio",
        "oldValue": "Ancien bio",
        "newValue": "Nouveau bio amélioré",
        "changedBy": "user-uuid",
        "changedByUsername": "admin",
        "changeReason": "User-initiated update",
        "changedAt": "2026-05-05T10:30:00Z"
      }
    ],
    "pagination": {
      "total": 23,
      "limit": 20,
      "offset": 0
    }
  }
}
```

---

### GET /profiles/:id/versions/:fieldName?page=1&limit=20

Historique des modifications d'un champ spécifique.

**Response 200:** (même format, filtré par fieldName)

---

### GET /profiles/versions/compare?v1=version-uuid-1&v2=version-uuid-2

Comparer deux versions d'un profil.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "version1": {
      "id": "version-uuid-1",
      "fieldName": "bio",
      "oldValue": "...",
      "newValue": "...",
      "changedAt": "2026-05-04T08:00:00Z"
    },
    "version2": {
      "id": "version-uuid-2",
      "fieldName": "bio",
      "oldValue": "...",
      "newValue": "...",
      "changedAt": "2026-05-05T10:00:00Z"
    }
  }
}
```

---

## Exemples complets

### Cas d'usage: Créer un profil complet et le configurer

```bash
#!/bin/bash

TOKEN="your-jwt-token"
PROFILE_ID="user-uuid"

# 1. Configurer la confidentialité
curl -X PUT http://localhost:3000/api/v1/profiles/me/privacy \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profileVisibility": "public",
    "showLocation": true,
    "showStats": true
  }'

# 2. Ajouter des champs personnalisés
curl -X PUT http://localhost:3000/api/v1/profiles/me/field \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldKey": "professional_title",
    "fieldValue": "Développeur Senior",
    "visibility": "public"
  }'

# 3. Configurer les préférences
curl -X PUT http://localhost:3000/api/v1/profiles/me/preferences \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "preferredCategories": ["civics", "education"],
    "language": "fr",
    "emailNotifications": true
  }'

# 4. Rechercher des profils similaires
curl "http://localhost:3000/api/v1/profiles/search/advanced?q=démocratie&location=Montréal&sort=reputation"

# 5. Voir le profil avec tous les champs
curl http://localhost:3000/api/v1/profiles/$PROFILE_ID

# 6. Consulter la réputation
curl http://localhost:3000/api/v1/profiles/$PROFILE_ID/reputation

# 7. Voir l'historique des modifications
curl http://localhost:3000/api/v1/profiles/$PROFILE_ID/versions
```

---

## Architecture & Extensibilité

### Comment ajouter de nouveaux champs?

```bash
# 1. Créer la définition (via API future ou admin panel)
INSERT INTO profile_field_definitions
(field_key, field_name, field_type, is_searchable, display_order)
VALUES ('my_custom_field', 'Mon Champ', 'text', true, 10);

# 2. Les utilisateurs peuvent remplir ce champ
curl -X PUT /api/v1/profiles/me/field \
  -d '{"fieldKey": "my_custom_field", "fieldValue": "Ma valeur"}'

# 3. Les autres utilisateurs voient le champ
curl /api/v1/profiles/:id/fields
```

**Avantages:**
- Zéro migration DB requise
- Extensible à l'infini
- Validation dynamique via Zod.compile()
- Support complet de la versioning

---

## Erreurs Courantes

### 404 Profile Not Found
```json
{
  "success": false,
  "error": {
    "message": "Profile not found"
  }
}
```

### 403 Access Denied (Visibilité)
```json
{
  "success": false,
  "error": {
    "message": "Access denied to this profile"
  }
}
```

### 422 Validation Failed
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "fieldErrors": {
      "profileVisibility": ["Invalid visibility option"]
    }
  }
}
```

---

## Notes Importantes

- ✅ Tous les timestamps sont en UTC ISO 8601
- ✅ Les UUIDs sont au format standard
- ✅ La pagination commence à 1 (pas 0)
- ✅ Les recherches sont case-insensitive (full-text)
- ✅ La réputation se met à jour automatiquement
- ✅ Les badges s'assignent automatiquement
- ✅ L'historique de versioning est immuable
- ✅ Les champs dynamiques supportent la visibilité mixte

---

**📌 Version:** 2.0.0 | **Statut:** ✅ 100% Plateforme | **Date:** 2026-05-05

