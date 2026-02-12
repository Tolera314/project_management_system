import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: string;
}

export class SocketService {
    private static io: SocketIOServer;

    private static activeUsers: Map<string, Set<string>> = new Map(); // projectId -> Set<userId>

    public static initialize(server: HttpServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'http://127.0.0.1:3000'],
                methods: ['GET', 'POST', 'PATCH', 'DELETE'],
                credentials: true
            }
        });

        // Authentication Middleware
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token;
            if (token) {
                jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
                    if (err) return next(new Error('Authentication error'));
                    socket.data.userId = (decoded as JwtPayload).userId;
                    next();
                });
            } else {
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            const userId = socket.data.userId;
            console.log(`🔌 Client connected: ${socket.id} (User: ${userId})`);

            // Auto-join user room
            if (userId) {
                socket.join(`user-${userId}`);
            }

            socket.on('join-workspace', (workspaceId: string) => {
                socket.join(`workspace-${workspaceId}`);
            });

            // Presence: Join Project
            socket.on('join-project', (projectId: string) => {
                socket.join(`project-${projectId}`);

                if (!this.activeUsers.has(projectId)) {
                    this.activeUsers.set(projectId, new Set());
                }
                this.activeUsers.get(projectId)?.add(userId);

                // Broadcast new list
                this.io.to(`project-${projectId}`).emit('presence-update', Array.from(this.activeUsers.get(projectId)!));
            });

            // Presence: Leave Project
            socket.on('leave-project', (projectId: string) => {
                socket.leave(`project-${projectId}`);
                if (this.activeUsers.has(projectId)) {
                    this.activeUsers.get(projectId)?.delete(userId);
                    if (this.activeUsers.get(projectId)?.size === 0) {
                        this.activeUsers.delete(projectId);
                    } else {
                        this.io.to(`project-${projectId}`).emit('presence-update', Array.from(this.activeUsers.get(projectId)!));
                    }
                }
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
                // Cleanup presence from all projects
                // Note: efficient lookup would require reverse map or iterating. 
                // For simplicity/perf in memory, iterating small map is okay, or just rely on explicit leave if client can. 
                // But disconnect should cleanup.
                this.activeUsers.forEach((users, projectId) => {
                    if (users.has(userId)) {
                        users.delete(userId);
                        if (users.size === 0) {
                            this.activeUsers.delete(projectId);
                        } else {
                            this.io.to(`project-${projectId}`).emit('presence-update', Array.from(users));
                        }
                    }
                });
            });
        });

        return this.io;
    }

    public static emitToWorkspace(workspaceId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(`workspace-${workspaceId}`).emit(event, data);
        }
    }

    public static emitToUser(userId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(`user-${userId}`).emit(event, data);
        }
    }

    public static getIO() {
        return this.io;
    }
}
