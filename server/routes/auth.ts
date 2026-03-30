import express, { Response } from 'express';
import User from '../models/User';
import { protect, generateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', async (req, res: Response) => {
    try {
        const { email, password, name, department } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }

        // Create user
        const user = await User.create({
            email,
            password,
            name,
            department,
        });

        // Generate token
        const token = generateToken(user._id.toString());

        res.status(201).json({
            success: true,
            token,
            user: user.toJSON(),
        });
    } catch (error: any) {
        console.error('Register error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res: Response) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please provide email and password' 
            });
        }

        // Find user with password
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Generate token
        const token = generateToken(user._id.toString());

        res.json({
            success: true,
            token,
            user: user.toJSON(),
        });
    } catch (error: any) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
    try {
        res.json({
            success: true,
            user: req.user?.toJSON(),
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   PUT /api/auth/profile
// @desc    Update profile
// @access  Private
router.put('/profile', protect, async (req: AuthRequest, res: Response) => {
    try {
        const { name, department, bio, year, avatar_url, reg_number } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user?._id,
            { name, department, bio, year, avatar_url, reg_number },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            user: user?.toJSON(),
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', protect, async (req: AuthRequest, res: Response) => {
    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});

export default router;
