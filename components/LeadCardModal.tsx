
import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { Calendar } from './Calendar';
import { KanbanCard, Customer, KanbanTag, KanbanFile } from '../types';
import { tasksService, CrmTask } from '../lib/tasksService';
import { customersService } from '../lib/services';
import { funnelsService } from '../lib/funnelsService';


interface LeadCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    card: KanbanCard | null;
    companyId: string;
    teamMembers?: any[];
    aiAgents?: any[]; // New prop
    funnelName?: string;
    stageName?: string;
    onUpdate?: () => void;
}

export const LeadCardModal: React.FC<LeadCardModalProps> = ({
    isOpen,
    onClose,
    card,
    companyId,
    teamMembers = [],
    aiAgents = [], // Default to empty
    funnelName,
    stageName,
    onUpdate
}) => {


    const [activeTab, setActiveTab] = useState<'details' | 'tasks' | 'files' | 'history'>('details');
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [tasks, setTasks] = useState<CrmTask[]>([]);

    const overdueTasksCount = useMemo(() => {
        return tasks.filter(t => !t.is_completed && t.due_date && new Date(t.due_date) < new Date()).length;
    }, [tasks]);

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

    const [showDeleteTaskConfirm, setShowDeleteTaskConfirm] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<CrmTask | null>(null);

    const handleTimeSelect = (time: string) => {
        setNewTaskTime(time);
        setIsTimePickerOpen(false);
    };

    const timeOptions = [];
    for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0');
        timeOptions.push(`${hour}:00`);
        timeOptions.push(`${hour}:30`);
    }
    const [tags, setTags] = useState<KanbanTag[]>(card?.tags || []);
    const [isAddingTag, setIsAddingTag] = useState(false);
    const [files, setFiles] = useState<KanbanFile[]>([]);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [allCompanyTags, setAllCompanyTags] = useState<{ name: string, color: string }[]>([]);
    const [showDeleteFileConfirm, setShowDeleteFileConfirm] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<KanbanFile | null>(null);

    useEffect(() => {
        if (companyId) {
            customersService.getCompanyTags(companyId).then(({ data }) => {
                if (data) setAllCompanyTags(data);
            });
        }
    }, [companyId]);

    useEffect(() => {
        if (card?.id) {
            // Fetch Files
            funnelsService.getLeadFiles(card.id).then(({ data, error }) => {
                if (!error && data) {
                    setFiles(data);
                }
            });
        }
    }, [card?.id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !card || !companyId) return;

        try {
            setIsUploadingFile(true);
            const { data, error } = await funnelsService.uploadLeadFile(companyId, card.id, file);
            if (error) throw error;
            if (data) {
                // Optimistically add to list (re-fetch would be safer but this is faster)
                // Casting type because DB return might slightly differ from frontend interface if not mapped, but should be close.
                // Or just refetch.
                const newFile: KanbanFile = {
                    id: data.id,
                    name: data.name,
                    url: data.url,
                    type: data.type,
                    size: data.size,
                    createdAt: data.created_at
                };
                setFiles(prev => [newFile, ...prev]);
                setIsUploadingFile(false);
            }
        } catch (error) {
            console.error("Upload error", error);
            setIsUploadingFile(false);
        } finally {
            // Reset input
            e.target.value = '';
        }
    };

    const handleOpenFileDelete = (file: KanbanFile) => {
        setFileToDelete(file);
        setShowDeleteFileConfirm(true);
    };

    const handleConfirmDeleteFile = async () => {
        if (!fileToDelete) return;

        try {
            setFiles(prev => prev.filter(f => f.id !== fileToDelete.id)); // Optimistic UI
            await funnelsService.deleteLeadFile(fileToDelete.id);
            // Optionally log history here if service doesn't
        } catch (error) {
            console.error("Error deleting file:", error);
            // Revert if needed, or show toast
        } finally {
            setShowDeleteFileConfirm(false);
            setFileToDelete(null);
        }
    };
    const [newTagText, setNewTagText] = useState('');

    // Predefined colors for new tags
    const TAG_COLORS = [
        'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 'bg-lime-500',
        'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
        'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500',
        'bg-pink-500', 'bg-rose-500'
    ];

    const handleRemoveTag = async (tagText: string) => {
        if (!companyId || !card) return;

        // Optimistic Update
        const oldTags = [...tags];
        setTags(prev => prev.filter(t => t.text !== tagText));

        try {
            await customersService.removeTag(companyId, card.customerId, tagText);
            // Log History
            await funnelsService.addLeadHistory(card.id, companyId, 'tag_removed', `Tag removida: ${tagText}`);
            if (onUpdate) onUpdate(); // Refresh board to ensure consistency
        } catch (error) {
            console.error("Failed to remove tag", error);
            setTags(oldTags); // Rollback
            alert("Erro ao remover tag.");
        }
    };

    const handleAddTag = async () => {
        if (!newTagText.trim() || !companyId || !card) return;

        const text = newTagText.trim();

        // Check if tag already exists to reuse color
        const existingTag = allCompanyTags.find(t => t.name.toLowerCase() === text.toLowerCase());
        const color = existingTag ? existingTag.color : TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];

        const tempTag = { text, color };
        setTags(prev => [...prev, tempTag]);
        setNewTagText('');
        setIsAddingTag(false);

        try {
            await customersService.addTag(companyId, card.customerId, text, color);
            // Log History
            await funnelsService.addLeadHistory(card.id, companyId, 'tag_added', `Tag adicionada: ${text}`);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error("Failed to add tag", error);
            setTags(prev => prev.filter(t => t.text !== text)); // Rollback
            alert("Erro ao adicionar tag.");
        }
    };

    // Delete State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteLead = async () => {
        if (!card) return;
        try {
            const { error } = await funnelsService.deleteLead(card.id);
            if (error) throw error;
            setShowDeleteConfirm(false);
            onClose(); // Close modal
            if (onUpdate) onUpdate(); // Refresh board
        } catch (error) {
            console.error("Failed to delete lead", error);
            alert("Erro ao excluir lead.");
        }
    };

    // Edit States
    const [isEditingValue, setIsEditingValue] = useState(false);
    const [editValue, setEditValue] = useState('');

    // Reset edit states when card changes
    useEffect(() => {
        if (card) {
            const val = Number(card.value);
            setEditValue(isNaN(val) ? '0' : card.value?.toString() || '0');
        }
    }, [card]);

    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const fetchHistory = async () => {
        if (!card) return;
        setLoadingHistory(true);
        const { data } = await funnelsService.getLeadHistory(card.id);
        if (data) setHistory(data);
        setLoadingHistory(false);
    };

    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistory();
        }
    }, [activeTab, card]);

    const getHistoryConfig = (action: string) => {
        switch (action) {
            case 'created':
                return { color: 'bg-primary-500', icon: null }; // Dot
            case 'moved':
                return { color: 'bg-neutral-300', icon: null };
            case 'file':
                return { color: 'bg-blue-500', icon: 'ph-file' };
            case 'task':
                return { color: 'bg-orange-500', icon: 'ph-check-square' };
            case 'tag_added':
                return { color: 'bg-emerald-500', icon: 'ph-tag' };
            case 'tag_removed':
                return { color: 'bg-red-500', icon: 'ph-tag' };
            default:
                return { color: 'bg-neutral-300', icon: null };
        }
    };

    const handleUpdateLead = async (updates: any) => {
        if (!card) return;

        // Optimistic update for UI if needed, but we rely on external refresh mostly
        const { error } = await funnelsService.updateLead(card.id, updates);

        if (!error && onUpdate) {
            onUpdate();
        }
    };

    // Toast State
    const [toast, setToast] = useState({ show: false, message: '' });
    const showToast = (message: string) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const handleCancelValue = () => {
        setIsEditingValue(false);
        const val = Number(card?.value);
        setEditValue(isNaN(val) ? '0' : card?.value?.toString() || '0');
    };

    const handleSaveValue = async () => {
        const val = parseFloat(editValue.replace(/[^\d.-]/g, ''));
        if (isNaN(val)) return;

        // Optimistic
        if (onUpdate) onUpdate();
        setIsEditingValue(false);

        // Update DB
        const { error } = await funnelsService.updateLead(card.id, { estimated_value: val });
        if (error) {
            console.error(error);
            alert("Erro ao atualizar valor.");
        } else {
            showToast("Valor atualizado com sucesso!");
            if (onUpdate) onUpdate();
        }
    };

    const handleAgentChange = async (userId: string) => {
        const { error } = await funnelsService.updateLead(card.id, { agent_id: userId });

        if (error) {
            console.error("Failed to assign agent", error);
            alert("Erro ao atribuir agente.");
        } else {
            showToast("Agente atualizado com sucesso!");
            if (onUpdate) onUpdate();
        }
    };

    // Formatters
    const formatPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.length >= 12) {
            return `+${digits.substring(0, 2)} (${digits.substring(2, 4)}) ${digits.substring(4, 9)}-${digits.substring(9)}`;
        }
        return phone;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    useEffect(() => {
        if (isOpen && card && companyId) {
            fetchTasks();
            setTags(card.tags || []);
        }
    }, [isOpen, card, companyId]);

    const fetchTasks = async () => {
        if (!card || !companyId) return;
        setLoadingTasks(true);
        const { data } = await tasksService.getTasks(companyId, card.id);
        if (data) setTasks(data);
        setLoadingTasks(false);
    };

    // Date/Time Masking Handlers
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 8) v = v.slice(0, 8);
        if (v.length > 4) {
            v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
        } else if (v.length > 2) {
            v = `${v.slice(0, 2)}/${v.slice(2)}`;
        }
        setNewTaskDate(v);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 4) v = v.slice(0, 4);
        if (v.length > 2) {
            v = `${v.slice(0, 2)}:${v.slice(2)}`;
        }
        setNewTaskTime(v);
    };

    const handleCalendarSelect = (date: Date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        setNewTaskDate(`${day}/${month}/${year}`);
        setIsCalendarOpen(false);
    };

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || !companyId || !card) return;

        let dueDate: string | undefined = undefined;
        // Parse dd/mm/yyyy
        if (newTaskDate && newTaskDate.length === 10) {
            const dateParts = newTaskDate.split('/'); // [dd, mm, yyyy]
            const timeParts = newTaskTime && newTaskTime.length === 5 ? newTaskTime.split(':') : ['09', '00'];

            const day = parseInt(dateParts[0]);
            const month = parseInt(dateParts[1]) - 1;
            const year = parseInt(dateParts[2]);
            const hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);

            // Basic validation
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                const date = new Date(year, month, day, hour, minute);
                dueDate = date.toISOString();
            }
        }

        // Optimistic
        const tempId = 'temp-' + Date.now();
        const tempTask: CrmTask = {
            id: tempId, company_id: companyId, lead_id: card.id,
            title: newTaskTitle, is_completed: false, created_at: new Date().toISOString(),
            due_date: dueDate
        };
        setTasks(prev => [tempTask, ...prev]);
        setNewTaskTitle('');
        setNewTaskDate('');
        setNewTaskTime('');

        const { data, error } = await tasksService.createTask(companyId, card.id, card.customerId, tempTask.title, dueDate);
        if (data) {
            setTasks(prev => prev.map(t => t.id === tempId ? data : t));
            // Log History
            await funnelsService.addLeadHistory(card.id, companyId, 'task', `Tarefa criada: ${tempTask.title}`);
            onUpdate?.();
        } else {
            // Revert on error
            setTasks(prev => prev.filter(t => t.id !== tempId));
            console.error("Error creating task", error);
        }
    };

    const handleOpenTaskDelete = (task: CrmTask) => {
        setTaskToDelete(task);
        setShowDeleteTaskConfirm(true);
    };

    const handleConfirmDeleteTask = async () => {
        if (!taskToDelete) return;

        try {
            setTasks(prev => prev.filter(t => t.id !== taskToDelete.id)); // Optimistic
            await tasksService.deleteTask(taskToDelete.id);
            // Log history
            if (card && companyId) {
                await funnelsService.addLeadHistory(card.id, companyId, 'task', `Tarefa excluída: ${taskToDelete.title}`);
            }
            onUpdate?.();
        } catch (error) {
            console.error("Error deleting task:", error);
            // Revert or show error
        } finally {
            setShowDeleteTaskConfirm(false);
            setTaskToDelete(null);
        }
    };

    const handleToggleTask = async (task: CrmTask) => {
        // Optimistic
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: !t.is_completed } : t));
        await tasksService.toggleTask(task.id, !task.is_completed);
        onUpdate?.();
    };

    const getGroupedTasks = () => {
        const groups: { [key: string]: CrmTask[] } = {};

        tasks.forEach(task => {
            if (!task.due_date) {
                const key = 'Sem data';
                if (!groups[key]) groups[key] = [];
                groups[key].push(task);
            } else {
                const date = new Date(task.due_date);
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' });
                const formattedKey = `${day}/${month}/${year} (${weekday.charAt(0).toUpperCase() + weekday.slice(1)})`;

                if (!groups[formattedKey]) groups[formattedKey] = [];
                groups[formattedKey].push(task);
            }
        });

        return Object.entries(groups).sort((a, b) => {
            if (a[0] === 'Sem data') return 1;
            if (b[0] === 'Sem data') return -1;

            const getDate = (str: string) => {
                const parts = str.split(' ')[0].split('/');
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
            };
            return getDate(a[0]) - getDate(b[0]);
        });
    };

    if (!card) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalhes do Lead"
            maxWidth="800px" // Adjusted width for new design (798px in CSS)
            noPadding
            hideHeader
            position="right"
        >
            <div className="flex flex-col h-full">
                {/* Custom Header with new design */}
                <div className="flex flex-col border-b border-neutral-100 bg-white rounded-t-2xl">
                    {/* Top Bar */}
                    <div className="flex flex-row justify-between items-center px-6 py-5 gap-3 h-[56px] border-b border-neutral-100 bg-white rounded-t-2xl">
                        <h5 className="text-[15px] font-bold text-[#1F1F1E] tracking-tight m-0">Detalhes do Lead</h5>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-system-error-500 hover:bg-system-error-50 transition-all border border-transparent hover:border-system-error-100"
                            >
                                Excluir Lead
                            </button>
                            <button
                                onClick={onClose}
                                className="flex items-center justify-center w-[30px] h-[30px] rounded-lg border border-[#E8E8E3] bg-white transition-all text-[#686864] hover:text-neutral-900 hover:bg-neutral-50"
                            >
                                <i className="ph ph-x text-lg"></i>
                            </button>
                        </div>
                    </div>

                    {/* Profile Section */}
                    <div className="p-6 pb-0 flex items-start gap-6 bg-white">
                        {/* Avatar */}
                        <div className="w-[94px] h-[94px] rounded-full bg-[#F4F4F1] border border-dashed border-[#E8E8E3] flex items-center justify-center overflow-hidden flex-none">
                            {card.customerAvatar ? (
                                <img src={card.customerAvatar} className="w-full h-full object-cover" />
                            ) : (
                                <i className="ph ph-user text-3xl text-[#0AB86D]"></i>
                            )}
                        </div>

                        <div className="flex flex-col gap-4 flex-1">
                            {/* Name */}
                            <h3 className="text-[24px] font-bold text-black leading-[120%]">{card.customerName}</h3>

                            {/* Info Rows */}
                            <div className="flex flex-col gap-2">
                                {/* WhatsApp */}
                                <div className="flex items-center gap-4">
                                    <span className="text-[13px] font-medium text-[#686864] w-[80px] flex-none">WhatsApp</span>
                                    <span
                                        className="text-[13px] font-semibold text-[#01040E] hover:text-primary-600 cursor-pointer transition-colors"
                                        onClick={() => window.open(`https://wa.me/${card.customerPhone.replace(/\D/g, '')}`, '_blank')}
                                    >
                                        {formatPhone(card.customerPhone)}
                                    </span>
                                </div>

                                {/* Email */}
                                {card.customerEmail && (
                                    <div className="flex items-center gap-4">
                                        <span className="text-[13px] font-medium text-[#686864] w-[80px] flex-none">Email</span>
                                        <span className="text-[13px] font-semibold text-[#01040E]">{card.customerEmail}</span>
                                    </div>
                                )}

                                {/* Funnel */}
                                <div className="flex items-center gap-4">
                                    <span className="text-[13px] font-medium text-[#686864] w-[80px] flex-none">Funil</span>
                                    <span className="text-[13px] font-semibold text-[#01040E]">{funnelName || 'Geral'}</span>
                                </div>

                                {/* Stage */}
                                <div className="flex items-center gap-4">
                                    <span className="text-[13px] font-medium text-[#686864] w-[80px] flex-none">Etapa</span>
                                    <span className="text-[13px] font-semibold text-[#01040E]">{stageName || 'Sem etapa'}</span>
                                </div>

                                {/* Creation */}
                                <div className="flex items-center gap-4">
                                    <span className="text-[13px] font-medium text-[#686864] w-[80px] flex-none">Criação</span>
                                    <span className="text-[13px] font-semibold text-[#01040E]">{formatDate(card.createdAt) || 'N/A'}</span>
                                </div>

                                {/* Tags */}
                                <div className="flex items-start gap-4">
                                    <span className="text-[13px] font-medium text-[#686864] w-[80px] flex-none py-1">Tags</span>
                                    <div className="flex flex-wrap gap-2 fl">
                                        {tags.map((tag, index) => (
                                            <span
                                                key={`${tag.text}-${index}`}
                                                className={`text-[11px] font-bold text-white px-2 py-1 rounded-md ${tag.color || 'bg-[#0AB86D]'} flex items-center gap-1 group`}
                                            >
                                                {tag.text}
                                                <button
                                                    onClick={() => handleRemoveTag(tag.text)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-100"
                                                >
                                                    <i className="ph ph-x"></i>
                                                </button>
                                            </span>
                                        ))}

                                        {isAddingTag ? (
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    value={newTagText}
                                                    onChange={(e) => setNewTagText(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleAddTag();
                                                        if (e.key === 'Escape') setIsAddingTag(false);
                                                    }}
                                                    className="w-[100px] h-[24px] text-[12px] px-2 rounded border border-neutral-300 outline-none focus:border-primary-500"
                                                    placeholder="Nome da tag..."
                                                />
                                                <button onClick={handleAddTag} className="text-primary-600 hover:text-primary-700">
                                                    <i className="ph ph-check-circle text-lg"></i>
                                                </button>
                                                <button onClick={() => setIsAddingTag(false)} className="text-red-500 hover:text-red-600">
                                                    <i className="ph ph-x-circle text-lg"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsAddingTag(true)}
                                                className="text-[13px] font-medium text-[#059E5D] hover:bg-emerald-50 px-2 py-1 rounded-lg transition-colors"
                                            >
                                                Nova Tag
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center px-6 pt-4 flex-none bg-white">
                        <button
                            onClick={() => setActiveTab('details')}
                            className={`h-[36px] px-6 flex items-center justify-center text-[13px] font-medium transition-colors border-b-[3px] ${activeTab === 'details' ? 'border-[#0AB86D] text-[#01040E] font-semibold' : 'border-transparent text-[#01040E]'}`}
                        >
                            Detalhes
                        </button>
                        <button
                            onClick={() => setActiveTab('tasks')}
                            className={`h-[36px] px-6 flex items-center justify-center text-[13px] font-medium transition-colors border-b-[3px] gap-2 ${activeTab === 'tasks' ? 'border-[#0AB86D] text-[#01040E] font-semibold' : 'border-transparent text-[#01040E]'}`}
                        >
                            Tarefas e Lembretes
                            {overdueTasksCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                                    {overdueTasksCount}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('files')}
                            className={`h-[36px] px-6 flex items-center justify-center text-[13px] font-medium transition-colors border-b-[3px] ${activeTab === 'files' ? 'border-[#0AB86D] text-[#01040E] font-semibold' : 'border-transparent text-[#01040E]'}`}
                        >
                            Arquivos
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`h-[36px] px-6 flex items-center justify-center text-[13px] font-medium transition-colors border-b-[3px] ${activeTab === 'history' ? 'border-[#0AB86D] text-[#01040E] font-semibold' : 'border-transparent text-[#01040E]'}`}
                        >
                            Histórico
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-white p-6">

                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <div className="flex flex-col gap-4">
                            {/* Card 1: Value */}
                            <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-2 relative group w-full">
                                <div className="flex justify-between items-start">
                                    <span className="text-body2 font-medium text-neutral-500">Valor Estimado</span>
                                    <button
                                        onClick={() => {
                                            setIsEditingValue(true);
                                            const val = Number(card.value);
                                            setEditValue(isNaN(val) ? '0' : card.value?.toString() || '0');
                                        }}
                                        className="text-neutral-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <i className="ph ph-pencil-simple"></i>
                                    </button>
                                </div>

                                {isEditingValue ? (
                                    <div className="flex items-center gap-2 w-full">
                                        <div className="flex items-center flex-1 gap-2 border-b border-primary-500">
                                            <span className="text-neutral-400 font-bold">R$</span>
                                            <input
                                                autoFocus
                                                type="text"
                                                className="w-full font-bold text-xl text-neutral-900 focus:outline-none bg-transparent"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleSaveValue();
                                                    if (e.key === 'Escape') handleCancelValue();
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={handleSaveValue}
                                                className="p-1 text-system-success-500 hover:bg-system-success-50 rounded-md transition-colors"
                                                title="Salvar"
                                            >
                                                <i className="ph ph-check text-xl"></i>
                                            </button>
                                            <button
                                                onClick={handleCancelValue}
                                                className="p-1 text-neutral-400 hover:text-system-error-500 hover:bg-system-error-50 rounded-md transition-colors"
                                                title="Cancelar"
                                            >
                                                <i className="ph ph-x text-xl"></i>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-xl font-bold text-neutral-900 tracking-tight">
                                        {isNaN(Number(card.value)) ? 'R$ 0,00' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(card.value))}
                                    </span>
                                )}
                            </div>

                            {/* Card 4: Agent */}
                            <div className="p-4 bg-white rounded-xl border border-neutral-200 shadow-sm flex flex-col gap-2 relative group w-full overflow-visible">
                                <span className="text-body2 font-medium text-neutral-500">Agente IA</span>
                                <div className="mt-1">
                                    <Dropdown
                                        label="Selecionar Agente"
                                        value={aiAgents.find(a => a.id === card.agent_id)?.id || ''}
                                        onChange={(val) => handleAgentChange(val)}
                                        options={[
                                            { label: 'Não atribuído', value: '' },
                                            ...aiAgents.map((agent: any) => ({
                                                label: agent.name,
                                                value: agent.id
                                            }))
                                        ]}
                                        className="w-full"
                                        leftIcon="ph-user"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TASKS TAB */}
                    {activeTab === 'tasks' && (
                        <div className="flex flex-col gap-6">
                            {/* Create Task Form */}
                            <div className="flex flex-col gap-3 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                                <TextInput
                                    placeholder="O que precisa ser feito?"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    // Removed onKeyDown to prevent submit without date if desired
                                    className="bg-white"
                                />
                                <div className="flex items-center gap-2">
                                    <div className="relative w-[140px]">
                                        <input
                                            type="text"
                                            className="w-full h-10 px-3 pr-8 rounded-lg border border-neutral-200 text-sm bg-white focus:border-primary-500 outline-none text-neutral-600 placeholder:text-neutral-400"
                                            placeholder="dd/mm/aaaa"
                                            value={newTaskDate}
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
                                                        selectedDate={newTaskDate.length === 10 ? new Date(parseInt(newTaskDate.split('/')[2]), parseInt(newTaskDate.split('/')[1]) - 1, parseInt(newTaskDate.split('/')[0])) : undefined}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="relative w-[100px]">
                                        <input
                                            type="text"
                                            className="w-full h-10 px-3 pr-8 rounded-lg border border-neutral-200 text-sm bg-white focus:border-primary-500 outline-none text-neutral-600 placeholder:text-neutral-400"
                                            placeholder="--:--"
                                            value={newTaskTime}
                                            onChange={handleTimeChange}
                                            onFocus={() => setIsTimePickerOpen(true)}
                                            maxLength={5}
                                        />
                                        <i className="ph ph-clock absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"></i>

                                        {isTimePickerOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setIsTimePickerOpen(false)}
                                                ></div>
                                                <div className="absolute top-full left-0 mt-2 z-50 w-[140px] max-h-[200px] overflow-y-auto bg-white rounded-xl shadow-lg border border-neutral-100 flex flex-col p-1 custom-scrollbar">
                                                    {timeOptions.map(time => (
                                                        <button
                                                            key={time}
                                                            onClick={() => handleTimeSelect(time)}
                                                            className={`h-8 px-3 rounded-md text-[13px] font-medium text-left transition-colors flex-none ${time === newTaskTime ? 'bg-primary-50 text-primary-600' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'}`}
                                                        >
                                                            {time}
                                                        </button>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="flex-1"></div>
                                    <Button onClick={handleAddTask} variant="primary" leftIcon="ph-plus">Agendar</Button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-6">
                                {loadingTasks && <div className="text-center py-4 text-neutral-400">Carregando tarefas...</div>}

                                {!loadingTasks && tasks.length === 0 && (
                                    <div className="text-center py-8 bg-white rounded-xl border border-dashed border-neutral-200">
                                        <p className="text-neutral-400 text-sm">Nenhuma tarefa pendente.</p>
                                    </div>
                                )}

                                {!loadingTasks && getGroupedTasks().map(([dateGroup, groupTasks]) => (
                                    <div key={dateGroup} className="flex flex-col gap-3">
                                        <h4 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-2">{dateGroup}</h4>
                                        <div className="flex flex-col gap-2">
                                            {groupTasks.sort((a, b) => (a.due_date || '').localeCompare(b.due_date || '')).map(task => (
                                                <div key={task.id} className="group flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-200 shadow-sm hover:border-primary-300 transition-all">
                                                    <button
                                                        onClick={() => handleToggleTask(task)}
                                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.is_completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-neutral-300 hover:border-primary-500'}`}
                                                    >
                                                        {task.is_completed && <i className="ph ph-check text-xs"></i>}
                                                    </button>

                                                    {task.due_date && (
                                                        <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded border ${!task.is_completed && new Date(task.due_date) < new Date()
                                                            ? 'bg-red-50 text-red-600 border-red-100 font-bold'
                                                            : 'bg-neutral-100 text-neutral-500 border-transparent'
                                                            }`}>
                                                            {new Date(task.due_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}

                                                    <span className={`flex-1 text-sm ${task.is_completed ? 'text-neutral-400 line-through' : 'text-neutral-800 font-medium'}`}>
                                                        {task.title}
                                                    </span>

                                                    <button
                                                        onClick={() => handleOpenTaskDelete(task)}
                                                        className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors border border-transparent hover:border-red-100"
                                                        title="Excluir Tarefa"
                                                    >
                                                        <i className="ph ph-trash text-lg"></i>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FILES TAB */}
                    {activeTab === 'files' && (
                        <div className="flex flex-col h-full relative">
                            {/* Hidden Input for Upload */}
                            <input
                                type="file"
                                id="lead-file-upload"
                                className="hidden"
                                onChange={handleFileUpload}
                                disabled={isUploadingFile}
                            />

                            {files.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4">
                                        <i className="ph ph-folder-open text-2xl text-neutral-400"></i>
                                    </div>
                                    <h3 className="text-neutral-900 font-bold text-base mb-2">Nenhum arquivo encontrado</h3>
                                    <p className="text-neutral-500 text-sm max-w-[280px] mb-6 leading-relaxed">
                                        Nenhum arquivo foi anexado a este lead ainda. Clique no botão abaixo para fazer o upload.
                                    </p>
                                    <label
                                        htmlFor="lead-file-upload"
                                        className={`cursor-pointer bg-white border border-neutral-200 text-neutral-900 font-semibold text-sm px-4 py-2.5 rounded-lg shadow-sm hover:bg-neutral-50 transition-all ${isUploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isUploadingFile ? (
                                            <div className="flex items-center gap-2">
                                                <i className="ph ph-spinner animate-spin"></i>
                                                <span>Enviando...</span>
                                            </div>
                                        ) : (
                                            "Anexar Arquivo"
                                        )}
                                    </label>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-neutral-800">Arquivos ({files.length})</h4>
                                        <label
                                            htmlFor="lead-file-upload"
                                            className="cursor-pointer text-sm font-bold text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-primary-100 flex items-center gap-2"
                                        >
                                            {isUploadingFile ? (
                                                <>
                                                    <i className="ph ph-spinner animate-spin"></i>
                                                    Enviando...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ph ph-plus"></i>
                                                    Novo Arquivo
                                                </>
                                            )}
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {files.map((file, index) => (
                                            <div key={`${file.id}-${index}`} className="flex items-center justify-between p-3 bg-white border border-neutral-200 rounded-xl hover:border-primary-300 transition-colors group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                                                        <i className="ph ph-file-text text-xl text-neutral-400 group-hover:text-primary-500 transition-colors"></i>
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className="text-body2 font-semibold text-neutral-900 truncate" title={file.name}>{file.name}</span>
                                                        <span className="text-xs text-neutral-500 uppercase">{file.name.split('.').pop() || 'FILE'} • {(file.size / 1024).toFixed(0)} KB</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-50 text-neutral-400 hover:text-neutral-900 transition-colors border border-transparent hover:border-neutral-200"
                                                        title="Baixar Arquivo"
                                                    >
                                                        <i className="ph ph-download-simple text-lg"></i>
                                                    </a>
                                                    <button
                                                        onClick={() => handleOpenFileDelete(file)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors border border-transparent hover:border-red-100"
                                                        title="Excluir Arquivo"
                                                    >
                                                        <i className="ph ph-trash text-lg"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {activeTab === 'history' && (
                        <div className="flex flex-col gap-4">
                            {loadingHistory ? (
                                <div className="flex items-center justify-center py-8">
                                    <i className="ph ph-spinner animate-spin text-2xl text-primary-500"></i>
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-8 text-neutral-400">
                                    <i className="ph ph-clock-counter-clockwise text-3xl mb-2"></i>
                                    <p className="text-sm">Nenhuma atividade registrada.</p>
                                </div>
                            ) : (
                                <div className="relative pl-4 border-l-2 border-neutral-200 space-y-6">
                                    {history.map((item, idx) => {
                                        const config = getHistoryConfig(item.action_type);
                                        return (
                                            <div key={item.id || idx} className="relative">
                                                <div className={`absolute -left-[21px] top-0 w-3 h-3 rounded-full ${config.color} ring-4 ring-white flex items-center justify-center`}>
                                                    {config.icon && <i className={`${config.icon} text-[8px] text-white`}></i>}
                                                </div>
                                                <p className="text-body2 font-semibold text-neutral-800" dangerouslySetInnerHTML={{ __html: item.description }}></p>
                                                <p className="text-xs text-neutral-400">
                                                    {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Delete Confirmation */}
            <Modal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                title="Excluir Lead"
                maxWidth="400px"
                footer={
                    <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1 !h-[36px]" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
                        <Button variant="danger" className="flex-1 !h-[36px] shadow-sm" onClick={handleDeleteLead}>
                            Excluir Lead
                        </Button>
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center justify-center py-2">
                        <div className="w-16 h-16 bg-system-error-50 rounded-full flex items-center justify-center text-system-error-500 mb-2 border border-system-error-100 shadow-sm">
                            <i className="ph ph-trash ph-bold text-3xl"></i>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 text-center">
                        <p className="text-body2 font-bold text-neutral-black">
                            Deseja excluir este lead?
                        </p>
                        <p className="text-small text-neutral-500 leading-relaxed">
                            O registro do cliente não será apagado, apenas este cartão do funil. Esta operação não pode ser desfeita.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Delete File Confirmation */}
            <Modal
                isOpen={showDeleteFileConfirm}
                onClose={() => setShowDeleteFileConfirm(false)}
                title="Excluir Arquivo"
                maxWidth="400px"
                footer={
                    <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1 !h-[36px]" onClick={() => setShowDeleteFileConfirm(false)}>Cancelar</Button>
                        <Button variant="danger" className="flex-1 !h-[36px] shadow-sm" onClick={handleConfirmDeleteFile}>
                            Excluir Arquivo
                        </Button>
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center justify-center py-2">
                        <div className="w-16 h-16 bg-system-error-50 rounded-full flex items-center justify-center text-system-error-500 mb-2 border border-system-error-100 shadow-sm">
                            <i className="ph ph-trash ph-bold text-3xl"></i>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 text-center">
                        <p className="text-body2 font-bold text-neutral-black">
                            Deseja excluir o arquivo "{fileToDelete?.name}"?
                        </p>
                        <p className="text-small text-neutral-500 leading-relaxed">
                            Esta ação removerá permanentemente o arquivo. Esta operação não pode ser desfeita.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Delete Task Confirmation */}
            <Modal
                isOpen={showDeleteTaskConfirm}
                onClose={() => setShowDeleteTaskConfirm(false)}
                title="Excluir Tarefa"
                maxWidth="400px"
                footer={
                    <div className="flex gap-3">
                        <Button variant="secondary" className="flex-1 !h-[36px]" onClick={() => setShowDeleteTaskConfirm(false)}>Cancelar</Button>
                        <Button variant="danger" className="flex-1 !h-[36px] shadow-sm" onClick={handleConfirmDeleteTask}>
                            Excluir Tarefa
                        </Button>
                    </div>
                }
            >
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col items-center justify-center py-2">
                        <div className="w-16 h-16 bg-system-error-50 rounded-full flex items-center justify-center text-system-error-500 mb-2 border border-system-error-100 shadow-sm">
                            <i className="ph ph-trash ph-bold text-3xl"></i>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 text-center">
                        <p className="text-body2 font-bold text-neutral-black">
                            Deseja excluir a tarefa "{taskToDelete?.title}"?
                        </p>
                        <p className="text-small text-neutral-500 leading-relaxed">
                            Esta ação removerá permanentemente a tarefa. Esta operação não pode ser desfeita.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Toast Notification */}
            {
                toast.show && (
                    <div className="fixed bottom-6 right-6 z-[60] animate-slide-up">
                        <div className="bg-neutral-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
                            <i className="ph ph-check-circle text-green-400 text-xl"></i>
                            <span className="text-sm font-medium">{toast.message}</span>
                        </div>
                    </div>
                )
            }
        </Modal>
    );
};

