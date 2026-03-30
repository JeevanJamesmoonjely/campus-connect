import axios from 'axios';

const API_URL = '/api';

// Create axios instance with defaults
const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const getCurrentUserId = (): string | null => {
    try {
        const persistedAuth = localStorage.getItem('campus-connect-auth');
        if (!persistedAuth) return null;

        const parsed = JSON.parse(persistedAuth);
        return parsed?.state?.user?.id || null;
    } catch {
        return null;
    }
};

const normalizeUserId = (userRef: any): string | undefined => {
    if (!userRef) return undefined;
    if (typeof userRef === 'string') return userRef;
    return userRef.id || userRef._id;
};

const normalizePost = (post: any) => {
    const userObj = typeof post.user_id === 'object' ? post.user_id : null;
    const clubObj = typeof post.club_id === 'object' ? post.club_id : null;
    return {
        ...post,
        author: post.author || userObj || undefined,
        club: post.club || clubObj || undefined,
    };
};

const normalizeNotification = (notification: any) => ({
    ...notification,
    is_read: notification.read ?? notification.is_read,
    content: notification.message ?? notification.content,
});

export const PostService = {
    async getAll(search?: string) {
        const { data } = await api.get('/posts', { params: { search } });
        return (data.data || []).map(normalizePost);
    },

    async getByUserId(userId: string) {
        const { data } = await api.get(`/posts/user/${userId}`);
        return (data.data || []).map(normalizePost);
    },

    async create(post: { content: string; image_url?: string; club_id?: string }) {
        const { data } = await api.post('/posts', post);
        return normalizePost(data.data);
    },

    async delete(id: string) {
        await api.delete(`/posts/${id}`);
    },

    async like(postId: string) {
        const { data } = await api.post(`/posts/${postId}/like`);
        return data;
    },

    async unlike(postId: string) {
        const { data } = await api.post(`/posts/${postId}/like`);
        return data;
    },

    async checkLiked(_postId: string, _userId: string): Promise<boolean> {
        // The backend already includes likes array in the post
        return false; // Will be checked client-side from post.likes
    },

    async getComments(postId: string) {
        const { data } = await api.get(`/posts/${postId}`);
        return data.data?.comments || [];
    },

    async addComment(postId: string, content: string) {
        const { data } = await api.post(`/posts/${postId}/comments`, { content });
        return data.data;
    }
};

export const LostFoundService = {
    async getAll(filter?: string, search?: string) {
        const params = new URLSearchParams();
        if (filter && filter !== 'all') params.append('type', filter);
        if (search) params.append('search', search);
        const { data } = await api.get(`/lostfound?${params}`);
        return (data.data || []).map((item: any) => {
            const owner = typeof item.user_id === 'object' ? item.user_id : null;
            return {
                ...item,
                user_id: normalizeUserId(item.user_id),
                user: item.user || owner || undefined,
            };
        });
    },

    async getByUserId(userId: string) {
        const { data } = await api.get('/lostfound');
        return (data.data || [])
            .map((item: any) => ({
                ...item,
                user_id: normalizeUserId(item.user_id),
                user: item.user || (typeof item.user_id === 'object' ? item.user_id : undefined),
            }))
            .filter((item: any) => item.user_id === userId);
    },

    async create(item: any) {
        const { data } = await api.post('/lostfound', item);
        return data.data;
    },

    async updateStatus(id: string, status: string) {
        const { data } = await api.put(`/lostfound/${id}`, { status });
        return data.data;
    },

    async delete(id: string) {
        await api.delete(`/lostfound/${id}`);
    }
};

export const MarketplaceService = {
    async getAll(category?: string, search?: string, minPrice?: number, maxPrice?: number) {
        const params = new URLSearchParams();
        if (category && category !== 'All') params.append('category', category);
        const { data } = await api.get(`/marketplace?${params}`);
        let items = (data.data || []).map((item: any) => {
            const owner = typeof item.user_id === 'object' ? item.user_id : null;
            const ownerId = normalizeUserId(item.user_id);
            return {
                ...item,
                user_id: ownerId,
                seller_id: item.seller_id || ownerId,
                seller: item.seller || item.user || owner || undefined,
                user: item.user || owner || undefined,
            };
        });
        
        if (search) {
            const searchLower = search.toLowerCase();
            items = items.filter((item: any) => 
                item.title.toLowerCase().includes(searchLower) ||
                item.description.toLowerCase().includes(searchLower)
            );
        }
        
        if (minPrice !== undefined) {
            items = items.filter((item: any) => item.price >= minPrice);
        }
        
        if (maxPrice !== undefined) {
            items = items.filter((item: any) => item.price <= maxPrice);
        }
        
        return items;
    },

    async getByUserId(userId: string) {
        const { data } = await api.get('/marketplace');
        return (data.data || [])
            .map((item: any) => {
                const ownerId = normalizeUserId(item.user_id);
                return {
                    ...item,
                    user_id: ownerId,
                    seller_id: item.seller_id || ownerId,
                    seller: item.seller || item.user || (typeof item.user_id === 'object' ? item.user_id : undefined),
                };
            })
            .filter((item: any) => item.user_id === userId || item.seller_id === userId);
    },

    async create(item: any) {
        const { data } = await api.post('/marketplace', item);
        return data.data;
    },

    async updateStatus(id: string, status: 'available' | 'sold') {
        const { data } = await api.put(`/marketplace/${id}/status`, { status });
        return data.data;
    },

    async delete(id: string) {
        await api.delete(`/marketplace/${id}`);
    }
};

