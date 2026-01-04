/**
 * Jest test setup file
 */

import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '8001';
process.env.AUTH_ENABLED = 'false';
process.env.CACHE_ENABLED = 'false';
process.env.LOG_LEVEL = 'error';

// Mock OpenAI API key for tests
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-api-key';

// Global test timeout
jest.setTimeout(30000);

// Suppress console logs during tests unless in verbose mode
if (!process.env.VERBOSE) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

// Clean up after all tests
afterAll(async () => {
  // Allow time for async operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});

