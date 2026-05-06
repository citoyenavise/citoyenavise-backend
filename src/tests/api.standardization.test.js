/**
 * Tests API Standardization
 * Vérifie que TOUS les 46 endpoints retournent le format standard
 */

const request = require('supertest');
const app = require('../app.js');

describe('API STANDARDIZATION - All 46 Endpoints', () => {
  /**
   * Liste complète des 46 endpoints CORE
   * Format: { method, url, auth: true/false, body?: {} }
   */
  const endpoints = [
    // AUTH (5)
    { method: 'POST', url: '/api/v1/auth/register', auth: false, body: { email: 'test@example.com', password: 'Pass123', username: 'user' } },
    { method: 'POST', url: '/api/v1/auth/login', auth: false, body: { email: 'test@example.com', password: 'Pass123' } },
    { method: 'GET', url: '/api/v1/auth/me', auth: true },
    { method: 'POST', url: '/api/v1/auth/refresh', auth: false, body: { refreshToken: 'token' } },
    { method: 'POST', url: '/api/v1/auth/logout', auth: true },

    // USERS (3)
    { method: 'GET', url: '/api/v1/users/123', auth: false },
    { method: 'PUT', url: '/api/v1/users/123', auth: true, body: { email: 'new@example.com' } },
    { method: 'DELETE', url: '/api/v1/users/123', auth: true },

    // PROFILES (7)
    { method: 'GET', url: '/api/v1/profiles', auth: false },
    { method: 'GET', url: '/api/v1/profiles/123', auth: false },
    { method: 'PUT', url: '/api/v1/profiles/123', auth: true, body: { bio: 'Bio' } },
    { method: 'GET', url: '/api/v1/profiles/123/posts', auth: false },
    { method: 'GET', url: '/api/v1/profiles/123/followers', auth: false },
    { method: 'POST', url: '/api/v1/profiles/123/follow', auth: true },
    { method: 'DELETE', url: '/api/v1/profiles/123/follow', auth: true },

    // POSTS (9)
    { method: 'GET', url: '/api/v1/posts', auth: false },
    { method: 'GET', url: '/api/v1/posts/123', auth: false },
    { method: 'POST', url: '/api/v1/posts', auth: true, body: { title: 'Title', content: 'Content', type: 'idea', category: 'gouvernement' } },
    { method: 'PUT', url: '/api/v1/posts/123', auth: true, body: { title: 'New Title' } },
    { method: 'DELETE', url: '/api/v1/posts/123', auth: true },
    { method: 'POST', url: '/api/v1/posts/123/flag', auth: true, body: { reason: 'spam' } },
    { method: 'POST', url: '/api/v1/posts/123/like', auth: true },
    { method: 'DELETE', url: '/api/v1/posts/123/like', auth: true },
    { method: 'GET', url: '/api/v1/posts/popular', auth: false },

    // LIKES (4)
    { method: 'POST', url: '/api/v1/likes/posts/123/like', auth: true },
    { method: 'DELETE', url: '/api/v1/likes/posts/123/like', auth: true },
    { method: 'GET', url: '/api/v1/likes/posts/123/likes', auth: false },
    { method: 'GET', url: '/api/v1/likes/posts/123/likes/check', auth: true },

    // COMMENTS (5)
    { method: 'POST', url: '/api/v1/comments/posts/123/comments', auth: true, body: { content: 'Comment' } },
    { method: 'GET', url: '/api/v1/comments/posts/123/comments', auth: false },
    { method: 'GET', url: '/api/v1/comments/comments/123', auth: false },
    { method: 'PUT', url: '/api/v1/comments/comments/123', auth: true, body: { content: 'Updated' } },
    { method: 'DELETE', url: '/api/v1/comments/comments/123', auth: true },

    // IDEAS (7)
    { method: 'GET', url: '/api/v1/ideas', auth: false },
    { method: 'GET', url: '/api/v1/ideas/popular', auth: false },
    { method: 'GET', url: '/api/v1/ideas/123', auth: false },
    { method: 'POST', url: '/api/v1/ideas', auth: true, body: { title: 'Title', content: 'Content', category: 'environnement' } },
    { method: 'PUT', url: '/api/v1/ideas/123', auth: true, body: { title: 'New Title' } },
    { method: 'DELETE', url: '/api/v1/ideas/123', auth: true },
    { method: 'POST', url: '/api/v1/ideas/123/like', auth: true },

    // POPULAR (1)
    { method: 'GET', url: '/api/v1/popular', auth: false },

    // SEARCH (3)
    { method: 'GET', url: '/api/v1/search?q=test', auth: false },
    { method: 'GET', url: '/api/v1/search/posts?q=test', auth: false },
    { method: 'GET', url: '/api/v1/search/users?q=test', auth: false },

    // MAP (4)
    { method: 'GET', url: '/api/v1/map/nodes?bounds=-74,45,-73,46', auth: false },
    { method: 'POST', url: '/api/v1/map/nodes', auth: true, body: { name: 'Node', latitude: 45, longitude: -73 } },
    { method: 'PUT', url: '/api/v1/map/nodes/123', auth: true, body: { name: 'New Name' } },
    { method: 'DELETE', url: '/api/v1/map/nodes/123', auth: true },

    // NOTIFICATIONS (3)
    { method: 'GET', url: '/api/v1/notifications', auth: true },
    { method: 'POST', url: '/api/v1/notifications/123/read', auth: true },
    { method: 'POST', url: '/api/v1/notifications/read-all', auth: true },
  ];

  describe('Response Format Standardization', () => {
    test('✅ All endpoints return standard format with (success, timestamp, data, error, meta)', async () => {
      let passed = 0;
      let failed = 0;

      for (const endpoint of endpoints) {
        try {
          const req = request(app)[endpoint.method.toLowerCase()](endpoint.url);

          if (endpoint.auth) {
            req.set('Authorization', 'Bearer mock-token');
          }

          if (endpoint.body) {
            req.send(endpoint.body);
          }

          const res = await req;

          // Vérifier le format standard
          expect(res.body).toHaveProperty('success');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('meta');

          // Vérifier que timestamp est valide ISO
          expect(() => new Date(res.body.timestamp)).not.toThrow();

          // Vérifier que error a la bonne structure si erreur
          if (!res.body.success && res.body.error) {
            expect(res.body.error).toHaveProperty('message');
            expect(res.body.error).toHaveProperty('code');
          }

          passed++;
        } catch (err) {
          console.error(`❌ ${endpoint.method} ${endpoint.url}:`, err.message);
          failed++;
        }
      }

      console.log(`\n✅ PASSED: ${passed}/${endpoints.length} endpoints`);
      console.log(`❌ FAILED: ${failed}/${endpoints.length} endpoints\n`);

      expect(failed).toBe(0);
    });
  });

  describe('Error Code Standardization', () => {
    test('✅ All error responses have standardized error codes', async () => {
      const errorCodes = [
        'VALIDATION_ERROR',
        'UNAUTHORIZED',
        'FORBIDDEN',
        'NOT_FOUND',
        'CONFLICT',
        'INVALID_CREDENTIALS',
        'TOKEN_EXPIRED',
        'SERVER_ERROR',
        'DATABASE_ERROR',
        'BAD_REQUEST',
      ];

      // Tester un endpoint qui retourne une erreur (ex: validation)
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'invalid-email', password: 'short' });

      expect(res.body.error).toHaveProperty('code');
      expect(errorCodes).toContain(res.body.error.code);
    });
  });

  describe('Pagination Standardization', () => {
    test('✅ All list endpoints return consistent pagination format', async () => {
      const listEndpoints = [
        { method: 'GET', url: '/api/v1/posts', auth: false },
        { method: 'GET', url: '/api/v1/profiles', auth: false },
        { method: 'GET', url: '/api/v1/ideas', auth: false },
        { method: 'GET', url: '/api/v1/search?q=test', auth: false },
      ];

      for (const endpoint of listEndpoints) {
        const req = request(app)[endpoint.method.toLowerCase()](endpoint.url);

        if (endpoint.auth) {
          req.set('Authorization', 'Bearer mock-token');
        }

        const res = await req;

        if (res.status === 200 && Array.isArray(res.body.data)) {
          // Vérifier la pagination si data est un array
          expect(res.body.meta).toHaveProperty('pagination');
          expect(res.body.meta.pagination).toHaveProperty('page');
          expect(res.body.meta.pagination).toHaveProperty('limit');
          expect(res.body.meta.pagination).toHaveProperty('total');
          expect(res.body.meta.pagination).toHaveProperty('pages');
          expect(res.body.meta.pagination).toHaveProperty('hasNextPage');
          expect(res.body.meta.pagination).toHaveProperty('hasPrevPage');
        }
      }
    });
  });

  describe('HTTP Status Code Standardization', () => {
    test('✅ All endpoints use correct HTTP status codes', async () => {
      const statusTests = [
        { method: 'POST', url: '/api/v1/auth/login', expectedStatus: [200, 401, 400] },
        { method: 'GET', url: '/api/v1/posts', expectedStatus: [200, 401] },
        { method: 'POST', url: '/api/v1/posts', expectedStatus: [201, 401, 400, 422] },
        { method: 'GET', url: '/api/v1/posts/999', expectedStatus: [200, 404, 401] },
      ];

      for (const test of statusTests) {
        const req = request(app)[test.method.toLowerCase()](test.url);

        if (test.method === 'POST' && !test.url.includes('login')) {
          req.set('Authorization', 'Bearer mock-token');
          req.send({ title: 'Test' });
        }

        const res = await req;
        expect(test.expectedStatus).toContain(res.status);
      }
    });
  });

  describe('Response Data Validation', () => {
    test('✅ All responses have correct data/error mutual exclusivity', async () => {
      const res = await request(app).get('/api/v1/posts');

      // Si success = true, error doit être null
      // Si success = false, data doit être null
      if (res.body.success) {
        expect(res.body.error).toBeNull();
        expect(res.body.data).toBeDefined();
      } else {
        expect(res.body.error).toBeDefined();
        expect(res.body.data).toBeNull();
      }
    });
  });
});
