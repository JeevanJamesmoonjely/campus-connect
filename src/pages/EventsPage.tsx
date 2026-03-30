import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, MapPin, Clock, Users, Search, X, Building2, Plus, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReveal } from '../components/ui/ScrollReveal';
import { useEvents } from '../hooks/useData';
import { useAuthStore } from '../store/authStore';
import { EventService } from '../services/api';
import { EventFormModal } from '../components/EventFormModal';
import type { Event } from '../types';

const CATEGORIES = ['All', 'Technology', 'Sports', 'Culture', 'Workshop', 'Music', 'Career'];

const MOCK_EVENTS: Event[] = [
    {
        id: 'mock-1',
        title: 'Tech Talk: AI & Machine Learning',
        description: 'Join us for an exciting discussion on the latest advancements in AI and machine learning technologies.',
        date: '2026-03-28',
        time: '2:00 PM',
        location: 'Auditorium A',
        category: 'Technology',
        attendees_count: 234,
        image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator: { name: 'Computer Science Club', email: 'csclub@campus.edu' } as any
    },
    {
        id: 'mock-2',
        title: 'Annual Sports Festival',
        description: 'Get ready for our biggest sports event of the year with competitions, games, and entertainment!',
        date: '2026-03-30',
        time: '9:00 AM',
        location: 'Sports Complex',
        category: 'Sports',
        attendees_count: 456,
        image_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=400&fit=crop',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator: { name: 'Sports & Athletics Club', email: 'sportsclub@campus.edu' } as any
    },
    {
        id: 'mock-3',
        title: 'Cultural Night 2026',
        description: 'Celebrate diverse cultures through music, dance, food, and art from around the world.',
        date: '2026-04-05',
        time: '6:00 PM',
        location: 'Main Hall',
        category: 'Culture',
        attendees_count: 312,
        image_url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=400&fit=crop',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator: { name: 'Cultural Committee', email: 'cultural@campus.edu' } as any
    },
    {
        id: 'mock-4',
        title: 'Entrepreneurship Workshop',
        description: 'Learn how to turn your ideas into successful startups with industry experts and mentors.',
        date: '2026-04-08',
        time: '10:00 AM',
        location: 'Innovation Hub',
        category: 'Workshop',
        attendees_count: 128,
        image_url: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&h=400&fit=crop',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator: { name: 'E-Cell', email: 'ecell@campus.edu' } as any
    },
    {
        id: 'mock-5',
        title: 'Music Concert Series',
        description: 'Experience amazing performances by talented student musicians and guest artists.',
        date: '2026-04-12',
        time: '7:00 PM',
        location: 'Concert Hall',
        category: 'Music',
        attendees_count: 389,
        image_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=400&fit=crop',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator: { name: 'Music Club', email: 'musicclub@campus.edu' } as any
    },
    {
        id: 'mock-6',
        title: 'Career Fair 2026',
        description: 'Meet top companies and explore career opportunities across various industries.',
        date: '2026-04-15',
        time: '11:00 AM',
        location: 'Convention Center',
        category: 'Career',
        attendees_count: 567,
        image_url: 'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&h=400&fit=crop',
        created_by: 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        creator: { name: 'Placement Cell', email: 'placement@campus.edu' } as any
    }
];

const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
        'Technology': 'bg-blue-100 text-blue-700',
        'Sports': 'bg-green-100 text-green-700',
        'Culture': 'bg-purple-100 text-purple-700',
        'Workshop': 'bg-orange-100 text-orange-700',
        'Music': 'bg-pink-100 text-pink-700',
        'Career': 'bg-indigo-100 text-indigo-700',
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
};

const getCategoryAccent = (category: string) => {
    const accents: { [key: string]: string } = {
        'Technology': '#3B82F6',
        'Sports': '#22C55E',
        'Culture': '#A855F7',
        'Workshop': '#F97316',
        'Music': '#EC4899',
        'Career': '#6366F1',
    };
    return accents[category] || '#6B7280';
};

// ── Event Detail Modal ──────────────────────────────────────────────────────────
interface EventDetailModalProps {
    event: Event;
    onClose: () => void;
}

