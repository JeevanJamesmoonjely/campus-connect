import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
                const envOrigins = (process.env.CLIENT_URL || '').split(',').map(o => o.trim()).filter(Boolean);
                const allowed = ['http://localhost:5173', 'http://localhost:5175', ...envOrigins];
                if (!origin || allowed.includes(origin) || process.env.NODE_ENV !== 'production') {
                    callback(null, true);
                } else {
                    callback(new Error(`CORS blocked for origin: ${origin}`));
                }
            },
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log('[Socket] Client connected:', socket.id);

        const userId = socket.handshake.query.userId as string;
        if (userId) {
            socket.join(userId);
            console.log(`[Socket] User ${userId} joined room`);
        }

        socket.on('disconnect', () => {
            console.log('[Socket] Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
    if (io) {
        io.to(userId).emit(event, data);
    }
};
