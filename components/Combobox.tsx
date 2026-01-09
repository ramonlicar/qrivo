
import React, { useState, useRef, useEffect } from 'react';

interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Search...',
    label,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);
    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <div className={`
          flex items-center px-3 gap-2 h-10 bg-white border border-neutral-200 rounded-md
          transition-all duration-200 focus-within:border-neutral-900 shadow-sm
          ${isOpen ? 'border-neutral-900 ring-1 ring-neutral-900/5' : ''}
        `}>
                    <i className="ph ph-magnifying-glass text-neutral-400"></i>
                    <input
                        type="text"
                        value={isOpen ? searchTerm : (selectedOption?.label || '')}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => {
                            setIsOpen(true);
                            setSearchTerm('');
                        }}
                        placeholder={placeholder}
                        className="w-full bg-transparent border-none text-[13px] font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                    />
                </div>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden">
                        <div className="max-h-[200px] overflow-y-auto p-1 scrollbar-thin">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => {
                                            onChange(option.value);
                                            setIsOpen(false);
                                            setSearchTerm(option.label);
                                        }}
                                        className={`
                      w-full px-2 py-2 text-left text-[13px] font-medium rounded transition-colors
                      ${value === option.value
                                                ? 'bg-primary-50 text-primary-600'
                                                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-black'}
                    `}
                                    >
                                        {option.label}
                                    </button>
                                ))
                            ) : (
                                <div className="px-2 py-4 text-center text-[13px] text-neutral-400 font-medium">
                                    Nenhum resultado encontrado
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
