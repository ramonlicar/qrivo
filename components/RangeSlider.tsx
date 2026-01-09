
import React, { useCallback, useEffect, useState, useRef } from "react";

interface RangeSliderProps {
    min: number;
    max: number;
    minVal: number;
    maxVal: number;
    onChange: (values: { min: number; max: number }) => void;
    step?: number;
    label?: string;
    currency?: boolean;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
    min,
    max,
    minVal,
    maxVal,
    onChange,
    step = 1,
    label,
    currency = false
}) => {
    const [minValState, setMinValState] = useState(minVal);
    const [maxValState, setMaxValState] = useState(maxVal);
    const minValRef = useRef(minVal);
    const maxValRef = useRef(maxVal);
    const range = useRef<HTMLDivElement>(null);

    // Convert to percentage
    const getPercent = useCallback(
        (value: number) => Math.round(((value - min) / (max - min)) * 100),
        [min, max]
    );

    // Set width of the range to decrease from the left side
    useEffect(() => {
        const minPercent = getPercent(minValState);
        const maxPercent = getPercent(maxValRef.current);

        if (range.current) {
            range.current.style.left = `${minPercent}%`;
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [minValState, getPercent]);

    // Set width of the range to decrease from the right side
    useEffect(() => {
        const minPercent = getPercent(minValRef.current);
        const maxPercent = getPercent(maxValState);

        if (range.current) {
            range.current.style.width = `${maxPercent - minPercent}%`;
        }
    }, [maxValState, getPercent]);

    // Get min and max values when their state changes
    useEffect(() => {
        if (minValState !== minVal) setMinValState(minVal);
    }, [minVal]);

    useEffect(() => {
        if (maxValState !== maxVal) setMaxValState(maxVal);
    }, [maxVal]);

    const handleMinChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.min(Number(event.target.value), maxValState - step);
        setMinValState(value);
        minValRef.current = value;
        onChange({ min: value, max: maxValState });
    };

    const handleMaxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = Math.max(Number(event.target.value), minValState + step);
        setMaxValState(value);
        maxValRef.current = value;
        onChange({ min: minValState, max: value });
    };

    const formatValue = (val: number) => {
        if (currency) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
        }
        return val;
    };

    return (
        <div className="flex flex-col gap-6 py-4 px-2">
            {label && (
                <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[13px] font-bold text-neutral-900">{formatValue(minValState)}</span>
                        <span className="text-neutral-300">-</span>
                        <span className="text-[13px] font-bold text-neutral-900">{formatValue(maxValState)}</span>
                    </div>
                </div>
            )}

            <div className="relative h-10 flex items-center">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={minValState}
                    onChange={handleMinChange}
                    className={`thumb thumb--left absolute w-full h-0 outline-none pointer-events-none appearance-none z-[3] ${minValState > max - 100 ? "z-[5]" : ""}`}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={maxValState}
                    onChange={handleMaxChange}
                    className="thumb thumb--right absolute w-full h-0 outline-none pointer-events-none appearance-none z-[4]"
                />

                <div className="relative w-full h-1.5 bg-neutral-100 rounded-full">
                    <div ref={range} className="absolute h-full bg-primary-500 rounded-full z-[1]" />
                </div>
            </div>

            <style>{`
        .thumb,
        .thumb::-webkit-slider-runnable-track,
        .thumb::-webkit-slider-thumb {
          appearance: none;
          -webkit-tap-highlight-color: transparent;
        }

        .thumb {
          pointer-events: none;
          position: absolute;
          height: 0;
          width: 100%;
          outline: none;
        }

        .thumb::-webkit-slider-thumb {
          background-color: #ffffff;
          border: 2px solid #0AB86D;
          border-radius: 50%;
          box-shadow: 0 0 1px 1px #ced4da;
          cursor: pointer;
          height: 18px;
          width: 18px;
          margin-top: 4px;
          pointer-events: all;
          position: relative;
        }

        .thumb::-moz-range-thumb {
          background-color: #ffffff;
          border: 2px solid #0AB86D;
          border-radius: 50%;
          box-shadow: 0 0 1px 1px #ced4da;
          cursor: pointer;
          height: 18px;
          width: 18px;
          pointer-events: all;
          position: relative;
        }
      `}</style>
        </div>
    );
};
