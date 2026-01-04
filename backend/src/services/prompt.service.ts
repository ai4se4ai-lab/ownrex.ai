/**
 * Prompt Engineering Service
 * Handles system prompts, context management, and message formatting
 */

import { getLogger } from '../utils/logger';
import { ChatMessage } from '../types/requests';
import { getModelCapabilities } from '../types/openai';
// import { DEFAULTS } from '../config/constants';

const logger = getLogger();

export interface PromptContext {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export class PromptService {
  private static instance: PromptService | null = null;

  // Default system prompts for different use cases
  private readonly systemPrompts = {
    default: `You are Ownrex.ai, an advanced AI programming assistant. You help developers write, understand, and improve code. You provide clear, accurate, and helpful responses.

Key guidelines:
- Write clean, efficient, and well-documented code
- Explain your reasoning when helpful
- Suggest best practices and improvements
- Be concise but thorough
- If you're unsure, say so`,

    codeGeneration: `You are Ownrex.ai, an expert code generator. Generate high-quality, production-ready code based on user requirements.

Guidelines:
- Follow language-specific best practices and conventions
- Include appropriate error handling
- Add helpful comments for complex logic
- Consider edge cases
- Optimize for readability and maintainability`,

    codeReview: `You are Ownrex.ai, an expert code reviewer. Analyze code for potential issues and suggest improvements.

Review criteria:
- Correctness and potential bugs
- Performance implications
- Security vulnerabilities
- Code style and consistency
- Best practices adherence
- Maintainability concerns`,

    debugging: `You are Ownrex.ai, an expert debugger. Help identify and fix issues in code.

Approach:
- Analyze the error message and stack trace
- Identify the root cause
- Suggest specific fixes with code examples
- Explain why the issue occurred
- Suggest preventive measures`,

    explanation: `You are Ownrex.ai, an expert code explainer. Help users understand code and programming concepts.

Approach:
- Break down complex code into understandable parts
- Use analogies when helpful
- Provide examples to illustrate concepts
- Link to relevant documentation when appropriate
- Adjust explanation depth based on context`
  };

  /**
   * Get singleton instance
   */
  public static getInstance(): PromptService {
    if (!PromptService.instance) {
      PromptService.instance = new PromptService();
    }
    return PromptService.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static resetInstance(): void {
    PromptService.instance = null;
  }

  /**
   * Get system prompt by type
   */
  getSystemPrompt(type: keyof typeof this.systemPrompts = 'default'): string {
    return this.systemPrompts[type] || this.systemPrompts.default;
  }

  /**
   * Enhance messages with system prompt if not present
   */
  enhanceMessages(
    messages: ChatMessage[],
    context?: PromptContext
  ): ChatMessage[] {
    const enhanced = [...messages];

    // Check if system message already exists
    const hasSystemMessage = enhanced.some(m => m.role === 'system');

    if (!hasSystemMessage && context?.systemPrompt !== '') {
      const systemPrompt = context?.systemPrompt || this.systemPrompts.default;
      enhanced.unshift({
        role: 'system',
        content: systemPrompt
      });
    }

    return enhanced;
  }

  /**
   * Estimate token count for messages (rough approximation)
   * More accurate counting would require tiktoken or similar
   */
  estimateTokenCount(messages: ChatMessage[]): number {
    let totalChars = 0;

    for (const message of messages) {
      if (message.content) {
        totalChars += message.content.length;
      }
      if (message.function_call) {
        totalChars += JSON.stringify(message.function_call).length;
      }
      if (message.tool_calls) {
        totalChars += JSON.stringify(message.tool_calls).length;
      }
      // Add overhead for role and formatting
      totalChars += 10;
    }

    // Rough estimate: ~4 characters per token
    return Math.ceil(totalChars / 4);
  }

  /**
   * Truncate messages to fit within context window
   */
  truncateMessages(
    messages: ChatMessage[],
    maxTokens: number,
    preserveSystemPrompt: boolean = true
  ): ChatMessage[] {
    const estimatedTokens = this.estimateTokenCount(messages);

    if (estimatedTokens <= maxTokens) {
      return messages;
    }

    logger.info(`Truncating messages from ${estimatedTokens} to ${maxTokens} tokens`);

    const result: ChatMessage[] = [];
    let currentTokens = 0;

    // Preserve system message if requested
    if (preserveSystemPrompt && messages[0]?.role === 'system') {
      result.push(messages[0]);
      currentTokens += this.estimateTokenCount([messages[0]]);
    }

    // Add messages from the end (most recent) until we hit the limit
    const startIndex = preserveSystemPrompt && messages[0]?.role === 'system' ? 1 : 0;
    const remainingMessages = messages.slice(startIndex).reverse();

    for (const message of remainingMessages) {
      const messageTokens = this.estimateTokenCount([message]);
      if (currentTokens + messageTokens <= maxTokens) {
        result.splice(preserveSystemPrompt ? 1 : 0, 0, message);
        currentTokens += messageTokens;
      } else {
        break;
      }
    }

    // Reverse back to correct order
    if (preserveSystemPrompt && result.length > 1) {
      const system = result.shift()!;
      result.reverse();
      result.unshift(system);
    } else {
      result.reverse();
    }

    return result;
  }

  /**
   * Format messages for specific use case
   */
  formatForUseCase(
    messages: ChatMessage[],
    useCase: 'chat' | 'completion' | 'code_generation' | 'code_review'
  ): ChatMessage[] {
    const formatted = [...messages];

    // Add use-case specific system prompt if not present
    if (!formatted.some(m => m.role === 'system')) {
      switch (useCase) {
        case 'code_generation':
          formatted.unshift({
            role: 'system',
            content: this.systemPrompts.codeGeneration
          });
          break;
        case 'code_review':
          formatted.unshift({
            role: 'system',
            content: this.systemPrompts.codeReview
          });
          break;
        default:
          formatted.unshift({
            role: 'system',
            content: this.systemPrompts.default
          });
      }
    }

    return formatted;
  }

  /**
   * Validate messages structure
   */
  validateMessages(messages: ChatMessage[]): { valid: boolean; error?: string } {
    if (!Array.isArray(messages) || messages.length === 0) {
      return { valid: false, error: 'Messages must be a non-empty array' };
    }

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];

      if (!message.role) {
        return { valid: false, error: `Message at index ${i} is missing role` };
      }

      if (!['system', 'user', 'assistant', 'function', 'tool'].includes(message.role)) {
        return { valid: false, error: `Invalid role at index ${i}: ${message.role}` };
      }

      // Content can be null for assistant messages with tool_calls
      if (message.content === undefined && !message.tool_calls && !message.function_call) {
        return { valid: false, error: `Message at index ${i} has no content` };
      }
    }

    return { valid: true };
  }

  /**
   * Get context window size for model
   */
  getContextWindow(model: string): number {
    const capabilities = getModelCapabilities(model);
    return capabilities.contextWindow;
  }

  /**
   * Get max output tokens for model
   */
  getMaxOutputTokens(model: string): number {
    const capabilities = getModelCapabilities(model);
    return capabilities.maxTokens;
  }
}

// Export singleton
export const promptService = PromptService.getInstance();

export default promptService;

