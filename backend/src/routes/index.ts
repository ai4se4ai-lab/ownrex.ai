/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { Router, Request, Response } from 'express';
import healthRoutes from './health';
import authRoutes from './auth';
import chatRoutes from './chat';
import completionsRoutes from './completions';
import embeddingsRoutes from './embeddings';
import modelsRoutes from './models';
import telemetryRoutes from './telemetry';
import { APP_NAME, APP_VERSION } from '../config/constants';

const router = Router();

/**
 * GET /
 * Root endpoint - API information
 */
router.get('/', (_req: Request, res: Response) => {
	res.status(200).json({
		name: APP_NAME,
		version: APP_VERSION,
		status: 'running',
		endpoints: {
			health: '/health',
			token: '/v1/token',
			chat: '/v1/chat/completions',
			completions: '/v1/completions',
			embeddings: '/v1/embeddings',
			models: '/v1/models',
			telemetry: '/v2/track'
		},
		documentation: 'See /health for server status',
		timestamp: new Date().toISOString()
	});
});

// Mount routes
router.use('/', healthRoutes);
router.use('/v1', authRoutes);
router.use('/v1', chatRoutes);
router.use('/v1', completionsRoutes);
router.use('/v1', embeddingsRoutes);
router.use('/v1', modelsRoutes);
router.use('/', telemetryRoutes);

// Also mount under root for compatibility
router.use('/', chatRoutes);
router.use('/', completionsRoutes);
router.use('/', embeddingsRoutes);
router.use('/', modelsRoutes);

export default router;

