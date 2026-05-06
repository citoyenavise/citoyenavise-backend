/**
 * Tests Auth Controller
 * Jest + Supertest
 */

const request = require('supertest');
const app = require('../../app');
const { query } = require('../../core/services/database');

jest.mock('../../core/services/database');

describe('AUTH CONTROLLER', () => {
  afterEach(() => jest.clearAllMocks());

  describe('POST /api/v1/auth/register', () => {
    test('✅ 201 Register successfully', async () => {
      query.mockResolvedValueOnce({
        rows: [{ id: 'user-1', email: 'test@example.com' }],
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123',
          username: 'testuser',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('profile');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.meta.version).toBe('1.0');
      expect(res.body.meta).toHaveProperty('timestamp');
      expect(res.body.error).toBeNull();
    });

    test('❌ 400 Invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'SecurePass123',
          username: 'testuser',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.data).toBeNull();
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toBeDefined();
    });

    test('❌ 400 Password too short', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
          username: 'testuser',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('❌ 400 Username too short', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123',
          username: 'ab',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('❌ 400 Missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('✅ 200 Login successfully', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.error).toBeNull();
    });

    test('❌ 400 Invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'not-an-email',
          password: 'SecurePass123',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('❌ 401 Invalid credentials', async () => {
      query.mockResolvedValueOnce({ rows: [] }); // User not found

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'WrongPass123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('❌ 400 Missing password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    test('✅ 200 Get current user', async () => {
      const token = 'valid-jwt-token';

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).toHaveProperty('username');
      expect(res.body.error).toBeNull();
    });

    test('❌ 401 Missing token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('❌ 401 Invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    test('✅ 200 Refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.error).toBeNull();
    });

    test('❌ 400 Missing refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('❌ 401 Invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-or-expired-token',
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    test('✅ 200 Logout successfully', async () => {
      const token = 'valid-jwt-token';

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({
          refreshToken: 'valid-refresh-token',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.loggedOut).toBe(true);
      expect(res.body.error).toBeNull();
    });

    test('✅ 200 Logout without refresh token', async () => {
      const token = 'valid-jwt-token';

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    test('❌ 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Response Format Validation', () => {
    test('✅ All responses follow standard format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123',
        });

      // Check response structure
      expect(res.body).toHaveProperty('success');
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body).toHaveProperty('error');

      // Check meta structure
      expect(res.body.meta).toHaveProperty('version');
      expect(res.body.meta).toHaveProperty('timestamp');
      expect(res.body.meta.version).toBe('1.0');

      // Check error structure (if error)
      if (!res.body.success) {
        expect(res.body.error).toHaveProperty('code');
        expect(res.body.error).toHaveProperty('message');
      }
    });
  });

  describe('Error Code Standardization', () => {
    test('✅ VALIDATION_ERROR code used for invalid input', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'short',
          username: 'a',
        });

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('✅ UNAUTHORIZED code used for missing auth', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me');

      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('✅ INVALID_CREDENTIALS code used for wrong login', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword123',
        });

      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    test('✅ TOKEN_EXPIRED code used for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(res.body.error.code).toBe('TOKEN_EXPIRED');
    });
  });
});
