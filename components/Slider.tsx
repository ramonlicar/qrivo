
import React from 'react';

interface SliderProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    label?: string;
    className?: string;
}

export const Slider: React.FC<SliderProps> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    step = 1,
    label,
    className = ''
}) => {
    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            <div className="flex justify-between items-center">
                {label && <span className="text-[12px] font-bold text-neutral-400 uppercase tracking-widest">{label}</span>}
                <span className="text-[13px] font-bold text-neutral-black">{value}</span>
            </div>
            <div className="relative flex items-center group">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="
            w-full h-1 bg-neutral-100 rounded-full appearance-none cursor-pointer
            accent-primary-500 transition-all group-hover:bg-neutral-200
          "
                />
            </div>
        </div>
    );
};
