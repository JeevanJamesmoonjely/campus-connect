import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Loader2, Heart, MessageCircle, Share2, Bell, CheckCheck, Send, ImagePlus, X, Calendar, ChevronRight, ChevronLeft, Search } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { LostFoundPage } from './pages/LostFoundPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { MessagesPage } from './pages/MessagesPage';
import { ProfilePage } from './pages/ProfilePage';
import { EventsPage } from './pages/EventsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { useAuth } from './hooks/useAuth';
import { usePosts, useNotifications, useClubs } from './hooks/useData';
import { useAuthStore } from './store/authStore';
import { PostService, NotificationService } from './services/api';
import { Button } from './components/ui/Button';
import { initSocket, disconnectSocket } from './services/socket';
import { ScrollReveal } from './components/ui/ScrollReveal';

// ── Calendar event data ───────────────────────────────────────────────────────
const CALENDAR_EVENTS = [
  { date: '2026-03-28', title: 'Tech Talk: AI & ML', club: 'CS Club', category: 'Technology', color: '#3B82F6' },
  { date: '2026-03-30', title: 'Annual Sports Festival', club: 'Sports & Athletics Club', category: 'Sports', color: '#22C55E' },
  { date: '2026-04-05', title: 'Cultural Night 2026', club: 'Cultural Committee', category: 'Culture', color: '#A855F7' },
  { date: '2026-04-08', title: 'Entrepreneurship Workshop', club: 'E-Cell', category: 'Workshop', color: '#F97316' },
  { date: '2026-04-12', title: 'Music Concert Series', club: 'Music Club', category: 'Music', color: '#EC4899' },
  { date: '2026-04-15', title: 'Career Fair 2026', club: 'Placement Cell', category: 'Career', color: '#6366F1' },
];

