
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { Calendar } from './Calendar';
import { tasksService, CrmTask } from '../lib/tasksService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TasksSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    funnelId: string | null;
    companyId: string;
    onOpenLead?: (leadId: string) => void;
    onTasksChange?: () => void;
}

export const TasksSidebar: React.FC<TasksSidebarProps> = ({
    isOpen,
    onClose,
    funnelId,
    companyId,
    onOpenLead,
    onTasksChange
}) => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    useEffect(() => {
        if (isOpen && funnelId && companyId) {
            fetchTasks();
        }
    }, [isOpen, funnelId, companyId]);

    const fetchTasks = async () => {
        if (!funnelId || !companyId) return;
        setLoading(true);
        try {
            const { data } = await tasksService.getTasksByFunnel(companyId, funnelId);
            setTasks(data || []);
        } catch (error) {
            console.error("Error fetching funnel tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = async (task: any) => {
        try {
            await tasksService.toggleTask(task.id, !task.is_completed);
            // Update local state
            setTasks(prev => prev.map(t =>
                t.id === task.id ? { ...t, is_completed: !t.is_completed } : t
            ).filter(t => !t.is_completed)); // Remove from list if completed (since it's "atividades em aberto")

            // Notify parent to refresh count
            onTasksChange?.();
        } catch (error) {
            console.error("Error toggling task:", error);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        if (v.length > 4) {
            v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        } else if (v.length > 2) {
            v = `${v.slice(0, 2)}/${v.slice(2)}`;
        }
        setDateFilter(v);
    };

    const handleCalendarSelect = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        setDateFilter(`${day}/${month}/${year}`);
        setIsCalendarOpen(false);
    };

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const customerName = task.lead?.customer?.name || '';
            const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.title.toLowerCase().includes(searchTerm.toLowerCase());

            let matchesDate = true;
            if (dateFilter && dateFilter.length === 10) {
                const parts = dateFilter.split('/');
                const formattedFilter = `${parts[2]}-${parts[1]}-${parts[0]}`;
                matchesDate = !!(task.due_date && task.due_date.startsWith(formattedFilter));
            } else if (dateFilter && dateFilter.length > 0) {
                // Partial typing, don't filter until complete or handle differently?
                // For now, let's only filter if format is complete dd/mm/yyyy
                matchesDate = true;
            }

            return matchesSearch && matchesDate;
        });
    }, [tasks, searchTerm, dateFilter]);

    const groupedTasks = useMemo(() => {
        const groups: Record<string, any[]> = {};

        filteredTasks.forEach(task => {
            if (!task.due_date) {
                const key = 'Sem data';
                if (!groups[key]) groups[key] = [];
                groups[key].push(task);
                return;
            }

            const date = new Date(task.due_date);
            const key = format(date, "d 'de' MMMM '('EEEE')'", { locale: ptBR });

            if (!groups[key]) groups[key] = [];
            groups[key].push(task);
        });

        return Object.entries(groups).sort((a, b) => {
            if (a[0] === 'Sem data') return 1;
            if (b[0] === 'Sem data') return -1;
            // Extract dates for sorting
            const taskA = groups[a[0]][0];
            const taskB = groups[b[0]][0];
            return (taskA.due_date || '').localeCompare(taskB.due_date || '');
        });
    }, [filteredTasks]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-[110] transition-all animate-in fade-in"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-[450px] bg-white border-l border-neutral-200 z-[120] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-6 h-[56px] bg-white border-b border-neutral-100 flex-none">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                            <i className="ph ph-check-square text-primary-600 text-lg"></i>
                        </div>
                        <h2 className="text-[17px] font-bold text-neutral-900">Tarefas em Aberto {filteredTasks.length > 0 ? `(${filteredTasks.length})` : ''}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-50 text-neutral-400 hover:text-neutral-900 transition-colors"
                    >
                        <i className="ph ph-x text-xl"></i>
                    </button>
                </div>

                {/* Filters */}
                <div className="p-6 bg-white border-b border-neutral-100 flex flex-col gap-4">
                    <TextInput
                        placeholder="Pesquisar cliente ou tarefa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon="ph ph-magnifying-glass"
                        className="!h-10"
                    />
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                className="w-full h-10 px-3 pr-8 rounded-lg border border-neutral-200 text-sm bg-white focus:border-primary-500 outline-none text-neutral-600 placeholder:text-neutral-400 font-medium"
                                placeholder="dd/mm/aaaa"
                                value={dateFilter}
                                onChange={handleDateChange}
                                onFocus={() => setIsCalendarOpen(true)}
                                maxLength={10}
                            />
                            <i className="ph ph-calendar absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"></i>

                            {isCalendarOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setIsCalendarOpen(false)}
                                    ></div>
                                    <div className="absolute top-full left-0 mt-2 z-50">
                                        <Calendar
                                            onSelect={handleCalendarSelect}
                                            selectedDate={dateFilter.length === 10 ? new Date(parseInt(dateFilter.split('/')[2]), parseInt(dateFilter.split('/')[1]) - 1, parseInt(dateFilter.split('/')[0])) : undefined}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                        {dateFilter && (
                            <button
                                onClick={() => setDateFilter('')}
                                className="text-xs font-bold text-neutral-400 hover:text-neutral-900 transition-colors uppercase tracking-widest"
                            >
                                Limpar
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <i className="ph ph-circle-notch animate-spin text-3xl text-primary-500"></i>
                            <span className="text-sm font-medium text-neutral-400">Carregando atividades...</span>
                        </div>
                    ) : groupedTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-dashed border-neutral-300 mb-4 shadow-sm">
                                <i className="ph ph-calendar-blank text-2xl text-neutral-300"></i>
                            </div>
                            <h3 className="text-neutral-900 font-bold text-base mb-1">Nenhuma atividade</h3>
                            <p className="text-neutral-500 text-sm max-w-[240px]">
                                {searchTerm || dateFilter
                                    ? "Não encontramos atividades com os filtros aplicados."
                                    : "Não há atividades pendentes neste funil."}
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-8">
                            {groupedTasks.map(([dateLabel, groupTasks]) => (
                                <div key={dateLabel} className="flex flex-col gap-3">
                                    <div className="flex items-center gap-3 mt-4 first:mt-0">
                                        <h3 className="text-[15px] font-semibold text-black">{dateLabel}</h3>
                                        <div className="flex-1 h-px bg-neutral-100" />
                                    </div>

                                    <div className="flex flex-col gap-2.5">
                                        {groupTasks.map(task => (
                                            <div
                                                key={task.id}
                                                className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:border-primary-300 transition-all flex items-center gap-4 group"
                                            >
                                                <button
                                                    onClick={() => handleToggleTask(task)}
                                                    className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center transition-all flex-none ${task.is_completed
                                                        ? 'bg-primary-500 border-primary-500 text-white'
                                                        : 'border-neutral-200 hover:border-primary-500 bg-white'
                                                        }`}
                                                >
                                                    {task.is_completed && <i className="ph ph-check ph-bold text-xs"></i>}
                                                </button>

                                                <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                                                    <div className="flex items-center gap-2">
                                                        {task.due_date && (
                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-neutral-100 rounded text-[11px] font-mono font-bold text-neutral-500 flex-none capitalize">
                                                                <i className="ph ph-clock text-xs"></i>
                                                                {format(new Date(task.due_date), 'HH:mm')}
                                                            </div>
                                                        )}
                                                        <span className="text-[14px] font-bold text-neutral-900 truncate">{task.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[12px] font-medium text-neutral-400">Cliente:</span>
                                                        <span className="text-[12px] font-bold text-primary-600 truncate">{task.lead?.customer?.name || 'Lead sem nome'}</span>
                                                    </div>
                                                </div>

                                                <div className="flex-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => onOpenLead?.(task.lead?.id)}
                                                        className="w-8 h-8 rounded-lg hover:bg-neutral-50 text-neutral-400 hover:text-neutral-900 flex items-center justify-center"
                                                    >
                                                        <i className="ph ph-arrow-right"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
