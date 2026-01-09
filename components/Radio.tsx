
import React from 'react';

interface RadioProps {
    checked: boolean;
    onChange: () => void;
    label?: string;
    disabled?: boolean;
}

export const Radio: React.FC<RadioProps> = ({ checked, onChange, label, disabled = false }) => {
    return (
        <label className={`flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="relative">
                <input
                    type="radio"
                    className="sr-only"
                    checked={checked}
                    disabled={disabled}
                    onChange={onChange}
                />
                <div className={`
          w-4 h-4 rounded-full border transition-all duration-200 flex items-center justify-center
          ${checked
                        ? 'bg-primary-500 border-primary-500 shadow-sm'
                        : 'bg-white border-neutral-200 group-hover:border-neutral-300'}
        `}>
                    {checked && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                    )}
                </div>
            </div>
            {label && <span className="text-[13px] font-medium text-neutral-black tracking-tight">{label}</span>}
        </label>
    );
};
