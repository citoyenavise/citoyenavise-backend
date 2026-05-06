/**
 * Module Education - Contenus pédagogiques (vidéos, articles, quiz)
 */

const videosModule = require('./videos');
const articlesModule = require('./articles');
const quizModule = require('./quiz');
const { asyncHandler } = require('../../core/middleware/errorHandler');

module.exports = {
  name: 'education',

  /**
   * Initialiser le module
   */
  init: () => {
    // Les sous-modules ne nécessitent pas d'initialisation particulière
    // mais on peut ajouter du code ici si besoin (ex: setup EventBus listeners)
  },

  /**
   * Enregistrer les routes
   */
  routes: (app) => {
    // Sanity check - assurer que le module education existe
    app.get('/api/v1/education', asyncHandler(async (req, res) => {
      res.apiSuccess({
        name: 'education',
        status: 'active',
        submodules: ['videos', 'articles', 'quiz'],
      });
    }));

    // Enregistrer les sous-modules
    videosModule.routes(app);
    articlesModule.routes(app);
    quizModule.routes(app);
  },

  /**
   * Exporter les sous-modules pour accès direct
   */
  submodules: {
    videos: videosModule,
    articles: articlesModule,
    quiz: quizModule,
  },
};
