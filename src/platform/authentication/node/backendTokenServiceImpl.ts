/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Disposable } from '../../../util/vs/base/common/lifecycle';
import { ILogService } from '../../log/common/logService';
import { IBackendTokenService, BackendTokenInfo, EndpointInfo } from '../common/backendTokenService';

/**
 * Implementation of IBackendTokenService that fetches token info from the backend API
 */
export class BackendTokenServiceImpl extends Disposable implements IBackendTokenService {
	declare readonly _serviceBrand: undefined;

	private tokenCache: Map<string, { info: BackendTokenInfo; expiresAt: number }> = new Map();
	private readonly cacheTimeout = 300000; // 5 minutes cache

	constructor(
		@ILogService private readonly logService: ILogService
	) {
		super();
		this.logService.info('[BackendTokenService] Initialized');
	}

	/**
	 * Get complete token information from the backend
	 */
	async getTokenInfo(apiKey: string, backendUrl: string): Promise<BackendTokenInfo> {
		const cacheKey = `${backendUrl}:${apiKey}`;
		const cached = this.tokenCache.get(cacheKey);

		// Return cached token if still valid
		if (cached && cached.expiresAt > Date.now()) {
			this.logService.debug('[BackendTokenService] Returning cached token info');
			return cached.info;
		}

		try {
			const url = `${backendUrl}/v1/token`;
			this.logService.debug(`[BackendTokenService] Fetching token info from ${url}`);

			const response = await fetch(url, {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				}
			});

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
			const expiresAt = Date.now() + this.cacheTimeout;
			this.tokenCache.set(cacheKey, { info: tokenInfo, expiresAt });

			this.logService.info('[BackendTokenService] Token info fetched successfully');
			return tokenInfo;
		} catch (error) {
			this.logService.error(`[BackendTokenService] Failed to fetch token info: ${error}`);
			throw error;
		}
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

