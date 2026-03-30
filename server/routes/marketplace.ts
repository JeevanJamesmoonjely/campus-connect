import express, { Response } from 'express';
import Marketplace from '../models/Marketplace';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/marketplace
// @desc    Get all marketplace items
// @access  Private
router.get('/', protect, async (req: AuthRequest, res: Response) => {
    try {
        const { category, status, condition } = req.query;
        const filter: any = {};
        
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (condition) filter.condition = condition;

        const items = await Marketplace.find(filter)
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

// @route   POST /api/marketplace
// @desc    Create listing
// @access  Private
router.post('/', protect, async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, price, category, condition, image_url, contact_info } = req.body;

        const item = await Marketplace.create({
            user_id: req.user?._id,
            title,
            description,
            price,
            category,
            condition,
            image_url,
            contact_info,
        });

        const populatedItem = await Marketplace.findById(item._id)
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

// @route   GET /api/marketplace/:id
// @desc    Get single listing
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const item = await Marketplace.findById(req.params.id)
            .populate('user_id', 'name avatar_url department');

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Listing not found' 
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

// @route   PUT /api/marketplace/:id
// @desc    Update listing
// @access  Private
router.put('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const item = await Marketplace.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Listing not found' 
            });
        }

        if (item.user_id.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this listing' 
            });
        }

        const { title, description, price, category, condition, image_url, status, contact_info } = req.body;

        const updatedItem = await Marketplace.findByIdAndUpdate(
            req.params.id,
            { title, description, price, category, condition, image_url, status, contact_info },
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

// @route   DELETE /api/marketplace/:id
// @desc    Delete listing
// @access  Private
router.delete('/:id', protect, async (req: AuthRequest, res: Response) => {
    try {
        const item = await Marketplace.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Listing not found' 
            });
        }

        if (item.user_id.toString() !== req.user?._id.toString() && !req.user?.is_admin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to delete this listing' 
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

// @route   PUT /api/marketplace/:id/status
// @desc    Update listing status (available/sold/reserved)
// @access  Private
router.put('/:id/status', protect, async (req: AuthRequest, res: Response) => {
    try {
        const item = await Marketplace.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ 
                success: false, 
                message: 'Listing not found' 
            });
        }

        if (item.user_id.toString() !== req.user?._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to update this listing' 
            });
        }

        const { status } = req.body;
        item.status = status;
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
