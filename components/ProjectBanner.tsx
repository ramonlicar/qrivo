
import React from 'react';
import { Button } from './Button';

interface ProjectBannerProps {
    title: string;
    description: string;
    image?: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const ProjectBanner: React.FC<ProjectBannerProps> = ({
    title,
    description,
    image,
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div className={`relative overflow-hidden rounded-3xl bg-neutral-900 p-10 flex flex-col md:flex-row items-center gap-10 ${className}`}>
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-primary-500/10 blur-[100px] pointer-events-none"></div>

            <div className="flex-1 z-10">
                <h2 className="text-h3 font-black text-white mb-4 tracking-tight leading-tight">{title}</h2>
                <p className="text-body1 text-neutral-400 mb-8 max-w-xl leading-relaxed font-medium">{description}</p>
                {actionLabel && onAction && (
                    <Button onClick={onAction} variant="primary" className="!rounded-full shadow-md">
                        {actionLabel}
                    </Button>
                )}
            </div>

            {image && (
                <div className="w-full md:w-1/3 flex-shrink-0 z-10 animate-in fade-in slide-in-from-right-10 duration-700">
                    <img src={image} alt={title} className="w-full h-auto object-contain drop-shadow-2xl rounded-2xl" />
                </div>
            )}
        </div>
    );
};
