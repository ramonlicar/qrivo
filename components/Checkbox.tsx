
import React from 'react';

interface CheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    disabled?: boolean;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, disabled = false }) => {
    return (
        <label className={`flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => !disabled && onChange(!checked)}
                />
                <div className={`
          w-4 h-4 rounded border transition-all duration-200 flex items-center justify-center
          ${checked
                        ? 'bg-primary-500 border-primary-500 shadow-sm'
                        : 'bg-white border-neutral-200 group-hover:border-neutral-300'}
        `}>
                    {checked && (
                        <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                </div>
            </div>
            {label && <span className="text-[13px] font-medium text-neutral-black tracking-tight">{label}</span>}
        </label>
    );
};
