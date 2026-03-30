import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
    user?: IUser;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // Also check cookies
    else if (req.cookies?.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized to access this route' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
        
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authorized to access this route' 
        });
    }
};

export const adminOnly = async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.is_admin) {
        return res.status(403).json({ 
            success: false, 
            message: 'Admin access required' 
        });
    }
    next();
};

export const generateToken = (userId: string): string => {
    const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
    const expiresIn = process.env.JWT_EXPIRE || '30d';
    return jwt.sign({ id: userId }, secret, { expiresIn } as jwt.SignOptions);
};
