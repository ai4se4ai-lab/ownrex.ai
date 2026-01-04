/**
 * Unit tests for Auth Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../../../src/middleware/auth';
import { TokenService } from '../../../src/services/token.service';
import { resetConfig } from '../../../src/config';

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    // Reset both config and token service to ensure fresh state
    resetConfig();
    TokenService.resetInstance();
    process.env.AUTH_ENABLED = 'true';
    process.env.OWNREX_API_KEY = 'test-api-key';

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      headers: {},
      ip: '127.0.0.1',
      path: '/test'
    };
    mockRes = {
      status: statusMock,
      json: jsonMock
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    resetConfig();
    TokenService.resetInstance();
  });

  describe('authMiddleware', () => {
    it('should call next when auth is disabled', () => {
      process.env.AUTH_ENABLED = 'false';
      resetConfig();
      TokenService.resetInstance();

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next with valid API key', () => {
      mockReq.headers = { authorization: 'Bearer test-api-key' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).tokenInfo).toBeDefined();
    });

    it('should return 401 for missing authorization header', () => {
      mockReq.headers = {};

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid API key', () => {
      mockReq.headers = { authorization: 'Bearer wrong-key' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 for invalid authorization format', () => {
      mockReq.headers = { authorization: 'Basic abc123' };

      authMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should call next when no auth header', () => {
      mockReq.headers = {};

      optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate when auth header is present', () => {
      mockReq.headers = { authorization: 'Bearer test-api-key' };

      optionalAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).tokenInfo).toBeDefined();
    });
  });
});

