import { Request, Response } from 'express';
import prisma from '../lib/prisma';

export const healthCheck = async (req: Request, res: Response) => {
    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        const dbStatus = 'healthy';

        // Get connection pool info if available
        const poolInfo = {
            status: 'operational',
            maxConnections: 20,
            timestamp: new Date().toISOString()
        };

        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: dbStatus,
                api: 'operational',
                pool: poolInfo
            },
            version: process.env.npm_package_version || '1.0.0'
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Database connection failed'
        });
    }
};
