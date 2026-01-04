/**
 * Unit tests for OpenAI Service
 */

import { OpenAIService } from '../../../src/services/openai.service';

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn()
      }
    },
    completions: {
      create: jest.fn()
    },
    embeddings: {
      create: jest.fn()
    },
    models: {
      list: jest.fn(),
      retrieve: jest.fn()
    }
  }));
});

describe('OpenAIService', () => {
  let openaiService: OpenAIService;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key';
    OpenAIService.resetInstance();
    openaiService = OpenAIService.getInstance();
  });

  afterEach(() => {
    OpenAIService.resetInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = OpenAIService.getInstance();
      const instance2 = OpenAIService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('createChatCompletion', () => {
    it('should call OpenAI chat completions API', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1234567890,
        model: 'gpt-4',
        choices: [{
          index: 0,
          message: { role: 'assistant', content: 'Hello!' },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15
        }
      };

      const client = (openaiService as any).client;
      client.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openaiService.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hi' }]
      });

      expect(result.id).toBe('chatcmpl-123');
      expect(result.choices[0].message.content).toBe('Hello!');
      expect(result.usage.total_tokens).toBe(15);
    });

    it('should throw error on API failure', async () => {
      const client = (openaiService as any).client;
      client.chat.completions.create.mockRejectedValue(new Error('API Error'));

      await expect(openaiService.createChatCompletion({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hi' }]
      })).rejects.toThrow();
    });
  });

  describe('createCompletion', () => {
    it('should call OpenAI completions API', async () => {
      const mockResponse = {
        id: 'cmpl-123',
        object: 'text_completion',
        created: 1234567890,
        model: 'gpt-3.5-turbo-instruct',
        choices: [{
          text: 'Hello world!',
          index: 0,
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 5,
          completion_tokens: 3,
          total_tokens: 8
        }
      };

      const client = (openaiService as any).client;
      client.completions.create.mockResolvedValue(mockResponse);

      const result = await openaiService.createCompletion({
        model: 'gpt-3.5-turbo-instruct',
        prompt: 'Say hello'
      });

      expect(result.choices[0].text).toBe('Hello world!');
    });
  });

  describe('createEmbedding', () => {
    it('should call OpenAI embeddings API', async () => {
      const mockResponse = {
        object: 'list',
        data: [{
          object: 'embedding',
          embedding: [0.1, 0.2, 0.3],
          index: 0
        }],
        model: 'text-embedding-3-small',
        usage: {
          prompt_tokens: 5,
          total_tokens: 5
        }
      };

      const client = (openaiService as any).client;
      client.embeddings.create.mockResolvedValue(mockResponse);

      const result = await openaiService.createEmbedding({
        model: 'text-embedding-3-small',
        input: 'Hello'
      });

      expect(result.data[0].embedding).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('listModels', () => {
    it('should list available models', async () => {
      const mockModels = [
        { id: 'gpt-4', object: 'model', created: 1234567890, owned_by: 'openai' },
        { id: 'gpt-3.5-turbo', object: 'model', created: 1234567890, owned_by: 'openai' }
      ];

      const client = (openaiService as any).client;
      client.models.list.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (const model of mockModels) {
            yield model;
          }
        }
      });

      const result = await openaiService.listModels();

      expect(result.data.length).toBe(2);
      expect(result.data[0].id).toBe('gpt-4');
    });
  });

  describe('retrieveModel', () => {
    it('should retrieve specific model', async () => {
      const mockModel = {
        id: 'gpt-4',
        object: 'model',
        created: 1234567890,
        owned_by: 'openai'
      };

      const client = (openaiService as any).client;
      client.models.retrieve.mockResolvedValue(mockModel);

      const result = await openaiService.retrieveModel('gpt-4');

      expect(result.id).toBe('gpt-4');
    });
  });

  describe('checkHealth', () => {
    it('should return true when API is available', async () => {
      const client = (openaiService as any).client;
      client.models.list.mockResolvedValue([]);

      const result = await openaiService.checkHealth();

      expect(result).toBe(true);
    });

    it('should return false when API fails', async () => {
      const client = (openaiService as any).client;
      client.models.list.mockRejectedValue(new Error('Connection failed'));

      const result = await openaiService.checkHealth();

      expect(result).toBe(false);
    });
  });
});

