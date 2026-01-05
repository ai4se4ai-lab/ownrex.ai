/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Request, Response, Router } from 'express';
import * as zlib from 'zlib';
import { getLogger } from '../utils/logger';

const logger = getLogger();
const router = Router();

/**
 * POST /v2/track
 * Application Insights telemetry endpoint
 *
 * Accepts gzipped newline-delimited JSON (NDJSON) format
 * This is the standard format used by Application Insights SDK
 */
router.post('/v2/track', (req: Request, res: Response) => {
	// Check if content is gzipped
	const isGzipped = req.headers['content-encoding'] === 'gzip' ||
		req.headers['content-type']?.includes('gzip');

	let body = '';
	const stream = isGzipped
		? req.pipe(zlib.createGunzip())
		: req;

	stream
		.on('data', (chunk: Buffer) => {
			body += chunk.toString('utf8');
		})
		.on('end', () => {
			try {
				// Parse newline-delimited JSON
				const lines = body.trim().split('\n').filter(line => line.trim());
				const telemetryItems: any[] = [];

				for (const line of lines) {
					try {
						const item = JSON.parse(line);
						telemetryItems.push(item);
					} catch (parseError) {
						logger.warn('Failed to parse telemetry line', {
							error: parseError instanceof Error ? parseError.message : String(parseError),
							line: line.substring(0, 100) // Log first 100 chars
						});
					}
				}

				// Log telemetry receipt (without sensitive data)
				logger.debug('Telemetry received', {
					itemCount: telemetryItems.length,
					userAgent: req.headers['user-agent'],
					contentType: req.headers['content-type']
				});

				// Store telemetry data (optional - for analytics)
				// You can extend telemetryService to store Application Insights data
				for (const item of telemetryItems) {
					// Extract event name if available
					const eventName = item.name || item.data?.baseData?.name || 'unknown';
					logger.debug('Telemetry event', { eventName });
				}

				// Return 204 No Content (Application Insights expects this)
				res.status(204).end();
			} catch (error) {
				logger.error('Error processing telemetry', {
					error: error instanceof Error ? error.message : String(error)
				});
				// Still return 204 to avoid retries
				res.status(204).end();
			}
		})
		.on('error', (error: Error) => {
			logger.error('Error reading telemetry stream', {
				error: error.message
			});
			res.status(204).end();
		});
});

/**
 * GET /v2/track
 * Health check for telemetry endpoint
 */
router.get('/v2/track', (_req: Request, res: Response) => {
	res.status(200).json({
		status: 'ok',
		message: 'Telemetry endpoint is available',
		timestamp: new Date().toISOString()
	});
});

export default router;

