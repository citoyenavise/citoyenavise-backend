/**
 * Module Quiz - Export des routes
 */

const router = require('./routes');

module.exports = {
  routes: (app) => {
    app.use('/api/v1/education/quizzes', router);
  },
};
