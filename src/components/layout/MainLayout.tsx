import { useState, useEffect, useRef } from 'react';
import type { FC, ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    Home,
    Search,
    ShoppingBag,
    MessageSquare,
    MessageCircle,
    Bell,
    User,
    LayoutDashboard,
    LogOut,
    MapPin,
    Calendar
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadNotificationCount } from '../../hooks/useData';
import { 
    ClubService, 
    MarketplaceService, 
    LostFoundService, 
    UserService,
    EventService,
    PostService
} from '../../services/api';
import { AppLogo } from '../ui/AppLogo';
import { AnimatedPage } from './AnimatedPage';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';

const Sidebar = () => {
    const { user } = useAuthStore();
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { data: unreadCount, refetch } = useUnreadNotificationCount(user?.id);
    
    useEffect(() => {
        const handler = () => refetch();
        window.addEventListener('notifications-updated', handler);
        return () => window.removeEventListener('notifications-updated', handler);
    }, [refetch]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { icon: Home, label: 'Feed', path: '/' },
        { icon: Search, label: 'Lost & Found', path: '/lost-found' },
        { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
        { icon: MessageSquare, label: 'Chat', path: '/messages' },
        { icon: Calendar, label: 'Events', path: '/events' },
        { icon: Bell, label: 'Notifications', path: '/notifications', badge: unreadCount },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border h-screen sticky top-0 p-4">
            <div className="flex items-center gap-3 px-2 mb-8">
                <AppLogo size="md" />
                <span className="font-bold text-xl tracking-tight">Campus<span className="text-brand">Connect</span></span>
            </div>

            <nav className="flex-1 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className="block no-underline"
                    >
                        {({ isActive }: { isActive: boolean }) => (
                            <motion.div
                                whileHover={{ x: 5 }}
                                whileTap={{ scale: 0.98 }}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative w-full ${isActive
                                    ? 'bg-brand/10 text-brand font-semibold shadow-sm'
                                    : 'text-text-secondary hover:bg-gray-50'
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                                {item.badge && item.badge > 0 && (
                                    <motion.span 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute right-4 w-5 h-5 bg-brand text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                                    >
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </motion.span>
                                )}
                                {isActive && (
                                    <motion.div 
                                        layoutId="sidebar-active"
                                        className="absolute left-0 w-1 h-6 bg-brand rounded-r-full"
                                    />
                                )}
                            </motion.div>
                        )}
                    </NavLink>
                ))}
            </nav>


            <div className="pt-4 border-t border-border mt-4">
                {user?.is_admin && (
                    <NavLink
                        to="/admin"
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'bg-brand/10 text-brand font-semibold'
                                : 'text-text-secondary hover:bg-gray-50'
                            }`
                        }
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span>Admin Dashboard</span>
                    </NavLink>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 mt-1 transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

const BottomNav = () => {
    const { user } = useAuthStore();
    const { data: unreadCount, refetch } = useUnreadNotificationCount(user?.id);
    
    useEffect(() => {
        const handler = () => refetch();
        window.addEventListener('notifications-updated', handler);
        return () => window.removeEventListener('notifications-updated', handler);
    }, [refetch]);

    const navItems = [
        { icon: Home, label: 'Feed', path: '/' },
        { icon: MapPin, label: 'Lost', path: '/lost-found' },
        { icon: ShoppingBag, label: 'Market', path: '/marketplace' },
        { icon: MessageSquare, label: 'Chat', path: '/messages' },
        { icon: Bell, label: 'Notifications', path: '/notifications', badge: unreadCount },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-2 z-50">
            <div className="flex justify-between items-center max-w-lg mx-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 p-2 transition-all relative ${isActive ? 'text-brand' : 'text-text-secondary'
                            }`
                        }
                    >
                        <item.icon className={`w-6 h-6 ${({ isActive }: any) => isActive ? 'fill-brand/20' : ''}`} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                        {item.badge && item.badge > 0 && (
                            <span className="absolute top-1 right-1 w-4 h-4 bg-brand text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                {item.badge > 9 ? '9+' : item.badge}
                            </span>
                        )}
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};

