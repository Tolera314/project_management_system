import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: string;
}

export class SocketService {
    private static io: SocketIOServer;

    private static activeUsers: Map<string, Set<string>> = new Map(); // projectId -> Set<userId>

    public static async initialize(server: HttpServer): Promise<SocketIOServer> {
        const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
            .split(',')
            .map((o) => o.trim());

        this.io = new SocketIOServer(server, {
            cors: {
                origin: allowedOrigins,
                methods: ['GET', 'POST', 'PATCH', 'DELETE'],
                credentials: true,
            },
            // Recommended: prefer WebSocket, fall back to polling
            transports: ['websocket', 'polling'],
            pingTimeout: 30_000,
            pingInterval: 25_000,
        });

        // ── Redis Adapter (optional — enabled when REDIS_URL is set) ──────────────
        if (process.env.REDIS_URL) {
            try {
                const { default: Redis } = await import('ioredis');
                const { createAdapter } = await import('@socket.io/redis-adapter');

                const pubClient = new Redis(process.env.REDIS_URL);
                const subClient = pubClient.duplicate();

                pubClient.on('error', (err: any) => console.error('[Socket.io] Redis pub error:', err?.message || err));
                subClient.on('error', (err: any) => console.error('[Socket.io] Redis sub error:', err?.message || err));

                this.io.adapter(createAdapter(pubClient, subClient));
                console.log('✅ Socket.io Redis adapter connected — multi-instance ready');
            } catch (err: any) {
                console.warn('[Socket.io] Failed to connect Redis adapter, falling back to in-memory:', err.message);
            }
        } else {
            console.log('⚠️  No REDIS_URL — Socket.io using in-memory adapter (single-instance only)');
        }

        // ── Authentication middleware ───────────────────────────────────────────────
        this.io.use((socket: any, next: (err?: Error) => void) => {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
                if (err) {
                    return next(new Error('Authentication error: Invalid or expired token'));
                }
                socket.data.userId = (decoded as JwtPayload).userId;
                next();
            });
        });

        // ── Event handlers ─────────────────────────────────────────────────────────
        this.io.on('connection', (socket: any) => {
            const userId = socket.data.userId as string;
            console.log(`🔌 Client connected: ${socket.id} (User: ${userId})`);

            // Auto-join user's personal room
            if (userId) {
                socket.join(`user-${userId}`);
            }

            socket.on('join-workspace', (workspaceId: string) => {
                socket.join(`workspace-${workspaceId}`);
            });

            socket.on('leave-workspace', (workspaceId: string) => {
                socket.leave(`workspace-${workspaceId}`);
            });

            // ── Presence: Join Project ──────────────────────────────────────────
            socket.on('join-project', (projectId: string) => {
                socket.join(`project-${projectId}`);

                if (!this.activeUsers.has(projectId)) {
                    this.activeUsers.set(projectId, new Set());
                }
                this.activeUsers.get(projectId)?.add(userId);

                this.io
                    .to(`project-${projectId}`)
                    .emit('presence-update', Array.from(this.activeUsers.get(projectId)!));
            });

            // ── Presence: Leave Project ─────────────────────────────────────────
            socket.on('leave-project', (projectId: string) => {
                socket.leave(`project-${projectId}`);
                this._removeUserFromProject(projectId, userId);
            });

            // ── Disconnect: cleanup all presence ───────────────────────────────
            socket.on('disconnect', (reason: string) => {
                console.log(`🔌 Client disconnected: ${socket.id} (Reason: ${reason})`);
                this.activeUsers.forEach((_users, projectId) => {
                    this._removeUserFromProject(projectId, userId);
                });
            });
        });

        return this.io;
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private static _removeUserFromProject(projectId: string, userId: string): void {
        const users = this.activeUsers.get(projectId);
        if (!users) return;

        users.delete(userId);
        if (users.size === 0) {
            this.activeUsers.delete(projectId);
        } else {
            this.io.to(`project-${projectId}`).emit('presence-update', Array.from(users));
        }
    }

    // ── Emit helpers ─────────────────────────────────────────────────────────────

    public static emitToWorkspace(workspaceId: string, event: string, data: any): void {
        if (this.io) {
            this.io.to(`workspace-${workspaceId}`).emit(event, data);
        }
    }

    public static emitToProject(projectId: string, event: string, data: any): void {
        if (this.io) {
            this.io.to(`project-${projectId}`).emit(event, data);
        }
    }

    public static emitToUser(userId: string, event: string, data: any): void {
        if (this.io) {
            this.io.to(`user-${userId}`).emit(event, data);
        }
    }

    public static getIO(): SocketIOServer {
        return this.io;
    }
}
