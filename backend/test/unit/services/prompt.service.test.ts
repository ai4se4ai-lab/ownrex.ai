/**
 * Unit tests for Prompt Service
 */

import { PromptService } from '../../../src/services/prompt.service';
import { ChatMessage } from '../../../src/types/requests';

describe('PromptService', () => {
  let promptService: PromptService;

  beforeEach(() => {
    PromptService.resetInstance();
    promptService = PromptService.getInstance();
  });

  afterEach(() => {
    PromptService.resetInstance();
  });

  describe('getSystemPrompt', () => {
    it('should return default system prompt', () => {
      const prompt = promptService.getSystemPrompt('default');
      
      expect(prompt).toContain('Ownrex.ai');
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('should return code generation prompt', () => {
      const prompt = promptService.getSystemPrompt('codeGeneration');
      
      expect(prompt).toContain('code generator');
    });

    it('should return code review prompt', () => {
      const prompt = promptService.getSystemPrompt('codeReview');
      
      expect(prompt).toContain('code reviewer');
    });
  });

  describe('enhanceMessages', () => {
    it('should add system message if not present', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' }
      ];
      
      const enhanced = promptService.enhanceMessages(messages);
      
      expect(enhanced[0].role).toBe('system');
      expect(enhanced.length).toBe(2);
    });

    it('should not add system message if already present', () => {
      const messages: ChatMessage[] = [
        { role: 'system', content: 'Custom system prompt' },
        { role: 'user', content: 'Hello' }
      ];
      
      const enhanced = promptService.enhanceMessages(messages);
      
      expect(enhanced.length).toBe(2);
      expect(enhanced[0].content).toBe('Custom system prompt');
    });

    it('should use custom system prompt from context', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' }
      ];
      
      const enhanced = promptService.enhanceMessages(messages, {
        systemPrompt: 'Custom prompt'
      });
      
      expect(enhanced[0].content).toBe('Custom prompt');
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate tokens for messages', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello, how are you?' }
      ];
      
      const count = promptService.estimateTokenCount(messages);
      
      expect(count).toBeGreaterThan(0);
    });

    it('should include overhead for message structure', () => {
      const shortMessage: ChatMessage[] = [
        { role: 'user', content: 'Hi' }
      ];
      const longMessage: ChatMessage[] = [
        { role: 'user', content: 'This is a much longer message with more content' }
      ];
      
      expect(promptService.estimateTokenCount(longMessage))
        .toBeGreaterThan(promptService.estimateTokenCount(shortMessage));
    });
  });

  describe('truncateMessages', () => {
    it('should not truncate if within limit', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Short message' }
      ];
      
      const truncated = promptService.truncateMessages(messages, 1000);
      
      expect(truncated.length).toBe(1);
    });

    it('should preserve system message when truncating', () => {
      const messages: ChatMessage[] = [
        { role: 'system', content: 'System prompt' },
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'Response' },
        { role: 'user', content: 'Second message' }
      ];
      
      const truncated = promptService.truncateMessages(messages, 20, true);
      
      expect(truncated[0].role).toBe('system');
    });
  });

  describe('validateMessages', () => {
    it('should validate correct messages', () => {
      const messages: ChatMessage[] = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' }
      ];
      
      const result = promptService.validateMessages(messages);
      
      expect(result.valid).toBe(true);
    });

    it('should reject empty array', () => {
      const result = promptService.validateMessages([]);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('non-empty');
    });

    it('should reject messages with invalid role', () => {
      const messages = [
        { role: 'invalid', content: 'Hello' }
      ] as unknown as ChatMessage[];
      
      const result = promptService.validateMessages(messages);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid role');
    });

    it('should reject messages without content', () => {
      const messages = [
        { role: 'user' }
      ] as ChatMessage[];
      
      const result = promptService.validateMessages(messages);
      
      expect(result.valid).toBe(false);
    });

    it('should allow null content for assistant with tool_calls', () => {
      const messages: ChatMessage[] = [
        {
          role: 'assistant',
          content: null,
          tool_calls: [{
            id: '1',
            type: 'function',
            function: { name: 'test', arguments: '{}' }
          }]
        }
      ];
      
      const result = promptService.validateMessages(messages);
      
      expect(result.valid).toBe(true);
    });
  });

  describe('getContextWindow', () => {
    it('should return context window for known models', () => {
      expect(promptService.getContextWindow('gpt-4')).toBe(8192);
      expect(promptService.getContextWindow('gpt-4-turbo')).toBe(128000);
    });

    it('should return default for unknown models', () => {
      const window = promptService.getContextWindow('unknown-model');
      expect(window).toBe(8192);
    });
  });

  describe('getMaxOutputTokens', () => {
    it('should return max output tokens for known models', () => {
      expect(promptService.getMaxOutputTokens('gpt-4')).toBe(8192);
      expect(promptService.getMaxOutputTokens('gpt-3.5-turbo')).toBe(4096);
    });
  });
});

