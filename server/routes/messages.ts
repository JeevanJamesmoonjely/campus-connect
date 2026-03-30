import express, { Response } from 'express';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Notification from '../models/Notification';
import { protect, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', protect, async (req: AuthRequest, res: Response) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user?._id
        })
            .populate('participants', 'name avatar_url department')
            .sort({ last_message_at: -1 });

        // Get unread count for each conversation
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    conversation_id: conv._id,
                    sender_id: { $ne: req.user?._id },
                    read: false,
                });
                return {
                    ...conv.toJSON(),
                    unread_count: unreadCount,
                };
            })
        );

        res.json({
            success: true,
            data: conversationsWithUnread,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   POST /api/messages/conversations
// @desc    Create or get conversation with user
// @access  Private
router.post('/conversations', protect, async (req: AuthRequest, res: Response) => {
    try {
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Recipient ID is required' 
            });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [req.user?._id, recipientId] }
        }).populate('participants', 'name avatar_url department');

        if (!conversation) {
            // Create new conversation
            conversation = await Conversation.create({
                participants: [req.user?._id, recipientId],
            });
            conversation = await Conversation.findById(conversation._id)
                .populate('participants', 'name avatar_url department');
        }

        res.status(201).json({
            success: true,
            data: conversation,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/messages/conversations/:id
// @desc    Get conversation messages
// @access  Private
router.get('/conversations/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Conversation not found' 
            });
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(
            (p) => p.toString() === req.user?._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to view this conversation' 
            });
        }

        const messages = await Message.find({ conversation_id: req.params.id })
            .populate('sender_id', 'name avatar_url')
            .sort({ created_at: 1 });

        // Mark messages as read
        await Message.updateMany(
            {
                conversation_id: req.params.id,
                sender_id: { $ne: req.user?._id },
                read: false,
            },
            { read: true }
        );

        res.json({
            success: true,
            data: messages,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   POST /api/messages/conversations/:id
// @desc    Send message in conversation
// @access  Private
router.post('/conversations/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const conversation = await Conversation.findById(req.params.id);

        if (!conversation) {
            return res.status(404).json({ 
                success: false, 
                message: 'Conversation not found' 
            });
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(
            (p) => p.toString() === req.user?._id.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to send message in this conversation' 
            });
        }

        const { content } = req.body;

        const message = await Message.create({
            conversation_id: req.params.id,
            sender_id: req.user?._id,
            content,
        });

        // Update conversation
        conversation.last_message = content;
        conversation.last_message_at = new Date();
        await conversation.save();

        // Create notification for recipient
        const recipientId = conversation.participants.find(
            (p) => p.toString() !== req.user?._id.toString()
        );

        if (recipientId) {
            await Notification.create({
                user_id: recipientId,
                type: 'message',
                title: 'New Message',
                message: `${req.user?.name} sent you a message`,
                reference_id: conversation._id,
                reference_type: 'conversation',
            });
        }

        const populatedMessage = await Message.findById(message._id)
            .populate('sender_id', 'name avatar_url');

        res.status(201).json({
            success: true,
            data: populatedMessage,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/messages/unread
// @desc    Get unread message count
// @access  Private
router.get('/unread', protect, async (req: AuthRequest, res: Response) => {
    try {
        // Get user's conversations
        const conversations = await Conversation.find({
            participants: req.user?._id
        });

        const conversationIds = conversations.map(c => c._id);

        const unreadCount = await Message.countDocuments({
            conversation_id: { $in: conversationIds },
            sender_id: { $ne: req.user?._id },
            read: false,
        });

        res.json({
            success: true,
            count: unreadCount,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

export default router;
