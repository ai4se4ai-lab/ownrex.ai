/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SyncDescriptor } from '../../../util/vs/platform/instantiation/common/descriptors';
import { OwnrexTokenManager, IOwnrexTokenManager } from './ownrexTokenManager';
import { OwnrexAuthService, IOwnrexAuthService } from './ownrexAuthService';
import { ICopilotTokenManager } from '../common/copilotTokenManager';

export interface IOwnrexServiceDescriptors {
	tokenManager: SyncDescriptor<OwnrexTokenManager>;
	authService: SyncDescriptor<OwnrexAuthService>;
}

/**
 * Check if Ownrex mode is enabled
 * Always returns true - Ownrex.ai is the default and only mode
 */
export function isOwnrexEnabled(): boolean {
	// Ownrex mode is always enabled - this extension is decoupled from GitHub Copilot
	return true;
}

/**
 * Get Ownrex service descriptors for dependency injection
 */
export function getOwnrexServiceDescriptors(): IOwnrexServiceDescriptors {
	return {
		tokenManager: new SyncDescriptor(OwnrexTokenManager),
		authService: new SyncDescriptor(OwnrexAuthService)
	};
}

/**
 * Service identifiers for Ownrex services
 */
export const OwnrexServiceIdentifiers = {
	TokenManager: IOwnrexTokenManager,
	AuthService: IOwnrexAuthService
};

/**
 * Register Ownrex services with an instantiation service builder
 * Call this instead of the default service registration when using Ownrex.ai backend
 */
export function registerOwnrexServices(builder: unknown): void {
	const descriptors = getOwnrexServiceDescriptors();

	// Register Ownrex-specific services
	builder.define(IOwnrexTokenManager, descriptors.tokenManager);
	builder.define(IOwnrexAuthService, descriptors.authService);

	// Also register under standard interfaces for compatibility
	builder.define(ICopilotTokenManager, descriptors.tokenManager);
}

/**
 * Export all Ownrex service classes
 */
export { OwnrexTokenManager } from './ownrexTokenManager';
export { OwnrexAuthService } from './ownrexAuthService';