export const MessageService = {
    async getConversations() {
        const { data } = await api.get('/messages/conversations');
        const currentUserId = getCurrentUserId();

        return (data.data || []).map((conversation: any) => {
            const participants = Array.isArray(conversation.participants) ? conversation.participants : [];
            const otherUser = participants.find((participant: any) => {
                const participantId = normalizeUserId(participant);
                return currentUserId ? participantId !== currentUserId : true;
            }) || participants[0];

            return {
                ...conversation,
                other_user: conversation.other_user || otherUser,
                participant_1: normalizeUserId(participants[0]),
                participant_2: normalizeUserId(participants[1]),
                last_message: conversation.last_message
                    ? { content: conversation.last_message }
                    : undefined,
            };
        });
    },

    async getOrCreateConversation(recipientId: string) {
        const { data } = await api.post('/messages/conversations', { recipientId });
        return data.data;
    },

    async getMessages(conversationId: string) {
        const { data } = await api.get(`/messages/conversations/${conversationId}`);
        return (data.data || []).map((message: any) => ({
            ...message,
            sender: typeof message.sender_id === 'object' ? message.sender_id : message.sender,
            sender_id: normalizeUserId(message.sender_id),
            is_read: message.is_read ?? message.read,
        }));
    },

    async sendMessage(conversationId: string, content: string) {
        const { data } = await api.post(`/messages/conversations/${conversationId}`, { content });
        return data.data;
    },

    async getUnreadCount() {
        const { data } = await api.get('/messages/unread');
        return data.count || 0;
    }
};

export const NotificationService = {
    async getAll() {
        const { data } = await api.get('/notifications');
        return (data.data || []).map(normalizeNotification);
    },

    async getUnreadCount() {
        const { data } = await api.get('/notifications/unread');
        return data.count || 0;
    },

    async markAsRead(id: string) {
        const { data } = await api.put(`/notifications/${id}/read`);
        return data.data;
    },

    async markAllAsRead() {
        await api.put('/notifications/read-all');
    },

    async delete(id: string) {
        await api.delete(`/notifications/${id}`);
    }
};

export const ProfileService = {
    async getById(userId: string) {
        const { data } = await api.get(`/users/${userId}`);
        return data.data;
    },

    async update(updates: any) {
        const { data } = await api.put('/auth/profile', updates);
        return data.user;
    }
};

export const AdminService = {
    async getStats() {
        const { data } = await api.get('/admin/stats');
        return data.data;
    },

    async getAllUsers() {
        const { data } = await api.get('/admin/users');
        return data.data || [];
    },

    async updateUser(userId: string, updates: any) {
        const { data } = await api.put(`/admin/users/${userId}`, updates);
        return data.data;
    },

    async deleteUser(userId: string) {
        await api.delete(`/admin/users/${userId}`);
    },

    async deletePost(postId: string) {
        await api.delete(`/admin/posts/${postId}`);
    },

    async deleteLostFound(itemId: string) {
        await api.delete(`/admin/lostfound/${itemId}`);
    },

    async deleteMarketplace(itemId: string) {
        await api.delete(`/admin/marketplace/${itemId}`);
    }
};

export const ClubService = {
    async getAll() {
        const { data } = await api.get('/clubs');
        return data.data || [];
    },

    async getById(clubId: string) {
        const { data } = await api.get(`/clubs/${clubId}`);
        return data.data;
    },

    async create(club: any) {
        const { data } = await api.post('/clubs', club);
        return data.data;
    },

    async update(clubId: string, updates: any) {
        const { data } = await api.put(`/clubs/${clubId}`, updates);
        return data.data;
    },

    async join(clubId: string) {
        const { data } = await api.post(`/clubs/${clubId}/join`);
        return data;
    },

    async leave(clubId: string) {
        const { data } = await api.post(`/clubs/${clubId}/leave`);
        return data;
    },

    async getPosts(clubId: string) {
        const { data } = await api.get(`/clubs/${clubId}/posts`);
        return data.data || [];
    },

    async getUserMemberships() {
        const { data } = await api.get('/clubs/user/memberships');
        return data.data || [];
    },

    async checkMembership(clubId: string, userId: string): Promise<boolean> {
        try {
            const { data } = await api.get(`/clubs/${clubId}`);
            const club = data.data;
            return club?.members?.some((m: any) => 
                m.user_id === userId || m.user_id?._id === userId
            ) || false;
        } catch {
            return false;
        }
    }
};

export const EventService = {
    async getAll(category?: string, search?: string) {
        const params = new URLSearchParams();
        if (category && category !== 'All') params.append('category', category);
        if (search) params.append('search', search);
        const { data } = await api.get(`/events?${params}`);
        return data.data || [];
    },

    async getById(id: string) {
        const { data } = await api.get(`/events/${id}`);
        return data.data;
    },

    async create(event: any) {
        const { data } = await api.post('/events', event);
        return data.data;
    },

    async update(id: string, event: any) {
        const { data } = await api.put(`/events/${id}`, event);
        return data.data;
    },

    async delete(id: string) {
        await api.delete(`/events/${id}`);
    }
};

export const UserService = {
    async getAll() {
        const { data } = await api.get('/users');
        return data.data || [];
    },

    async getById(userId: string) {
        const { data } = await api.get(`/users/${userId}`);
        return data.data;
    },

    async search(query: string) {
        const { data } = await api.get(`/users/search/${query}`);
        return data.data || [];
    }
};

export default api;
