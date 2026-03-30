import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { AuthService } from '../services/auth';
import type { User } from '../types';

export const useAuth = () => {
    const { user, isLoading, setUser, setLoading, logout: storeLogout } = useAuthStore();

    const refreshUser = useCallback(async () => {
        if (AuthService.isAuthenticated()) {
            const currentUser = await AuthService.getCurrentUser();
            if (currentUser) {
                setUser(currentUser as User);
            }
        }
    }, [setUser]);

    useEffect(() => {
        // Check current session from localStorage and validate with server
        const checkSession = async () => {
            setLoading(true);
            try {
                // First check if we have a stored user
                const storedUser = AuthService.getStoredUser();
                if (storedUser) {
                    setUser(storedUser as User);
                }

                // Validate token with server and get fresh user data
                await refreshUser();
            } catch (error) {
                console.error('Session check error:', error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkSession();
    }, [setUser, setLoading, refreshUser]);

    const handleLogout = async () => {
        await AuthService.logout();
        storeLogout();
    };

    return {
        user,
        isLoading,
        isAuthenticated: !!user,
        logout: handleLogout,
        refreshUser
    };
};
