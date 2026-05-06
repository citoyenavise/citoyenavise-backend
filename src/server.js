import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getConfig } from './config/env.js';
import { logger } from './middlewares/logger.js';
import routes from './routes/index.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const config = getConfig();

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Routes
app.use('/', routes);

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method,
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Erreur interne du serveur',
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Démarrage du serveur
const server = app.listen(config.PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  Citoyen Avisé - Backend API           ║
╠════════════════════════════════════════╣
║  Service: citoyenavise-backend         ║
║  Environnement: ${config.NODE_ENV.padEnd(27)}║
║  Port: ${String(config.PORT).padEnd(34)}║
║  URL: http://localhost:${config.PORT}${' '.repeat(26 - String(config.PORT).length)}║
╚════════════════════════════════════════╝
  `);
});

// Gestion graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, fermeture du serveur...');
  server.close(() => {
    console.log('Serveur fermé');
    process.exit(0);
  });
});

export default app;
