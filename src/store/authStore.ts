import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
    updateProfile: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isLoading: true,
            setUser: (user) => set({ user, isLoading: false }),
            setLoading: (isLoading) => set({ isLoading }),
            logout: () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ user: null, isLoading: false });
            },
            updateProfile: (updates) => set((state) => ({
                user: state.user ? { ...state.user, ...updates } : null
            })),
        }),
        {
            name: 'campus-connect-auth',
            partialize: (state) => ({ user: state.user }), // Only persist user
        }
    )
);
