import api from './api';

export const AuthService = {
    async signUp(email: string, password: string, name: string, department: string) {
        const { data } = await api.post('/auth/register', {
            email,
            password,
            name,
            department,
        });

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data.user;
    },

    async login(email: string, password: string) {
        const { data } = await api.post('/auth/login', {
            email,
            password,
        });

        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
        }

        return data.user;
    },

    async logout() {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // Ignore logout errors
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    async getCurrentUser() {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const { data } = await api.get('/auth/me');
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
            return data.user;
        } catch (error) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return null;
        }
    },

    getStoredUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    }
};
