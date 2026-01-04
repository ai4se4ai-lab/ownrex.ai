/**
 * Ownrex Authentication Service
 * Provides authentication for Ownrex.ai backend without GitHub dependency
 */

import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { ILogService } from '../../log/common/logService';
import { IConfigurationService } from '../../configuration/common/configurationService';
import { Event, Emitter } from '../../../util/vs/base/common/event';
import { createServiceIdentifier } from '../../../util/vs/platform/instantiation/common/instantiation';
import { CopilotToken, TokenInfo } from '../common/authentication';

export interface OwnrexAuthSession {
  readonly accessToken: string;
  readonly account: {
    id: string;
    label: string;
  };
  readonly scopes: string[];
}

export interface IOwnrexAuthService {
  readonly _serviceBrand: undefined;
  
  /**
   * Event fired when authentication status changes
   */
  readonly onDidChangeSession: Event<OwnrexAuthSession | undefined>;
  
  /**
   * Get the current session
   */
  getSession(silent?: boolean): Promise<OwnrexAuthSession | undefined>;
  
  /**
   * Get a Copilot token for API calls
   */
  getCopilotToken(force?: boolean): Promise<CopilotToken>;
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean;
  
  /**
   * Sign out
   */
  signOut(): Promise<void>;
}

export const IOwnrexAuthService = createServiceIdentifier<IOwnrexAuthService>('IOwnrexAuthService');

/**
 * Ownrex Authentication Service Implementation
 * Uses API key-based authentication for Ownrex.ai backend
 */
export class OwnrexAuthService extends Disposable implements IOwnrexAuthService {
  declare readonly _serviceBrand: undefined;

  private _session: OwnrexAuthSession | undefined;
  private _onDidChangeSession = this._register(new Emitter<OwnrexAuthSession | undefined>());
  readonly onDidChangeSession = this._onDidChangeSession.event;

  private cachedToken: CopilotToken | null = null;

  constructor(
    @IConfigurationService private readonly configurationService: IConfigurationService,
    @ILogService private readonly logService: ILogService
  ) {
    super();
    this.initializeSession();
    this.logService.info('[OwnrexAuthService] Initialized');
  }

  /**
   * Initialize the session from configuration
   */
  private initializeSession(): void {
    const apiKey = this.getApiKey();
    
    if (apiKey && apiKey !== 'ownrex-default-key') {
      this._session = {
        accessToken: apiKey,
        account: {
          id: 'ownrex-user',
          label: 'Ownrex.ai User'
        },
        scopes: ['chat', 'completions', 'embeddings']
      };
      this.logService.info('[OwnrexAuthService] Session initialized with configured API key');
    } else {
      // Create a default session for development
      this._session = {
        accessToken: 'ownrex-default-key',
        account: {
          id: 'ownrex-dev',
          label: 'Ownrex.ai Developer'
        },
        scopes: ['chat', 'completions', 'embeddings']
      };
      this.logService.info('[OwnrexAuthService] Session initialized with default key (development mode)');
    }
  }

  /**
   * Get API key from configuration
   */
  private getApiKey(): string {
    const apiKey = this.configurationService.getConfig<string>('ownrex.apiKey' as any);
    if (apiKey) {
      return apiKey;
    }

    if (typeof process !== 'undefined' && process.env.OWNREX_API_KEY) {
      return process.env.OWNREX_API_KEY;
    }

    return 'ownrex-default-key';
  }

  /**
   * Get backend URL from configuration
   */
  private getBackendUrl(): string {
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
   * Get current session
   */
  async getSession(silent?: boolean): Promise<OwnrexAuthSession | undefined> {
    if (!this._session) {
      this.initializeSession();
    }
    return this._session;
  }

  /**
   * Get a Copilot token for API calls
   */
  async getCopilotToken(force?: boolean): Promise<CopilotToken> {
    if (!force && this.cachedToken) {
      return this.cachedToken;
    }

    const apiKey = this.getApiKey();
    const backendUrl = this.getBackendUrl();

    const tokenInfo: TokenInfo = {
      token: apiKey,
      expires_at: Math.floor((Date.now() + 86400000) / 1000),
      refresh_in: 3600,
      endpoints: {
        api: backendUrl,
        proxy: backendUrl,
        telemetry: backendUrl,
        'origin-tracker': backendUrl
      },
      sku: 'ownrex_free',
      tracking_id: `ownrex_${Date.now()}`,
      annotations_enabled: false,
      chat_enabled: true,
      codesearch: false,
      code_quote_enabled: false,
      copilotignore_enabled: false,
      individual: true,
      intellij_editor_fetcher: false,
      limited_user_quotas: undefined,
      organization_list: [],
      prompt_8k: true,
      public_suggestions: 'disabled',
      snippy_load_test_enabled: false,
      telemetry: 'disabled',
      vsc_electron_fetcher: true,
      vsc_panel: true
    };

    this.cachedToken = new CopilotToken(tokenInfo);
    return this.cachedToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this._session;
  }

  /**
   * Sign out (clears session)
   */
  async signOut(): Promise<void> {
    this._session = undefined;
    this.cachedToken = null;
    this._onDidChangeSession.fire(undefined);
    this.logService.info('[OwnrexAuthService] Signed out');
  }

  override dispose(): void {
    this._session = undefined;
    this.cachedToken = null;
    super.dispose();
  }
}

export default OwnrexAuthService;

