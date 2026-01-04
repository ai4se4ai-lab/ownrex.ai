/**
 * Ownrex Endpoint Provider
 * Provides endpoint configuration for Ownrex.ai backend instead of GitHub Copilot
 */

import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { IConfigurationService } from '../../configuration/common/configurationService';
import { ILogService } from '../../log/common/logService';
import { createServiceIdentifier } from '../../../util/vs/platform/instantiation/common/instantiation';
import {
  IEndpointProvider,
  IChatEndpoint,
  IEmbeddingsEndpoint,
  ICompletionModelInformation,
  ChatEndpointFamily,
  EmbeddingsEndpointFamily,
  ModelSupportedEndpoint
} from '../common/endpointProvider';
import { TokenizerType } from '../../../util/tikTokenizer/tikTokenizer';

export interface IOwnrexEndpointProvider extends IEndpointProvider {
  getBackendUrl(): string;
}

export const IOwnrexEndpointProvider = createServiceIdentifier<IOwnrexEndpointProvider>('IOwnrexEndpointProvider');

/**
 * Chat endpoint implementation for Ownrex.ai backend
 */
class OwnrexChatEndpoint implements IChatEndpoint {
  readonly maxOutputTokens: number;
  readonly model: string;
  readonly supportsToolCalls: boolean = true;
  readonly supportsVision: boolean = false;
  readonly supportsPrediction: boolean = false;
  readonly showInModelPicker: boolean = true;
  readonly isDefault: boolean;
  readonly isFallback: boolean = false;
  readonly policy: 'enabled' | { terms: string } = 'enabled';
  readonly modelMaxPromptTokens: number;
  readonly urlOrRequestMetadata: string;
  readonly family: string;
  readonly tokenizer: TokenizerType = TokenizerType.O200K;
  readonly name: string;
  readonly version: string = '1.0';

  constructor(
    private readonly backendUrl: string,
    model: string,
    isDefault: boolean = true
  ) {
    this.model = model;
    this.isDefault = isDefault;
    this.name = model;
    this.family = this.getFamily(model);
    this.maxOutputTokens = this.getMaxOutputTokens(model);
    this.modelMaxPromptTokens = this.getContextWindow(model);
    this.urlOrRequestMetadata = `${backendUrl}/v1/chat/completions`;
  }

  private getFamily(model: string): string {
    if (model.startsWith('gpt-4')) return 'gpt-4';
    if (model.startsWith('gpt-3.5')) return 'gpt-3.5';
    return 'gpt-4';
  }

  private getMaxOutputTokens(model: string): number {
    if (model.includes('turbo')) return 4096;
    if (model.includes('gpt-4')) return 8192;
    return 4096;
  }

  private getContextWindow(model: string): number {
    if (model.includes('turbo') || model.includes('128k')) return 128000;
    if (model.includes('32k')) return 32768;
    if (model.includes('16k')) return 16384;
    if (model.includes('gpt-4')) return 8192;
    return 4096;
  }

  acquireTokenizer(): any {
    // Return tokenizer instance
    return null;
  }

  getExtraHeaders?(): Record<string, string> {
    return {};
  }

  async processResponseFromChatEndpoint(
    _telemetryService: any,
    _logService: any,
    response: Response,
    _expectedNumChoices: number,
    _finishCallback: any,
    _telemetryData: any,
    _cancellationToken?: any
  ): Promise<any> {
    // Process response from backend
    return response.json();
  }

  async acceptChatPolicy(): Promise<boolean> {
    return true;
  }

  async makeChatRequest(
    _debugName: string,
    _messages: any[],
    _finishedCb: any,
    _token: any,
    _location: any,
    _source?: any,
    _requestOptions?: any,
    _userInitiatedRequest?: boolean,
    _telemetryProperties?: any
  ): Promise<any> {
    // This will be handled by the fetcher
    throw new Error('makeChatRequest should be handled by ChatMLFetcher');
  }

  async makeChatRequest2(_options: any, _token: any): Promise<any> {
    throw new Error('makeChatRequest2 should be handled by ChatMLFetcher');
  }

  createRequestBody(_options: any): any {
    // Create request body for the endpoint
    return {};
  }
}

/**
 * Ownrex Endpoint Provider Implementation
 */
export class OwnrexEndpointProvider extends Disposable implements IOwnrexEndpointProvider {
  declare readonly _serviceBrand: undefined;

