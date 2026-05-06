# Architecture Backend Modulaire

## 📋 Vue d'ensemble

Le backend a été restructuré en une architecture **modulaire scalable** permettant :
- ✅ Développement parallèle des 28 modules
- ✅ Isolation des dépendances
- ✅ Réutilisabilité du code core
- ✅ Maintenance simplifiée

## 🏗️ Structure

```
backend/src/
├── modules/                    # 28 modules métier (voir ci-dessous)
│   ├── auth/                   # Module Auth (MVP ✅)
│   │   ├── routes.js           # Définition des routes
│   │   ├── controller.js       # Logique des endpoints
│   │   ├── service.js          # Logique métier
│   │   ├── schema.js           # Validation Zod
│   │   └── index.js            # Exports du module
│   ├── users/                  # Module Users (MVP ✅)
│   ├── profiles/               # Module Profiles (MVP ✅)
│   ├── posts/                  # Module Posts (MVP ✅)
│   ├── map/                    # Module Map (MVP ✅)
│   ├── ideas/                  # Module Ideas (MVP ✅)
│   ├── [22 autres modules...]  # À implémenter (voir ROADMAP)
│   └── ...
│
├── core/                       # Code partagé
│   ├── middleware/             # Middlewares globaux
│   │   ├── auth.js            # JWT validation
│   │   └── errorHandler.js    # Error handling global
│   ├── services/               # Services cross-modules
│   │   └── database.js        # DB connection pool, transactions
│   ├── utils/                  # Utilitaires
│   │   ├── jwt.js             # Token generation/verification
│   │   └── logger.js          # Winston logger
│   └── constants/              # Constants
│       ├── roles.js           # User roles
│       ├── categories.js      # Post categories
│       └── errors.js          # Error classes
│
├── database/                   # Migrations & schema
│   ├── init.js                # Initialization script
│   ├── migrations/            # SQL migration files
│   ├── seeds/                 # Sample data
│   └── schema.sql             # Full database schema
│
├── config.js                   # Configuration globale
├── app.js                      # Express app setup
├── moduleLoader.js             # Dynamic module loader
└── server.js                   # Server entry point
```

## 🔌 Modules MVP (6 modules - COMPLÉTÉS ✅)

### 1. **auth** - Authentification
- Routes: `/api/v1/auth`
- Endpoints: register, login, getMe
- État: ✅ Prêt en production

### 2. **users** - Gestion utilisateurs
- Routes: `/api/v1/users`
- CRUD complet, gestion des rôles
- État: ✅ Prêt en production

### 3. **profiles** - Profils citoyens
- Routes: `/api/v1/profiles`
- Profils, follows, localisation
- État: ✅ Prêt en production

### 4. **posts** - Publications civiques
- Routes: `/api/v1/posts`
- CRUD posts, likes, modération
- État: ✅ Prêt en production

### 5. **map** - Carte interactive
- Routes: `/api/v1/map`
- GeoJSON, PostGIS queries, clustering
- État: ✅ Prêt en production

### 6. **ideas** - Idées citoyennes
- Routes: `/api/v1/ideas`
- Framework en place, à implémenter
- État: 🟡 En progrès

## 📦 Modules à implémenter (22 modules - Phase 2+)

### Phase 2 (4-6 semaines)
- **notifications** → `/api/v1/notifications`
- **likes** → `/api/v1/likes`
- **popular_system** → `/api/v1/popular`
- **search** → `/api/v1/search`
- **admin** → `/api/v1/admin`
- **moderation** → `/api/v1/moderation`
- **cms** → `/api/v1/cms`
- **content** → `/api/v1/content`

### Phase 3 (6-8 semaines)
- **groups** → `/api/v1/groups`
- **friends** → `/api/v1/friends`
- **follow** → `/api/v1/follow`
- **official_pages** → `/api/v1/official-pages`

### Phase 4 (4-6 semaines)
- **programmes** → `/api/v1/programmes`
- **establishments** → `/api/v1/establishments`
- **public_dashboard** → `/api/v1/dashboard`
- **influence_system** → `/api/v1/influence`

### Phase 5 (4 semaines)
- **ai_mascot** → `/api/v1/ai`
- **analytics** → `/api/v1/analytics`
- **webhooks** → `/api/v1/webhooks`
- **comments** → `/api/v1/comments`
- **homepage** → `/api/v1/homepage`

