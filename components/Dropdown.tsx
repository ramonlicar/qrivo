
import React, { useState, useRef, useEffect } from 'react';

export interface DropdownOption {
  label: string;
  value: string | number;
  color?: string; // Tailwind class like 'bg-system-success-500'
}

interface DropdownProps {
  label: string;
  options: DropdownOption[];
  value?: string | number;
  onChange: (value: any) => void;
  className?: string;
  size?: 'sm' | 'md';
  prefix?: string;
  leftIcon?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  value,
  onChange,
  className = '',
  size = 'md',
  prefix,
  leftIcon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSmall = size === 'sm';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          box-border flex flex-row justify-between items-center gap-[8px] bg-white border transition-all active:scale-[0.98] shadow-sm rounded-[6px] w-full
          ${isOpen ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'}
          ${isSmall ? 'h-[30px] px-[8px]' : 'h-[36px] px-[12px]'}
        `}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          {prefix && (
            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tight whitespace-nowrap">
              {prefix}
            </span>
          )}

          {leftIcon && !selectedOption && (
            <i className={`ph ${leftIcon} text-neutral-400 ${isSmall ? 'text-xs' : 'text-sm'}`}></i>
          )}

          <div className="flex items-center gap-2 truncate">
            {selectedOption?.color && (
              <div className={`w-2 h-2 rounded-full ${selectedOption.color} flex-none`}></div>
            )}
            <span className={`truncate font-medium text-[13px] ${selectedOption ? 'text-neutral-black' : 'text-neutral-400'}`}>
              {selectedOption ? selectedOption.label : label}
            </span>
          </div>
        </div>
        <i className={`ph ph-caret-down ph-bold text-neutral-400 transition-transform duration-200 ${isSmall ? 'text-[10px]' : 'text-xs'} ${isOpen ? 'rotate-180' : ''}`}></i>
      </button>

      {/* Options Modal (Popover) */}
      {isOpen && (
        <div className={`
          absolute left-0 mt-1 bg-white border border-neutral-200 rounded-[8px] shadow-lg z-[100] py-1 overflow-hidden
          animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 origin-top-left
          ${isSmall ? 'min-w-[120px] bottom-full mb-2 mt-0' : 'w-full min-w-[200px]'}
        `}>
          {/* Internal Header Label */}
          {!isSmall && (
            <div className="px-3 py-2 mb-1 border-b border-neutral-50">
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em]">{label}</span>
            </div>
          )}

          <div className="max-h-[280px] overflow-y-auto custom-scrollbar">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  flex items-center justify-between px-3 py-2 text-left transition-all relative group rounded-md mx-1 my-0.5 w-[calc(100%-8px)]
                  ${value === option.value ? 'bg-neutral-100' : 'hover:bg-neutral-50'}
                `}
              >
                <div className="flex items-center gap-2.5">
                  {option.color && (
                    <div className={`w-2 h-2 rounded-full ${option.color} ring-1 ring-neutral-200`}></div>
                  )}
                  <span className={`
                    text-[13px] whitespace-nowrap transition-colors
                    ${value === option.value ? 'font-medium text-neutral-900' : 'font-medium text-neutral-600 group-hover:text-neutral-900'}
                  `}>
                    {option.label}
                  </span>
                </div>

                {value === option.value && (
                  <i className="ph ph-check ph-bold text-neutral-900 text-[14px]"></i>
                )}
              </button>
            ))}
          </div>

          {/* Action Footer for md size (Clear Selection) */}
          {value && !isSmall && (
            <div className="mt-1 pt-1 border-t border-neutral-100 px-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left hover:bg-neutral-50 text-neutral-500 hover:text-neutral-900 transition-colors group"
              >
                <i className="ph ph-trash ph-bold text-xs"></i>
                <span className="text-[12px] font-bold">Limpar seleção</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};