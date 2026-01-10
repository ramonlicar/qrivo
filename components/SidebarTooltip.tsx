import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface SidebarTooltipProps {
    label: string;
    children: React.ReactNode;
    active: boolean; // Only show if collapsed
}

export const SidebarTooltip: React.FC<SidebarTooltipProps> = ({ label, children, active }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (!active) return;
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + rect.height / 2,
                left: rect.right + 12 // 12px offset
            });
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    // Close tooltip on scroll or resize to prevent floating ghosts
    useEffect(() => {
        if (!isVisible) return;

        const handleScroll = () => setIsVisible(false);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isVisible]);

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="w-full"
            >
                {children}
            </div>
            {isVisible && active && createPortal(
                <div
                    className="fixed z-[9999] px-2.5 py-1.5 bg-neutral-900 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap pointer-events-none transform -translate-y-1/2 flex items-center animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: coords.top, left: coords.left }}
                >
                    {label}
                    {/* Arrow */}
                    <div className="absolute top-1/2 -left-[8px] -translate-y-1/2 border-4 border-transparent border-r-neutral-900"></div>
                </div>,
                document.body
            )}
        </>
    );
};
