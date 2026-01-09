
import React, { useState } from 'react';

interface CollapseProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export const Collapse: React.FC<CollapseProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-neutral-25 transition-colors text-left"
            >
                <span className="text-[14px] font-bold text-neutral-900 tracking-tight">{title}</span>
                <i className={`ph ph-caret-down text-neutral-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}></i>
            </button>
            <div
                className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
            >
                <div className="p-4 pt-0 text-[13px] text-neutral-600 leading-relaxed border-t border-neutral-50 bg-neutral-25/30">
                    {children}
                </div>
            </div>
        </div>
    );
};
