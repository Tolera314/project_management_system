import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

interface JwtPayload {
    userId: string;
    tokenVersion?: number;
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            // 1. Bearer token (Authorization header — mobile apps, Postman, etc.)
            token = authHeader.substring(7).trim();
        } else if ((req as any).cookies?.token) {
            // 2. HttpOnly cookie (browsers — preferred for XSS protection)
            token = (req as any).cookies.token;
        } else if (req.query.token && typeof req.query.token === 'string') {
            // 3. Query string — only for file-download / socket handshake endpoints
            token = req.query.token.trim();
        }

        if (!token || token === 'undefined' || token === 'null') {
            res.status(401).json({ error: 'Authentication required. Please provide a valid token.' });
            return;
        }

        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        } catch (jwtErr: any) {
            if (jwtErr.name === 'TokenExpiredError') {
                res.status(401).json({ error: 'Your session has expired. Please log in again.' });
            } else {
                res.status(401).json({ error: 'Invalid token. Please log in again.' });
            }
            return;
        }

        // Verify token version to support session revocation
        if (decoded.tokenVersion !== undefined) {
            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                select: { id: true, tokenVersion: true, status: true },
            });

            if (!user) {
                res.status(401).json({ error: 'User account not found.' });
                return;
            }

            if (user.tokenVersion !== decoded.tokenVersion) {
                res.status(401).json({ error: 'Session revoked. Please log in again.' });
                return;
            }

            if (user.status === 'SUSPENDED') {
                res.status(403).json({ error: 'Your account has been suspended. Contact support.' });
                return;
            }
        }

        (req as any).userId = decoded.userId;
        (req as any).user = { userId: decoded.userId }; // Uniform access pattern
        next();

    } catch (error: any) {
        console.error('[Auth Middleware] Unexpected error:', error);
        res.status(500).json({ error: 'An internal error occurred during authentication.' });
    }
};

// Alias used by some route files
export const authenticate = authMiddleware;
