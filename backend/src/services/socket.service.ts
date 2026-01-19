import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: string;
}

export class SocketService {
    private static io: SocketIOServer;

    public static initialize(server: HttpServer) {
        this.io = new SocketIOServer(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
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
            console.log(`🔌 Client connected: ${socket.id} (User: ${socket.data.userId})`);

            // Auto-join user room
            if (socket.data.userId) {
                socket.join(`user-${socket.data.userId}`);
            }

            socket.on('join-workspace', (workspaceId: string) => {
                socket.join(`workspace-${workspaceId}`);
                console.log(`📡 Socket ${socket.id} joined workspace-${workspaceId}`);
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
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
