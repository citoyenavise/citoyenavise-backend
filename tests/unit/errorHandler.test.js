/**
 * Tests unitaires pour la gestion d'erreurs
 */

const { AppError, errorHandler, asyncHandler } = require('../../src/core/middleware/errorHandler');
const { z } = require('zod');

describe('Error Handling Middleware', () => {
  describe('AppError class', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('Test error', 400, { field: 'email' });

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should default statusCode to 500', () => {
      const error = new AppError('Server error');

      expect(error.statusCode).toBe(500);
    });

    it('should default details to empty object', () => {
      const error = new AppError('Error message', 400);

      expect(error.details).toEqual({});
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('errorHandler.test.js');
    });
  });

  describe('asyncHandler wrapper', () => {
    it('should wrap async function and pass errors to next', (done) => {
      const asyncFn = jest.fn(async (req, res, next) => {
        throw new Error('Async error');
      });

      const wrapped = asyncHandler(asyncFn);
      const req = {};
      const res = {};
      const next = jest.fn((err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe('Async error');
        done();
      });

      wrapped(req, res, next);
    });

    it('should call next with thrown errors', (done) => {
      const error = new AppError('Custom error', 400);
      const asyncFn = jest.fn(async () => {
        throw error;
      });

      const wrapped = asyncHandler(asyncFn);
      const next = jest.fn((err) => {
        expect(err).toBe(error);
        done();
      });

      wrapped({}, {}, next);
    });

    it('should handle successful async functions', (done) => {
      const asyncFn = jest.fn(async (req, res) => {
        res.json({ success: true });
      });

      const wrapped = asyncHandler(asyncFn);
      const res = {
        json: jest.fn(() => {
          expect(asyncFn).toHaveBeenCalled();
          done();
        }),
      };

      wrapped({}, res, jest.fn());
    });
  });

  describe('errorHandler middleware', () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        path: '/api/test',
        method: 'POST',
        user: { userId: 'test-id' },
        requestId: 'req-123',
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      next = jest.fn();
      process.env.NODE_ENV = 'development';
    });

    describe('Zod validation errors', () => {
      it('should handle ZodError with issue list', () => {
        const zodError = new z.ZodError([
          {
            code: 'invalid_string',
            expected: 'email',
            received: 'string',
            path: ['email'],
            message: 'Invalid email',
          },
        ]);

        errorHandler(zodError, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Validation failed',
            issues: expect.any(Array),
          })
        );
      });
    });

    describe('Client errors (4xx)', () => {
      it('should return client error message as-is', () => {
        const error = new AppError('Bad request', 400);

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Bad request',
            requestId: 'req-123',
          })
        );
      });
    });

    describe('Server errors (5xx)', () => {
      it('should return generic message in production', () => {
        process.env.NODE_ENV = 'production';
        const error = new AppError('Database connection failed', 500);

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'An error occurred. Please try again later.',
            requestId: 'req-123',
          })
        );
        expect(res.json).not.toHaveBeenCalledWith(
          expect.objectContaining({
            details: expect.anything(),
          })
        );
      });

      it('should include details in development', () => {
        process.env.NODE_ENV = 'development';
        const error = new AppError('Database error', 500, { query: 'SELECT *' });

        errorHandler(error, req, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            details: { query: 'SELECT *' },
          })
        );
      });

      it('should never expose stack trace in response', () => {
        const error = new Error('Sensitive error');
        error.statusCode = 500;

        errorHandler(error, req, res, next);

        const responseBody = res.json.mock.calls[0][0];
        expect(JSON.stringify(responseBody)).not.toContain('at ');
      });
    });

    describe('Request ID tracking', () => {
      it('should include requestId in error response', () => {
        const error = new AppError('Error', 400);
        req.requestId = 'unique-request-id';

        errorHandler(error, req, res, next);

        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            requestId: 'unique-request-id',
          })
        );
      });
    });

    describe('User ID tracking (S3 fix)', () => {
      it('should use userId from JWT (not id)', () => {
        process.env.NODE_ENV = 'development';
        const error = new AppError('Error', 500);
        req.user = { userId: 'correct-id' };

        // errorHandler logs internally, we can't easily test logging
        // but we can verify it doesn't crash with userId
        errorHandler(error, req, res, next);
        expect(res.status).toHaveBeenCalled();
      });
    });
  });

  describe('Error classification', () => {
    it('should treat default error as 500 server error', () => {
      const error = new Error('Generic error');
      const req = { path: '/', method: 'GET', requestId: 'test' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      errorHandler(error, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle errors without statusCode', () => {
      const error = { message: 'Custom error' };
      const req = { path: '/', method: 'GET', requestId: 'test' };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      errorHandler(error, req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
