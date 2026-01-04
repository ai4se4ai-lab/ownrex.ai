/**
 * OpenAI Service - Wrapper for OpenAI API interactions
 */

import OpenAI from 'openai';
import { Stream } from 'openai/streaming';
import { getConfig } from '../config';
import { getLogger } from '../utils/logger';
import { createErrorFromOpenAI } from '../utils/errors';
// import { generateCompletionId, getCurrentTimestamp } from '../utils/helpers';
import {
  ChatCompletionRequest,
  CompletionRequest,
  EmbeddingRequest
} from '../types/requests';
import {
  ChatCompletionResponse,
  CompletionResponse,
  EmbeddingResponse,
  ModelInfo,
  ModelsResponse
} from '../types/responses';
// import { getModelCapabilities } from '../types/openai';

const logger = getLogger();

export class OpenAIService {
  private client: OpenAI;
  private static instance: OpenAIService | null = null;

  constructor() {
    const config = getConfig();
    
    if (!config.openai.apiKey) {
      logger.warn('OpenAI API key is not configured');
    }

    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
      organization: config.openai.organization,
      baseURL: config.openai.baseURL,
      timeout: 120000, // 2 minutes
      maxRetries: 2
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  /**
   * Reset singleton instance (for testing)
   */
  public static resetInstance(): void {
    OpenAIService.instance = null;
  }

  /**
   * Create a chat completion
   */
  async createChatCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const config = getConfig();
    const model = request.model || config.models.defaultChat;

    try {
      logger.info(`Creating chat completion with model: ${model}`);

      const response = await this.client.chat.completions.create({
        model,
        messages: request.messages as OpenAI.ChatCompletionMessageParam[],
        temperature: request.temperature,
        top_p: request.top_p,
        n: request.n || 1,
        stream: false,
        stop: request.stop,
        max_tokens: request.max_tokens,
        presence_penalty: request.presence_penalty,
        frequency_penalty: request.frequency_penalty,
        logit_bias: request.logit_bias,
        user: request.user,
        tools: request.tools as OpenAI.ChatCompletionTool[],
        tool_choice: request.tool_choice as OpenAI.ChatCompletionToolChoiceOption,
        response_format: request.response_format,
        seed: request.seed
      });

      logger.info(`Chat completion successful, tokens used: ${response.usage?.total_tokens}`);

      return {
        id: response.id,
        object: 'chat.completion',
        created: response.created,
        model: response.model,
        choices: response.choices.map((choice, index) => ({
          index,
          message: {
            role: choice.message.role,
            content: choice.message.content,
            tool_calls: choice.message.tool_calls?.map(tc => ({
              id: tc.id,
              type: tc.type as 'function',
              function: {
                name: tc.function.name,
                arguments: tc.function.arguments
              }
            }))
          },
          logprobs: null,
          finish_reason: choice.finish_reason as any
        })),
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0
        },
        system_fingerprint: response.system_fingerprint || undefined
      };
    } catch (error) {
      logger.error('Chat completion failed', { error });
      throw createErrorFromOpenAI(error);
    }
  }

  /**
   * Create a streaming chat completion
   */
  async createChatCompletionStream(
    request: ChatCompletionRequest
  ): Promise<Stream<OpenAI.ChatCompletionChunk>> {
    const config = getConfig();
    const model = request.model || config.models.defaultChat;

    try {
      logger.info(`Creating streaming chat completion with model: ${model}`);

      const stream = await this.client.chat.completions.create({
        model,
        messages: request.messages as OpenAI.ChatCompletionMessageParam[],
        temperature: request.temperature,
        top_p: request.top_p,
        n: request.n || 1,
        stream: true,
        stop: request.stop,
        max_tokens: request.max_tokens,
        presence_penalty: request.presence_penalty,
        frequency_penalty: request.frequency_penalty,
        logit_bias: request.logit_bias,
        user: request.user,
        tools: request.tools as OpenAI.ChatCompletionTool[],
        tool_choice: request.tool_choice as OpenAI.ChatCompletionToolChoiceOption,
        response_format: request.response_format,
        seed: request.seed
      });

      return stream;
    } catch (error) {
      logger.error('Streaming chat completion failed', { error });
      throw createErrorFromOpenAI(error);
    }
  }

  /**
   * Create a code completion (legacy completions API)
   */
  async createCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const config = getConfig();
    const model = request.model || config.models.defaultCompletion;

    try {
      logger.info(`Creating completion with model: ${model}`);

      const response = await this.client.completions.create({
        model,
        prompt: request.prompt,
        suffix: request.suffix,
        max_tokens: request.max_tokens,
        temperature: request.temperature,
        top_p: request.top_p,
        n: request.n || 1,
        stream: false,
        logprobs: request.logprobs,
        echo: request.echo,
        stop: request.stop,
        presence_penalty: request.presence_penalty,
        frequency_penalty: request.frequency_penalty,
        best_of: request.best_of,
        logit_bias: request.logit_bias,
        user: request.user
      });

      logger.info(`Completion successful, tokens used: ${response.usage?.total_tokens}`);

      return {
        id: response.id,
        object: 'text_completion',
        created: response.created,
        model: response.model,
        choices: response.choices.map((choice, index) => ({
          text: choice.text,
          index,
          logprobs: null,
          finish_reason: choice.finish_reason as any
        })),
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      logger.error('Completion failed', { error });
      throw createErrorFromOpenAI(error);
    }
  }

  /**
   * Create a streaming completion
   */
  async createCompletionStream(
    request: CompletionRequest
  ): Promise<Stream<OpenAI.Completion>> {
    const config = getConfig();
    const model = request.model || config.models.defaultCompletion;

    try {
      logger.info(`Creating streaming completion with model: ${model}`);

      const stream = await this.client.completions.create({
        model,
        prompt: request.prompt,
        suffix: request.suffix,
        max_tokens: request.max_tokens,
        temperature: request.temperature,
        top_p: request.top_p,
        n: request.n || 1,
        stream: true,
        logprobs: request.logprobs,
        echo: request.echo,
        stop: request.stop,
        presence_penalty: request.presence_penalty,
        frequency_penalty: request.frequency_penalty,
        best_of: request.best_of,
        logit_bias: request.logit_bias,
        user: request.user
      });

      return stream;
    } catch (error) {
      logger.error('Streaming completion failed', { error });
      throw createErrorFromOpenAI(error);
    }
  }

  /**
   * Create embeddings
   */
  async createEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const config = getConfig();
    const model = request.model || config.models.defaultEmbedding;

    try {
      const inputCount = Array.isArray(request.input) ? request.input.length : 1;
      logger.info(`Creating embeddings with model: ${model}, inputs: ${inputCount}`);

      const response = await this.client.embeddings.create({
        model,
        input: request.input,
        encoding_format: request.encoding_format,
        dimensions: request.dimensions,
        user: request.user
      });

      logger.info(`Embeddings successful, tokens used: ${response.usage?.total_tokens}`);

      return {
        object: 'list',
        data: response.data.map((item, index) => ({
          object: 'embedding',
          embedding: item.embedding,
          index
        })),
        model: response.model,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0
        }
      };
    } catch (error) {
      logger.error('Embedding creation failed', { error });
      throw createErrorFromOpenAI(error);
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<ModelsResponse> {
    try {
      logger.info('Listing available models');

      const response = await this.client.models.list();
      
      const models: ModelInfo[] = [];
      for await (const model of response) {
        models.push({
          id: model.id,
          object: 'model',
          created: model.created,
          owned_by: model.owned_by
        });
      }

      logger.info(`Found ${models.length} models`);

      return {
        object: 'list',
        data: models
      };
    } catch (error) {
      logger.error('Model listing failed', { error });
      throw createErrorFromOpenAI(error);
    }
  }

  /**
   * Retrieve a specific model
   */
  async retrieveModel(modelId: string): Promise<ModelInfo> {
    try {
      logger.info(`Retrieving model: ${modelId}`);

      const model = await this.client.models.retrieve(modelId);

      return {
        id: model.id,
        object: 'model',
        created: model.created,
        owned_by: model.owned_by
      };
    } catch (error) {
      logger.error(`Model retrieval failed for: ${modelId}`, { error });
      throw createErrorFromOpenAI(error);
    }
  }

  /**
   * Check if API is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton
export const openaiService = OpenAIService.getInstance();

export default openaiService;

