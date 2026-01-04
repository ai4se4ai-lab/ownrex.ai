/**
 * Ownrex Services Registration
 * 
 * This file provides utilities to register Ownrex-specific services
 * instead of the default GitHub Copilot services.
 * 
 * Usage:
 * To use Ownrex.ai backend instead of GitHub Copilot, set the environment variable:
 * OWNREX_ENABLED=true
 * 
 * Or configure in VS Code settings:
 * "ownrex.backendUrl": "http://localhost:8000"
 */

import { SyncDescriptor } from '../../../util/vs/platform/instantiation/common/instantiation';
import { OwnrexTokenManager, IOwnrexTokenManager } from './ownrexTokenManager';
import { OwnrexAuthService, IOwnrexAuthService } from './ownrexAuthService';
import { OwnrexEndpointProvider, IOwnrexEndpointProvider } from '../../endpoint/node/ownrexEndpointProvider';
import { ICopilotTokenManager } from '../common/authentication';
import { IAuthenticationService } from '../common/authentication';
import { IEndpointProvider } from '../../endpoint/common/endpointProvider';

export interface IOwnrexServiceDescriptors {
  tokenManager: SyncDescriptor<OwnrexTokenManager>;
  authService: SyncDescriptor<OwnrexAuthService>;
  endpointProvider: SyncDescriptor<OwnrexEndpointProvider>;
}

/**
 * Check if Ownrex mode is enabled
 */
export function isOwnrexEnabled(): boolean {
  // Check environment variable
  if (typeof process !== 'undefined') {
    if (process.env.OWNREX_ENABLED === 'true') {
      return true;
    }
    if (process.env.OWNREX_BACKEND_URL) {
      return true;
    }
    if (process.env.OWNREX_API_KEY) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get Ownrex service descriptors for dependency injection
 */
export function getOwnrexServiceDescriptors(): IOwnrexServiceDescriptors {
  return {
    tokenManager: new SyncDescriptor(OwnrexTokenManager),
    authService: new SyncDescriptor(OwnrexAuthService),
    endpointProvider: new SyncDescriptor(OwnrexEndpointProvider)
  };
}

/**
 * Service identifiers for Ownrex services
 */
export const OwnrexServiceIdentifiers = {
  TokenManager: IOwnrexTokenManager,
  AuthService: IOwnrexAuthService,
  EndpointProvider: IOwnrexEndpointProvider
};

/**
 * Register Ownrex services with an instantiation service builder
 * Call this instead of the default service registration when using Ownrex.ai backend
 */
export function registerOwnrexServices(builder: any): void {
  const descriptors = getOwnrexServiceDescriptors();
  
  // Register Ownrex-specific services
  builder.define(IOwnrexTokenManager, descriptors.tokenManager);
  builder.define(IOwnrexAuthService, descriptors.authService);
  builder.define(IOwnrexEndpointProvider, descriptors.endpointProvider);
  
  // Also register under standard interfaces for compatibility
  builder.define(ICopilotTokenManager, descriptors.tokenManager);
  // Note: IAuthenticationService and IEndpointProvider have different interfaces
  // They need to be adapted or the code needs to check for Ownrex mode
}

/**
 * Export all Ownrex service classes
 */
export { OwnrexTokenManager } from './ownrexTokenManager';
export { OwnrexAuthService } from './ownrexAuthService';
export { OwnrexEndpointProvider } from '../../endpoint/node/ownrexEndpointProvider';

