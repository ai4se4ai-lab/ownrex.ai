/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { window, type AuthenticationGetSessionOptions, type AuthenticationGetSessionPresentationOptions, type AuthenticationSession } from 'vscode';
import { IConfigurationService } from '../../configuration/common/configurationService';
import { ILogService } from '../../log/common/logService';
import { BaseAuthenticationService, IAuthenticationService } from '../common/authentication';
import { CopilotToken, TokenInfo } from '../common/copilotToken';
import { ICopilotTokenManager } from '../common/copilotTokenManager';
import { ICopilotTokenStore } from '../common/copilotTokenStore';
import { IOwnrexTokenManager } from '../node/ownrexTokenManager';
import { BackendTokenInfo } from '../common/backendTokenService';

/**
 * Mock authentication session for Ownrex.ai
 * Provides a VSCode AuthenticationSession-compatible interface
 */
class OwnrexAuthSession implements AuthenticationSession {
	readonly id: string;
	readonly accessToken: string;
	readonly account: { id: string; label: string };
	readonly scopes: readonly string[];

	constructor(apiKey: string) {
		this.id = 'ownrex-session';
		this.accessToken = apiKey;
		this.account = {
			id: 'ownrex-user',
			label: 'Ownrex.ai User'
		};
		this.scopes = ['chat', 'completions', 'embeddings'];
	}
}

/**
 * Ownrex Authentication Service Implementation
 * Extends BaseAuthenticationService for better compatibility with the rest of the system
 */
export class OwnrexAuthenticationService extends BaseAuthenticationService implements IAuthenticationService {

	private ownrexTokenManager: IOwnrexTokenManager | undefined;

	constructor(
		@ILogService logService: ILogService,
		@ICopilotTokenStore tokenStore: ICopilotTokenStore,
		@ICopilotTokenManager tokenManager: ICopilotTokenManager,
		@IConfigurationService configurationService: IConfigurationService,
	) {
		super(logService, tokenStore, tokenManager, configurationService);
		this._logService.info('[OwnrexAuthenticationService] Initialized - using Ownrex.ai backend');

		// Check if tokenManager is OwnrexTokenManager
		if ('getBackendTokenInfo' in tokenManager) {
			this.ownrexTokenManager = tokenManager as IOwnrexTokenManager;
		}

		this._initializeSession();

		// Pre-populate the token and fire the auth change event to unblock activation
		// This runs asynchronously but will trigger the activation blocker to complete
		void this._initializeToken();
	}

	/**
	 * Initialize the token asynchronously to unblock activation
	 */
	private async _initializeToken(): Promise<void> {
		try {
			await this.getCopilotToken();
			this._logService.info('[OwnrexAuthenticationService] Token initialized, firing auth change event');
			this._onDidAuthenticationChange.fire();
		} catch (error) {
			this._logService.error('[OwnrexAuthenticationService] Failed to initialize token', error);
			// Still fire the event so activation doesn't block forever
			this._onDidAuthenticationChange.fire();
		}
	}

