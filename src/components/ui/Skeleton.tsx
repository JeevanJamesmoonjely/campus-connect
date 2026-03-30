import React from 'react';

interface SkeletonProps {
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
    return (
        <div className={`bg-gray-100 animate-pulse rounded-md ${className}`} />
    );
};

export const PostSkeleton = () => (
    <div className="card p-6 space-y-4">
        <div className="flex gap-3 items-center">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
            </div>
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>
        <div className="flex gap-4 pt-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
        </div>
    </div>
);
