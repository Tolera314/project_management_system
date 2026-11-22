import { Request, Response } from 'express';
import prisma from '../lib/prisma';

const startTime = Date.now();

export const healthCheck = async (_req: Request, res: Response) => {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    try {
        // Lightweight DB liveness probe
        const dbStart = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbLatencyMs = Date.now() - dbStart;

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: uptimeSeconds,
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            services: {
                database: {
                    status: 'healthy',
                    latencyMs: dbLatencyMs,
                },
                api: {
                    status: 'operational',
                    pool: {
                        max: 10,
                        note: 'Configured for Neon free-tier (tune for paid plans)',
                    },
                },
            },
        });
    } catch (error: any) {
        console.error('[Health] DB check failed:', error.message);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: uptimeSeconds,
            services: {
                database: {
                    status: 'unreachable',
                    error: 'Database connection failed',
                },
            },
        });
    }
};

/**
 * Lightweight ping endpoint — returns 200 immediately without a DB query.
 * Used by UptimeRobot / Render health checks to prevent free-tier sleep.
 */
export const ping = (_req: Request, res: Response) => {
    res.status(200).json({ ok: true, ts: Date.now() });
};
