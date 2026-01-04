/**
 * Ownrex Token Manager
 * Replaces GitHub-based authentication with simple API key authentication for Ownrex.ai backend
 */

import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { ICopilotTokenManager, CopilotToken, TokenInfo, TokenInfoOrError } from '../common/authentication';
import { IConfigurationService, ConfigKey } from '../../configuration/common/configurationService';
import { ILogService } from '../../log/common/logService';
import { createServiceIdentifier } from '../../../util/vs/platform/instantiation/common/instantiation';

export interface IOwnrexTokenManager {
  readonly _serviceBrand: undefined;
  getCopilotToken(force?: boolean): Promise<CopilotToken>;
  checkCopilotToken(): Promise<{ status: 'OK' } | { kind: 'failure'; reason: string }>;
  getBackendUrl(): string;
  getApiKey(): string;
}

export const IOwnrexTokenManager = createServiceIdentifier<IOwnrexTokenManager>('IOwnrexTokenManager');

/**
 * Ownrex Token Manager Implementation
 * Uses simple API key authentication instead of GitHub OAuth
 */
export class OwnrexTokenManager extends Disposable implements IOwnrexTokenManager {
  declare readonly _serviceBrand: undefined;

  private cachedToken: CopilotToken | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    @IConfigurationService private readonly configurationService: IConfigurationService,
    @ILogService private readonly logService: ILogService
  ) {
    super();
    this.logService.info('[OwnrexTokenManager] Initialized');
  }

  /**
   * Get the Ownrex backend URL from configuration
   */
  getBackendUrl(): string {
    // Try to get from Ownrex-specific config first
    const ownrexUrl = this.configurationService.getConfig<string>('ownrex.backendUrl' as any);
    if (ownrexUrl) {
      return ownrexUrl;
    }

    // Fall back to environment variable
    if (typeof process !== 'undefined' && process.env.OWNREX_BACKEND_URL) {
      return process.env.OWNREX_BACKEND_URL;
    }

    // Default to localhost
    return 'http://localhost:8000';
  }

  /**
   * Get the API key from configuration
   */
  getApiKey(): string {
    // Try to get from Ownrex-specific config first
    const apiKey = this.configurationService.getConfig<string>('ownrex.apiKey' as any);
    if (apiKey) {
      return apiKey;
    }

    // Fall back to environment variable
    if (typeof process !== 'undefined' && process.env.OWNREX_API_KEY) {
      return process.env.OWNREX_API_KEY;
    }

    // Default key for development
    return 'ownrex-default-key';
  }

  /**
   * Get a Copilot token (creates one from API key configuration)
   */
  async getCopilotToken(force?: boolean): Promise<CopilotToken> {
    const now = Date.now();

    // Return cached token if still valid and not forced refresh
    if (!force && this.cachedToken && this.tokenExpiresAt > now) {
      return this.cachedToken;
    }

    const apiKey = this.getApiKey();
    const backendUrl = this.getBackendUrl();

    this.logService.info(`[OwnrexTokenManager] Creating token for backend: ${backendUrl}`);

    // Create token info structure compatible with CopilotToken
    const tokenInfo: TokenInfo = {
      token: apiKey,
      expires_at: Math.floor((now + 86400000) / 1000), // 24 hours from now (Unix timestamp)
      refresh_in: 3600, // Refresh in 1 hour
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

    // Create and cache the token
    this.cachedToken = new CopilotToken(tokenInfo);
    this.tokenExpiresAt = now + 86400000; // Cache for 24 hours

    return this.cachedToken;
  }

  /**
   * Check if the token is valid
   */
  async checkCopilotToken(): Promise<{ status: 'OK' } | { kind: 'failure'; reason: string }> {
    try {
      const token = await this.getCopilotToken();
      
      if (!token.token) {
        return {
          kind: 'failure',
          reason: 'No API key configured'
        };
      }

      // Optionally verify by calling the backend health endpoint
      const backendUrl = this.getBackendUrl();
      try {
        const response = await fetch(`${backendUrl}/health`);
        if (response.ok) {
          return { status: 'OK' };
        }
        return {
          kind: 'failure',
          reason: `Backend health check failed: ${response.status}`
        };
      } catch (error) {
        // If health check fails, still return OK if we have a token
        // The backend might just not be running yet
        this.logService.warn(`[OwnrexTokenManager] Backend health check failed: ${error}`);
        return { status: 'OK' };
      }
    } catch (error) {
      return {
        kind: 'failure',
        reason: `Token check failed: ${error}`
      };
    }
  }

  /**
   * Dispose of resources
   */
  override dispose(): void {
    this.cachedToken = null;
    super.dispose();
  }
}

export default OwnrexTokenManager;

