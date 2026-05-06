/**
 * Test setup — configuration globale et fixtures
 */

const { pool } = require('../src/core/services/database');

// Avant tous les tests
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
});

// Après chaque test
afterEach(async () => {
  // Nettoyer les données de test si nécessaire
});

// Après tous les tests
afterAll(async () => {
  await pool.end();
});

// Fixtures helpers
global.testUser = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'Test1234',
};

global.testIdea = {
  title: 'Test Idea',
  description: 'Test description',
  category: 'environment',
};
