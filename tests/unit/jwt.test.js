/**
 * Tests unitaires pour les utilitaires JWT
 */

const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken, verifyToken, verifyRefreshToken } = require('../../src/core/utils/jwt');
const config = require('../../src/config');

describe('JWT Utilities', () => {
  const testUserId = '550e8400-e29b-41d4-a716-446655440000';
  const testRole = 'citizen';

  describe('generateAccessToken', () => {
    it('should generate a valid access token with correct claims', () => {
      const token = generateAccessToken(testUserId, testRole);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, config.JWT_SECRET);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.role).toBe(testRole);
      expect(decoded.type).toBe('access');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });

    it('should include correct expiry time', () => {
      const token = generateAccessToken(testUserId, testRole);
      const decoded = jwt.verify(token, config.JWT_SECRET);

      const expirySeconds = decoded.exp - decoded.iat;
      const expectedSeconds = 24 * 60 * 60; // 24 hours in seconds

      // Allow 5 second variance for execution time
      expect(Math.abs(expirySeconds - expectedSeconds)).toBeLessThan(5);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token with correct claims', () => {
      const token = generateRefreshToken(testUserId);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.type).toBe('refresh');
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(testUserId, testRole);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.role).toBe(testRole);
      expect(decoded.type).toBe('access');
    });

    it('should throw on invalid access token type', () => {
      const refreshToken = generateRefreshToken(testUserId);

      expect(() => {
        verifyToken(refreshToken, 'access');
      }).toThrow('Token type mismatch');
    });

    it('should throw on malformed token', () => {
      expect(() => {
        verifyToken('invalid.token.here');
      }).toThrow();
    });

    it('should throw on expired token', (done) => {
      // Create a token with very short expiry (1 second)
      const shortToken = jwt.sign(
        { userId: testUserId, role: testRole, type: 'access' },
        config.JWT_SECRET,
        { expiresIn: '1s', algorithm: 'HS256' }
      );

      // Wait for token to expire
      setTimeout(() => {
        expect(() => {
          verifyToken(shortToken);
        }).toThrow();
        done();
      }, 1100);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testUserId);
      const decoded = verifyRefreshToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(testUserId);
      expect(decoded.type).toBe('refresh');
    });

    it('should throw if access token passed as refresh token', () => {
      const accessToken = generateAccessToken(testUserId, testRole);

      expect(() => {
        verifyRefreshToken(accessToken);
      }).toThrow('Token type mismatch');
    });
  });

  describe('Token isolation', () => {
    it('should use different secrets for access and refresh tokens', () => {
      expect(config.JWT_SECRET).not.toBe(config.JWT_REFRESH_SECRET);
    });

    it('should not allow using access secret to verify refresh token', () => {
      const refreshToken = generateRefreshToken(testUserId);

      expect(() => {
        jwt.verify(refreshToken, config.JWT_SECRET);
      }).toThrow();
    });
  });
});
