
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

interface JwtPayload {
    userId: string;
    tokenVersion?: number;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        let token: string | undefined;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else if (req.query.token && typeof req.query.token === 'string') {
            token = req.query.token;
        }

        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

        // NEW: Verify Token Version (if available in payload, otherwise perform extra check)
        if (decoded.tokenVersion !== undefined) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { tokenVersion: true }
            });

            if (!user || user.tokenVersion !== decoded.tokenVersion) {
                res.status(401).json({ error: 'Session expired/revoked' });
                return;
            }
        }

        (req as any).userId = decoded.userId;
        next();

    } catch (error: any) {
        console.error('[AuthMiddleware] Error:', error);

        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Invalid or expired token' });
            return;
        }

        // For other errors (like DB connection), return 500 to distinguish
        res.status(500).json({ error: 'Internal logic error during auth' });
        return;
    }
};
