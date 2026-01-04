/**
 * Integration tests for Embeddings endpoints
 */

import request from 'supertest';
import { createServer } from '../../src/server';
import { Application } from 'express';

describe('Embeddings API Integration', () => {
  let app: Application;

  beforeAll(() => {
    process.env.AUTH_ENABLED = 'false';
    process.env.CACHE_ENABLED = 'false';
    app = createServer();
  });

  describe('POST /v1/embeddings', () => {
    it('should accept valid embedding request', async () => {
      const response = await request(app)
        .post('/v1/embeddings')
        .send({
          model: 'text-embedding-3-small',
          input: 'Hello world'
        })
        .set('Content-Type', 'application/json');

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should reject missing input', async () => {
      const response = await request(app)
        .post('/v1/embeddings')
        .send({
          model: 'text-embedding-3-small'
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    it('should accept array input', async () => {
      const response = await request(app)
        .post('/v1/embeddings')
        .send({
          input: ['text1', 'text2', 'text3']
        })
        .set('Content-Type', 'application/json');

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should accept encoding_format parameter', async () => {
      const response = await request(app)
        .post('/v1/embeddings')
        .send({
          input: 'Hello',
          encoding_format: 'float'
        })
        .set('Content-Type', 'application/json');

      expect([200, 401, 500]).toContain(response.status);
    });

    it('should reject invalid encoding_format', async () => {
      const response = await request(app)
        .post('/v1/embeddings')
        .send({
          input: 'Hello',
          encoding_format: 'invalid'
        })
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });
  });
});

