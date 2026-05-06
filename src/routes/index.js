/**
 * Routes principales
 * Regroupe tous les endpoints de l'API
 */

import express from 'express';
import { getConfig, isDevelopment } from '../config/env.js';

const router = express.Router();
const config = getConfig();

/**
 * GET /health
 * Endpoint de santé pour les health checks (Render, monitoring, etc.)
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: config.SERVICE_NAME,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /api/info
 * Informations sur l'API et le service
 */
router.get('/api/info', (req, res) => {
  res.json({
    project: 'Citoyen Avisé',
    description: 'Plateforme civique de participation citoyenne',
    version: config.API_VERSION,
    service: config.SERVICE_NAME,
    environment: config.NODE_ENV,
    timestamp: new Date().toISOString(),
    ...(isDevelopment() && {
      note: 'API en développement - endpoints à venir',
    }),
  });
});

/**
 * Routes futures à implémenter :
 * - /api/v1/users (comptes citoyens)
 * - /api/v1/events (logging des actions)
 * - /api/v1/votes (votes/sondages)
 * - /api/v1/map (carte citoyenne)
 * - /api/v1/analytics (analytics des actions)
 *
 * Structure préparée pour ajouter des modules :
 * import usersRoutes from './modules/users.js';
 * router.use('/api/v1/users', usersRoutes);
 */

/**
 * Route de test (à supprimer en production)
 */
if (isDevelopment()) {
  router.get('/dev/test', (req, res) => {
    res.json({
      message: 'Endpoint de test',
      query: req.query,
      body: req.body,
    });
  });
}

export default router;
