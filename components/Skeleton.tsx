
import React from 'react';

interface SkeletonProps {
    className?: string;
    isCircle?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    isCircle = false
}) => {
    return (
        <div
            className={`
        animate-pulse bg-neutral-100/80
        ${isCircle ? 'rounded-full' : 'rounded-md'} 
        ${className}
      `}
        />
    );
};
