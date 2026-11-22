import dotenv from 'dotenv';
// Load environment variables immediately after import
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';

import prisma from './lib/prisma';
import { SocketService } from './services/socket.service';
import { authLimiter, apiLimiter } from './middleware/rateLimit.middleware';

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import workspaceRoutes from './routes/workspace.routes';
import listRoutes from './routes/list.routes';
import taskRoutes from './routes/task.routes';
import milestoneRoutes from './routes/milestone.routes';
import dependencyRoutes from './routes/dependency.routes';
import invitationRoutes from './routes/invitation.routes';
import notificationRoutes from './routes/notification.routes';
import userRoutes from './routes/user.routes';
import tagRoutes from './routes/tag.routes';
import fileRoutes from './routes/file.routes';
import templateRoutes from './routes/template.routes';
import adminRoutes from './routes/admin.routes';
import settingsRoutes from './routes/settings.routes';
import calendarRoutes from './routes/calendar.routes';
import analyticsRoutes from './routes/analytics.routes';
import healthRoutes from './routes/health.routes';
import contactRoutes from './routes/contact.routes';

// ── Validate required env vars before boot ──────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_URL'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
    process.exit(1);
}

const app = express();
const port = Number(process.env.PORT) || 4000;
const httpServer = createServer(app);

// Trust proxy settings for Render / Cloud environments (required for rate-limiter IP detection)
app.set('trust proxy', 1);

// ── Security middleware ──────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow Cloudinary images
}));

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(o => o.trim());
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Render health checks)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin "${origin}" not allowed`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Initialize Socket.io ─────────────────────────────────────────────────────
SocketService.initialize(httpServer);

// ── Rate limiters ────────────────────────────────────────────────────────────
app.use('/auth', authLimiter);
app.use('/api', apiLimiter);
app.use('/projects', apiLimiter);
app.use('/tasks', apiLimiter);
app.use('/workspaces', apiLimiter);
app.use('/files', apiLimiter);
app.use('/templates', apiLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/workspaces', workspaceRoutes);
app.use('/lists', listRoutes);
app.use('/tasks', taskRoutes);
app.use('/milestones', milestoneRoutes);
app.use('/dependencies', dependencyRoutes);
app.use('/invitations', invitationRoutes);
app.use('/notifications', notificationRoutes);
app.use('/templates', templateRoutes);
app.use('/users', userRoutes);
app.use('/tags', tagRoutes);
app.use('/files', fileRoutes);
app.use('/admin', adminRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/health', healthRoutes);
app.use('/api', contactRoutes);

app.get('/', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'ProjectOS API', version: '1.0.0' });
});

// ── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const isDev = process.env.NODE_ENV === 'development';
    console.error('[GlobalError]', err);
    res.status(status).json({
        error: err.message || 'Internal server error',
        ...(isDev && { stack: err.stack }),
    });
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// ── Start server ─────────────────────────────────────────────────────────────
prisma.$connect()
    .then(() => console.log('✅ Database connected successfully'))
    .catch((error: any) => {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    });

const server = httpServer.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down gracefully`);
    server.close(async () => {
        await prisma.$disconnect();
        console.log('💤 Server closed');
        process.exit(0);
    });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

export { app, prisma, httpServer, server };
