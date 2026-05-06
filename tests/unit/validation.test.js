/**
 * Tests unitaires pour la validation et la sanitization
 */

const { sanitizeString, sanitizeObject, validateBody, validateQuery, validateParams } = require('../../src/core/middleware/validation');
const { z } = require('zod');

describe('Input Validation & Sanitization', () => {
  describe('sanitizeString', () => {
    it('should remove XSS script tags', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeString(input);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
    });

    it('should remove dangerous event handlers', () => {
      const input = '<img src=x onerror="alert(\'XSS\')" />';
      const result = sanitizeString(input);

      expect(result).not.toContain('onerror');
    });

    it('should preserve safe HTML entities', () => {
      const input = 'Hello &amp; Goodbye';
      const result = sanitizeString(input);

      expect(result).toContain('&amp;');
    });

    it('should handle null gracefully', () => {
      const result = sanitizeString(null);
      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = sanitizeString('');
      expect(result).toBe('');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values in object', () => {
      const input = {
        name: '<script>alert("XSS")</script>John',
        email: 'john@example.com',
        bio: '<img src=x onerror="alert(\'XSS\')" />Developer',
      };

      const result = sanitizeObject(input);

      expect(result.name).not.toContain('<script>');
      expect(result.email).toBe('john@example.com');
      expect(result.bio).not.toContain('onerror');
    });

    it('should handle nested objects', () => {
      const input = {
        user: {
          name: '<script>John</script>',
          profile: {
            bio: '<img src=x onerror="xss" />Dev',
          },
        },
      };

      const result = sanitizeObject(input);

      expect(result.user.name).not.toContain('<script>');
      expect(result.user.profile.bio).not.toContain('onerror');
    });

    it('should preserve non-string values', () => {
      const input = {
        name: 'John',
        age: 30,
        active: true,
        score: 95.5,
        data: null,
        tags: ['tag1', 'tag2'],
      };

      const result = sanitizeObject(input);

      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
      expect(result.score).toBe(95.5);
      expect(result.data).toBe(null);
      expect(Array.isArray(result.tags)).toBe(true);
    });
  });

  describe('validateBody middleware', () => {
    it('should validate and store validated body in req.validatedBody', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      const middleware = validateBody(schema);
      const req = {
        body: { email: 'test@example.com', password: 'password123' },
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.validatedBody).toBeDefined();
      expect(req.validatedBody.email).toBe('test@example.com');
      expect(next).toHaveBeenCalled();
    });

    it('should call next on error handler when validation fails', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      const middleware = validateBody(schema);
      const req = {
        body: { email: 'invalid-email' },
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('validateQuery middleware', () => {
    it('should validate and store validated query in req.validatedQuery', () => {
      const schema = z.object({
        limit: z.coerce.number().min(1).max(100),
        offset: z.coerce.number().min(0),
      });

      const middleware = validateQuery(schema);
      const req = {
        query: { limit: '20', offset: '0' },
      };
      const res = {};
      const next = jest.fn();

      middleware(req, res, next);

      expect(req.validatedQuery).toBeDefined();
      expect(req.validatedQuery.limit).toBe(20);
      expect(req.validatedQuery.offset).toBe(0);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('XSS prevention', () => {
    it('should prevent common XSS vectors', () => {
      const xssVectors = [
        '<iframe src="javascript:alert(\'XSS\')"></iframe>',
        '<body onload="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '<marquee onstart="alert(\'XSS\')"></marquee>',
      ];

      xssVectors.forEach(vector => {
        const result = sanitizeString(vector);
        expect(result).not.toContain('alert');
        expect(result).not.toContain('onload');
        expect(result).not.toContain('onstart');
      });
    });
  });
});