const TopBar = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{
        clubs: any[];
        marketplace: any[];
        lostFound: any[];
        users: any[];
        events: any[];
        posts: any[];
    }>({ clubs: [], marketplace: [], lostFound: [], users: [], events: [], posts: [] });
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const avatarUrl = user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'User'}`;

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            try {
                const [clubs, marketplace, lostFound, users, events, posts] = await Promise.all([
                    ClubService.getAll(),
                    MarketplaceService.getAll(undefined, searchQuery),
                    LostFoundService.getAll(undefined, searchQuery),
                    UserService.search(searchQuery),
                    EventService.getAll(undefined, searchQuery),
                    PostService.getAll(searchQuery)
                ]);

                setSearchResults({
                    clubs: clubs.filter((c: any) => c.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 3),
                    marketplace: marketplace.slice(0, 3),
                    lostFound: lostFound.slice(0, 3),
                    users: users.slice(0, 3),
                    events: events.slice(0, 3),
                    posts: posts.slice(0, 3)
                });
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleResultClick = (path: string) => {
        navigate(path);
        setShowResults(false);
        setSearchQuery('');
    };

    return (
        <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-border px-4 py-3">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="md:hidden flex items-center gap-2">
                    <AppLogo size="sm" />
                    <span className="font-bold text-lg">Campus<span className="text-brand">Connect</span></span>
                </div>

                <div className="hidden md:flex flex-1 max-w-xl mx-4 relative" ref={searchRef}>
                    <div className="relative w-full">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-brand animate-pulse' : 'text-text-secondary'}`} />
                        <input
                            type="text"
                            placeholder="Search clubs, items, people..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value) setShowResults(true);
                            }}
                            onFocus={() => searchQuery && setShowResults(true)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
                        />
                        {isSearching && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    {/* Search Results Dropdown */}
                    {showResults && searchQuery.trim().length >= 2 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[480px] overflow-y-auto animate-fadeIn slide-in-from-top-2">
                            {isSearching ? (
                                <div className="p-8 text-center">
                                    <div className="w-8 h-8 border-4 border-brand/20 border-t-brand rounded-full animate-spin mx-auto mb-3"></div>
                                    <p className="text-sm text-text-secondary font-medium">Searching campus database...</p>
                                </div>
                            ) : (
                                Object.values(searchResults).every(arr => arr.length === 0) ? (
                                    <div className="p-8 text-center">
                                        <Search className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                                        <p className="text-sm text-text-secondary font-bold">No matches found</p>
                                        <p className="text-xs text-gray-400 mt-1">Try a different keyword</p>
                                    </div>
                                ) : (
                                    <div className="p-2 space-y-4">
                                        {/* Clubs Section */}
                                        {searchResults.clubs.length > 0 && (
                                            <div>
                                                <h4 className="px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Clubs</h4>
                                                <div className="mt-1 space-y-1">
                                                    {searchResults.clubs.map((club: any) => (
                                                        <button
                                                            key={club.id}
                                                            onClick={() => handleResultClick('/events')}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-brand/5 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
                                                                {club.icon || '🎯'}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-800 truncate">{club.name}</p>
                                                                <p className="text-[10px] text-text-secondary">{club.members_count} members</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Marketplace Section */}
                                        {searchResults.marketplace.length > 0 && (
                                            <div>
                                                <h4 className="px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Marketplace</h4>
                                                <div className="mt-1 space-y-1">
                                                    {searchResults.marketplace.map((item: any) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleResultClick('/marketplace')}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                {item.image_url ? (
                                                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-800 truncate">{item.title}</p>
                                                                <p className="text-[10px] text-brand font-bold">₹{item.price}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Lost & Found Section */}
                                        {searchResults.lostFound.length > 0 && (
                                            <div>
                                                <h4 className="px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Lost & Found</h4>
                                                <div className="mt-1 space-y-1">
                                                    {searchResults.lostFound.map((item: any) => (
                                                        <button
                                                            key={item.id}
                                                            onClick={() => handleResultClick('/lost-found')}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                {item.image_url ? (
                                                                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <MapPin className="w-4 h-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-800 truncate">{item.title}</p>
                                                                <p className={`text-[10px] font-bold uppercase ${item.type === 'lost' ? 'text-red-500' : 'text-green-500'}`}>{item.type}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Events Section */}
                                        {searchResults.events.length > 0 && (
                                            <div>
                                                <h4 className="px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Events</h4>
                                                <div className="mt-1 space-y-1">
                                                    {searchResults.events.map((event: any) => (
                                                        <button
                                                            key={event.id}
                                                            onClick={() => handleResultClick(`/events?id=${event.id}`)}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-brand/5 flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
                                                                <Calendar className="w-4 h-4 text-brand" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-800 truncate">{event.title}</p>
                                                                <p className="text-[10px] text-text-secondary">{event.location} · {new Date(event.date).toLocaleDateString()}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Feed Posts Section */}
                                        {searchResults.posts.length > 0 && (
                                            <div>
                                                <h4 className="px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Feed</h4>
                                                <div className="mt-1 space-y-1">
                                                    {searchResults.posts.map((post: any) => (
                                                        <button
                                                            key={post.id}
                                                            onClick={() => handleResultClick('/')}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                                        >
                                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                                {post.author?.avatar_url ? (
                                                                    <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <MessageCircle className="w-4 h-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-800 truncate">{post.content}</p>
                                                                <p className="text-[10px] text-text-secondary">Posted by {post.author?.name || 'User'}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* People Section */}
                                        {searchResults.users.length > 0 && (
                                            <div>
                                                <h4 className="px-3 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-widest">Students</h4>
                                                <div className="mt-1 space-y-1">
                                                    {searchResults.users.map((person: any) => (
                                                        <button
                                                            key={person.id}
                                                            onClick={() => handleResultClick(`/profile/${person.id}`)}
                                                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors text-left group"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-brand/10 overflow-hidden">
                                                                <img
                                                                    src={person.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${person.name}`}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-bold text-gray-800 truncate">{person.name}</p>
                                                                <p className="text-[10px] text-text-secondary">{person.department}</p>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    <button className="md:hidden p-2 text-text-secondary">
                        <Search className="w-5 h-5" />
                    </button>
                    <NavLink to="/profile" className="relative group">
                        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-all">
                            <div className="w-8 h-8 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-semibold text-xs overflow-hidden">
                                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            </div>
                            <span className="hidden md:block text-sm font-medium">{user?.name || 'User'}</span>
                        </button>
                    </NavLink>
                </div>
            </div>
        </header>
    );
};

export const MainLayout: FC<{ children: ReactNode }> = ({ children }) => {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div className="flex min-h-screen bg-background text-text-primary selection:bg-brand/20 selection:text-brand-dark">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <motion.div
                    className="fixed top-0 left-0 right-0 h-1 bg-linear-to-r from-brand via-brand-dark to-brand z-50 origin-left shadow-[0_0_10px_rgba(59,130,246,0.6)]"
                    style={{ scaleX }}
                />
                <TopBar />
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pb-24 md:pb-8 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <AnimatedPage key={window.location.pathname}>
                            {children}
                        </AnimatedPage>
                    </AnimatePresence>
                </main>
                <BottomNav />
            </div>
        </div>
    );
};
