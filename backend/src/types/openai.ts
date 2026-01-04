/**
 * OpenAI-specific types and interfaces
 */

export type OpenAIModel = 
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4-turbo-preview'
  | 'gpt-4-0125-preview'
  | 'gpt-4-1106-preview'
  | 'gpt-4-vision-preview'
  | 'gpt-4-32k'
  | 'gpt-3.5-turbo'
  | 'gpt-3.5-turbo-16k'
  | 'gpt-3.5-turbo-instruct'
  | 'text-embedding-3-small'
  | 'text-embedding-3-large'
  | 'text-embedding-ada-002';

export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseURL: string;
}

export interface ModelCapabilities {
  supportsVision: boolean;
  supportsTools: boolean;
  supportsStreaming: boolean;
  maxTokens: number;
  contextWindow: number;
}

export const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  'gpt-4': {
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    maxTokens: 8192,
    contextWindow: 8192
  },
  'gpt-4-turbo': {
    supportsVision: true,
    supportsTools: true,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 128000
  },
  'gpt-4-turbo-preview': {
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 128000
  },
  'gpt-4-vision-preview': {
    supportsVision: true,
    supportsTools: false,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 128000
  },
  'gpt-3.5-turbo': {
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 16385
  },
  'gpt-3.5-turbo-16k': {
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 16385
  },
  'gpt-3.5-turbo-instruct': {
    supportsVision: false,
    supportsTools: false,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 4096
  },
  'text-embedding-3-small': {
    supportsVision: false,
    supportsTools: false,
    supportsStreaming: false,
    maxTokens: 0,
    contextWindow: 8191
  },
  'text-embedding-3-large': {
    supportsVision: false,
    supportsTools: false,
    supportsStreaming: false,
    maxTokens: 0,
    contextWindow: 8191
  },
  'text-embedding-ada-002': {
    supportsVision: false,
    supportsTools: false,
    supportsStreaming: false,
    maxTokens: 0,
    contextWindow: 8191
  }
};

export function getModelCapabilities(model: string): ModelCapabilities {
  return MODEL_CAPABILITIES[model] || {
    supportsVision: false,
    supportsTools: true,
    supportsStreaming: true,
    maxTokens: 4096,
    contextWindow: 8192
  };
}