## 🔄 Pattern de module (Exemple)

Chaque module suit ce pattern :

```
├── routes.js
│   └── Express Router avec endpoints
│   └── Import middleware auth
│   └── Import controller
│
├── controller.js
│   └── Validation (Zod)
│   └── Appel au service
│   └── Response au client
│
├── service.js
│   └── Logique métier
│   └── Requêtes DB
│   └── Validations métier
│
├── schema.js
│   └── Schémas Zod pour validation
│
└── index.js
    └── Exports du module
```

## 🔌 Dépendances entre modules

```
Modules indépendants:
├── auth (base)
├── cms
└── programmes

Niveau 1 (dépend d'auth):
├── users
├── profiles
└── content

Niveau 2 (dépend de niveaux précédents):
├── posts
├── map
├── official_pages
└── establishments

Niveau 3 (dépend de posts/profiles):
├── ideas
├── likes
├── friends
├── follow
├── groups
└── notifications

Niveau 4:
├── comments
├── popular_system
├── influence_system

Niveau 5 (agrégation):
├── search
├── public_dashboard
├── admin
└── homepage
```

## 🚀 Démarrage d'un nouveau module

### 1. Créer la structure
```bash
mkdir -p backend/src/modules/mon_module
```

### 2. Créer les fichiers de base
```javascript
// routes.js
const express = require('express');
const { asyncHandler } = require('../../core/middleware/errorHandler');
const controller = require('./controller');
const router = express.Router();
// TODO: Ajouter les routes

// controller.js
const service = require('./service');
module.exports = {
  // TODO: Ajouter les handlers
};

// service.js
const { query } = require('../../core/services/database');
module.exports = {
  // TODO: Ajouter la logique
};

// schema.js
const { z } = require('zod');
module.exports = {
  // TODO: Ajouter les schémas
};

// index.js
module.exports = {
  routes: require('./routes'),
  controller: require('./controller'),
  service: require('./service'),
};
```

### 3. Enregistrer le module dans `moduleLoader.js`
```javascript
const moduleRoutes = {
  // ...
  mon_module: '/api/v1/mon-module',
};
```

### 4. Tester
```bash
npm run dev
# Vérifier que le module apparaît dans les logs:
# "✅ Module chargé : mon_module → /api/v1/mon-module"
```

## 🛠️ Core API

### Middleware
```javascript
const { authRequired, authOptional } = require('../../core/middleware/auth');
const { asyncHandler } = require('../../core/middleware/errorHandler');
```

### Services
```javascript
const { query, transaction } = require('../../core/services/database');
const { generateAccessToken, verifyToken } = require('../../core/utils/jwt');
const logger = require('../../core/utils/logger');
```

### Constants
```javascript
const { ROLES, ROLE_HIERARCHY } = require('../../core/constants/roles');
const { POST_CATEGORIES, POST_TYPES } = require('../../core/constants/categories');
const { BadRequest, NotFound, Unauthorized } = require('../../core/constants/errors');
```

## 📝 Notes d'implémentation

### Imports
- Core: `require('../../core/...')`
- Modules frères: `require('../nom_module/...')`
- Config: `require('../../config')`

### Logging
```javascript
const logger = require('../../core/utils/logger');
logger.info('Message');
logger.warn('Warning');
logger.error('Error', { meta: { details } });
```

### Erreurs
```javascript
const { BadRequest, NotFound } = require('../../core/constants/errors');
throw new BadRequest('Message d\'erreur');
```

### Transactions
```javascript
const { transaction } = require('../../core/services/database');
await transaction(async (client) => {
  await client.query('UPDATE ...');
  // Si erreur → ROLLBACK automatique
});
```

## ✅ Statut de la restructuration

- ✅ Créé 28 dossiers modules
- ✅ Déplacé 6 modules MVP existants
- ✅ Créé structure core/
- ✅ Créé moduleLoader.js
- ✅ Mis à jour tous les imports
- ✅ Ajouté transaction support
- ✅ Créé fichiers templates pour 22 nouveaux modules

**Prochaine étape**: Implémenter les modules Phase 2 selon ROADMAP.md
