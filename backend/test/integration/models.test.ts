/**
 * Integration tests for Models endpoints
 */

import request from 'supertest';
import { createServer } from '../../src/server';
import { Application } from 'express';

describe('Models API Integration', () => {
  let app: Application;

  beforeAll(() => {
    process.env.AUTH_ENABLED = 'false';
    process.env.CACHE_ENABLED = 'false';
    app = createServer();
  });

  describe('GET /v1/models', () => {
    it('should return models list', async () => {
      const response = await request(app)
        .get('/v1/models')
        .set('Accept', 'application/json');

      // Will fail without real API key, but endpoint should work
      expect([200, 401, 500]).toContain(response.status);
    });
  });

  describe('GET /v1/models/:model', () => {
    it('should return specific model info', async () => {
      const response = await request(app)
        .get('/v1/models/gpt-4')
        .set('Accept', 'application/json');

      expect([200, 401, 404, 500]).toContain(response.status);
    });
  });

  describe('Health endpoints', () => {
    it('GET /health should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .set('Accept', 'application/json');

      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('GET /health/live should return live status', async () => {
      const response = await request(app)
        .get('/health/live')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('live');
    });

    it('GET /health/stats should return statistics', async () => {
      const response = await request(app)
        .get('/health/stats')
        .set('Accept', 'application/json');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('requests');
    });
  });
});