	/**
	 * Convert BackendTokenInfo to CopilotToken for compatibility
	 */
	private _backendTokenInfoToCopilotToken(tokenInfo: BackendTokenInfo): CopilotToken {
		// Create a TokenInfo structure compatible with CopilotToken
		const tokenInfoAdapter: TokenInfo = {
			token: tokenInfo.token,
			expires_at: tokenInfo.expires_at,
			refresh_in: tokenInfo.refresh_in,
			endpoints: tokenInfo.endpoints,
			sku: tokenInfo.sku,
			tracking_id: `ownrex_${Date.now()}`,
			annotations_enabled: false,
			chat_enabled: tokenInfo.chat_enabled,
			codesearch: false,
			code_quote_enabled: tokenInfo.code_quote_enabled,
			copilotignore_enabled: tokenInfo.copilotignore_enabled,
			individual: tokenInfo.individual,
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
		return new CopilotToken(tokenInfoAdapter);
	}

	/**
	 * Get Copilot token - uses backend token service if available
	 */
	async getCopilotToken(force?: boolean): Promise<CopilotToken> {
		// If we have OwnrexTokenManager, use it to get BackendTokenInfo
		if (this.ownrexTokenManager) {
			try {
				const backendTokenInfo = await this.ownrexTokenManager.getBackendTokenInfo(force);
				const copilotToken = this._backendTokenInfoToCopilotToken(backendTokenInfo);
				// Store in token store for compatibility
				this._tokenStore.copilotToken = copilotToken;
				this._logService.info(`[OwnrexAuthenticationService] Token set with endpoints:`, {
					api: copilotToken.endpoints?.api,
					proxy: copilotToken.endpoints?.proxy,
					telemetry: copilotToken.endpoints?.telemetry
				});
				return copilotToken;
			} catch (error) {
				this._logService.error('[OwnrexAuthenticationService] Failed to get backend token info', error);
				throw error;
			}
		}

		// Fallback to base implementation
		return super.getCopilotToken(force);
	}

	/**
	 * Initialize the session from configuration
	 */
	private _initializeSession(): void {
		const apiKey = this._getApiKey();
		if (apiKey) {
			const session = new OwnrexAuthSession(apiKey);
			this._anyGitHubSession = session;
			this._permissiveGitHubSession = session;
			this._logService.info('[OwnrexAuthenticationService] Session initialized with API key');
		} else {
			// Create a default session for development
			const defaultSession = new OwnrexAuthSession('ownrex-default-key');
			this._anyGitHubSession = defaultSession;
			this._permissiveGitHubSession = defaultSession;
			this._logService.info('[OwnrexAuthenticationService] Session initialized with default key');
		}
	}

	/**
	 * Get API key from configuration or environment
	 */
	private _getApiKey(): string {
		// Try VSCode settings
		const configKey = this._configurationService.getConfig<string>('ownrex.apiKey' as unknown);
		if (configKey) {
			return configKey;
		}

		// Try environment variable
		if (typeof process !== 'undefined' && process.env.OWNREX_API_KEY) {
			return process.env.OWNREX_API_KEY;
		}

		// Default key for development
		return 'ownrex-default-key';
	}

	/**
	 * Get GitHub session - returns Ownrex session for compatibility
	 */
	async getGitHubSession(
		_kind: 'permissive' | 'any',
		options: AuthenticationGetSessionOptions & { createIfNone?: boolean | AuthenticationGetSessionPresentationOptions; forceNewSession?: boolean | AuthenticationGetSessionPresentationOptions }
	): Promise<AuthenticationSession | undefined> {
		// If we don't have a session and createIfNone is true, prompt for API key
		if (!this._anyGitHubSession && options?.createIfNone) {
			await this._promptForApiKey();
		}
		return this._anyGitHubSession;
	}

	/**
	 * Prompt user for API key
	 */
	private async _promptForApiKey(): Promise<void> {
		const apiKey = await window.showInputBox({
			prompt: 'Enter your Ownrex.ai API Key',
			placeHolder: 'Your API key from Ownrex.ai backend',
			password: true,
			ignoreFocusOut: true
		});

		if (apiKey) {
			const session = new OwnrexAuthSession(apiKey);
			this._anyGitHubSession = session;
			this._permissiveGitHubSession = session;
			this._onDidAuthenticationChange.fire();
			this._logService.info('[OwnrexAuthenticationService] API key set by user');
		}
	}

	/**
	 * Get any ADO session (not used with Ownrex)
	 */
	protected async getAnyAdoSession(_options?: AuthenticationGetSessionOptions): Promise<AuthenticationSession | undefined> {
		return undefined;
	}

	/**
	 * Get ADO access token (not used with Ownrex)
	 */
	async getAdoAccessTokenBase64(_options?: AuthenticationGetSessionOptions): Promise<string | undefined> {
		return undefined;
	}
}

export default OwnrexAuthenticationService;
