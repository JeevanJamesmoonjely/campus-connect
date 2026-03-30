import express, { Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import LostAndFound from '../models/LostAndFound';
import Marketplace from '../models/Marketplace';
import Club from '../models/Club';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Apply protect and adminOnly middleware to all routes
router.use(protect, adminOnly);

// @route   GET /api/admin/stats
// @desc    Get dashboard stats
// @access  Admin
router.get('/stats', async (req: AuthRequest, res: Response) => {
    try {
        const [
            totalUsers,
            totalPosts,
            totalLostFound,
            totalMarketplace,
            totalClubs,
            recentUsers,
        ] = await Promise.all([
            User.countDocuments(),
            Post.countDocuments(),
            LostAndFound.countDocuments(),
            Marketplace.countDocuments(),
            Club.countDocuments(),
            User.find().sort({ created_at: -1 }).limit(5).select('name email department created_at'),
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalPosts,
                totalLostFound,
                totalMarketplace,
                totalClubs,
                recentUsers,
            },
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Admin
router.get('/users', async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find()
            .sort({ created_at: -1 });

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

// @route   PUT /api/admin/users/:id
// @desc    Update user (admin actions)
// @access  Admin
router.put('/users/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { is_admin } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { is_admin },
            { new: true }
        );

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

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Prevent deleting self
        if (user._id.toString() === req.user?._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete your own account' 
            });
        }

        await user.deleteOne();

        res.json({
            success: true,
            message: 'User deleted',
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   DELETE /api/admin/posts/:id
// @desc    Delete any post
// @access  Admin
router.delete('/posts/:id', async (req: AuthRequest, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        await post.deleteOne();

        res.json({
            success: true,
            message: 'Post deleted',
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   DELETE /api/admin/lostfound/:id
// @desc    Delete any lost/found item
// @access  Admin
router.delete('/lostfound/:id', async (req: AuthRequest, res: Response) => {
    try {
        const item = await LostAndFound.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        await item.deleteOne();

        res.json({
            success: true,
            message: 'Item deleted',
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   DELETE /api/admin/marketplace/:id
// @desc    Delete any marketplace listing
// @access  Admin
router.delete('/marketplace/:id', async (req: AuthRequest, res: Response) => {
    try {
        const item = await Marketplace.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Listing not found' 
            });
        }

        await item.deleteOne();

        res.json({
            success: true,
            message: 'Listing deleted',
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   PUT /api/admin/clubs/:id
// @desc    Update club (activate/deactivate)
// @access  Admin
router.put('/clubs/:id', async (req: AuthRequest, res: Response) => {
    try {
        const { is_active } = req.body;

        const club = await Club.findByIdAndUpdate(
            req.params.id,
            { is_active },
            { new: true }
        );

        if (!club) {
            return res.status(404).json({ 
                success: false, 
                message: 'Club not found' 
            });
        }

        res.json({
            success: true,
            data: club,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

export default router;
