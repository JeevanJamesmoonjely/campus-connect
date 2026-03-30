type AppLogoProps = {
    size?: 'sm' | 'md' | 'lg';
    showText?: boolean;
    className?: string;
};

const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
};

export const AppLogo = ({ size = 'md', showText = false, className = '' }: AppLogoProps) => {
    return (
        <div className={`flex items-center gap-3 ${className}`.trim()}>
            <svg
                viewBox="0 0 64 64"
                className={`${sizeClasses[size]} text-brand drop-shadow-sm`}
                role="img"
                aria-label="Campus Connect logo"
            >
                <rect x="4" y="4" width="56" height="56" rx="14" fill="currentColor" />
                <path d="M12 26L32 16L52 26L32 36L12 26Z" fill="white" opacity="0.95" />
                <path d="M20 31V38C20 42 25 45 32 45C39 45 44 42 44 38V31L32 37L20 31Z" fill="white" opacity="0.9" />
                <circle cx="22" cy="49" r="3" fill="white" opacity="0.95" />
                <circle cx="42" cy="49" r="3" fill="white" opacity="0.95" />
                <path d="M25 49H39" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" />
            </svg>

            {showText && (
                <span className="font-bold tracking-tight text-xl">
                    Campus<span className="text-brand">Connect</span>
                </span>
            )}
        </div>
    );
};
