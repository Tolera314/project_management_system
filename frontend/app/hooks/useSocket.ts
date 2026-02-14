import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api.config';

let socket: Socket | null = null;

export const useSocket = () => {
    const [socketInstance, setSocketInstance] = useState<Socket | null>(socket);

    useEffect(() => {
        if (!socket) {
            const token = localStorage.getItem('token');
            // Assuming backend is on localhost:4000 or defined in env
            const url = API_BASE_URL;

            socket = io(url, {
                auth: { token },
                transports: ['websocket'],
                autoConnect: true
            });

            socket.on('connect', () => {
                console.log('Socket connected:', socket?.id);
            });

            socket.on('disconnect', () => {
                console.log('Socket disconnected');
            });
        }
        setSocketInstance(socket);

        return () => {
            // Optional: disconnect on unmount if we want strict cleanup, 
            // but usually we want a persistent socket for the app session.
        };
    }, []);

    return socketInstance;
};
