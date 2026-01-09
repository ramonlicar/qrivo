
import React, { useState } from 'react';

interface CalendarProps {
    selectedDate?: Date;
    onSelect?: (date: Date) => void;
    className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({ selectedDate, onSelect, className = '' }) => {
    const [viewDate, setViewDate] = useState(selectedDate || new Date());

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const days = [];
    const monthDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    // Previous month padding
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }

    // Current month days
    for (let i = 1; i <= monthDays; i++) {
        days.push(new Date(year, month, i));
    }

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const handlePrev = () => setViewDate(new Date(year, month - 1, 1));
    const handleNext = () => setViewDate(new Date(year, month + 1, 1));

    const isSelected = (date: Date | null) => {
        if (!date || !selectedDate) return false;
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    return (
        <div className={`p-4 bg-white border border-neutral-200 rounded-xl shadow-sm w-[280px] ${className}`}>
            <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-[13px] font-bold text-neutral-black">
                    {monthNames[month]} {year}
                </span>
                <div className="flex gap-1">
                    <button onClick={handlePrev} className="p-1 rounded-md hover:bg-neutral-50 transition-colors">
                        <i className="ph ph-caret-left text-neutral-400"></i>
                    </button>
                    <button onClick={handleNext} className="p-1 rounded-md hover:bg-neutral-50 transition-colors">
                        <i className="ph ph-caret-right text-neutral-400"></i>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                    <div key={d} className="h-8 flex items-center justify-center text-[10px] font-black text-neutral-300 uppercase">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((date, i) => (
                    <div key={i} className="h-8 flex items-center justify-center">
                        {date ? (
                            <button
                                onClick={() => onSelect?.(date)}
                                className={`
                  w-8 h-8 rounded-full text-[12px] font-medium transition-all
                  ${isSelected(date)
                                        ? 'bg-primary-500 text-white font-bold shadow-sm'
                                        : isToday(date)
                                            ? 'bg-primary-50 text-primary-600 font-bold'
                                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-black'}
                `}
                            >
                                {date.getDate()}
                            </button>
                        ) : null}
                    </div>
                ))}
            </div>
        </div>
    );
};