const EventDetailModal = ({ event, onClose }: EventDetailModalProps) => {
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };

    const maxParticipants = 100; // Standard for now if not in DB
    const spotsLeft = maxParticipants - event.attendees_count;
    const fillPercent = Math.min((event.attendees_count / maxParticipants) * 100, 100);
    const accent = getCategoryAccent(event.category);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Hero Image */}
                {event.image_url && (
                    <div className="relative h-52 w-full overflow-hidden rounded-t-2xl">
                        <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.65))' }} />
                        <span className={`absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(event.category)}`}>
                            {event.category}
                        </span>
                    </div>
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 hover:bg-white shadow-md transition-all"
                >
                    <X className="w-5 h-5 text-gray-700" />
                </button>

                <div className="p-6 space-y-6">
                    {/* Title & Organising Club */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4" style={{ color: accent }} />
                            <span className="text-sm font-semibold" style={{ color: accent }}>{event.creator?.name || 'Club'}</span>
                            <span className="text-xs text-gray-400">· {event.category}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">{event.title}</h2>
                        <p className="text-sm text-gray-500 mt-2 leading-relaxed">{event.description}</p>
                    </div>

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                            <Calendar className="w-5 h-5 mt-0.5 shrink-0" style={{ color: accent }} />
                            <div>
                                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Date</p>
                                <p className="text-sm font-semibold text-gray-800">{formatDate(event.date)}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                            <Clock className="w-5 h-5 mt-0.5 shrink-0" style={{ color: accent }} />
                            <div>
                                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Time</p>
                                <p className="text-sm font-semibold text-gray-800">{event.time}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                            <MapPin className="w-5 h-5 mt-0.5 shrink-0" style={{ color: accent }} />
                            <div>
                                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Venue</p>
                                <p className="text-sm font-semibold text-gray-800">{event.location}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                            <Users className="w-5 h-5 mt-0.5 shrink-0" style={{ color: accent }} />
                            <div>
                                <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Organiser</p>
                                <p className="text-sm font-semibold text-gray-800">{event.creator?.name || 'Admin'}</p>
                                <p className="text-xs text-gray-400">{event.creator?.email || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Participants Progress */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" style={{ color: accent }} />
                                <span className="text-sm font-semibold text-gray-700">Participants</span>
                            </div>
                            <span className="text-sm font-bold" style={{ color: accent }}>
                                {event.attendees_count} / {maxParticipants}
                            </span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${fillPercent}%`, backgroundColor: accent }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                            {spotsLeft > 0
                                ? <span className="text-green-600 font-medium">{spotsLeft} spots remaining</span>
                                : <span className="text-red-500 font-medium">Fully booked</span>
                            }
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2 border-t border-gray-100">
                        <button
                            className="flex-1 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
                            style={{ backgroundColor: accent }}
                        >
                            Register Now
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── Main Page ───────────────────────────────────────────────────────────────────
export const EventsPage = () => {
    const { user } = useAuthStore();
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchParams] = useSearchParams();
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [showEventForm, setShowEventForm] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const { data: events, isLoading, refetch } = useEvents(selectedCategory === 'All' ? undefined : selectedCategory);

    useEffect(() => {
        const eventId = searchParams.get('id');
        if (eventId && events) {
            const event = events.find(e => e.id === eventId);
            if (event) {
                setSelectedEvent(event);
            }
        }
    }, [searchParams, events]);

    const allEvents = [...(events || []), ...MOCK_EVENTS];

    const filteredEvents = allEvents.filter(event => {
        const matchSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (event.creator?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchCategory = selectedCategory === 'All' || event.category === selectedCategory;
        return matchSearch && matchCategory;
    });

    const sortedEvents = [...filteredEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    };

    const handleCreateEvent = async (formData: any) => {
        setIsCreating(true);
        try {
            await EventService.create(formData);
            await refetch();
            setShowEventForm(false);
        } catch (error) {
            console.error('Failed to create event:', error);
            alert('Failed to create event. Please try again.');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campus Events</h1>
                    <p className="text-text-secondary mt-1">Discover and join exciting events happening on campus.</p>
                </div>
                {user?.is_admin && (
                    <Button 
                        onClick={() => setShowEventForm(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Event
                    </Button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full md:w-64 space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-text-secondary">Categories</h3>
                        <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
                            {CATEGORIES.map((cat) => (
                                <motion.button
                                    key={cat}
                                    whileHover={{ x: 4 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-left text-sm font-medium transition-all whitespace-nowrap relative ${selectedCategory === cat
                                        ? 'bg-brand text-white shadow-md'
                                        : 'text-text-secondary hover:bg-gray-100'
                                        }`}
                                >
                                    {cat}
                                    {selectedCategory === cat && (
                                        <motion.div 
                                            layoutId="cat-active"
                                            className="absolute left-0 w-1 h-4 bg-white rounded-r-full"
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Events List */}
                <div className="flex-1 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                        <input
                            type="text"
                            placeholder="Search events, organizers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                        />
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 animate-spin text-brand" />
                        </div>
                    ) : sortedEvents.length > 0 ? (
                        <div className="space-y-4">
                            {sortedEvents.map((event) => (
                                <ScrollReveal key={event.id}>
                                    <div className="card p-6 hover:border-brand/40 transition-all">
                                        <div className="flex gap-6">
                                            {event.image_url && (
                                                <div className="hidden sm:block w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-1">
                                                    <div>
                                                        <h3 className="font-bold text-lg hover:text-brand transition-colors">{event.title}</h3>
                                                        <div className="flex items-center gap-1.5 mt-1 mb-2">
                                                            <Building2 className="w-3.5 h-3.5 text-brand" />
                                                            <span className="text-xs font-semibold text-brand">{event.creator?.name || 'Club'}</span>
                                                        </div>
                                                        <p className="text-xs text-text-secondary line-clamp-2">{event.description}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${getCategoryColor(event.category)}`}>
                                                        {event.category}
                                                    </span>
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-border/50 text-sm text-text-secondary">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-brand" />
                                                        {formatDate(event.date)}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-brand" />
                                                        {event.time}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-4 h-4 text-brand" />
                                                        {event.location}
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-auto">
                                                        <Users className="w-4 h-4 text-brand" />
                                                        {event.attendees_count} attending
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex gap-2">
                                                    <Button size="sm">Attend Event</Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedEvent(event)}
                                                    >
                                                        Learn More
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    ) : (
                        <div className="card p-12 text-center">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold">No events found</h3>
                            <p className="text-text-secondary mt-2">Try adjusting your filters or search query.</p>
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {selectedEvent && (
                    <EventDetailModal
                        event={selectedEvent}
                        onClose={() => setSelectedEvent(null)}
                    />
                )}
            </AnimatePresence>

            <EventFormModal
                isOpen={showEventForm}
                onClose={() => setShowEventForm(false)}
                onSubmit={handleCreateEvent}
                isLoading={isCreating}
            />
        </div>
    );
};
