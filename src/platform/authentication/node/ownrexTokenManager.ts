/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { Emitter, Event } from '../../../util/vs/base/common/event';
import { ICopilotTokenManager } from '../common/copilotTokenManager';
import { IConfigurationService } from '../../configuration/common/configurationService';
import { ILogService } from '../../log/common/logService';
import { IBackendTokenService, BackendTokenInfo } from '../common/backendTokenService';
import { createServiceIdentifier } from '../../../util/common/services';

export interface IOwnrexTokenManager extends ICopilotTokenManager {
	getBackendUrl(): string;
	getApiKey(): string;
	getBackendTokenInfo(force?: boolean): Promise<BackendTokenInfo>;
	checkCopilotToken(): Promise<{ status: 'OK' } | { kind: 'failure'; reason: string }>;
}

export const IOwnrexTokenManager = createServiceIdentifier<IOwnrexTokenManager>('IOwnrexTokenManager');

/**
 * Ownrex Token Manager Implementation
 * Fetches token information from the backend API
 */
export class OwnrexTokenManager extends Disposable implements IOwnrexTokenManager {
	declare readonly _serviceBrand: undefined;

	private readonly _onDidCopilotTokenRefresh = this._register(new Emitter<void>());
	readonly onDidCopilotTokenRefresh: Event<void> = this._onDidCopilotTokenRefresh.event;

	private cachedTokenInfo: BackendTokenInfo | null = null;
	private tokenExpiresAt: number = 0; // Unix timestamp in seconds

	constructor(
		@IConfigurationService private readonly configurationService: IConfigurationService,
		@ILogService private readonly logService: ILogService,
		@IBackendTokenService private readonly backendTokenService: IBackendTokenService
	) {
		super();
		this.logService.info('[OwnrexTokenManager] Initialized - using Ownrex.ai backend API');
	}

	/**
	 * Get the Ownrex backend URL from configuration
	 */
	getBackendUrl(): string {
		// Try to get from Ownrex-specific config first
		const ownrexUrl = this.configurationService.getConfig<string>('ownrex.backendUrl' as unknown);
		if (ownrexUrl) {
			// Validate and sanitize URL
			const sanitized = this._sanitizeUrl(ownrexUrl);
			if (sanitized) {
				return sanitized;
			}
			this.logService.warn(`[OwnrexTokenManager] Invalid backend URL in config: ${ownrexUrl}, using default`);
		}

		// Fall back to environment variable
		if (typeof process !== 'undefined' && process.env.OWNREX_BACKEND_URL) {
			const sanitized = this._sanitizeUrl(process.env.OWNREX_BACKEND_URL);
			if (sanitized) {
				return sanitized;
			}
			this.logService.warn(`[OwnrexTokenManager] Invalid backend URL in env: ${process.env.OWNREX_BACKEND_URL}, using default`);
		}

		// Default to localhost
		return 'http://localhost:8000';
	}

	/**
	 * Sanitize and validate a URL string
	 */
	private _sanitizeUrl(url: string | undefined): string | undefined {
		if (!url || typeof url !== 'string') {
			return undefined;
		}

		// Trim whitespace
		url = url.trim();

		// Remove any invalid characters that could cause URI parsing errors
		// Ensure it starts with http:// or https://
		if (!/^https?:\/\//i.test(url)) {
			// If it doesn't start with http:// or https://, try to fix it
			if (url.startsWith('//')) {
				url = 'http:' + url;
			} else if (!url.includes('://')) {
				// Assume http:// if no scheme
				url = 'http://' + url;
			} else {
				// Invalid scheme, return undefined
				return undefined;
			}
		}

		// Remove trailing slash for consistency
		url = url.replace(/\/$/, '');

		// Basic validation - check for invalid characters in scheme
		try {
			// Try to create a URL object to validate
			new URL(url);
			return url;
		} catch (e) {
			this.logService.warn(`[OwnrexTokenManager] URL validation failed: ${url}`, e);
			return undefined;
		}
	}

