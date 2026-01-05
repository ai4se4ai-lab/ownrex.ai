/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { createServiceIdentifier } from '../../../util/common/services';

/**
 * Endpoint information structure
 */
export interface EndpointInfo {
	api: string;
	proxy: string;
	telemetry: string;
	'origin-tracker'?: string;
}

/**
 * Backend token information returned from the backend API
 */
export interface BackendTokenInfo {
	token: string;
	endpoints: EndpointInfo;
	chat_enabled: boolean;
	code_quote_enabled: boolean;
	copilotignore_enabled: boolean;
	individual: boolean;
	sku: string;
	expires_at: number; // Unix timestamp in seconds
	refresh_in: number; // Seconds until refresh
	timestamp?: string; // ISO timestamp from backend
}

/**
 * Service interface for fetching token information from the backend
 */
export interface IBackendTokenService {
	readonly _serviceBrand: undefined;

	/**
	 * Get complete token information from the backend
	 * @param apiKey The API key to authenticate with
	 * @param backendUrl The backend base URL
	 * @returns Promise resolving to BackendTokenInfo
	 */
	getTokenInfo(apiKey: string, backendUrl: string): Promise<BackendTokenInfo>;

	/**
	 * Get endpoint information from the backend
	 * @param apiKey The API key to authenticate with
	 * @param backendUrl The backend base URL
	 * @returns Promise resolving to EndpointInfo
	 */
	getEndpoints(apiKey: string, backendUrl: string): Promise<EndpointInfo>;

	/**
	 * Check if chat is enabled for the given API key
	 * @param apiKey The API key to authenticate with
	 * @param backendUrl The backend base URL
	 * @returns Promise resolving to boolean
	 */
	isChatEnabled(apiKey: string, backendUrl: string): Promise<boolean>;
}

export const IBackendTokenService = createServiceIdentifier<IBackendTokenService>('IBackendTokenService');

