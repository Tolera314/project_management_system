import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private workspaceId: string | null = null;

    public connect(workspaceId: string) {
        if (this.socket?.connected && this.workspaceId === workspaceId) return;

        if (this.socket) {
            this.socket.disconnect();
        }

        const token = localStorage.getItem('token');
        this.socket = io('http://localhost:4000', {
            auth: { token },
            transports: ['websocket']
        });

        this.workspaceId = workspaceId;

        this.socket.on('connect', () => {
            console.log('🔌 Connected to WebSocket server');
            this.socket?.emit('join-workspace', workspaceId);
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 Disconnected from WebSocket server');
        });

        return this.socket;
    }

    public on(event: string, callback: (data: any) => void) {
        this.socket?.on(event, callback);
    }

    public off(event: string, callback?: (data: any) => void) {
        this.socket?.off(event, callback);
    }

    public disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }
}

export const socketService = new SocketService();
