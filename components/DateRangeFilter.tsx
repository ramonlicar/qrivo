import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay, isSameDay, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateRangeFilterProps {
    startDate: string | null;
    endDate: string | null;
    onChange: (start: string | null, end: string | null) => void;
    className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ startDate, endDate, onChange, className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState<'presets' | 'custom'>('presets');
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const ref = useRef<HTMLDivElement>(null);

    // Custom range temporary state
    const [tempStart, setTempStart] = useState<string>('');
    const [tempEnd, setTempEnd] = useState<string>('');

    useEffect(() => {
        const updatePosition = () => {
            if (ref.current && isOpen) {
                const rect = ref.current.getBoundingClientRect();
                setPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                });
            }
        };

        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
        }

        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const portalContent = document.getElementById('date-range-filter-portal');
            if (ref.current && !ref.current.contains(target) && (!portalContent || !portalContent.contains(target))) {
                setIsOpen(false);
                setView('presets'); // Reset view
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && view === 'custom' && startDate && endDate) {
            // Pre-fill inputs if opening custom view with existing values
            setTempStart(format(parseISO(startDate), 'yyyy-MM-dd'));
            setTempEnd(format(parseISO(endDate), 'yyyy-MM-dd'));
        }
    }, [isOpen, view, startDate, endDate]);


    const handlePreset = (type: string) => {
        const today = new Date();
        let start = null;
        let end = null;

        switch (type) {
            case 'today':
                start = startOfDay(today);
                end = endOfDay(today);
                break;
            case 'yesterday':
                const yesterday = subDays(today, 1);
                start = startOfDay(yesterday);
                end = endOfDay(yesterday);
                break;
            case 'last7':
                start = startOfDay(subDays(today, 6));
                end = endOfDay(today);
                break;
            case 'last30':
                start = startOfDay(subDays(today, 29));
                end = endOfDay(today);
                break;
            case 'thisMonth':
                start = startOfMonth(today);
                end = endOfDay(today);
                break;
            case 'lastMonth':
                const lastMonth = subMonths(today, 1);
                start = startOfMonth(lastMonth);
                end = endOfMonth(lastMonth);
                break;
        }

        if (start && end) {
            onChange(start.toISOString(), end.toISOString());
        } else {
            onChange(null, null);
        }
        setIsOpen(false);
    };

    const applyCustom = () => {
        if (tempStart && tempEnd) {
            const s = startOfDay(new Date(tempStart));
            const e = endOfDay(new Date(tempEnd));
            if (isValid(s) && isValid(e)) {
                onChange(s.toISOString(), e.toISOString());
                setIsOpen(false);
                setView('presets');
            }
        }
    };

    const getLabel = () => {
        if (!startDate || !endDate) return 'Período';
        const s = new Date(startDate);
        const e = new Date(endDate);
        if (!isValid(s) || !isValid(e)) return 'Período';

        if (isSameDay(s, e)) return format(s, "dd MMM", { locale: ptBR });
        return `${format(s, "dd MMM", { locale: ptBR })} - ${format(e, "dd MMM", { locale: ptBR })}`;
    };

    const hasSelection = !!(startDate && endDate);

    const portalContent = (
        <div
            id="date-range-filter-portal"
            className="fixed z-[9999] bg-white border border-neutral-200 rounded-[8px] shadow-lg py-1 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 origin-top-left min-w-[200px]"
            style={{ top: position.top + 4, left: position.left }}
        >
            {view === 'presets' ? (
                <>
                    <div className="px-3 py-2 border-b border-neutral-50 mb-1">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.1em]">Filtrar por data</span>
                    </div>

                    <div className="flex flex-col">
                        <button onClick={() => handlePreset('today')} className="text-left px-3 py-2 hover:bg-neutral-50 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 mx-1 rounded-md transition-colors">Hoje</button>
                        <button onClick={() => handlePreset('yesterday')} className="text-left px-3 py-2 hover:bg-neutral-50 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 mx-1 rounded-md transition-colors">Ontem</button>
                        <button onClick={() => handlePreset('last7')} className="text-left px-3 py-2 hover:bg-neutral-50 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 mx-1 rounded-md transition-colors">Últimos 7 dias</button>
                        <button onClick={() => handlePreset('last30')} className="text-left px-3 py-2 hover:bg-neutral-50 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 mx-1 rounded-md transition-colors">Últimos 30 dias</button>
                        <button onClick={() => handlePreset('thisMonth')} className="text-left px-3 py-2 hover:bg-neutral-50 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 mx-1 rounded-md transition-colors">Este mês</button>
                        <button onClick={() => handlePreset('lastMonth')} className="text-left px-3 py-2 hover:bg-neutral-50 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 mx-1 rounded-md transition-colors">Mês passado</button>

                        <div className="h-[1px] bg-neutral-100 my-1 mx-1"></div>

                        <button onClick={() => setView('custom')} className="text-left px-3 py-2 hover:bg-primary-50 text-[13px] font-bold text-primary-600 mx-1 rounded-md transition-colors flex justify-between items-center group">
                            Personalizado
                            <i className="ph ph-caret-right text-primary-400 group-hover:text-primary-600"></i>
                        </button>

                        {hasSelection && (
                            <div className="mt-1 pt-1 border-t border-neutral-100 px-1">
                                <button
                                    onClick={() => { onChange(null, null); setIsOpen(false); }}
                                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-left hover:bg-rose-50 text-neutral-500 hover:text-rose-600 transition-colors group"
                                >
                                    <i className="ph ph-trash ph-bold text-xs"></i>
                                    <span className="text-[12px] font-bold">Limpar período</span>
                                </button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="p-3 w-[260px]">
                    <div className="flex items-center justify-between mb-3">
                        <button onClick={() => setView('presets')} className="p-1 hover:bg-neutral-100 rounded-md text-neutral-500 hover:text-neutral-900">
                            <i className="ph ph-arrow-left text-sm"></i>
                        </button>
                        <span className="text-[12px] font-bold text-neutral-900">Personalizado</span>
                        <div className="w-6"></div> {/* Spacer */}
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-neutral-500 uppercase">Início</label>
                            <input
                                type="date"
                                value={tempStart}
                                onChange={(e) => setTempStart(e.target.value)}
                                className="w-full px-2 py-1.5 text-[13px] border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-semibold text-neutral-500 uppercase">Fim</label>
                            <input
                                type="date"
                                value={tempEnd}
                                onChange={(e) => setTempEnd(e.target.value)}
                                className="w-full px-2 py-1.5 text-[13px] border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>

                        <button
                            onClick={applyCustom}
                            disabled={!tempStart || !tempEnd}
                            className="mt-1 w-full bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-200 disabled:cursor-not-allowed text-white text-[13px] font-bold py-2 rounded-md transition-colors"
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <div className={`relative ${className}`} ref={ref}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`
            box-border flex flex-row justify-between items-center gap-[8px] bg-white border transition-all active:scale-[0.98] shadow-sm rounded-[6px] w-full
            ${isOpen ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'}
            h-[36px] px-[12px] min-w-[140px]
          `}
                >
                    <div className="flex items-center gap-2 overflow-hidden">
                        <i className="ph ph-calendar-blank text-neutral-400 text-sm"></i>
                        <div className="flex items-center gap-2 truncate">
                            <span className={`truncate font-medium text-[13px] ${hasSelection ? 'text-neutral-black' : 'text-neutral-400'}`}>
                                {getLabel()}
                            </span>
                        </div>
                    </div>
                    <i className={`ph ph-caret-down ph-bold text-neutral-400 transition-transform duration-200 text-xs ${isOpen ? 'rotate-180' : ''}`}></i>
                </button>
            </div>
            {isOpen && createPortal(portalContent, document.body)}
        </>
    );
};
