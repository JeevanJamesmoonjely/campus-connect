import express, { Response } from 'express';
import Event from '../models/Event';
import { protect, adminOnly, AuthRequest } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/events
// @desc    Get all events
// @access  Public
router.get('/', async (req: express.Request, res: Response) => {
    try {
        const { category, search } = req.query;
        const filter: Record<string, any> = {};
        
        if (category) filter.category = category;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        const events = await Event.find(filter)
            .populate('created_by', 'name')
            .sort({ date: 1 });

        res.json({
            success: true,
            data: events,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   POST /api/events
// @desc    Create event (admin only)
// @access  Private/Admin
router.post('/', protect, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, date, time, location, category, image_url, attendees_count } = req.body;

        const event = await Event.create({
            title,
            description,
            date,
            time,
            location,
            category,
            image_url,
            attendees_count: attendees_count || 0,
            created_by: req.user?._id,
        });

        const populatedEvent = await Event.findById(event._id)
            .populate('created_by', 'name');

        res.status(201).json({
            success: true,
            data: populatedEvent,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Public
router.get('/:id', async (req: express.Request, res: Response) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('created_by', 'name');

        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }

        res.json({
            success: true,
            data: event,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   PUT /api/events/:id
// @desc    Update event (admin only)
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, date, time, location, category, image_url, attendees_count } = req.body;

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { title, description, date, time, location, category, image_url, attendees_count },
            { new: true, runValidators: true }
        ).populate('created_by', 'name');

        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }

        res.json({
            success: true,
            data: event,
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

// @route   DELETE /api/events/:id
// @desc    Delete event (admin only)
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req: AuthRequest, res: Response) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }

        res.json({
            success: true,
            message: 'Event deleted successfully',
        });
    } catch (error: any) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Server error' 
        });
    }
});

export default router;