// ── EventCalendar widget ──────────────────────────────────────────────────────
const EventCalendar = ({ navigate }: { navigate: (path: string) => void }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof CALENDAR_EVENTS> = {};
    CALENDAR_EVENTS.forEach(ev => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, []);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthName = new Date(viewYear, viewMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const makeKey = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] || []) : [];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand" />
          <h3 className="font-bold text-sm uppercase tracking-widest">Event Calendar</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <span className="text-xs font-bold text-gray-700 min-w-[110px] text-center">{monthName}</span>
          <button
            onClick={nextMonth}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 text-center">
        {dayLabels.map(d => (
          <div key={d} className="text-[10px] font-bold text-text-secondary uppercase py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const key = makeKey(day);
          const events = eventsByDate[key] || [];
          const hasEvent = events.length > 0;
          const isToday = key === todayStr;
          const isSelected = key === selectedDate;

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : key)}
              className={[
                'relative flex flex-col items-center justify-center rounded-lg w-full aspect-square text-xs font-semibold transition-all',
                isSelected ? 'bg-brand text-white shadow-md scale-110 z-10' : '',
                isToday && !isSelected ? 'border border-brand text-brand font-bold' : '',
                !isSelected && !isToday ? 'hover:bg-gray-100 text-gray-700' : '',
              ].join(' ')}
            >
              {day}
              {hasEvent && (
                <span className="absolute bottom-0.5 flex gap-0.5 justify-center">
                  {events.slice(0, 3).map((ev, idx) => (
                    <span
                      key={idx}
                      className="w-1 h-1 rounded-full"
                      style={{ backgroundColor: isSelected ? 'white' : ev.color }}
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Popover for selected date */}
      {selectedDate && (
        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          {selectedEvents.length > 0 ? (
            <>
              <div className="px-3 py-2 bg-gray-50 border-b border-border">
                <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wide">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              {selectedEvents.map((ev, i) => (
                <div
                  key={i}
                  className="px-3 py-2.5 bg-white flex items-start gap-2.5 hover:bg-gray-50 transition-colors"
                  style={{ borderLeft: `3px solid ${ev.color}` }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{ev.title}</p>
                    <p className="text-[10px] text-text-secondary">{ev.club} · {ev.category}</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="px-3 py-4 text-center bg-white">
              <p className="text-xs text-text-secondary">No events on this day</p>
            </div>
          )}
        </div>
      )}

      {/* Upcoming legend */}
      <div className="pt-2 border-t border-border/50">
        <p className="text-[10px] text-text-secondary font-semibold uppercase tracking-wide mb-2">Upcoming</p>
        <div className="space-y-1.5">
          {CALENDAR_EVENTS.filter(ev => ev.date >= todayStr).slice(0, 3).map((ev, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
              <span className="text-xs text-gray-600 truncate flex-1">{ev.title}</span>
              <span className="text-[10px] text-text-secondary whitespace-nowrap">
                {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate('/events')}
          className="mt-3 w-full py-2 rounded-xl text-xs font-bold text-brand border border-brand/30 hover:bg-brand/5 transition-all"
        >
          See All Events →
        </button>
      </div>
    </motion.div>
  );
};

// Main Feed Page
const Feed = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { data: posts, isLoading, refetch } = usePosts(debouncedSearch);
  const { data: clubs } = useClubs();

  // Handle debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostClubId, setNewPostClubId] = useState<string>('');
  const [isPosting, setIsPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
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
      if (typeof reader.result === 'string') {
        setNewPostImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearSelectedImage = () => {
    setNewPostImage(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if ((!newPostContent.trim() && !newPostImage) || !user) return;
    setIsPosting(true);
    try {
      await PostService.create({
        content: newPostContent.trim(),
        image_url: newPostImage || undefined,
        club_id: newPostClubId || undefined,
      });
      setNewPostContent('');
      setNewPostClubId('');
      clearSelectedImage();
      refetch();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to create post:', error.response?.data?.message || error.message);
      } else {
        console.error('Failed to create post:', error);
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    try {
      await PostService.like(postId);
      refetch();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleComment = async (postId: string) => {
    const content = commentTexts[postId];
    if (!content?.trim() || !user) return;

    try {
      await PostService.addComment(postId, content.trim());
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
      refetch();
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campus Feed</h1>
          <p className="text-text-secondary mt-1">What's happening on campus today.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-sm"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post */}
          {user && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 bg-brand/5 border-dashed border-brand/30"
            >
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center font-bold text-brand overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="Share something with your campus..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm resize-none h-16 focus:outline-none"
                  />
                  {newPostImage && (
                    <div className="mt-3 relative w-full max-w-sm">
                      <img src={newPostImage} alt="Selected" className="w-full rounded-xl border border-border" />
                      <button
                        type="button"
                        onClick={clearSelectedImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-lg hover:bg-black/70 transition-colors"
                        aria-label="Remove selected image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="mt-3">
                    <select
                      value={newPostClubId}
                      onChange={(e) => setNewPostClubId(e.target.value)}
                      className="w-full text-xs border border-brand/20 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand/30 text-text-secondary"
                    >
                      <option value="">📢 General (no specific club)</option>
                      {clubs && clubs.map(club => (
                        <option key={club.id} value={club.id}>
                          {club.icon || '🎯'} {club.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-brand/10">
                    <div className="flex gap-2">
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="p-2 hover:bg-white rounded-lg transition-all text-text-secondary"
                        aria-label="Add image"
                      >
                        <ImagePlus className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-white rounded-lg transition-all text-text-secondary">📍</button>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleCreatePost}
                      disabled={(!newPostContent.trim() && !newPostImage) || isPosting}
                      isLoading={isPosting}
                    >
                      Post Now
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Posts Feed */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-brand" />
            </div>
          ) : posts && posts.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {posts.map((post) => {
                const clubName = (typeof post.club_id === 'object' ? post.club_id?.name : undefined)
                  || post.club?.name
                  || post.club_name;
                return (
                  <ScrollReveal key={post.id}>
                    <div className="card p-6 hover:border-brand/40 transition-all">
                      <div className="flex gap-3 items-center mb-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 text-text-secondary flex items-center justify-center font-bold overflow-hidden">
                          {post.author?.avatar_url ? (
                            <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author?.name || 'user'}`} alt="avatar" className="rounded-xl" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-sm">{post.author?.name || 'Unknown User'}</div>
                          <div className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                            {post.author?.department || ''}{post.author?.department ? ' • ' : ''}{formatTime(post.created_at)}
                          </div>
                          {clubName && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-brand/10 text-brand text-[10px] font-bold rounded-full">
                              🎯 {clubName}
                            </span>
                          )}
                        </div>
                        {post.is_pinned && (
                          <span className="px-2 py-1 bg-brand/10 text-brand text-[10px] font-bold rounded uppercase">Pinned</span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary mb-4 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>
                      {post.image_url && (
                        <img src={post.image_url} alt="" className="w-full rounded-xl mb-4" />
                      )}
                      <div className="flex items-center gap-6 text-text-secondary text-[11px] font-bold uppercase tracking-widest pt-4 border-t border-border/50">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center gap-1.5 hover:text-brand transition-colors ${post.likes?.includes(user?.id || '') ? 'text-red-500' : ''}`}
                        >
                          <Heart className={`w-4 h-4 ${post.likes?.includes(user?.id || '') ? 'fill-current' : ''}`} />
                          {post.likes_count || 0} Likes
                        </button>
                        <button 
                          onClick={() => toggleComments(post.id)}
                          className={`flex items-center gap-1.5 hover:text-brand transition-colors ${expandedComments.has(post.id) ? 'text-brand' : ''}`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          {post.comments_count || 0} Comments
                        </button>
                        <button className="flex items-center gap-1.5 hover:text-brand transition-colors">
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                      </div>

                      {/* Comments Section */}
                      <AnimatePresence>
                        {expandedComments.has(post.id) && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-4 pt-4 border-t border-border/30 space-y-4 overflow-hidden"
                          >
                            <div className="space-y-3">
                              {post.comments && post.comments.length > 0 ? (
                                post.comments.map((comment: any, idx: number) => (
                                  <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex gap-2.5"
                                  >
                                    <div className="w-7 h-7 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center text-[10px] font-bold text-brand overflow-hidden">
                                      {comment.user_id?.avatar_url || comment.avatar_url ? (
                                        <img src={comment.user_id?.avatar_url || comment.avatar_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        (comment.user_id?.name || 'U').charAt(0)
                                      )}
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-xl p-2.5">
                                      <div className="flex justify-between items-baseline mb-0.5">
                                        <span className="text-[11px] font-bold text-gray-800">{comment.user_id?.name || 'User'}</span>
                                        <span className="text-[9px] text-text-secondary">{formatTime(comment.created_at)}</span>
                                      </div>
                                      <p className="text-[11px] text-text-secondary">{comment.content}</p>
                                    </div>
                                  </motion.div>
                                ))
                              ) : (
                                <p className="text-[11px] text-text-secondary text-center py-2">No comments yet. Be the first to comment!</p>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Write a comment..."
                                value={commentTexts[post.id] || ''}
                                onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                                className="flex-1 bg-gray-50 border border-border rounded-xl px-3 py-2 text-[11px] focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                              />
                              <motion.button
                                onClick={() => handleComment(post.id)}
                                disabled={!commentTexts[post.id]?.trim()}
                                className="p-2 bg-brand text-white rounded-xl disabled:opacity-50 transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              >
                                <Send className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </ScrollReveal>
                );
              })}
            </AnimatePresence>
          ) : (
            <div className="card p-12 text-center">
              <p className="text-text-secondary">No posts yet. Be the first to share something!</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <EventCalendar navigate={navigate} />
        </div>
      </div>
    </div>
  );
};

const Notifications = () => {
  const { user } = useAuthStore();
  const { data: notifications, isLoading, refetch } = useNotifications(user?.id);
  
  useEffect(() => {
    const handler = () => refetch();
    window.addEventListener('notifications-updated', handler);
    return () => window.removeEventListener('notifications-updated', handler);
  }, [refetch]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      window.dispatchEvent(new CustomEvent('notifications-updated'));
      refetch();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await NotificationService.markAllAsRead();
      window.dispatchEvent(new CustomEvent('notifications-updated'));
      refetch();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'message': return '✉️';
      case 'announcement': return '📢';
      case 'marketplace': return '🛍️';
      case 'lost_found': return '🔍';
      default: return '🔔';
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <div className="text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to view notifications</h2>
          <p className="text-text-secondary">You need to be logged in to see your notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        {notifications && notifications.some(n => !n.is_read) && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      ) : notifications && notifications.length > 0 ? (
        <div className="space-y-1">
          {notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              className={`card p-5 flex gap-4 hover:border-brand/20 transition-all cursor-pointer ${!notification.is_read ? 'bg-brand/5 border-brand/20' : ''
                }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 ${!notification.is_read ? 'bg-brand text-white' : 'bg-gray-100'
                }`}>
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-sm">{notification.title}</h3>
                  <span className="text-[10px] text-text-secondary font-medium uppercase">
                    {formatTime(notification.created_at)}
                  </span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">{notification.content}</p>
              </div>
              {!notification.is_read && (
                <div className="w-2 h-2 bg-brand rounded-full flex-shrink-0 mt-2"></div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No notifications</h3>
          <p className="text-text-secondary">You're all caught up!</p>
        </div>
      )}
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();
  const isAuthenticated = !!user;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuthStore();
  const isAuthenticated = !!user;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  // Initialize auth listener
  useAuth();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      const socket = initSocket(user.id);
      
      socket.on('notification', (notification) => {
        // Here we could update global state or show a toast
        console.log('Real-time notification received:', notification);
        // We might want to trigger a refetch of notification count or list
        // For simplicity in this task, we can use a custom event or just rely on the user navigating
        // But the requirement is "real time working", so let's use a custom event to notify components
        window.dispatchEvent(new CustomEvent('notifications-updated', { detail: notification }));
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [user?.id]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/" element={<ProtectedRoute><MainLayout><Feed /></MainLayout></ProtectedRoute>} />
        <Route path="/lost-found" element={<ProtectedRoute><MainLayout><LostFoundPage /></MainLayout></ProtectedRoute>} />
        <Route path="/marketplace" element={<ProtectedRoute><MainLayout><MarketplacePage /></MainLayout></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MainLayout><MessagesPage /></MainLayout></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><MainLayout><EventsPage /></MainLayout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><MainLayout><Notifications /></MainLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><MainLayout><AdminDashboard /></MainLayout></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