  private _cachedEndpoints: IChatEndpoint[] | null = null;

  constructor(
    @IConfigurationService private readonly configurationService: IConfigurationService,
    @ILogService private readonly logService: ILogService
  ) {
    super();
    this.logService.info('[OwnrexEndpointProvider] Initialized');
  }

  /**
   * Get the Ownrex backend URL from configuration
   */
  getBackendUrl(): string {
    const url = this.configurationService.getConfig<string>('ownrex.backendUrl' as any);
    if (url) {
      return url;
    }

    if (typeof process !== 'undefined' && process.env.OWNREX_BACKEND_URL) {
      return process.env.OWNREX_BACKEND_URL;
    }

    return 'http://localhost:8000';
  }

  /**
   * Get the default model from configuration
   */
  private getDefaultModel(): string {
    const model = this.configurationService.getConfig<string>('ownrex.defaultModel' as any);
    return model || 'gpt-4';
  }

  /**
   * Get all completion models
   */
  async getAllCompletionModels(_forceRefresh?: boolean): Promise<ICompletionModelInformation[]> {
    const backendUrl = this.getBackendUrl();
    
    // Return static list of supported models
    // In a real implementation, you might fetch this from the backend
    return [
      {
        id: 'gpt-3.5-turbo-instruct',
        model: 'gpt-3.5-turbo-instruct',
        name: 'GPT-3.5 Turbo Instruct',
        family: 'gpt-3.5',
        tokenizer: TokenizerType.O200K,
        version: '1',
        modelMaxPromptTokens: 4096,
        maxOutputTokens: 4096,
        urlOrRequestMetadata: `${backendUrl}/v1/completions`
      }
    ];
  }

  /**
   * Get all chat endpoints
   */
  async getAllChatEndpoints(): Promise<IChatEndpoint[]> {
    if (this._cachedEndpoints) {
      return this._cachedEndpoints;
    }

    const backendUrl = this.getBackendUrl();
    const defaultModel = this.getDefaultModel();

    // Create endpoints for supported models
    const models = [
      { id: 'gpt-4', isDefault: defaultModel === 'gpt-4' },
      { id: 'gpt-4-turbo', isDefault: defaultModel === 'gpt-4-turbo' },
      { id: 'gpt-3.5-turbo', isDefault: defaultModel === 'gpt-3.5-turbo' }
    ];

    this._cachedEndpoints = models.map(m => 
      new OwnrexChatEndpoint(backendUrl, m.id, m.isDefault)
    );

    return this._cachedEndpoints;
  }

  /**
   * Get a specific chat endpoint
   */
  async getChatEndpoint(
    requestOrFamily: any
  ): Promise<IChatEndpoint> {
    const endpoints = await this.getAllChatEndpoints();
    
    // If it's a string (family name), find matching endpoint
    if (typeof requestOrFamily === 'string') {
      const endpoint = endpoints.find(e => e.family === requestOrFamily || e.model === requestOrFamily);
      if (endpoint) {
        return endpoint;
      }
    }

    // If it's a request object, try to match the model
    if (requestOrFamily && typeof requestOrFamily === 'object') {
      const model = requestOrFamily.model || requestOrFamily.family;
      if (model) {
        const endpoint = endpoints.find(e => e.model === model || e.family === model);
        if (endpoint) {
          return endpoint;
        }
      }
    }

    // Return default endpoint
    const defaultEndpoint = endpoints.find(e => e.isDefault);
    return defaultEndpoint || endpoints[0];
  }

  /**
   * Get embeddings endpoint
   */
  async getEmbeddingsEndpoint(_family?: EmbeddingsEndpointFamily): Promise<IEmbeddingsEndpoint> {
    const backendUrl = this.getBackendUrl();
    
    return {
      url: `${backendUrl}/v1/embeddings`,
      model: 'text-embedding-3-small',
      family: 'text3small',
      modelMaxPromptTokens: 8191,
      urlOrRequestMetadata: `${backendUrl}/v1/embeddings`,
      tokenizer: TokenizerType.O200K,
      name: 'text-embedding-3-small',
      version: '1',
      acquireTokenizer: () => null
    };
  }

  override dispose(): void {
    this._cachedEndpoints = null;
    super.dispose();
  }
}

export default OwnrexEndpointProvider;

