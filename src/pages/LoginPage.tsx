import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, Lock, User as UserIcon, Building } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AppLogo } from '../components/ui/AppLogo';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { AuthService } from '../services/auth';
import { InteractiveBackground } from '../components/ui/InteractiveBackground';

const authSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name is required').optional(),
    department: z.string().min(2, 'Department is required').optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

export const LoginPage = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm<AuthFormData>({
        resolver: zodResolver(authSchema)
    });

    const onSubmit = async (data: AuthFormData) => {
        setIsLoading(true);
        try {
            let user;
            if (isLogin) {
                user = await AuthService.login(data.email, data.password);
            } else {
                user = await AuthService.signUp(
                    data.email,
                    data.password,
                    data.name || '',
                    data.department || ''
                );
            }
            if (user) {
                useAuthStore.getState().setUser(user);
            }
            navigate('/');
        } catch (error: any) {
            alert(error.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
            <InteractiveBackground />
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md z-10"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex mb-4">
                        <AppLogo size="lg" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Campus Connect</h1>
                    <p className="text-text-secondary mt-2">
                        {isLogin ? 'Welcome back, student!' : 'Create your campus account'}
                    </p>
                </div>

                <div className="glass-card p-8 rounded-3xl backdrop-blur-2xl bg-white/70 border-white/50 shadow-2xl">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {!isLogin && (
                            <>
                                <Input
                                    label="Full Name"
                                    placeholder="John Doe"
                                    {...register('name')}
                                    error={errors.name?.message}
                                    leftIcon={UserIcon}
                                />
                                <Input
                                    label="Department"
                                    placeholder="Computer Science"
                                    {...register('department')}
                                    error={errors.department?.message}
                                    leftIcon={Building}
                                />
                            </>
                        )}

                        <Input
                            label="Email"
                            placeholder="your@email.com"
                            {...register('email')}
                            error={errors.email?.message}
                            leftIcon={Mail}
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            {...register('password')}
                            error={errors.password?.message}
                            leftIcon={Lock}
                        />

                        <Button
                            type="submit"
                            className="w-full py-3"
                            isLoading={isLoading}
                        >
                            {isLogin ? 'Sign In' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="mt-8 text-center space-y-4">
                        <p className="text-sm text-text-secondary">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-brand font-semibold hover:underline"
                            >
                                {isLogin ? 'Sign Up' : 'Sign In'}
                            </button>
                        </p>

                        {isLogin && (
                            <button className="text-sm text-text-secondary hover:text-brand transition-colors">
                                Forgot password?
                            </button>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-text-secondary mt-8 uppercase tracking-widest font-medium opacity-50">
                    Campus Connect
                </p>
            </motion.div>
        </div>
    );
};
