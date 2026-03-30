import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: LucideIcon;
    rightIcon?: LucideIcon;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    className = '',
    disabled,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-xl';

    const variants = {
        primary: 'bg-brand text-white hover:bg-brand-dark shadow-sm',
        secondary: 'bg-white border border-border text-text-primary hover:bg-gray-50',
        ghost: 'bg-transparent text-text-secondary hover:bg-gray-100',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            ) : LeftIcon ? (
                <LeftIcon className="w-4 h-4 mr-2" />
            ) : null}
            {children}
            {!isLoading && RightIcon && <RightIcon className="w-4 h-4 ml-2" />}
        </button>
    );
};
