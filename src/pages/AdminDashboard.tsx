import { useState, useEffect } from 'react';
import { Users, FileText, ShoppingCart, Loader2, Shield, Trash2, UserCog, Search, Eye, Package, Calendar } from 'lucide-react';
import { useDashboardStats, usePosts, useLostFound, useMarketplace, useEvents } from '../hooks/useData';
import { useAuthStore } from '../store/authStore';
import { AdminService, EventService } from '../services/api';
import { EventFormModal } from '../components/EventFormModal';
import type { User, Post, LostAndFoundItem, MarketplaceItem, Event } from '../types';

type TabType = 'overview' | 'users' | 'posts' | 'lostfound' | 'marketplace' | 'events';

export const AdminDashboard = () => {
    const { user } = useAuthStore();
    const { data: stats, isLoading: loadingStats, refetch: refetchStats } = useDashboardStats();
    const { data: posts, refetch: refetchPosts } = usePosts();
    const { data: lostFoundItems, refetch: refetchLostFound } = useLostFound();
    const { data: marketplaceItems, refetch: refetchMarketplace } = useMarketplace();
    const { data: events, refetch: refetchEvents } = useEvents();
    
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showEventForm, setShowEventForm] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | undefined>(undefined);

    useEffect(() => {
        if (activeTab === 'users' && user?.is_admin) {
            loadUsers();
        }
    }, [activeTab, user?.is_admin]);

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            const data = await AdminService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCreateOrUpdateEvent = async (formData: any) => {
        setActionLoading('event-form');
        try {
            if (editingEvent) {
                await EventService.update(editingEvent.id, formData);
            } else {
                await EventService.create(formData);
            }
            await refetchEvents();
            setEditingEvent(undefined);
        } catch (error) {
            console.error('Failed to save event:', error);
            alert('Failed to save event');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;
        setActionLoading(eventId);
        try {
            await EventService.delete(eventId);
            await refetchEvents();
        } catch (error) {
            console.error('Failed to delete event:', error);
            alert('Failed to delete event');
        } finally {
            setActionLoading(null);
        }
    };

    // Check if user is admin
    if (!user || !user.is_admin) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
                <div className="text-center">
                    <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold mb-2">Access Denied</h2>
                    <p className="text-text-secondary">You need admin privileges to view this page.</p>
                </div>
            </div>
        );
    }

    const handleToggleAdmin = async (userId: string, currentStatus: boolean) => {
        if (userId === user.id) {
            alert("You can't change your own admin status");
            return;
        }
        setActionLoading(userId);
        try {
            await AdminService.updateUser(userId, { is_admin: !currentStatus });
            await loadUsers();
        } catch (error) {
            console.error('Failed to update user:', error);
            alert('Failed to update user');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (userId === user.id) {
            alert("You can't delete your own account");
            return;
        }
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        setActionLoading(userId);
        try {
            await AdminService.deleteUser(userId);
            await loadUsers();
            refetchStats();
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        setActionLoading(postId);
        try {
            await AdminService.deletePost(postId);
            refetchPosts();
            refetchStats();
        } catch (error) {
            console.error('Failed to delete post:', error);
            alert('Failed to delete post');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteLostFound = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        setActionLoading(itemId);
        try {
            await AdminService.deleteLostFound(itemId);
            refetchLostFound();
            refetchStats();
        } catch (error) {
            console.error('Failed to delete item:', error);
            alert('Failed to delete item');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteMarketplace = async (itemId: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;
        setActionLoading(itemId);
        try {
            await AdminService.deleteMarketplace(itemId);
            refetchMarketplace();
            refetchStats();
        } catch (error) {
            console.error('Failed to delete listing:', error);
            alert('Failed to delete listing');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPosts = (posts || []).filter((p: Post) =>
        p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredLostFound = (lostFoundItems || []).filter((item: LostAndFoundItem) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMarketplace = (marketplaceItems || []).filter((item: MarketplaceItem) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredEvents = (events || []).filter((event: Event) =>
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: Eye },
        { id: 'users' as TabType, label: 'Users', icon: Users },
        { id: 'posts' as TabType, label: 'Posts', icon: FileText },
        { id: 'lostfound' as TabType, label: 'Lost & Found', icon: Search },
        { id: 'marketplace' as TabType, label: 'Marketplace', icon: ShoppingCart },
        { id: 'events' as TabType, label: 'Events', icon: Calendar },
    ];

    const statCards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
        { label: 'Total Posts', value: stats?.totalPosts || 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-100' },
        { label: 'Market Listings', value: stats?.totalMarketplace || 0, icon: ShoppingCart, color: 'text-orange-600', bg: 'bg-orange-100' },
        { label: 'Lost & Found', value: stats?.totalLostFound || 0, icon: Package, color: 'text-green-600', bg: 'bg-green-100' },
    ];

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-text-secondary mt-1">Platform management and content moderation.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'bg-white text-brand shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Search Bar (for non-overview tabs) */}
            {activeTab !== 'overview' && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab}...`}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
                    />
                </div>
            )}

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {loadingStats ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-brand" />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {statCards.map((stat) => (
                                    <div key={stat.label} className="card p-5 flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-secondary">{stat.label}</p>
                                            <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {stats?.recentUsers && stats.recentUsers.length > 0 && (
                                <div className="card p-6">
                                    <h2 className="text-lg font-bold mb-4">Recent Users</h2>
                                    <div className="space-y-3">
                                        {stats.recentUsers.map((u: any) => (
                                            <div key={u.id || u._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                                <div>
                                                    <p className="font-medium">{u.name}</p>
                                                    <p className="text-sm text-text-secondary">{u.email}</p>
                                                </div>
                                                <span className="text-sm text-text-secondary">{u.department}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="card p-6">
                                <h2 className="text-lg font-bold mb-2">Quick Actions</h2>
                                <p className="text-text-secondary mb-4">Use the tabs above to manage platform content.</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <button onClick={() => setActiveTab('users')} className="p-4 bg-blue-50 rounded-xl text-blue-600 hover:bg-blue-100 transition-colors">
                                        <Users className="w-6 h-6 mx-auto mb-2" />
                                        <span className="text-sm font-medium">Manage Users</span>
                                    </button>
                                    <button onClick={() => setActiveTab('posts')} className="p-4 bg-purple-50 rounded-xl text-purple-600 hover:bg-purple-100 transition-colors">
                                        <FileText className="w-6 h-6 mx-auto mb-2" />
                                        <span className="text-sm font-medium">Manage Posts</span>
                                    </button>
                                    <button onClick={() => setActiveTab('lostfound')} className="p-4 bg-green-50 rounded-xl text-green-600 hover:bg-green-100 transition-colors">
                                        <Package className="w-6 h-6 mx-auto mb-2" />
                                        <span className="text-sm font-medium">Lost & Found</span>
                                    </button>
                                    <button onClick={() => setActiveTab('marketplace')} className="p-4 bg-orange-50 rounded-xl text-orange-600 hover:bg-orange-100 transition-colors">
                                        <ShoppingCart className="w-6 h-6 mx-auto mb-2" />
                                        <span className="text-sm font-medium">Marketplace</span>
                                    </button>
                                    <button onClick={() => setActiveTab('events')} className="p-4 bg-cyan-50 rounded-xl text-cyan-600 hover:bg-cyan-100 transition-colors text-center flex flex-col items-center">
                                        <Calendar className="w-6 h-6 mb-2" />
                                        <span className="text-sm font-medium">Manage Events</span>
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setActiveTab('events');
                                            setEditingEvent(undefined);
                                            setShowEventForm(true);
                                        }} 
                                        className="p-4 bg-brand/10 rounded-xl text-brand hover:bg-brand/20 transition-colors text-center flex flex-col items-center"
                                    >
                                        <Calendar className="w-6 h-6 mb-2" />
                                        <span className="text-sm font-medium">Add New Event</span>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="space-y-4">
                    {loadingUsers ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-brand" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">No users found</div>
                    ) : (
                        <div className="card overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-border">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-sm">User</th>
                                        <th className="text-left p-4 font-semibold text-sm hidden md:table-cell">Department</th>
                                        <th className="text-left p-4 font-semibold text-sm hidden lg:table-cell">Joined</th>
                                        <th className="text-left p-4 font-semibold text-sm">Role</th>
                                        <th className="text-right p-4 font-semibold text-sm">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u) => (
                                        <tr key={u.id} className="border-b border-border last:border-0 hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center text-white font-bold">
                                                        {u.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{u.name}</p>
                                                        <p className="text-sm text-text-secondary">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 hidden md:table-cell text-text-secondary">{u.department}</td>
                                            <td className="p-4 hidden lg:table-cell text-text-secondary">{formatDate(u.created_at)}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    u.is_admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {u.is_admin ? 'Admin' : 'User'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleToggleAdmin(u.id, !!u.is_admin)}
                                                        disabled={actionLoading === u.id || u.id === user.id}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            u.is_admin
                                                                ? 'text-orange-600 hover:bg-orange-50'
                                                                : 'text-purple-600 hover:bg-purple-50'
                                                        } disabled:opacity-50`}
                                                        title={u.is_admin ? 'Remove admin' : 'Make admin'}
                                                    >
                                                        {actionLoading === u.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <UserCog className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        disabled={actionLoading === u.id || u.id === user.id}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Delete user"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Posts Tab */}
            {activeTab === 'posts' && (
                <div className="space-y-4">
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">No posts found</div>
                    ) : (
                        filteredPosts.map((post: Post) => (
                            <div key={post.id} className="card p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-medium">{post.author?.name || 'Unknown'}</span>
                                            <span className="text-sm text-text-secondary">·</span>
                                            <span className="text-sm text-text-secondary">{formatDate(post.created_at)}</span>
                                        </div>
                                        <p className="text-text-secondary line-clamp-3">{post.content}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                                            <span>❤️ {post.likes_count} likes</span>
                                            <span>💬 {post.comments_count} comments</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePost(post.id)}
                                        disabled={actionLoading === post.id}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                        title="Delete post"
                                    >
                                        {actionLoading === post.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Lost & Found Tab */}
            {activeTab === 'lostfound' && (
                <div className="space-y-4">
                    {filteredLostFound.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">No items found</div>
                    ) : (
                        filteredLostFound.map((item: LostAndFoundItem) => (
                            <div key={item.id} className="card p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {item.type === 'lost' ? 'Lost' : 'Found'}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                item.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold">{item.title}</h3>
                                        <p className="text-sm text-text-secondary line-clamp-2">{item.description}</p>
                                        <p className="text-sm text-text-secondary mt-1">📍 {item.location} · {formatDate(item.created_at)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteLostFound(item.id)}
                                        disabled={actionLoading === item.id}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                        title="Delete item"
                                    >
                                        {actionLoading === item.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Marketplace Tab */}
            {activeTab === 'marketplace' && (
                <div className="space-y-4">
                    {filteredMarketplace.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">No listings found</div>
                    ) : (
                        filteredMarketplace.map((item: MarketplaceItem) => (
                            <div key={item.id} className="card p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                item.status === 'available' ? 'bg-green-100 text-green-700' : 
                                                item.status === 'sold' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                            <span className="text-sm font-bold text-brand">₹{item.price}</span>
                                        </div>
                                        <h3 className="font-semibold">{item.title}</h3>
                                        <p className="text-sm text-text-secondary line-clamp-2">{item.description}</p>
                                        <p className="text-sm text-text-secondary mt-1">{item.category} · {item.condition} · {formatDate(item.created_at)}</p>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteMarketplace(item.id)}
                                        disabled={actionLoading === item.id}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                        title="Delete listing"
                                    >
                                        {actionLoading === item.id ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
                <div className="space-y-4">
                    <button
                        onClick={() => {
                            setEditingEvent(undefined);
                            setShowEventForm(true);
                        }}
                        className="w-full px-4 py-3 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors font-medium"
                    >
                        + Add New Event
                    </button>

                    {filteredEvents.length === 0 ? (
                        <div className="text-center py-12 text-text-secondary">No events found</div>
                    ) : (
                        filteredEvents.map((event: Event) => (
                            <div key={event.id} className="card p-4">
                                <div className="flex items-start justify-between gap-4">
                                    {event.image_url && (
                                        <img
                                            src={event.image_url}
                                            alt={event.title}
                                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                                {event.category}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold">{event.title}</h3>
                                        <p className="text-sm text-text-secondary line-clamp-2">{event.description}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                                            <span>📅 {formatDate(event.date)}</span>
                                            <span>🕐 {event.time}</span>
                                            <span>📍 {event.location}</span>
                                            <span>👥 {event.attendees_count} attending</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => {
                                                setEditingEvent(event);
                                                setShowEventForm(true);
                                            }}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit event"
                                        >
                                            <FileText className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEvent(event.id)}
                                            disabled={actionLoading === event.id}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete event"
                                        >
                                            {actionLoading === event.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Event Form Modal */}
            <EventFormModal
                isOpen={showEventForm}
                event={editingEvent}
                onClose={() => {
                    setShowEventForm(false);
                    setEditingEvent(undefined);
                }}
                onSubmit={handleCreateOrUpdateEvent}
                isLoading={actionLoading === 'event-form'}
            />
        </div>
    );
};
