import express, { Response } from 'express';
import LostAndFound from '../models/LostAndFound';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/lostfound
// @desc    Get all lost and found items
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response) => {
    try {
        const { type, status, search } = req.query;
        const filter: any = {};
        
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const items = await LostAndFound.find(filter)
            .populate('user_id', 'name avatar_url department')
            .sort({ created_at: -1 });

        res.json({
            success: true,
            data: items,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   POST /api/lostfound
// @desc    Create lost/found item
// @access  Private
router.post('/', protect, async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, type, location, category, image_url, contact_info } = req.body;

        const item = await LostAndFound.create({
            user_id: req.user?._id,
            title,
            description,
            type,
            location,
            category,
            image_url,
            contact_info,
        });

        const populatedItem = await LostAndFound.findById(item._id)
            .populate('user_id', 'name avatar_url department');

        res.status(201).json({
            success: true,
            data: populatedItem,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/lostfound/:id
// @desc    Get single item
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const item = await LostAndFound.findById(req.params.id)
            .populate('user_id', 'name avatar_url department');

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        res.json({
            success: true,
            data: item,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   PUT /api/lostfound/:id
// @desc    Update item
// @access  Private
router.put('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const item = await LostAndFound.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        if (item.user_id.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this item' 
            });
        }

        const { title, description, location, category, image_url, status, contact_info } = req.body;

        const updatedItem = await LostAndFound.findByIdAndUpdate(
            req.params.id,
            { title, description, location, category, image_url, status, contact_info },
            { new: true, runValidators: true }
        ).populate('user_id', 'name avatar_url department');

        res.json({
            success: true,
            data: updatedItem,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   DELETE /api/lostfound/:id
// @desc    Delete item
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const item = await LostAndFound.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        if (item.user_id.toString() !== req.user?._id.toString() && !req.user?.is_admin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to delete this item' 
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

// @route   PUT /api/lostfound/:id/resolve
// @desc    Mark item as resolved
// @access  Private
router.put('/:id/resolve', protect, async (req: AuthRequest, res: Response) => {
    try {
        const item = await LostAndFound.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Item not found' 
            });
        }

        if (item.user_id.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to resolve this item' 
            });
        }

        item.status = 'resolved';
        await item.save();

        res.json({
            success: true,
            data: item,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

export default router;
