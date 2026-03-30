import express from 'express';
import { createServer } from 'http';
import os from 'os';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import connectDB from './config/db';
import { initSocket } from './socket';
import {
    authRoutes,
    postRoutes,
    lostfoundRoutes,
    marketplaceRoutes,
    messageRoutes,
    notificationRoutes,
    clubRoutes,
    adminRoutes,
    userRoutes,
    eventRoutes,
} from './routes';

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

const envOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const allowedOrigins = Array.from(new Set([
    'http://localhost:5173',
    'http://localhost:5175',
    ...envOrigins,
]));

console.log('[CORS] Allowed origins:', allowedOrigins);

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // In development, allow all origins if not explicitly set
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/lostfound', lostfoundRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err.stack);

    if (err?.type === 'entity.too.large') {
        return res.status(413).json({
            success: false,
            message: 'Uploaded image is too large. Please choose a smaller image.',
        });
    }

    res.status(500).json({
        success: false,
        message: err.message || 'Internal server error',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

const PORT = parseInt(process.env.PORT || '5002', 10);
const HOST = '0.0.0.0';

const httpServer = createServer(app);
initSocket(httpServer);

if (process.env.VERCEL !== '1') {
    httpServer.listen(PORT, HOST, () => {
        const interfaces = os.networkInterfaces();
        const addresses: string[] = [];
        for (const k in interfaces) {
            for (const k2 in interfaces[k]!) {
                const address = interfaces[k]![k2];
                if ((address.family === 'IPv4' || (address.family as number | string) === 4) && !address.internal) {
                    addresses.push(address.address);
                }
            }
        }
        
        console.log('--------------------------------------------------');
        console.log(`Server running on:`);
        console.log(`- Local:   http://localhost:${PORT}`);
        addresses.forEach(addr => {
            console.log(`- Network: http://${addr}:${PORT}`);
        });
        console.log('--------------------------------------------------');
        console.log(`Frontend accessible (usually) on port 5173:`);
        addresses.forEach(addr => {
            console.log(`- Network: http://${addr}:5173`);
        });
        console.log('--------------------------------------------------');
    });
}

export default app;
