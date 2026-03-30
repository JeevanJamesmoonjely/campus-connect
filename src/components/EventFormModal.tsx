import { useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { Button } from './ui/Button';
import type { Event } from '../types';

interface EventFormModalProps {
    isOpen: boolean;
    event?: Event;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    isLoading?: boolean;
}

const EVENT_CATEGORIES = ['Technology', 'Sports', 'Culture', 'Workshop', 'Music', 'Career', 'Academic'];

export const EventFormModal = ({ isOpen, event, onClose, onSubmit, isLoading }: EventFormModalProps) => {
    const [formData, setFormData] = useState({
        title: event?.title || '',
        description: event?.description || '',
        date: event?.date || '',
        time: event?.time || '',
        location: event?.location || '',
        category: event?.category || 'Technology',
        image_url: event?.image_url || '',
        attendees_count: event?.attendees_count || 0,
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(event?.image_url || null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result;
                if (typeof result === 'string') {
                    setImagePreview(result);
                    setSelectedImage(result);
                    setFormData({ ...formData, image_url: result });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
        setSelectedImage(null);
        setFormData({ ...formData, image_url: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description || !formData.date || !formData.time || !formData.location) {
            alert('Please fill in all required fields');
            return;
        }
        try {
            await onSubmit(formData);
            setFormData({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                category: 'Technology',
                image_url: '',
                attendees_count: 0,
            });
            setImagePreview(null);
            setSelectedImage(null);
            onClose();
        } catch (error) {
            console.error('Error submitting event:', error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white">
                    <h2 className="text-xl font-bold">{event ? 'Edit Event' : 'Create Event'}</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Image Upload */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            Event Image (Optional)
                        </label>
                        <div className="relative">
                            {imagePreview || selectedImage ? (
                                <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                                    <img
                                        src={(imagePreview || selectedImage) as string}
                                        alt="Event preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Upload className="w-8 h-8 text-text-secondary mb-2" />
                                        <p className="text-sm text-text-secondary">Click to upload image</p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            Title *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Event title"
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            Description *
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Event description"
                            rows={3}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-none"
                            required
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-primary">
                                Date *
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-text-primary">
                                Time *
                            </label>
                            <input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                                required
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            Location *
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Event location"
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-text-primary">
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                        >
                            {EVENT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-center rounded-lg border border-border text-text-primary hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="flex-1 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {event ? 'Updating...' : 'Creating...'}
                                </>
                            ) : (
                                event ? 'Update Event' : 'Create Event'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
