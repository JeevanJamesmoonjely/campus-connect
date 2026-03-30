import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, Plus, IndianRupee, X, Loader2, ImagePlus, MessageCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useMarketplace } from '../hooks/useData';
import { useAuthStore } from '../store/authStore';
import { MarketplaceService, MessageService } from '../services/api';
import type { MarketplaceItem } from '../types';
import { ScrollReveal } from '../components/ui/ScrollReveal';

const CATEGORIES = ['All', 'Books', 'Electronics', 'Stationery', 'Other'];
const DEPARTMENTS = ['Engineering', 'Science', 'Arts', 'Commerce', 'Medicine', 'Law', 'Other'];

interface SellModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (item: Partial<MarketplaceItem>) => Promise<void>;
}

const SellModal = ({ isOpen, onClose, onSubmit }: SellModalProps) => {
    const { user } = useAuthStore();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'Books',
        condition: 'good' as 'new' | 'like_new' | 'good' | 'fair',
        department: user?.department || 'Engineering',
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
            await onSubmit({
                ...formData,
                price: parseFloat(formData.price)
            });
            onClose();
            setFormData({ title: '', description: '', price: '', category: 'Books', condition: 'good', department: user?.department || 'Engineering', image_url: '' });
        } catch (error) {
            alert('Failed to create listing. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-border flex items-center justify-between">
                    <h2 className="text-xl font-bold">Sell an Item</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <Input
                        label="Item Title"
                        placeholder="e.g., Engineering Mathematics Textbook"
                        value={formData.title}
                        onChange={(e) => setFormData(d => ({ ...d, title: e.target.value }))}
                        required
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Description</label>
                        <textarea
                            placeholder="Describe the item, its condition, etc..."
                            value={formData.description}
                            onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none h-24"
                            required
                        />
                    </div>

                    <Input
                        label="Price (₹)"
                        type="number"
                        placeholder="500"
                        value={formData.price}
                        onChange={(e) => setFormData(d => ({ ...d, price: e.target.value }))}
                        leftIcon={IndianRupee}
                        required
                    />

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData(d => ({ ...d, category: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20"
                        >
                            {CATEGORIES.filter(c => c !== 'All').map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Condition</label>
                        <select
                            value={formData.condition}
                            onChange={(e) => setFormData(d => ({ ...d, condition: e.target.value as 'new' | 'like_new' | 'good' | 'fair' }))}
                            className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20"
                        >
                            <option value="new">New</option>
                            <option value="like_new">Like New</option>
                            <option value="good">Good</option>
                            <option value="fair">Fair</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Department</label>
                        <select
                            value={formData.department}
                            onChange={(e) => setFormData(d => ({ ...d, department: e.target.value }))}
                            className="w-full px-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20"
                        >
                            {DEPARTMENTS.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

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
                        List for Sale
                    </Button>
                </form>
            </div>
        </div>
    );
};

export const MarketplacePage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: items, isLoading, error, refetch } = useMarketplace(
        activeCategory === 'All' ? undefined : activeCategory,
        searchQuery || undefined,
        minPrice ? parseFloat(minPrice) : undefined,
        maxPrice ? parseFloat(maxPrice) : undefined
    );

    const handleCreateListing = async (itemData: Partial<MarketplaceItem>) => {
        if (!user) {
            alert('Please login to sell an item');
            return;
        }
        await MarketplaceService.create({ ...itemData, seller_id: user.id });
        refetch();
    };

    const handleMarkSold = async (id: string) => {
        await MarketplaceService.updateStatus(id, 'sold');
        refetch();
    };

    const handleMessageSeller = async (sellerId?: string, itemTitle?: string, itemImage?: string) => {
        if (!user) {
            alert('Please login to send messages');
            return;
        }

        if (!sellerId || sellerId === user.id) return;

        try {
            const conversation = await MessageService.getOrCreateConversation(sellerId);
            const itemParam = itemTitle ? `&item=${encodeURIComponent(itemTitle)}` : '';
            const imgParam = itemImage ? `&img=${encodeURIComponent(itemImage)}` : '';
            navigate(`/messages?conversationId=${conversation.id}${itemParam}${imgParam}&type=marketplace`);
        } catch (error) {
            console.error('Failed to open conversation:', error);
            alert('Unable to open messages right now. Please try again.');
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
                    <p className="text-text-secondary mt-1">Buy and sell items within the student community.</p>
                </div>
                <Button leftIcon={Plus} onClick={() => setIsModalOpen(true)}>Sell Item</Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-64 space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-text-secondary">Categories</h3>
                        <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-left text-sm font-medium transition-all whitespace-nowrap ${activeCategory === cat
                                        ? 'bg-brand text-white shadow-sm'
                                        : 'text-text-secondary hover:bg-gray-100'
                                        }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-text-secondary">Filter by Price</h3>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-border rounded-xl text-sm"
                            />
                            <span className="text-text-secondary">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-border rounded-xl text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                        />
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
                    ) : items && items.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {items.map((item) => (
                                <ScrollReveal key={item.id}>
                                    <div className="card group hover:shadow-md transition-all h-full flex flex-col">
                                        <div className="aspect-square bg-gray-50 flex items-center justify-center relative">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <ShoppingBag className="w-16 h-16 text-gray-200 group-hover:scale-110 transition-transform duration-500" />
                                            )}
                                            <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-brand font-bold text-sm shadow-sm flex items-center gap-1">
                                                ₹{item.price}
                                            </div>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="text-xs font-semibold text-brand uppercase tracking-wider mb-1">{item.category}</div>
                                            <h3 className="font-bold text-lg leading-tight mb-2">{item.title}</h3>
                                            <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                                                {item.description}
                                            </p>
                                            {item.seller && (
                                                <p className="text-xs text-text-secondary mb-3 mt-auto">
                                                    Seller: {item.seller.name}
                                                </p>
                                            )}
                                            <div className="flex items-center justify-between mt-auto">
                                                <div className="text-[10px] bg-gray-100 px-2 py-1 rounded text-text-secondary font-bold uppercase tracking-tighter">
                                                    {item.department}
                                                </div>
                                                {user?.id === item.seller_id ? (
                                                    <Button size="sm" variant="secondary" onClick={() => handleMarkSold(item.id)}>
                                                        Mark Sold
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        leftIcon={MessageCircle}
                                                        onClick={() => handleMessageSeller(item.seller_id || item.user_id, item.title, item.image_url)}
                                                    >
                                                        Message
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-border">
                            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold">No items found</h3>
                            <p className="text-text-secondary mt-2">Try adjusting your filters or be the first to list!</p>
                            <Button className="mt-4" onClick={() => setIsModalOpen(true)}>Sell Something</Button>
                        </div>
                    )}
                </div>
            </div>

            <SellModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleCreateListing}
            />
        </div>
    );
};
