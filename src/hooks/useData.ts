import { useState, useEffect, useCallback } from 'react';
import { 
    PostService, 
    LostFoundService, 
    MarketplaceService, 
    MessageService, 
    NotificationService,
    AdminService,
    ClubService,
    ProfileService,
    EventService
} from '../services/api';
import type { 
    Post, 
    LostAndFoundItem, 
    MarketplaceItem, 
    Conversation, 
    Message, 
    Notification,
    Club,
    ClubMembership,
    DashboardStats,
    User,
    Event
} from '../types';

// Generic data fetching hook
function useData<T>(
    fetchFn: () => Promise<T>,
    deps: any[] = []
) {
    const [data, setData] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refetch = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetchFn();
            setData(result);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    useEffect(() => {
        refetch();
    }, [refetch]);

    return { data, isLoading, error, refetch, setData };
}

// Posts hooks
export const usePosts = (search?: string) => {
    return useData<Post[]>(() => PostService.getAll(search), [search]);
};

export const useUserPosts = (userId: string | undefined) => {
    return useData<Post[]>(
        () => userId ? PostService.getByUserId(userId) : Promise.resolve([]),
        [userId]
    );
};

// Lost & Found hooks
export const useLostFound = (filter?: string, search?: string) => {
    return useData<LostAndFoundItem[]>(
        () => LostFoundService.getAll(filter, search),
        [filter, search]
    );
};

export const useUserLostFound = (userId: string | undefined) => {
    return useData<LostAndFoundItem[]>(
        () => userId ? LostFoundService.getByUserId(userId) : Promise.resolve([]),
        [userId]
    );
};

// Marketplace hooks
export const useMarketplace = (category?: string, search?: string, minPrice?: number, maxPrice?: number) => {
    return useData<MarketplaceItem[]>(
        () => MarketplaceService.getAll(category, search, minPrice, maxPrice),
        [category, search, minPrice, maxPrice]
    );
};

export const useUserMarketplace = (userId: string | undefined) => {
    return useData<MarketplaceItem[]>(
        () => userId ? MarketplaceService.getByUserId(userId) : Promise.resolve([]),
        [userId]
    );
};

// Messaging hooks
export const useConversations = (_userId: string | undefined) => {
    return useData<Conversation[]>(
        () => MessageService.getConversations(),
        [_userId]
    );
};

export const useMessages = (conversationId: string | undefined) => {
    return useData<Message[]>(
        () => conversationId ? MessageService.getMessages(conversationId) : Promise.resolve([]),
        [conversationId]
    );
};

// Notifications hook
export const useNotifications = (_userId: string | undefined) => {
    return useData<Notification[]>(
        () => NotificationService.getAll(),
        [_userId]
    );
};

export const useUnreadNotificationCount = (_userId: string | undefined) => {
    return useData<number>(
        () => NotificationService.getUnreadCount(),
        [_userId]
    );
};

// Admin hooks
export const useDashboardStats = () => {
    return useData<DashboardStats>(() => AdminService.getStats(), []);
};

// Clubs hook
export const useClubs = () => {
    return useData<Club[]>(() => ClubService.getAll(), []);
};

export const useUserMemberships = (userId: string | undefined) => {
    return useData<ClubMembership[]>(
        () => userId ? ClubService.getUserMemberships() : Promise.resolve([]),
        [userId]
    );
};

// Profile hook
export const useProfile = (userId: string | undefined) => {
    return useData<User | null>(
        () => userId ? ProfileService.getById(userId) : Promise.resolve(null),
        [userId]
    );
};

// Events hook
export const useEvents = (category?: string, search?: string) => {
    return useData<Event[]>(
        () => EventService.getAll(category, search),
        [category, search]
    );
};
