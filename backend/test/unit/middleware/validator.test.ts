/**
 * Unit tests for Validator Middleware
 */

import { Request, Response, NextFunction } from 'express';
import {
  validateChatCompletion,
  validateCompletion,
  validateEmbedding
} from '../../../src/middleware/validator';

describe('Validator Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('validateChatCompletion', () => {
    it('should pass valid chat completion request', () => {
      mockReq.body = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }]
      };

      validateChatCompletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass request without model (will use default)', () => {
      mockReq.body = {
        messages: [{ role: 'user', content: 'Hello' }]
      };

      validateChatCompletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject empty messages array', () => {
      mockReq.body = {
        model: 'gpt-4',
        messages: []
      };

      validateChatCompletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject invalid message role', () => {
      mockReq.body = {
        model: 'gpt-4',
        messages: [{ role: 'invalid', content: 'Hello' }]
      };

      validateChatCompletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should validate temperature range', () => {
      mockReq.body = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 2.5 // Invalid: > 2
      };

      validateChatCompletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should accept valid tool calls', () => {
      mockReq.body = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello' }],
        tools: [{
          type: 'function',
          function: {
            name: 'get_weather',
            description: 'Get weather info',
            parameters: { type: 'object', properties: {} }
          }
        }]
      };

      validateChatCompletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('validateCompletion', () => {
    it('should pass valid completion request', () => {
      mockReq.body = {
        model: 'gpt-3.5-turbo-instruct',
        prompt: 'Say hello'
      };

      validateCompletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should accept array prompts', () => {
      mockReq.body = {
        prompt: ['prompt1', 'prompt2']
      };

      validateCompletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject missing prompt', () => {
      mockReq.body = {
        model: 'gpt-3.5-turbo-instruct'
      };

      validateCompletion(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('validateEmbedding', () => {
    it('should pass valid embedding request', () => {
      mockReq.body = {
        model: 'text-embedding-3-small',
        input: 'Hello world'
      };

      validateEmbedding(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should accept array inputs', () => {
      mockReq.body = {
        input: ['text1', 'text2', 'text3']
      };

      validateEmbedding(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject missing input', () => {
      mockReq.body = {
        model: 'text-embedding-3-small'
      };

      validateEmbedding(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should validate encoding_format', () => {
      mockReq.body = {
        input: 'Hello',
        encoding_format: 'invalid'
      };

      validateEmbedding(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