	/**
	 * Get the API key from configuration
	 */
	getApiKey(): string {
		// Try to get from Ownrex-specific config first
		const apiKey = this.configurationService.getConfig<string>('ownrex.apiKey' as unknown);
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
	 * Get backend token information from the backend API
	 */
	async getBackendTokenInfo(force?: boolean): Promise<BackendTokenInfo> {
		const now = Math.floor(Date.now() / 1000); // Current time in seconds

		// Return cached token if still valid and not forced refresh
		if (!force && this.cachedTokenInfo && this.tokenExpiresAt > now) {
			this.logService.debug('[OwnrexTokenManager] Returning cached token info');
			return this.cachedTokenInfo;
		}

		const apiKey = this.getApiKey();
		const backendUrl = this.getBackendUrl();

		this.logService.info(`[OwnrexTokenManager] Fetching token info from backend: ${backendUrl}`);

		try {
			// Fetch token info from backend
			const tokenInfo = await this.backendTokenService.getTokenInfo(apiKey, backendUrl);

			// Cache the token info
			this.cachedTokenInfo = tokenInfo;
			// Use expires_at from backend, or default to 24 hours
			this.tokenExpiresAt = tokenInfo.expires_at || (now + 86400);

			this.logService.info('[OwnrexTokenManager] Token info fetched and cached successfully');
			return tokenInfo;
		} catch (error) {
			this.logService.error(`[OwnrexTokenManager] Failed to fetch token info: ${error}`);
			throw error;
		}
	}

	/**
	 * Get a Copilot token (for compatibility - creates adapter from BackendTokenInfo)
	 * @deprecated Use getBackendTokenInfo() instead
	 */
	async getCopilotToken(force?: boolean): Promise<unknown> {
		// For now, return BackendTokenInfo as CopilotToken for compatibility
		// This will be removed in later phases
		const tokenInfo = await this.getBackendTokenInfo(force);

		// Create a minimal adapter object that provides the same interface
		// This is a temporary compatibility layer
		return {
			token: tokenInfo.token,
			endpoints: tokenInfo.endpoints,
			sku: tokenInfo.sku,
			chat_enabled: tokenInfo.chat_enabled,
			code_quote_enabled: tokenInfo.code_quote_enabled,
			copilotignore_enabled: tokenInfo.copilotignore_enabled,
			individual: tokenInfo.individual,
			isChatEnabled: () => tokenInfo.chat_enabled,
			expires_at: tokenInfo.expires_at
		};
	}

	/**
	 * Check if the token is valid
	 */
	async checkCopilotToken(): Promise<{ status: 'OK' } | { kind: 'failure'; reason: string }> {
		try {
			const apiKey = this.getApiKey();

			if (!apiKey || apiKey === 'ownrex-default-key') {
				return {
					kind: 'failure',
					reason: 'No API key configured'
				};
			}

			// Try to fetch token info from backend
			try {
				await this.getBackendTokenInfo();
				return { status: 'OK' };
			} catch (error) {
				// If token fetch fails, try health endpoint as fallback
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
				} catch (healthError) {
					this.logService.warn(`[OwnrexTokenManager] Backend health check failed: ${healthError}`);
					return {
						kind: 'failure',
						reason: `Cannot connect to backend: ${error}`
					};
				}
			}
		} catch (error) {
			return {
				kind: 'failure',
				reason: `Token check failed: ${error}`
			};
		}
	}

	/**
	 * Reset the token (e.g., after HTTP error)
	 */
	resetCopilotToken(_httpError?: number): void {
		this.cachedTokenInfo = null;
		this.tokenExpiresAt = 0;
		// Clear backend service cache if available
		if ('clearCache' in this.backendTokenService && typeof (this.backendTokenService as unknown).clearCache === 'function') {
			(this.backendTokenService as unknown).clearCache();
		}
		this._onDidCopilotTokenRefresh.fire();
		this.logService.info('[OwnrexTokenManager] Token reset');
	}

	/**
	 * Dispose of resources
	 */
	override dispose(): void {
		this.cachedTokenInfo = null;
		super.dispose();
	}
}

export default OwnrexTokenManager;
