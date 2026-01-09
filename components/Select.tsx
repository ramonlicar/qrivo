
import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

export const Select: React.FC<SelectProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option...',
    label,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
            {label && <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{label}</span>}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
            w-full h-9 px-3 flex items-center justify-between bg-white border border-neutral-200 rounded-md
            transition-all duration-200 hover:border-neutral-300 focus:border-neutral-900 shadow-sm
            ${isOpen ? 'border-neutral-900' : ''}
          `}
                >
                    <span className={`text-[13px] font-medium ${selectedOption ? 'text-neutral-black' : 'text-neutral-400'}`}>
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <i className={`ph ph-caret-down text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
                </button>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg animate-in fade-in zoom-in-95 duration-100">
                        <div className="p-1">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        onChange(option.value);
                                        setIsOpen(false);
                                    }}
                                    className={`
                    w-full px-2 py-1.5 text-left text-[13px] font-medium rounded transition-colors
                    ${value === option.value ? 'bg-primary-50 text-primary-600' : 'text-neutral-500 hover:bg-neutral-25 hover:text-neutral-black'}
                  `}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
