/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { NextFunction, Request, Response } from 'express';
import { getConfig } from '../config';
import { tokenService } from '../services/token.service';
import { AuthenticationError } from '../utils/errors';
import { getLogger } from '../utils/logger';

const logger = getLogger();

/**
 * Authentication middleware - validates API key in Authorization header
 */
export function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	const config = getConfig();

	// Skip auth if disabled, but still extract token info for downstream use
	if (!config.auth.enabled) {
		const authHeader = req.headers.authorization;
		if (authHeader) {
			const token = authHeader.replace(/^Bearer\s+/i, '');
			(req as any).tokenInfo = {
				token: token,
				isValid: true,
				type: 'api_key' as const
			};
		} else {
			// Use default token when auth is disabled and no header provided
			(req as any).tokenInfo = {
				token: config.auth.apiKey || 'ownrex-default-key',
				isValid: true,
				type: 'api_key' as const
			};
		}
		return next();
	}

	const authHeader = req.headers.authorization;
	const result = tokenService.validateAuthHeader(authHeader);

	if (!result.valid) {
		logger.warn(`Authentication failed: ${result.reason}`, {
			ip: req.ip,
			path: req.path
		});

		const error = new AuthenticationError(result.reason);
		res.status(error.statusCode).json({
			error: {
				message: error.message,
				type: error.type,
				code: error.code
			}
		});
		return;
	}

	// Add token info to request for downstream use
	(req as any).tokenInfo = result.tokenInfo;
	next();
}

/**
 * Optional auth middleware - validates if present, allows if absent
 */
export function optionalAuthMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	const authHeader = req.headers.authorization;

	if (!authHeader) {
		return next();
	}

	return authMiddleware(req, res, next);
}

export default authMiddleware;

