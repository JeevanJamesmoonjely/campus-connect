import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    leftIcon?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, helperText, leftIcon: LeftIcon, className = '', ...props }, ref) => {
        return (
            <div className="w-full space-y-1">
                {label && (
                    <label className="block text-sm font-medium text-text-secondary">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {LeftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">
                            <LeftIcon className="w-5 h-5" />
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={`input-field ${LeftIcon ? 'pl-11' : ''} ${error ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : ''} ${className}`}
                        {...props}
                    />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                {!error && helperText && <p className="text-sm text-text-secondary">{helperText}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
