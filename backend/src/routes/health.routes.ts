import { Router } from 'express';
import { healthCheck, ping } from '../controllers/health.controller';

const router = Router();

/** Full health check — queries DB, returns latency & pool info */
router.get('/', healthCheck);

/** Fast ping — no DB query, used for keep-alive / uptime monitors */
router.get('/ping', ping);

export default router;
