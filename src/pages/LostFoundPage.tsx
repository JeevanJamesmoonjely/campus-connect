import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Tag, Plus, Filter, X, Loader2, ImagePlus, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useLostFound } from '../hooks/useData';
import { useAuthStore } from '../store/authStore';
import { LostFoundService, MessageService } from '../services/api';
import type { LostAndFoundItem } from '../types';
import { ScrollReveal } from '../components/ui/ScrollReveal';

const CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Accessories', 'Documents', 'Other'];

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (item: Partial<LostAndFoundItem>) => Promise<void>;
}

const ReportModal = ({ isOpen, onClose, onSubmit }: ReportModalProps) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Electronics',
        location: '',
        type: 'lost' as 'lost' | 'found',
        contact_info: '',
        image_url: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            e.target.value = '';
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            alert('Please select an image smaller than 3MB.');
            e.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === 'string') {
                setFormData((prev) => ({ ...prev, image_url: result }));
            }
        };
        reader.readAsDataURL(file);
    };

    const clearSelectedImage = () => {
        setFormData((prev) => ({ ...prev, image_url: '' }));
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
            setFormData({ title: '', description: '', category: 'Electronics', location: '', type: 'lost', contact_info: '', image_url: '' });
        } catch (error) {
            alert('Failed to submit. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-xl font-bold">Report Lost/Found Item</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setFormData(d => ({ ...d, type: 'lost' }))}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'lost' ? 'bg-red-500 text-white' : 'text-gray-600'}`}
                        >
                            I Lost Something
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData(d => ({ ...d, type: 'found' }))}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.type === 'found' ? 'bg-green-500 text-white' : 'text-gray-600'}`}
                        >
                            I Found Something
                        </button>
                    </div>

                    <Input
                        label="Item Title"
                        placeholder="e.g., Blue Water Bottle"
                        value={formData.title}
                        onChange={(e) => setFormData(d => ({ ...d, title: e.target.value }))}
                        required
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Description</label>
                        <textarea
                            placeholder="Describe the item in detail..."
                            value={formData.description}
                            onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none h-24"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData(d => ({ ...d, category: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="Location"
                        placeholder="e.g., Library, Block A Room 204"
                        value={formData.location}
                        onChange={(e) => setFormData(d => ({ ...d, location: e.target.value }))}
                        leftIcon={MapPin}
                        required
                    />

                    <Input
                        label="Contact Info (optional)"
                        placeholder="Phone number or preferred contact method"
                        value={formData.contact_info}
                        onChange={(e) => setFormData(d => ({ ...d, contact_info: e.target.value }))}
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Image (optional)</label>
                        <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                        {formData.image_url ? (
                            <div className="relative rounded-xl overflow-hidden border border-border">
                                <img src={formData.image_url} alt="Selected item" className="w-full h-48 object-cover" />
                                <button
                                    type="button"
                                    onClick={clearSelectedImage}
                                    className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/70 transition-colors"
                                    aria-label="Remove selected image"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                className="w-full border border-dashed border-border rounded-xl p-4 text-sm text-text-secondary hover:border-brand hover:text-brand transition-colors flex items-center justify-center gap-2"
                            >
                                <ImagePlus className="w-4 h-4" />
                                Upload Image
                            </button>
                        )}
                    </div>

                    <Button type="submit" className="w-full" isLoading={isSubmitting}>
                        Submit Report
                    </Button>
                </form>
            </div>
        </div>
    );
};

export const LostFoundPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'lost' | 'found' | 'returned'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const { data: items, isLoading, error, refetch } = useLostFound(
        filter === 'all' ? undefined : filter,
        debouncedQuery || undefined
    );

    const handleCreateItem = async (itemData: Partial<LostAndFoundItem>) => {
        if (!user) {
            alert('Please login to report an item');
            return;
        }
        await LostFoundService.create({ ...itemData, user_id: user.id });
        refetch();
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        await LostFoundService.updateStatus(id, newStatus);
        refetch();
    };

    const handleMessageUser = async (recipientId?: string, itemTitle?: string, itemImage?: string) => {
        if (!user) {
            alert('Please login to send messages');
            return;
        }

        if (!recipientId || recipientId === user.id) return;

        try {
            const conversation = await MessageService.getOrCreateConversation(recipientId);
            const itemParam = itemTitle ? `&item=${encodeURIComponent(itemTitle)}` : '';
            const imgParam = itemImage ? `&img=${encodeURIComponent(itemImage)}` : '';
            navigate(`/messages?conversationId=${conversation.id}${itemParam}${imgParam}&type=lostfound`);
        } catch (error) {
            console.error('Failed to open conversation:', error);
            alert('Unable to open messages right now. Please try again.');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lost & Found</h1>
                    <p className="text-text-secondary mt-1">Help fellow students find their missing items.</p>
                </div>
                <Button leftIcon={Plus} onClick={() => setIsModalOpen(true)}>Report Item</Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                        type="text"
                        placeholder="Search for items..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                    />
                </div>
                <div className="flex bg-white p-1 border border-border rounded-xl shadow-sm">
                    {(['all', 'lost', 'found', 'returned'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === s
                                ? 'bg-brand text-white shadow-sm'
                                : 'text-text-secondary hover:bg-gray-50'
                                }`}
                        >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-brand" />
                </div>
            ) : error ? (
                <div className="text-center py-20 bg-red-50 rounded-3xl border border-red-200">
                    <p className="text-red-600">Error loading items. Please try again.</p>
                    <Button variant="secondary" className="mt-4" onClick={refetch}>Retry</Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items?.map((item) => (
                        <ScrollReveal key={item.id}>
                            <div className="card group hover:border-brand/40 transition-all h-full flex flex-col">
                                <div className="relative aspect-video bg-gray-100 flex items-center justify-center p-4">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <Tag className="w-12 h-12 text-gray-300" />
                                    )}
                                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.type === 'found' ? 'bg-green-100 text-green-700' :
                                        item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {item.type}
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="font-bold text-lg mb-2 group-hover:text-brand transition-colors">{item.title}</h3>
                                    <p className="text-sm text-text-secondary line-clamp-2 mb-4 leading-relaxed">
                                        {item.description}
                                    </p>

                                    <div className="flex flex-col gap-2 mb-auto">
                                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                                            <MapPin className="w-4 h-4 text-brand/60" />
                                            {item.location}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                                            <Filter className="w-4 h-4 text-brand/60" />
                                            {item.category}
                                        </div>
                                        {item.user && (
                                            <div className="flex items-center gap-2 text-xs text-text-secondary font-medium">
                                                Posted by {item.user.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                                        <span className="text-xs text-text-secondary">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </span>
                                        <div className="flex gap-2">
                                            {item.status !== 'resolved' && user?.id === item.user_id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(item.id, 'resolved')}
                                                >
                                                    Mark Resolved
                                                </Button>
                                            )}
                                            {item.contact_info && (
                                                <Button variant="ghost" size="sm">Contact</Button>
                                            )}
                                            {item.user_id && item.user_id !== user?.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    leftIcon={MessageCircle}
                                                    onClick={() => handleMessageUser(item.user_id, item.title, item.image_url)}
                                                >
                                                    Message
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollReveal>
                    ))}
                </div>
            )}

            {!isLoading && items?.length === 0 && (
                <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-border">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold">No items found</h3>
                    <p className="text-text-secondary mt-2">Try adjusting your filters or search query.</p>
                    <Button className="mt-4" onClick={() => setIsModalOpen(true)}>Report an Item</Button>
                </div>
            )}

            <ReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateItem}
            />
        </div>
    );
};
