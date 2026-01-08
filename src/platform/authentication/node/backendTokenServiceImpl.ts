/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { ILogService } from '../../log/common/logService';
import { IBackendTokenService, BackendTokenInfo, EndpointInfo } from '../common/backendTokenService';
import { TaskSingler } from '../../../util/common/taskSingler';

/**
 * Implementation of IBackendTokenService that fetches token info from the backend API
 */
export class BackendTokenServiceImpl extends Disposable implements IBackendTokenService {
	declare readonly _serviceBrand: undefined;

	private tokenCache: Map<string, { info: BackendTokenInfo; expiresAt: number }> = new Map();
	private readonly cacheTimeout = 600000; // 10 minutes cache (increased to reduce requests)
	private readonly taskSingler = new TaskSingler<BackendTokenInfo>();

	constructor(
		@ILogService private readonly logService: ILogService
	) {
		super();
		this.logService.info('[BackendTokenService] Initialized');
	}

	/**
	 * Sleep for a given number of milliseconds
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	/**
	 * Get complete token information from the backend with retry logic and rate limit handling
	 */
	async getTokenInfo(apiKey: string, backendUrl: string): Promise<BackendTokenInfo> {
		const cacheKey = `${backendUrl}:${apiKey}`;
		const cached = this.tokenCache.get(cacheKey);

		// Return cached token if still valid (even if expired by a few minutes to handle rate limits)
		const now = Date.now();
		if (cached) {
			// Use cached token if still valid, or if expired but less than 5 minutes ago (grace period for rate limits)
			const gracePeriod = 5 * 60 * 1000; // 5 minutes grace period
			if (cached.expiresAt > now || (cached.expiresAt + gracePeriod > now)) {
				this.logService.debug('[BackendTokenService] Returning cached token info');
				return cached.info;
			}
		}

		// Use TaskSingler to prevent concurrent requests for the same cache key
		return this.taskSingler.getOrCreate(cacheKey, async () => {
			const maxRetries = 3;
			const baseDelay = 1000; // 1 second base delay

			for (let attempt = 0; attempt <= maxRetries; attempt++) {
				try {
					const url = `${backendUrl}/v1/token`;
					if (attempt === 0) {
						this.logService.debug(`[BackendTokenService] Fetching token info from ${url}`);
					} else {
						this.logService.debug(`[BackendTokenService] Retry attempt ${attempt} for token info`);
					}

					const response = await fetch(url, {
						method: 'GET',
						headers: {
							'Authorization': `Bearer ${apiKey}`,
							'Content-Type': 'application/json'
						}
					});

					// Handle rate limit (429) with exponential backoff
					if (response.status === 429) {
						const errorText = await response.text().catch(() => 'Unknown error');
						const retryAfter = response.headers.get('Retry-After');
						const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * Math.pow(2, attempt);

						// Always try to use cached token if available (even if expired)
						if (cached) {
							this.logService.warn(`[BackendTokenService] Rate limited (429), using cached token. Retry after: ${retryAfterMs}ms`);
							return cached.info;
						}

						// If no cached token, check if we can retry
						if (attempt < maxRetries) {
							const delay = Math.min(retryAfterMs, 30000); // Cap at 30 seconds
							this.logService.warn(`[BackendTokenService] Rate limited (429), retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
							await this.sleep(delay);
							continue;
						} else {
							// Last attempt failed and no cached token - this is a critical error
							// But we should still try to create a minimal fallback token
							this.logService.error(`[BackendTokenService] Rate limited (429) after ${maxRetries + 1} attempts with no cached token available`);
							throw new Error(`Backend token endpoint returned 429: ${errorText}`);
						}
					}

					if (!response.ok) {
						const errorText = await response.text().catch(() => 'Unknown error');
						throw new Error(`Backend token endpoint returned ${response.status}: ${errorText}`);
					}

					const tokenInfo: BackendTokenInfo = await response.json();

					// Validate response structure
					if (!tokenInfo.token || !tokenInfo.endpoints || !tokenInfo.endpoints.api) {
						throw new Error('Invalid token info response from backend');
					}

					// Cache the token info
					const expiresAt = now + this.cacheTimeout;
					this.tokenCache.set(cacheKey, { info: tokenInfo, expiresAt });

					this.logService.info('[BackendTokenService] Token info fetched successfully');
					return tokenInfo;
				} catch (error) {
					// Check if this is a rate limit error that we should handle
					const isRateLimitError = error instanceof Error && error.message.includes('429');

					// If it's the last attempt, try to use cached token or throw
					if (attempt === maxRetries) {
						// Always try to use cached token as fallback if available
						if (cached) {
							this.logService.warn(`[BackendTokenService] Failed to fetch token after ${maxRetries + 1} attempts, using cached token: ${error}`);
							return cached.info;
						}

						// For rate limit errors, log more details
						if (isRateLimitError) {
							this.logService.error(`[BackendTokenService] Rate limited after ${maxRetries + 1} attempts with no cached token. Extension may not work until rate limit resets.`);
						} else {
							this.logService.error(`[BackendTokenService] Failed to fetch token info after ${maxRetries + 1} attempts: ${error}`);
						}
						throw error;
					}

					// For rate limit errors, use longer backoff
					if (isRateLimitError) {
						const delay = Math.min(baseDelay * Math.pow(2, attempt + 1), 30000); // Longer delay for rate limits
						this.logService.warn(`[BackendTokenService] Rate limited, retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries}): ${error}`);
						await this.sleep(delay);
					} else {
						// For non-429 errors, retry with exponential backoff
						const delay = baseDelay * Math.pow(2, attempt);
						this.logService.warn(`[BackendTokenService] Request failed, retrying after ${delay}ms (attempt ${attempt + 1}/${maxRetries}): ${error}`);
						await this.sleep(delay);
					}
				}
			}

			// This should never be reached, but TypeScript needs it
			throw new Error('Failed to fetch token info after all retries');
		});
	}

	/**
	 * Get endpoint information from the backend
	 */
	async getEndpoints(apiKey: string, backendUrl: string): Promise<EndpointInfo> {
		const tokenInfo = await this.getTokenInfo(apiKey, backendUrl);
		return tokenInfo.endpoints;
	}

	/**
	 * Check if chat is enabled for the given API key
	 */
	async isChatEnabled(apiKey: string, backendUrl: string): Promise<boolean> {
		try {
			const tokenInfo = await this.getTokenInfo(apiKey, backendUrl);
			return tokenInfo.chat_enabled ?? false;
		} catch (error) {
			this.logService.warn(`[BackendTokenService] Failed to check chat enabled status: ${error}`);
			return false;
		}
	}

	/**
	 * Clear the token cache (useful for testing or when token changes)
	 */
	clearCache(): void {
		this.tokenCache.clear();
		this.logService.debug('[BackendTokenService] Cache cleared');
	}

	override dispose(): void {
		this.tokenCache.clear();
		super.dispose();
	}
}

export default BackendTokenServiceImpl;

