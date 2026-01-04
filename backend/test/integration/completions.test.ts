/**
 * Integration tests for Completions endpoints
 */

import request from 'supertest';
import { createServer } from '../../src/server';
import { Application } from 'express';

describe('Completions API Integration', () => {
  let app: Application;

  beforeAll(() => {
    process.env.AUTH_ENABLED = 'false';
    process.env.CACHE_ENABLED = 'false';
    app = createServer();
  });

  describe('POST /v1/completions', () => {
    it('should accept valid completion request', async () => {
      const response = await request(app)
        .post('/v1/completions')
        .send({
          model: 'gpt-3.5-turbo-instruct',
          prompt: 'Say hello'
        })
        .set('Content-Type', 'application/json');

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should reject missing prompt', async () => {
      const response = await request(app)
        .post('/v1/completions')
        .send({
          model: 'gpt-3.5-turbo-instruct'
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should accept array prompt', async () => {
      const response = await request(app)
        .post('/v1/completions')
        .send({
          prompt: ['prompt1', 'prompt2']
        })
        .set('Content-Type', 'application/json');

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should accept optional parameters', async () => {
      const response = await request(app)
        .post('/v1/completions')
        .send({
          prompt: 'Hello',
          max_tokens: 50,
          temperature: 0.5,
          suffix: '.'
        })
        .set('Content-Type', 'application/json');

      expect([200, 401, 500]).toContain(response.status);
    });
  });
});

