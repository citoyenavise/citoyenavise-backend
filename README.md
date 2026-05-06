# Citoyen Avisé — Backend API

Backend Node.js/Express pour la plateforme civique canadienne **Citoyen Avisé**.

## 🚀 Quick Start

### Prérequis
- Node.js 18+
- PostgreSQL 12+
- PostGIS (extension spatiale)

### 1. Setup Base de Données

```bash
# Créer base de données
createdb citoyenavise_dev

# Activer PostGIS
psql citoyenavise_dev -c "CREATE EXTENSION postgis;"

# Tester connexion
psql citoyenavise_dev -c "SELECT version();"
```

### 2. Setup Backend

```bash
cd backend

# Copier .env.example en .env
cp .env.example .env

# Éditer .env avec vos paramètres
# - DATABASE_URL=postgresql://user:password@localhost:5432/citoyenavise_dev
# - JWT_SECRET=gen_secret_min_32_chars

# Installer dépendances
npm install

# Initialiser schéma DB
node src/database/init.js

# Démarrer serveur en développement
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

## 📚 API Routes

### Authentification
```
POST   /api/v1/auth/register    — Inscription
POST   /api/v1/auth/login       — Connexion
GET    /api/v1/auth/me          — Utilisateur actuel (protégé)
```

### Utilisateurs
```
GET    /api/v1/users/:id        — Infos utilisateur
PUT    /api/v1/users/:id        — Éditer profil (protégé)
DELETE /api/v1/users/:id        — Supprimer compte (protégé)
```

### Profils Citoyens
```
GET    /api/v1/profiles                    — Lister
GET    /api/v1/profiles/:id                — Détail
POST   /api/v1/profiles                    — Créer (protégé)
PUT    /api/v1/profiles/:id                — Éditer (protégé, owner)
GET    /api/v1/profiles/:id/posts          — Posts d'un citoyen
GET    /api/v1/profiles/:id/followers      — Followers
POST   /api/v1/profiles/:id/follow         — Suivre (protégé)
DELETE /api/v1/profiles/:id/follow         — Unfollow (protégé)
```

### Posts & Idées
```
GET    /api/v1/posts                       — Feed (filtrable, pagé)
POST   /api/v1/posts                       — Créer (protégé)
GET    /api/v1/posts/:id                   — Détail
PUT    /api/v1/posts/:id                   — Éditer (protégé, owner)
DELETE /api/v1/posts/:id                   — Supprimer (protégé)
POST   /api/v1/posts/:id/flag              — Signaler (protégé)
POST   /api/v1/posts/:id/like              — Liker (protégé)
DELETE /api/v1/posts/:id/like              — Unliker (protégé)
```

### Carte (GeoJSON)
```
GET    /api/v1/map/nodes?bounds=...        — Nœuds dans bbox
GET    /api/v1/map/nodes?region=QC         — Nœuds par région
POST   /api/v1/map/nodes                   — Créer (admin)
PUT    /api/v1/map/nodes/:id               — Éditer (admin)
DELETE /api/v1/map/nodes/:id               — Supprimer (admin)
```

## 🧪 Tests

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## 🔧 Linting

```bash
# Check
npm run lint

# Fix
npm run lint:fix
```

## 📦 Structure du Projet

```
backend/
├── src/
│   ├── config.js               # Configuration centralisée
│   ├── app.js                  # Application Express
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   └── errorHandler.js     # Global error handling
│   ├── routes/                 # Route definitions
│   ├── controllers/            # HTTP layer
│   ├── services/               # Business logic
│   ├── utils/
│   │   ├── db.js              # PostgreSQL pool
│   │   ├── logger.js          # Winston logger
│   │   └── jwt.js             # Token utilities
│   └── database/
│       └── init.js            # DB initialization
├── database/
│   └── schema.sql             # SQL schema
├── package.json
├── .env.example
└── server.js
```

## 🔐 Sécurité

- **JWT** : 24h expiry
- **Passwords** : bcrypt hash (12 rounds)
- **Rate limit** : 60 req/min global, 5 req/15min auth
- **CORS** : Restricted to configured domains
- **Validation** : Zod schemas on all inputs

## 🌐 Environnement

### Développement
```bash
NODE_ENV=development
JWT_SECRET=dev_secret_CHANGE_IN_PROD
DATABASE_URL=postgresql://localhost/citoyenavise_dev
PORT=5000
```

### Production
```bash
NODE_ENV=production
JWT_SECRET=<use strong random 32+ chars>
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/citoyenavise
PORT=5000
```

## 🚢 Déploiement

### Docker (futur)
```bash
docker build -t citoyenavise-api .
docker run -p 5000:5000 --env-file .env citoyenavise-api
```

### Heroku (futur)
```bash
heroku create citoyenavise-api
git push heroku main
heroku run node src/database/init.js
```

## 📝 Logs

Logs structurés avec Winston :
- Console en développement
- Fichiers en production (logs/error.log, logs/combined.log)
- JSON format pour parsing

## 🆘 Troubleshooting

### Erreur de connexion DB
```bash
# Vérifier connexion
psql citoyenavise_dev -c "SELECT NOW();"

# Vérifier PostGIS
psql citoyenavise_dev -c "SELECT PostGIS_version();"
```

### JWT errors
```bash
# Régénérer JWT_SECRET (32+ chars)
openssl rand -base64 32
```

### Ports en conflit
```bash
# Changer PORT dans .env
PORT=5001
```

## 📚 Documentation supplémentaire

- [Guide prompting IA](_ai/10_guide_prompting.md)
- [Architecture modules](_ai/02_architecture_modules.md)
- [Journal de sessions](_ai/40_journal_sessions/)

## 👨‍💻 Contributing

1. Create feature branch (`git checkout -b feature/xyz`)
2. Commit with messages (`git commit -m "feat: xyz"`)
3. Push to branch (`git push origin feature/xyz`)
4. Open Pull Request

## 📄 License

MIT - Citoyen Avisé
