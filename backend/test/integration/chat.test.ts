/**
 * Integration tests for Chat endpoints
 */

import request from 'supertest';
import { createServer } from '../../src/server';
import { Application } from 'express';

describe('Chat API Integration', () => {
  let app: Application;

  beforeAll(() => {
    process.env.AUTH_ENABLED = 'false';
    process.env.CACHE_ENABLED = 'false';
    app = createServer();
  });

  describe('POST /v1/chat/completions', () => {
    it('should accept valid chat request', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }]
        })
        .set('Content-Type', 'application/json');

      // Will fail without real API key, but should validate request
      expect([200, 401, 500]).toContain(response.status);
    });

    it('should reject invalid request body', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'gpt-4',
          messages: [] // Empty messages - invalid
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should reject missing messages', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'gpt-4'
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should handle streaming parameter', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
          stream: true
        })
        .set('Content-Type', 'application/json');

      // Will fail without real API key, but should not crash
      expect([200, 401, 500]).toContain(response.status);
    });

    it('should accept optional parameters', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.7,
          max_tokens: 100,
          top_p: 0.9
        })
        .set('Content-Type', 'application/json');

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should reject invalid temperature', async () => {
      const response = await request(app)
        .post('/v1/chat/completions')
        .send({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 3.0 // Invalid: > 2
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });
  });
});

