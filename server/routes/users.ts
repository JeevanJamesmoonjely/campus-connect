import express, { Response } from 'express';
import User from '../models/User';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (for messaging)
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find({ _id: { $ne: req.user?._id } })
            .select('name avatar_url department')
            .sort({ name: 1 });

        res.json({
            success: true,
            data: users,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/users/search/:query
// @desc    Search users by name
// @access  Private
router.get('/search/:query', protect, async (req: AuthRequest, res: Response) => {
    try {
        const searchQuery = req.params.query as string;
        const users = await User.find({
            name: { $regex: new RegExp(searchQuery, 'i') },
            _id: { $ne: req.user?._id },
        })
            .select('name avatar_url department')
            .limit(10);

        res.json({
            success: true,
            data: users,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

export default router;
