import express, { Response } from 'express';
import Post from '../models/Post';
import Notification from '../models/Notification';
import { protect, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// @route   GET /api/posts
// @desc    Get all posts
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response) => {
    try {
        const { search } = req.query;
        const filter: any = {};
        
        if (search) {
            filter.content = { $regex: search, $options: 'i' };
        }

        const posts = await Post.find(filter)
            .populate('user_id', 'name avatar_url department')
            .populate('club_id', 'name')
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

// @route   POST /api/posts
// @desc    Create post
// @access  Private
router.post('/', protect, async (req: AuthRequest, res: Response) => {
    try {
        const { content, image_url, club_id } = req.body;

        if (typeof content !== 'undefined' && typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Content must be a string',
            });
        }

        if (typeof image_url !== 'undefined' && image_url !== null && typeof image_url !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Image URL must be a string',
            });
        }

        const hasContent = Boolean(content && content.trim().length > 0);
        const hasImage = Boolean(image_url && image_url.trim().length > 0);

        if (!hasContent && !hasImage) {
            return res.status(400).json({
                success: false,
                message: 'Either content or image is required',
            });
        }

        const post = await Post.create({
            user_id: req.user?._id,
            content: content?.trim() || '',
            image_url: image_url?.trim() || null,
            club_id: club_id || null,
        });

        const populatedPost = await Post.findById(post._id)
            .populate('user_id', 'name avatar_url department')
            .populate('club_id', 'name');

        res.status(201).json({
            success: true,
            data: populatedPost,
        });
    } catch (error: any) {
        console.error('Create post error:', error);
        const isValidationError = error?.name === 'ValidationError';
        res.status(isValidationError ? 400 : 500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/posts/:id
// @desc    Get single post
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('user_id', 'name avatar_url department')
            .populate('club_id', 'name')
            .populate('comments.user_id', 'name avatar_url');

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        res.json({
            success: true,
            data: post,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private
router.put('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        if (post.user_id.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this post' 
            });
        }

        const { content, image_url } = req.body;

        if (typeof content !== 'undefined' && typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Content must be a string',
            });
        }

        if (typeof image_url !== 'undefined' && image_url !== null && typeof image_url !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Image URL must be a string',
            });
        }

        const hasContent = Boolean(content && content.trim().length > 0);
        const hasImage = Boolean(image_url && image_url.trim().length > 0);

        if (!hasContent && !hasImage) {
            return res.status(400).json({
                success: false,
                message: 'Either content or image is required',
            });
        }

        post.content = content?.trim() || '';
        post.image_url = image_url?.trim() || null;
        await post.save();

        const updatedPost = await Post.findById(post._id)
            .populate('user_id', 'name avatar_url department')
            .populate('club_id', 'name');

        res.json({
            success: true,
            data: updatedPost,
        });
    } catch (error: any) {
        console.error('Update post error:', error);
        const isValidationError = error?.name === 'ValidationError';
        res.status(isValidationError ? 400 : 500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        if (post.user_id.toString() !== req.user?._id.toString() && !req.user?.is_admin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to delete this post' 
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

// @route   POST /api/posts/:id/like
// @desc    Like/unlike post
// @access  Private
router.post('/:id/like', protect, async (req: AuthRequest, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        const userId = req.user?._id;
        const likeIndex = post.likes.findIndex(
            (id) => id.toString() === userId?.toString()
        );

        if (likeIndex > -1) {
            // Unlike
            post.likes.splice(likeIndex, 1);
        } else {
            // Like
            post.likes.push(userId as mongoose.Types.ObjectId);

            // Create notification if not own post
            if (post.user_id.toString() !== userId?.toString()) {
                await Notification.create({
                    user_id: post.user_id,
                    type: 'like',
                    title: 'New Like',
                    message: `${req.user?.name} liked your post`,
                    reference_id: post._id,
                    reference_type: 'post',
                });
            }
        }

        await post.save();

        res.json({
            success: true,
            liked: likeIndex === -1,
            likes_count: post.likes.length,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   POST /api/posts/:id/comments
// @desc    Add comment
// @access  Private
router.post('/:id/comments', protect, async (req: AuthRequest, res: Response) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ 
                success: false, 
                message: 'Post not found' 
            });
        }

        const { content } = req.body;

        post.comments.push({
            _id: new mongoose.Types.ObjectId(),
            user_id: req.user?._id as mongoose.Types.ObjectId,
            content,
            created_at: new Date(),
        });

        await post.save();

        // Create notification if not own post
        if (post.user_id.toString() !== req.user?._id.toString()) {
            await Notification.create({
                user_id: post.user_id,
                type: 'comment',
                title: 'New Comment',
                message: `${req.user?.name} commented on your post`,
                reference_id: post._id,
                reference_type: 'post',
            });
        }

        const updatedPost = await Post.findById(post._id)
            .populate('user_id', 'name avatar_url department')
            .populate('comments.user_id', 'name avatar_url');

        res.status(201).json({
            success: true,
            data: updatedPost,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/posts/user/:userId
// @desc    Get user's posts
// @access  Private
router.get('/user/:userId', protect, async (req: AuthRequest, res: Response) => {
    try {
        const posts = await Post.find({ user_id: req.params.userId })
            .populate('user_id', 'name avatar_url department')
            .populate('club_id', 'name')
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

export default router;
