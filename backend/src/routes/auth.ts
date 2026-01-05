/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getLogger } from '../utils/logger';

const logger = getLogger();
const router = Router();

/**
 * GET /v1/token
 * Returns token information for the authenticated API key
 *
 * Authentication: Requires Authorization: Bearer <api-key> header
 *
 * Response includes:
 * - Token information
 * - Endpoints (api, proxy, telemetry)
 * - Feature flags (chat_enabled, code_quote_enabled, etc.)
 * - Metadata (sku, individual, expires_at, refresh_in)
 */
router.get('/token', authMiddleware, (req: Request, res: Response): void => {
	try {
		let tokenInfo = (req as any).tokenInfo;

		// If auth is disabled or tokenInfo not set, create from Authorization header or use default
		if (!tokenInfo) {
			const authHeader = req.headers.authorization;
			const token = authHeader?.replace(/^Bearer\s+/i, '') || 'ownrex-default-key';
			tokenInfo = {
				token: token,
				isValid: true,
				type: 'api_key' as const
			};
		}

		// Get base URL from request or config
		const protocol = req.protocol || 'http';
		const host = req.get('host') || 'localhost:8000';
		const baseUrl = `${protocol}://${host}`;

		// Calculate expiration (24 hours from now)
		const expiresAt = Math.floor((Date.now() + 86400000) / 1000); // Unix timestamp in seconds
		const refreshIn = 3600; // Refresh in 1 hour

		// Build token response
		const response = {
			token: tokenInfo.token,
			endpoints: {
				api: baseUrl,
				proxy: baseUrl,
				telemetry: baseUrl,
				'origin-tracker': baseUrl
			},
			chat_enabled: true,
			code_quote_enabled: false,
			copilotignore_enabled: false,
			individual: true,
			sku: 'ownrex_free',
			expires_at: expiresAt,
			refresh_in: refreshIn,
			timestamp: new Date().toISOString()
		};

		logger.debug('Token info requested', { token: tokenInfo.token.substring(0, 10) + '...' });

		res.status(200).json(response);
	} catch (error: any) {
		logger.error('Error generating token info', error);
		res.status(500).json({
			error: {
				message: 'Internal server error while generating token info',
				type: 'server_error',
				code: 'token_generation_failed'
			}
		});
	}
});

/**
 * GET /v1/auth/token
 * Alias for /v1/token for compatibility
 */
router.get('/auth/token', authMiddleware, (req: Request, res: Response): void => {
	// Use the same handler as /token
	try {
		let tokenInfo = (req as any).tokenInfo;

		// If auth is disabled or tokenInfo not set, create from Authorization header or use default
		if (!tokenInfo) {
			const authHeader = req.headers.authorization;
			const token = authHeader?.replace(/^Bearer\s+/i, '') || 'ownrex-default-key';
			tokenInfo = {
				token: token,
				isValid: true,
				type: 'api_key' as const
			};
		}

		const protocol = req.protocol || 'http';
		const host = req.get('host') || 'localhost:8000';
		const baseUrl = `${protocol}://${host}`;

		const expiresAt = Math.floor((Date.now() + 86400000) / 1000);
		const refreshIn = 3600;

		const response = {
			token: tokenInfo.token,
			endpoints: {
				api: baseUrl,
				proxy: baseUrl,
				telemetry: baseUrl,
				'origin-tracker': baseUrl
			},
			chat_enabled: true,
			code_quote_enabled: false,
			copilotignore_enabled: false,
			individual: true,
			sku: 'ownrex_free',
			expires_at: expiresAt,
			refresh_in: refreshIn,
			timestamp: new Date().toISOString()
		};

		logger.debug('Token info requested (via /auth/token)', { token: tokenInfo.token.substring(0, 10) + '...' });

		res.status(200).json(response);
	} catch (error: any) {
		logger.error('Error generating token info', error);
		res.status(500).json({
			error: {
				message: 'Internal server error while generating token info',
				type: 'server_error',
				code: 'token_generation_failed'
			}
		});
	}
});

export default router;

