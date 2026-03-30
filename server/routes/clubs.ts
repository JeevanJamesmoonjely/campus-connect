import express, { Response } from 'express';
import Club from '../models/Club';
import Post from '../models/Post';
import Notification from '../models/Notification';
import { protect, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// @route   GET /api/clubs
// @desc    Get all clubs
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response) => {
    try {
        const clubs = await Club.find({ is_active: true })
            .populate('created_by', 'name avatar_url')
            .sort({ member_count: -1, created_at: -1 });

        res.json({
            success: true,
            data: clubs,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   POST /api/clubs
// @desc    Create club
// @access  Private
router.post('/', protect, async (req: AuthRequest, res: Response) => {
    try {
        const { name, description, image_url, category } = req.body;

        const club = await Club.create({
            name,
            description,
            image_url,
            category,
            created_by: req.user?._id,
            members: [{
                user_id: req.user?._id,
                role: 'admin',
                joined_at: new Date(),
            }],
        });

        const populatedClub = await Club.findById(club._id)
            .populate('created_by', 'name avatar_url');

        res.status(201).json({
            success: true,
            data: populatedClub,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/clubs/:id
// @desc    Get single club
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const club = await Club.findById(req.params.id)
            .populate('created_by', 'name avatar_url')
            .populate('members.user_id', 'name avatar_url department');

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

// @route   PUT /api/clubs/:id
// @desc    Update club
// @access  Private (Admin only)
router.put('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const club = await Club.findById(req.params.id);

        if (!club) {
            return res.status(404).json({ 
                success: false, 
                message: 'Club not found' 
            });
        }

        // Check if user is club admin
        const membership = club.members.find(
            (m) => m.user_id.toString() === req.user?._id.toString()
        );

        if (!membership || membership.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this club' 
            });
        }

        const { name, description, image_url, category } = req.body;

        const updatedClub = await Club.findByIdAndUpdate(
            req.params.id,
            { name, description, image_url, category },
            { new: true, runValidators: true }
        ).populate('created_by', 'name avatar_url');

        res.json({
            success: true,
            data: updatedClub,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   POST /api/clubs/:id/join
// @desc    Join club
// @access  Private
router.post('/:id/join', protect, async (req: AuthRequest, res: Response) => {
    try {
        const club = await Club.findById(req.params.id);

        if (!club) {
            return res.status(404).json({ 
                success: false, 
                message: 'Club not found' 
            });
        }

        // Check if already member
        const isMember = club.members.some(
            (m) => m.user_id.toString() === req.user?._id.toString()
        );

        if (isMember) {
            return res.status(400).json({ 
                success: false, 
                message: 'Already a member of this club' 
            });
        }

        club.members.push({
            user_id: req.user?._id as mongoose.Types.ObjectId,
            role: 'member',
            joined_at: new Date(),
        });

        await club.save();

        res.json({
            success: true,
            message: 'Joined club successfully',
            data: club,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   POST /api/clubs/:id/leave
// @desc    Leave club
// @access  Private
router.post('/:id/leave', protect, async (req: AuthRequest, res: Response) => {
    try {
        const club = await Club.findById(req.params.id);

        if (!club) {
            return res.status(404).json({ 
                success: false, 
                message: 'Club not found' 
            });
        }

        const memberIndex = club.members.findIndex(
            (m) => m.user_id.toString() === req.user?._id.toString()
        );

        if (memberIndex === -1) {
            return res.status(400).json({ 
                success: false, 
                message: 'Not a member of this club' 
            });
        }

        // Prevent creator from leaving
        if (club.created_by.toString() === req.user?._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Club creator cannot leave the club' 
            });
        }

        club.members.splice(memberIndex, 1);
        await club.save();

        res.json({
            success: true,
            message: 'Left club successfully',
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/clubs/:id/posts
// @desc    Get club posts
// @access  Private
router.get('/:id/posts', protect, async (req: AuthRequest, res: Response) => {
    try {
        const posts = await Post.find({ club_id: req.params.id })
            .populate('user_id', 'name avatar_url department')
            .populate('comments.user_id', 'name avatar_url')
            .sort({ created_at: -1 });

        res.json({
            success: true,
            data: posts,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/clubs/user/memberships
// @desc    Get user's club memberships
// @access  Private
router.get('/user/memberships', protect, async (req: AuthRequest, res: Response) => {
    try {
        const clubs = await Club.find({
            'members.user_id': req.user?._id,
            is_active: true,
        })
            .populate('created_by', 'name avatar_url')
            .sort({ created_at: -1 });

        res.json({
            success: true,
            data: clubs,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

export default router;
