/**
 * Route Aggregator
 */

import { Router } from 'express';
import healthRoutes from './health';
import chatRoutes from './chat';
import completionsRoutes from './completions';
import embeddingsRoutes from './embeddings';
import modelsRoutes from './models';

const router = Router();

// Mount routes
router.use('/', healthRoutes);
router.use('/v1', chatRoutes);
router.use('/v1', completionsRoutes);
router.use('/v1', embeddingsRoutes);
router.use('/v1', modelsRoutes);

// Also mount under root for compatibility
router.use('/', chatRoutes);
router.use('/', completionsRoutes);
router.use('/', embeddingsRoutes);
router.use('/', modelsRoutes);

export default router;

