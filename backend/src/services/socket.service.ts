import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';

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

        this.io.on('connection', (socket) => {
            console.log(`🔌 Client connected: ${socket.id}`);

            socket.on('join-workspace', (workspaceId: string) => {
                socket.join(`workspace-\${workspaceId}`);
                console.log(`📡 Socket \${socket.id} joined workspace-\${workspaceId}`);
            });

            socket.on('disconnect', () => {
                console.log(`🔌 Client disconnected: ${socket.id}`);
            });
        });

        return this.io;
    }

    public static emitToWorkspace(workspaceId: string, event: string, data: any) {
        if (this.io) {
            this.io.to(`workspace-\${workspaceId}`).emit(event, data);
        }
    }

    public static getIO() {
        return this.io;
    }
}
