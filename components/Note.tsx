
import React from 'react';

interface NoteProps {
    children: React.ReactNode;
    variant?: 'info' | 'success' | 'warning' | 'error';
    label?: string;
    className?: string;
}

export const Note: React.FC<NoteProps> = ({
    children,
    variant = 'info',
    label,
    className = ''
}) => {
    const styles = {
        info: {
            bg: 'bg-white',
            border: 'border-neutral-200',
            icon: 'ph-info',
            iconColor: 'text-neutral-900',
        },
        success: {
            bg: 'bg-primary-25/30',
            border: 'border-primary-200',
            icon: 'ph-check-circle',
            iconColor: 'text-primary-600',
        },
        warning: {
            bg: 'bg-amber-25/30',
            border: 'border-amber-200',
            icon: 'ph-warning',
            iconColor: 'text-amber-600',
        },
        error: {
            bg: 'bg-red-25/30',
            border: 'border-red-200',
            icon: 'ph-x-circle',
            iconColor: 'text-red-600',
        }
    };

    const style = styles[variant];

    return (
        <div className={`flex flex-col gap-2 p-4 rounded-lg border ${style.bg} ${style.border} ${className} shadow-sm transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center gap-2">
                <i className={`ph ${style.icon} text-lg ${style.iconColor}`}></i>
                {label && <span className={`text-[12px] font-black uppercase tracking-widest ${style.iconColor}`}>{label}</span>}
            </div>
            <div className="text-[13px] text-neutral-600 font-medium leading-relaxed">
                {children}
            </div>
        </div>
    );
};
