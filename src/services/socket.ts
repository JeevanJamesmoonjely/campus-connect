import { io, Socket } from 'socket.io-client';

const SOCKET_URL = window.location.origin;

let socket: Socket | null = null;

export const initSocket = (userId: string) => {
    if (socket) return socket;

    socket = io(SOCKET_URL, {
        query: { userId },
        withCredentials: true,
    });

    socket.on('connect', () => {
        console.log('[Socket] Connected to server');
    });

    socket.on('disconnect', () => {
        console.log('[Socket] Disconnected from server');
    });

    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
