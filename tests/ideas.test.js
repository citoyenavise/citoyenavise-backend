/**
 * Tests Ideas Module
 */

const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/core/services/database');

describe('Ideas Module', () => {
  let accessToken;
  let userId;

  beforeAll(async () => {
    // Setup DB
    await pool.query('DELETE FROM likes');
    await pool.query('DELETE FROM posts');
    await pool.query('DELETE FROM refresh_tokens');
    await pool.query('DELETE FROM profiles');
    await pool.query('DELETE FROM users');
  });

  beforeEach(async () => {
    // Register and login for each test
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `test${Date.now()}@example.com`,
        username: `testuser${Date.now()}`,
        password: 'TestPass123',
      });
    accessToken = response.body.accessToken;
    userId = response.body.user.id;
  });

  afterEach(async () => {
    // Clean test data
    await pool.query('DELETE FROM likes WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM posts WHERE user_id = $1', [userId]);
  });

  describe('POST /api/v1/ideas', () => {
    it('should create an idea with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Better public transport',
          description: 'Improve bus frequency in rural areas',
          category: 'environment',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Better public transport');
      expect(response.body.category).toBe('environment');
      expect(response.body.likes_count).toBe(0);
    });

    it('should reject idea without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/ideas')
        .send({
          title: 'Test Idea',
          description: 'Test Description',
          category: 'environment',
        });

      expect(response.status).toBe(401);
    });

    it('should reject idea with missing title', async () => {
      const response = await request(app)
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Test Description',
          category: 'environment',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject idea with invalid category', async () => {
      const response = await request(app)
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Idea',
          description: 'Test Description',
          category: 'invalid_category',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/ideas', () => {
    beforeEach(async () => {
      // Create some test ideas
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/ideas')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            title: `Idea ${i + 1}`,
            description: `Description ${i + 1}`,
            category: 'environment',
          });
      }
    });

    it('should get all ideas with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/ideas?page=1&limit=10');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should filter ideas by category', async () => {
      const response = await request(app)
        .get('/api/v1/ideas?category=environment');

      expect(response.status).toBe(200);
      expect(response.body.data.every(idea => idea.category === 'environment')).toBe(true);
    });

    it('should respect pagination limit', async () => {
      const response = await request(app)
        .get('/api/v1/ideas?page=1&limit=2');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
      expect(response.body.meta.limit).toBe(2);
    });
  });

  describe('GET /api/v1/ideas/:id', () => {
    let ideaId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Detailed Idea',
          description: 'Detailed Description',
          category: 'environment',
        });
      ideaId = response.body.id;
    });

    it('should get idea details', async () => {
      const response = await request(app)
        .get(`/api/v1/ideas/${ideaId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(ideaId);
      expect(response.body.title).toBe('Detailed Idea');
    });

    it('should return 404 for non-existent idea', async () => {
      const response = await request(app)
        .get('/api/v1/ideas/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/v1/ideas/:id', () => {
    let ideaId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Original Title',
          description: 'Original Description',
          category: 'environment',
        });
      ideaId = response.body.id;
    });

    it('should update idea', async () => {
      const response = await request(app)
        .put(`/api/v1/ideas/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated Description',
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Title');
      expect(response.body.description).toBe('Updated Description');
    });

    it('should reject update from non-owner', async () => {
      // Register a different user
      const otherResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'other@example.com',
          username: 'otheruser',
          password: 'TestPass123',
        });
      const otherToken = otherResponse.body.accessToken;

      const response = await request(app)
        .put(`/api/v1/ideas/${ideaId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Hacked Title',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/ideas/:id', () => {
    let ideaId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'To Delete',
          description: 'Will be deleted',
          category: 'environment',
        });
      ideaId = response.body.id;
    });

    it('should delete idea', async () => {
      const response = await request(app)
        .delete(`/api/v1/ideas/${ideaId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/v1/ideas/${ideaId}`);

      expect(getResponse.status).toBe(404);
    });

    it('should reject deletion from non-owner', async () => {
      const otherResponse = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'deleter@example.com',
          username: 'deleteruser',
          password: 'TestPass123',
        });
      const otherToken = otherResponse.body.accessToken;

      const response = await request(app)
        .delete(`/api/v1/ideas/${ideaId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('Like Ideas', () => {
    let ideaId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/v1/ideas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Likeable Idea',
          description: 'This can be liked',
          category: 'environment',
        });
      ideaId = response.body.id;
    });

    it('should like an idea', async () => {
      const response = await request(app)
        .post(`/api/v1/ideas/${ideaId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(201);
      expect(response.body.likes_count).toBe(1);
    });

    it('should not allow double like', async () => {
      await request(app)
        .post(`/api/v1/ideas/${ideaId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app)
        .post(`/api/v1/ideas/${ideaId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(409);
    });

    it('should unlike an idea', async () => {
      await request(app)
        .post(`/api/v1/ideas/${ideaId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app)
        .delete(`/api/v1/ideas/${ideaId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.likes_count).toBe(0);
    });
  });
});
