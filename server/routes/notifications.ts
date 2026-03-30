import express, { Response } from 'express';
import Notification from '../models/Notification';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response) => {
    try {
        const notifications = await Notification.find({ user_id: req.user?._id })
            .sort({ created_at: -1 })
            .limit(50);

        res.json({
            success: true,
            data: notifications,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/notifications/unread
// @desc    Get unread notification count
// @access  Private
router.get('/unread', protect, async (req: AuthRequest, res: Response) => {
    try {
        const count = await Notification.countDocuments({
            user_id: req.user?._id,
            read: false,
        });

        res.json({
            success: true,
            count,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, async (req: AuthRequest, res: Response) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ 
                success: false, 
                message: 'Notification not found' 
            });
        }

        if (notification.user_id.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized' 
            });
        }

        notification.read = true;
        await notification.save();

        res.json({
            success: true,
            data: notification,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, async (req: AuthRequest, res: Response) => {
    try {
        await Notification.updateMany(
            { user_id: req.user?._id, read: false },
            { read: true }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ 
                success: false, 
                message: 'Notification not found' 
            });
        }

        if (notification.user_id.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized' 
            });
        }

        await notification.deleteOne();

        res.json({
            success: true,
            message: 'Notification deleted',
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

export default router;
