
import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon = 'ph-folder-open',
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div className={`flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-neutral-100 rounded-3xl bg-neutral-25/30 ${className}`}>
            <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <i className={`ph ${icon} text-3xl text-neutral-300`}></i>
            </div>
            <h3 className="text-[16px] font-black text-neutral-900 mb-2 tracking-tight">{title}</h3>
            <p className="text-[13px] text-neutral-400 max-w-[280px] mb-8 leading-relaxed font-medium">{description}</p>
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="secondary" className="shadow-sm">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};
