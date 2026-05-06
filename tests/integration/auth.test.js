/**
 * Tests d'intégration pour les routes d'authentification
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Authentication Integration Tests', () => {
  // Note: Ces tests nécessitent une base de données de test configurée
  // Configuration dans .env.test

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.username).toBe('newuser');
    });

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate email registration', async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          username: 'user1',
          password: 'SecurePassword123!',
        });

      // Second registration with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          username: 'user2',
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject duplicate username', async () => {
      const username = `dupuser-${Date.now()}`;

      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `email1-${Date.now()}@example.com`,
          username,
          password: 'SecurePassword123!',
        });

      // Second registration with same username
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `email2-${Date.now()}@example.com`,
          username,
          password: 'SecurePassword123!',
        });

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    let testEmail = `login-test-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';

    beforeAll(async () => {
      // Create test user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: testEmail,
          username: `logintest${Date.now()}`,
          password: testPassword,
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: testPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.email).toBe(testEmail);
    });

    it('should reject login with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject login with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testPassword,
        });

      expect(response.status).toBe(401);
    });

    it('should not expose user existence', async () => {
      const response1 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword',
        });

      const response2 = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testEmail,
          password: 'wrongpassword',
        });

      // Both should return same generic error message
      expect(response1.body.error).toBe(response2.body.error);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let accessToken, refreshToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `refresh-test-${Date.now()}@example.com`,
          username: `refreshtest${Date.now()}`,
          password: 'SecurePassword123!',
        });

      accessToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.accessToken).not.toBe(accessToken);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid.token.here',
        });

      expect(response.status).toBe(401);
    });

    it('should reject missing refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let refreshToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `logout-test-${Date.now()}@example.com`,
          username: `logouttest${Date.now()}`,
          password: 'SecurePassword123!',
        });

      refreshToken = response.body.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({
          refreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success');
    });

    it('should handle missing refresh token gracefully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({});

      // Should succeed even without token
      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/v1/auth/me (current user)', () => {
    let accessToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `currentuser-${Date.now()}@example.com`,
          username: `currentuser${Date.now()}`,
          password: 'SecurePassword123!',
        });

      accessToken = response.body.accessToken;
    });

    it('should get current user with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBeDefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
    });
  });

  describe('Rate limiting on auth endpoints', () => {
    it('should enforce rate limit on register after multiple attempts', async () => {
      const requests = [];
      for (let i = 0; i < 6; i++) {
        requests.push(
          request(app)
            .post('/api/v1/auth/register')
            .send({
              email: `ratelimit-${i}-${Date.now()}@example.com`,
              username: `ratelimit${i}`,
              password: 'SecurePassword123!',
            })
        );
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);

      expect(rateLimited).toBe(true);
    });
  });
});
