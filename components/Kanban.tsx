import React, { useState, useMemo, useEffect, useRef } from 'react';
import { KanbanColumn, KanbanCard, Customer, KanbanNote, KanbanTag } from '../types';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { Modal } from './Modal';
import { IconButton } from './IconButton';
import { Dropdown } from './Dropdown';
import { RangeSlider } from './RangeSlider';
import { TasksSidebar } from './TasksSidebar';
import { LeadPickerModal } from './LeadPickerModal';
import { CustomerFormModal } from './CustomerFormModal';

import { LeadCardModal } from './LeadCardModal';
import { FunnelModal } from './FunnelModal';

import { supabase } from '../lib/supabase';
import { companiesService, customersService, teamService } from '../lib/services';
import { funnelsService, Funnel, FunnelStage, FunnelLead } from '../lib/funnelsService';
import { tasksService } from '../lib/tasksService';

const formatWhatsApp = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `+55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 13) {
    return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
};

export const Kanban: React.FC = () => {
  // --- Global State ---
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- Funnel State ---
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [currentFunnel, setCurrentFunnel] = useState<Funnel | null>(null);
  const [funnelLoading, setFunnelLoading] = useState(true);

  // --- Kanban Data State ---
  // We still use 'columns' as the view model, but populated from stages + leads
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  // --- UI Filters ---
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [minPrice, setMinPrice] = useState<number>(0);
  const [maxPrice, setMaxPrice] = useState<number>(100000); // High default
  const [allCompanyTags, setAllCompanyTags] = useState<KanbanTag[]>([]);
  const [isValueFilterOpen, setIsValueFilterOpen] = useState(false);
  const valueFilterRef = useRef<HTMLDivElement>(null);

  // --- Modals State ---
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false); // For Stages
  const [isDeleteColumnModalOpen, setIsDeleteColumnModalOpen] = useState(false);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [isFunnelModalOpen, setIsFunnelModalOpen] = useState(false); // For Funnels

  // --- Selection State ---
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null); // For adding lead
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);

  // --- Temporary Editing State ---
  const [editingColumn, setEditingColumn] = useState<KanbanColumn | null>(null); // Actually a Stage
  const [columnToDelete, setColumnToDelete] = useState<KanbanColumn | null>(null); // Actually a Stage
  // Use LeadCardModal instead of Sidebar for Cards
  const [isLeadCardModalOpen, setIsLeadCardModalOpen] = useState(false);
  const [isTasksSidebarOpen, setIsTasksSidebarOpen] = useState(false);
  const [columnTitleInput, setColumnTitleInput] = useState('');
  const [columnPositionInput, setColumnPositionInput] = useState<number>(0);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingFunnel, setEditingFunnel] = useState<Funnel | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [aiAgents, setAiAgents] = useState<any[]>([]);
  const [openTasksCount, setOpenTasksCount] = useState<number>(0);

  // --- Drag State ---
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [draggedColId, setDraggedColId] = useState<string | null>(null);
  const [sourceColId, setSourceColId] = useState<string | null>(null);

  // --- Toast ---
  const [toast, setToast] = useState({ show: false, message: '' });
  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // --- Initializer ---
  useEffect(() => {
    fetchUserAndCompany();
  }, []);

  const fetchUserAndCompany = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUser(user);
      const { data: company } = await companiesService.getMyCompany(user.id);
      if (company) {
        setCompanyId(company.id);
        fetchFunnels(company.id);
        fetchCompanyTags(company.id);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (valueFilterRef.current && !valueFilterRef.current.contains(event.target as Node)) {
        setIsValueFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCompanyTags = async (id: string) => {
    const { data } = await customersService.getCompanyTags(id);
    if (data) {
      setAllCompanyTags(data.map((t: any) => ({ text: t.name, color: t.color })));
    }
  };

  const fetchFunnels = async (id: string, selectFunnelId?: string) => {
    setFunnelLoading(true);
    const { data, error } = await funnelsService.getFunnels(id);
    if (error) {
      console.error("Error fetching funnels:", error);
      setFunnelLoading(false);
      return;
    }

    setFunnels(data || []);

    // Auto-select logic
    if (data && data.length > 0) {
      const target = selectFunnelId ? data.find(f => f.id === selectFunnelId) : data[0];
      if (target) {
        setCurrentFunnel(target);
        fetchBoardData(target.id);
        fetchOpenTasksCount(id, target.id);
      }
    } else {
      // No funnels? Maybe creating default?
      setColumns([]); // Clear board
      setCurrentFunnel(null);
    }
    setFunnelLoading(false);
  };

  const fetchBoardData = async (funnelId: string) => {
    // Parallel fetch: Stages + Leads + Team + Tags (later optimized)
    const stagesRes = await funnelsService.getStages(funnelId);
    const leadsRes = await funnelsService.getLeads(funnelId);
    const teamRes = companyId ? await teamService.getTeamMembers(companyId) : { data: [] };
    const agentsRes = companyId ? await teamService.getAgents(companyId) : { data: [] };

    if (stagesRes.error) console.error(stagesRes.error);
    if (leadsRes.error) console.error(leadsRes.error);

    const stages = stagesRes.data || [];
    const leads = leadsRes.data || [];
    const teamMembers = teamRes.data || [];

    // Fetch tags for these leads
    const customerIds = Array.from(new Set(leads.map(l => l.customer_id)));
    let tagsMap: Record<string, KanbanTag[]> = {};

    if (customerIds.length > 0) {
      const { data: assignments } = await supabase
        .from('customer_tag_assignments')
        .select('customer_id, tag:customer_tags(name, color)')
        .in('customer_id', customerIds);

      if (assignments) {
        assignments.forEach((assignment: any) => {
          if (!tagsMap[assignment.customer_id]) {
            tagsMap[assignment.customer_id] = [];
          }
          if (assignment.tag) {
            tagsMap[assignment.customer_id].push({
              text: assignment.tag.name,
              color: assignment.tag.color
            });
          }
        });
      }
    }

    // Fetch overdue tasks count for these leads
    const leadIds = leads.map(l => l.id);
    let overdueCounts: Record<string, number> = {};

    if (leadIds.length > 0) {
      const { data: overdueTasks } = await supabase
        .from('lead_tasks')
        .select('lead_id')
        .eq('is_completed', false)
        .lt('due_date', new Date().toISOString())
        .in('lead_id', leadIds);

      if (overdueTasks) {
        overdueTasks.forEach((t: any) => {
          overdueCounts[t.lead_id] = (overdueCounts[t.lead_id] || 0) + 1;
        });
      }
    }

    setTeamMembers(teamMembers);
    if (agentsRes.data) {
      setAiAgents(agentsRes.data);
    }

    // Transform to KanbanColumns
    const newColumns: KanbanColumn[] = stages.map(stage => {
      // Filter leads for this stage
      const stageLeads = leads.filter(l => l.stage_id === stage.id);

      // Map leads to cards
      const cards: KanbanCard[] = stageLeads.map(lead => {
        const humanAgent = lead.agent_id ? teamMembers.find((m: any) => m.id === lead.agent_id) : null;
        const aiAgent = lead.agent_id ? aiAgents.find((a: any) => a.id === lead.agent_id) : null;

        return {
          id: lead.id,
          customerId: lead.customer_id,
          customerName: lead.customer?.name || 'Cliente Desconhecido',
          customerPhone: lead.customer?.whatsapp || '',
          customerEmail: lead.customer?.email,
          customerAvatar: lead.customer?.avatar_url || '',
          lastInteraction: 'Recente',
          value: Number(lead.estimated_value || lead.value || 0),
          totalOrders: 0,
          agent_id: lead.agent_id,
          agentName: humanAgent ? (humanAgent.full_name || 'Agente') : (aiAgent ? aiAgent.name : undefined),
          tags: tagsMap[lead.customer_id] || [],
          notes: [],
          createdAt: lead.created_at,
          overdueTasksCount: overdueCounts[lead.id] || 0
        };
      });

      return {
        id: stage.id,
        title: stage.name,
        cards
      };
    });

    setColumns(newColumns);

    // Sync selected card
    if (selectedCard) {
      const allCards = newColumns.flatMap(col => col.cards);
      const updatedCard = allCards.find(c => c.id === selectedCard.id);
      if (updatedCard) {
        setSelectedCard(updatedCard);
      }
    }
  };

  const fetchOpenTasksCount = async (compId: string, funnelId: string) => {
    try {
      const { data } = await tasksService.getTasksByFunnel(compId, funnelId);
      setOpenTasksCount(data?.length || 0);
    } catch (error) {
      console.error("Error fetching open tasks count:", error);
    }
  };

  // --- Computed ---
  const filteredColumns = useMemo(() => {
    return columns.map(col => ({
      ...col,
      cards: col.cards.filter(card => {
        const matchesSearch =
          card.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.customerPhone.includes(searchTerm);

        const matchesAgent = agentFilter === '' || card.agent_id === agentFilter;

        const matchesTag = tagFilter === '' || (card.tags && card.tags.some(t => t.text === tagFilter));

        const val = Number(card.value);
        const matchesValue = val >= minPrice && val <= maxPrice;

        return matchesSearch && matchesAgent && matchesTag && matchesValue;
      })
    }));
  }, [columns, searchTerm, agentFilter, tagFilter, minPrice, maxPrice]);

  // --- Handlers: Funnels ---
  const handleOpenFunnelModal = (funnel?: Funnel) => {
    setEditingFunnel(funnel || null);
    setIsFunnelModalOpen(true);
  };

  const handleSaveFunnel = async (name: string, description?: string) => {
    if (!companyId) return;

    if (editingFunnel) {
      // Update
      const { data } = await funnelsService.updateFunnel(editingFunnel.id, { name, description });
      if (data) {
        showToast("Funil atualizado!");
        fetchFunnels(companyId, data.id); // Refresh and keep selected
      }
    } else {
      // Create
      const { data } = await funnelsService.createFunnel(companyId, name, description);
      if (data) {
        // Also create default stages if desired? For now just empty.
        // Let's create default stages for better UX
        await funnelsService.createStage(companyId, data.id, 'Prospecção', 0);
        await funnelsService.createStage(companyId, data.id, 'Contato', 1);
        await funnelsService.createStage(companyId, data.id, 'Negociação', 2);
        await funnelsService.createStage(companyId, data.id, 'Fechamento', 3);

        showToast("Novo funil criado!");
        fetchFunnels(companyId, data.id); // Refresh and select new
      }
    }
    setIsFunnelModalOpen(false);
  };

  const handleChangeFunnel = (funnelId: string) => {
    const funnel = funnels.find(f => f.id === funnelId);
    if (funnel) {
      setCurrentFunnel(funnel);
      fetchBoardData(funnel.id);
      if (companyId) {
        fetchOpenTasksCount(companyId, funnel.id);
      }
    }
  };

  // --- Handlers: DnD ---
  const handleDragStart = (e: React.DragEvent, cardId: string, colId: string) => {
    e.stopPropagation();
    setDraggedCardId(cardId);
    setSourceColId(colId);
    e.dataTransfer.setData('cardId', cardId);
    e.dataTransfer.setData('colId', colId);
    e.dataTransfer.setData('type', 'card');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColDragStart = (e: React.DragEvent, colId: string) => {
    setDraggedColId(colId);
    e.dataTransfer.setData('sourceColIndex', columns.findIndex(c => c.id === colId).toString());
    e.dataTransfer.setData('type', 'column');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId') || draggedCardId;
    const originColId = e.dataTransfer.getData('colId') || sourceColId;
    const type = e.dataTransfer.getData('type');

    if (type === 'column' || draggedColId) {
      const sourceIndex = parseInt(e.dataTransfer.getData('sourceColIndex'));
      const targetIndex = columns.findIndex(c => c.id === targetColId);

      if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
        setDraggedColId(null);
        return;
      }

      const newColumns = [...columns];
      const [movedCol] = newColumns.splice(sourceIndex, 1);
      newColumns.splice(targetIndex, 0, movedCol);

      setColumns(newColumns);
      setDraggedColId(null);

      // Backend Persistence
      const updatePromises = newColumns.map((col, idx) =>
        funnelsService.updateStage(col.id, { position: idx })
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        showToast("Erro ao salvar nova ordem.");
      } else {
        showToast("Ordem das etapas atualizada!");
      }
      return;
    }

    if (!cardId || !originColId) return;

    // Granular Lead Reordering
    const targetCardElement = (e.target as HTMLElement).closest('[data-card-id]');
    const targetCardId = targetCardElement?.getAttribute('data-card-id');

    // Optimistic UI Update
    const sourceCol = columns.find(c => c.id === originColId);
    const targetCol = columns.find(c => c.id === targetColId);
    const card = sourceCol?.cards.find(c => c.id === cardId);

    if (sourceCol && targetCol && card) {
      const newColumns = columns.map(col => {
        if (col.id === originColId && col.id === targetColId) {
          // Reorder in same column
          const updatedCards = col.cards.filter(c => c.id !== cardId);
          const targetIndex = targetCardId ? updatedCards.findIndex(c => c.id === targetCardId) : updatedCards.length;
          updatedCards.splice(targetIndex === -1 ? updatedCards.length : targetIndex, 0, card);
          return { ...col, cards: updatedCards };
        }

        if (col.id === originColId) {
          return { ...col, cards: col.cards.filter(c => c.id !== cardId) };
        }

        if (col.id === targetColId) {
          const targetIndex = targetCardId ? col.cards.findIndex(c => c.id === targetCardId) : col.cards.length;
          const updatedCards = [...col.cards];
          updatedCards.splice(targetIndex === -1 ? updatedCards.length : targetIndex, 0, card);
          return { ...col, cards: updatedCards };
        }

        return col;
      });

      setColumns(newColumns);

      // Backend Update
      const targetColumn = newColumns.find(c => c.id === targetColId)!;
      const sourceColumn = newColumns.find(c => c.id === originColId)!;

      const leadsToUpdate = targetColumn.cards.map((c, idx) => ({
        id: c.id,
        position: idx,
        stage_id: targetColId,
        company_id: companyId || '',
        funnel_id: currentFunnel?.id || '',
        customer_id: c.customerId
      }));

      // If moved across columns, also update source column positions if needed
      if (originColId !== targetColId) {
        sourceColumn.cards.forEach((c, idx) => {
          leadsToUpdate.push({
            id: c.id,
            position: idx,
            stage_id: originColId,
            company_id: companyId || '',
            funnel_id: currentFunnel?.id || '',
            customer_id: c.customerId
          });
        });
      }

      const { error } = await funnelsService.batchUpdateLeadPositions(leadsToUpdate);

      if (error) {
        console.error("Move failed:", error);
        showToast("Erro ao reorganizar leads.");
      } else {
        if (originColId !== targetColId) {
          showToast(`Lead movido para ${targetCol.title}`);
        }
      }
    }

    setDraggedCardId(null);
    setSourceColId(null);
  };

  // --- Handlers: Stages (Columns) ---
  const handleOpenColumnModal = (column?: KanbanColumn) => {
    if (column) {
      setEditingColumn(column);
      setColumnTitleInput(column.title);
      // Find the index in the current columns array as default position if no explicit position field in KanbanColumn yet
      // But we need the real position from the DB or effectively the index. 
      // Since columns are sorted by position, index matches relative order.
      // Let's assume we want to edit the numeric index (0-based or 1-based? User sees 1-based in UI usually).
      // Let's use the current index in the array for now.
      const index = columns.findIndex(c => c.id === column.id);
      // User wants 1-based index in UI
      setColumnPositionInput(index >= 0 ? index + 1 : 1);
    } else {
      setEditingColumn(null);
      setColumnTitleInput('');
      setColumnPositionInput(columns.length + 1); // Default to end (1-based)
    }
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = async () => {
    if (!columnTitleInput.trim()) {
      showToast("Nome da etapa é obrigatório.");
      return;
    }
    if (!companyId || !currentFunnel) {
      console.error("Missing companyId or currentFunnel", { companyId, currentFunnel });
      showToast("Erro: Dados do funil ou empresa não carregados.");
      return;
    }

    if (editingColumn) {
      // Update
      // Optimistic
      setColumns(prev => prev.map(c => c.id === editingColumn.id ? { ...c, title: columnTitleInput } : c));

      // Note: To handle reordering correctly locally effectively needs a full resort, 
      // but for now we just push to backend and refetch.
      const { error } = await funnelsService.updateStage(editingColumn.id, {
        name: columnTitleInput,
        position: Number(columnPositionInput) - 1 // Convert back to 0-based for DB
      });

      if (error) {
        showToast("Erro ao atualizar etapa.");
        fetchBoardData(currentFunnel.id); // Revert
      } else {
        showToast('Etapa atualizada!');
        // Ideally we refetch to get correct order
        fetchBoardData(currentFunnel.id);
      }
    } else {
      // Create
      // Determine position (last + 1)
      const maxPos = columns.length; // Approximate
      const { data, error } = await funnelsService.createStage(companyId, currentFunnel.id, columnTitleInput, maxPos);

      if (error) {
        console.error("Error creating stage:", error);
        showToast("Erro ao criar etapa: " + error.message);
        return; // Keep modal open
      }

      if (data) {
        showToast('Nova etapa adicionada!');
        fetchBoardData(currentFunnel.id); // Refresh to get proper ID and consistency
      }
    }
    setIsColumnModalOpen(false);
  };

  const handleOpenDeleteColumnModal = (column: KanbanColumn) => {
    if (column.cards.length > 0) {
      alert("Não é possível excluir uma etapa com leads. Mova-os primeiro.");
      return;
    }
    setColumnToDelete(column);
    setIsDeleteColumnModalOpen(true);
  };

  const confirmDeleteColumn = async () => {
    if (columnToDelete && currentFunnel) {
      setColumns(prev => prev.filter(c => c.id !== columnToDelete.id));
      await funnelsService.deleteStage(columnToDelete.id);
      showToast('Etapa removida.');
    }
    setIsDeleteColumnModalOpen(false);
    setColumnToDelete(null);
  };

  // --- Handlers: Leads ---
  const handleOpenPicker = (colId: string) => {
    setActiveColumnId(colId);
    setIsPickerOpen(true);
  };

  const handleSelectExisting = async (customer: Customer) => {
    if (!activeColumnId || !companyId || !currentFunnel) return;

    // Check if already in this funnel? Service handles it, but nice to check visually if possible.
    // Optimistic Add
    // We need a temporary ID until we get the real one from DB, but for DnD to work well we want real ID.
    // So let's await.

    const { data, error } = await funnelsService.addLead(companyId, currentFunnel.id, activeColumnId, customer.id);

    if (error) {
      alert("Erro ao adicionar lead: " + (error.message || 'Desconhecido'));
      return;
    }

    if (data) {
      const newCard: KanbanCard = {
        id: data.id,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAvatar: customer.avatar,
        customerEmail: customer.email,
        lastInteraction: 'Agora',
        value: Number(data.value),
        totalOrders: customer.totalOrders || 0,
        agentName: 'Vendedor IA',
        tags: customer.tags,
        notes: [],
        createdAt: new Date().toISOString()
      };

      setColumns(cols => cols.map(c =>
        c.id === activeColumnId ? { ...c, cards: [newCard, ...c.cards] } : c
      ));

      showToast("Lead adicionado!");
    }

    setIsPickerOpen(false);
  };

  const handleOpenCardDetails = async (card: KanbanCard) => {
    setSelectedCard(card);
    setIsLeadCardModalOpen(true);
  };

  const handleOpenLeadFromTask = (leadId: string) => {
    const allCards = columns.flatMap(col => col.cards);
    const card = allCards.find(c => c.id === leadId);
    if (card) {
      setSelectedCard(card);
      setIsTasksSidebarOpen(false);
      setIsLeadCardModalOpen(true);
    }
  };

  // Not implementing full note/tag update logic in this snippet for brevity, 
  // but it would mirror the previous implementation using `selectedCard` and `customersService`.
  // Assuming Sidebar calls same ops.

  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in duration-500 overflow-hidden relative">
      {/* Toast */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 bg-primary-100 border border-primary-500 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <i className="ph ph-check-circle ph-fill text-primary-600 text-xl"></i>
          <span className="text-body2 font-bold text-primary-900">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col w-full bg-white flex-none border-b border-neutral-200">
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[12px] lg:gap-[16px] w-full min-h-[64px]">
          {/* Title Area */}
          <div className="flex flex-col items-start p-0 gap-[1px] flex-none">
            <h1 className="text-h5 font-bold text-neutral-black tracking-tight m-0">KanBan CRM</h1>
            <p className="hidden sm:block text-body2 font-normal text-neutral-500 m-0">Gestão visual do funil.</p>
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Funnel Controls */}
          <div className="flex items-center gap-3">
            <div className="w-[220px]">
              <Dropdown
                label="Selecione o Funil"
                value={currentFunnel?.id || ''}
                onChange={handleChangeFunnel}
                options={funnels.map(f => ({ label: f.name, value: f.id }))}
                leftIcon="ph-funnel"
              />
            </div>

            <Button
              variant="secondary"
              leftIcon="ph ph-pencil-simple"
              onClick={() => handleOpenFunnelModal(currentFunnel || undefined)}
              disabled={!currentFunnel}
              className="!h-[36px] !w-[36px] !px-0 flex items-center justify-center"
              title="Editar Funil Atual"
            />

            <Button
              variant="primary"
              leftIcon="ph ph-plus"
              onClick={() => handleOpenFunnelModal()}
              className="!h-[36px] font-bold"
            >
              Novo Funil
            </Button>

            <Button
              variant="secondary"
              leftIcon="ph ph-check-square"
              onClick={() => setIsTasksSidebarOpen(true)}
              className="!h-[36px] font-bold"
            >
              Ver Tarefas {openTasksCount > 0 ? `(${openTasksCount})` : ''}
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[16px] w-full bg-white border-t border-neutral-100 relative z-[20]">
          <TextInput
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon="ph-magnifying-glass"
            containerClassName="w-full max-w-[240px] !h-[36px] flex-none"
          />

          <div className="flex-none w-[180px]">
            <Dropdown
              label="Filtrar por Tags"
              value={tagFilter}
              onChange={(val) => setTagFilter(val)}
              options={allCompanyTags.map(t => ({ label: t.text, value: t.text, color: t.color }))}
              leftIcon="ph-tag"
            />
          </div>

          <div className="flex-none w-[180px]">
            <Dropdown
              label="Filtrar por Agente"
              value={agentFilter}
              onChange={(val) => setAgentFilter(val)}
              options={aiAgents.map(a => ({ label: a.name, value: a.id }))}
              leftIcon="ph-user-robot"
            />
          </div>

          {/* Value Range Filter Dropdown */}
          <div className="relative" ref={valueFilterRef}>
            <button
              onClick={() => setIsValueFilterOpen(!isValueFilterOpen)}
              className={`
                box-border flex flex-row justify-between items-center gap-[8px] bg-white border transition-all active:scale-[0.98] shadow-sm rounded-[6px] w-[180px] h-[36px] px-[12px]
                ${isValueFilterOpen ? 'border-neutral-900 ring-1 ring-neutral-900' : 'border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50'}
              `}
            >
              <div className="flex items-center gap-1.5 overflow-hidden">
                <i className="ph ph-currency-circle-dollar text-neutral-400 text-sm"></i>
                <span className={`truncate font-medium text-[13px] ${minPrice > 0 || maxPrice < 100000 ? 'text-neutral-black' : 'text-neutral-400'}`}>
                  {minPrice > 0 || maxPrice < 100000 ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(minPrice)} - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(maxPrice)}` : 'Valor Estimado'}
                </span>
              </div>
              <i className={`ph ph-caret-down ph-bold text-neutral-400 transition-transform duration-200 text-xs ${isValueFilterOpen ? 'rotate-180' : ''}`}></i>
            </button>

            {isValueFilterOpen && (
              <div className="absolute left-0 mt-1 bg-white border border-neutral-200 rounded-[8px] shadow-lg z-[100] p-4 w-[280px] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150 origin-top-left">
                <RangeSlider
                  min={0}
                  max={100000}
                  step={100}
                  minVal={minPrice}
                  maxVal={maxPrice}
                  label="Faixa de Valor"
                  currency
                  onChange={(vals) => {
                    setMinPrice(vals.min);
                    setMaxPrice(vals.max);
                  }}
                />

                <div className="mt-4 pt-3 border-t border-neutral-100 flex justify-end">
                  <button
                    onClick={() => {
                      setMinPrice(0);
                      setMaxPrice(100000);
                      setIsValueFilterOpen(false);
                    }}
                    className="text-[11px] font-bold text-neutral-400 hover:text-system-error-500 uppercase tracking-widest transition-colors"
                  >
                    Resetar
                  </button>
                  <Button
                    variant="primary"
                    className="!h-[28px] !text-[11px] ml-4"
                    onClick={() => setIsValueFilterOpen(false)}
                  >
                    Aplicar
                  </Button>
                </div>
              </div>
            )}
          </div>

          {(searchTerm || agentFilter || tagFilter || minPrice > 0 || maxPrice < 100000) && (
            <Button
              variant="danger-light"
              onClick={() => {
                setSearchTerm('');
                setAgentFilter('');
                setTagFilter('');
                setMinPrice(0);
                setMaxPrice(100000);
              }}
              leftIcon="ph ph-trash"
              className="!h-[36px] font-bold whitespace-nowrap"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 bg-neutral-25 p-4 lg:p-6 overflow-x-auto custom-scrollbar overflow-y-hidden">
        {funnelLoading ? (
          <div className="flex items-center justify-center h-full w-full">
            <i className="ph ph-spinner animate-spin text-3xl text-primary-500"></i>
          </div>
        ) : !currentFunnel ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
            <i className="ph ph-kanban text-6xl text-neutral-300"></i>
            <p className="text-h6 text-neutral-400">Crie seu primeiro funil para começar</p>
            <Button variant="primary" onClick={() => handleOpenFunnelModal()}>Criar Funil</Button>
          </div>
        ) : (
          <div className="flex flex-row gap-6 h-full min-w-max pb-4">
            {filteredColumns.map((column, colIdx) => (
              <div
                key={column.id}
                draggable
                onDragStart={(e) => handleColDragStart(e, column.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`flex flex-col w-[300px] h-full bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden shadow-small shrink-0 transition-opacity ${draggedColId === column.id ? 'opacity-30' : 'opacity-100'}`}
              >
                {/* Column Header */}
                <div className="p-4 flex flex-col gap-1 bg-white border-b border-neutral-100 group/header">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <span className="w-5 h-5 rounded-full bg-secondary-700 text-white text-[10px] font-black flex items-center justify-center flex-none">
                        {colIdx + 1}
                      </span>
                      <h3 className="text-body2 font-bold text-neutral-900 truncate" title={column.title}>{column.title}</h3>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity flex-none">
                      <div className="w-8 h-8 flex items-center justify-center text-neutral-300 cursor-grab active:cursor-grabbing hover:text-neutral-600 transition-colors" title="Arraste para reordenar">
                        <i className="ph ph-dots-six-vertical text-lg"></i>
                      </div>
                      <IconButton variant="ghost" icon="ph-pencil-simple" size="sm" onClick={() => handleOpenColumnModal(column)} />
                      <IconButton variant="ghost" icon="ph-trash" size="sm" onClick={() => handleOpenDeleteColumnModal(column)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-bold text-emerald-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
                        column.cards.reduce((sum, card) => sum + (Number(card.value) || 0), 0)
                      )}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {column.cards.length} {column.cards.length === 1 ? 'lead' : 'leads'}
                    </span>
                  </div>
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar">
                  {column.cards.map((card) => (
                    <div
                      key={card.id}
                      data-card-id={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id, column.id)}
                      onClick={() => handleOpenCardDetails(card)}
                      className={`group bg-white p-4 rounded-xl border border-neutral-200 shadow-small hover:border-primary-500 hover:shadow-cards transition-all relative cursor-grab active:cursor-grabbing ${draggedCardId === card.id ? 'opacity-20' : 'opacity-100'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative flex-none">
                          <div className="w-10 h-10 rounded-full border border-neutral-100 overflow-hidden bg-neutral-50 flex items-center justify-center">
                            {card.customerAvatar ? (
                              <img src={card.customerAvatar} className="w-full h-full object-cover" />
                            ) : (
                              <i className="ph ph-user text-neutral-400 text-lg"></i>
                            )}
                          </div>

                          {/* Overdue Badge */}
                          {card.overdueTasksCount !== undefined && card.overdueTasksCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center border-2 border-white animate-pulse z-10">
                              <span className="text-[10px] font-bold">{card.overdueTasksCount}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-body2 font-bold text-neutral-black truncate group-hover:text-primary-600">{card.customerName}</span>
                          <span className="text-[11px] text-neutral-400 font-medium">{formatWhatsApp(card.customerPhone)}</span>
                        </div>
                      </div>

                      {/* Tags & Agent */}
                      <div className="flex flex-col gap-2 mt-3">
                        {/* Tags */}
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {card.tags.slice(0, 10).map((tag, i) => (
                              <span key={i} className={`text-[10px] font-bold px-1.5 py-0.5 rounded text-white ${tag.color || 'bg-emerald-500'}`}>
                                {tag.text}
                              </span>
                            ))}
                            {card.tags.length > 10 && (
                              <span className="text-[10px] text-neutral-400 font-medium">+{card.tags.length - 10}</span>
                            )}
                          </div>
                        )}

                        {/* Agent & Value */}
                        <div className="flex items-center justify-between border-t border-neutral-100 pt-2 mt-1">
                          {card.agentName ? (
                            <div className="flex items-center gap-1.5">
                              <i className="ph ph-user text-neutral-400 text-xs"></i>
                              <span className="text-[11px] text-neutral-500 font-medium">
                                {card.agentName}
                              </span>
                            </div>
                          ) : (
                            <div></div>
                          )}

                          <div className="flex flex-col items-end">
                            <span className="text-[11px] font-bold text-primary-600">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.value)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="p-3 bg-white/50 border-t border-neutral-100">
                  <button
                    onClick={() => handleOpenPicker(column.id)}
                    className="w-full h-8 flex items-center justify-center gap-2 text-tag font-bold text-neutral-400 uppercase tracking-widest hover:bg-white hover:text-primary-600 rounded-lg transition-all"
                  >
                    <i className="ph ph-plus-circle"></i> Add Lead
                  </button>
                </div>
              </div>
            ))}

            {/* Add Column Button */}
            <button
              onClick={() => handleOpenColumnModal()}
              className="flex flex-col items-center justify-center w-[300px] h-full border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 hover:border-primary-200 transition-all group shrink-0"
            >
              <i className="ph ph-plus-circle-bold text-3xl text-neutral-300 group-hover:text-primary-500 mb-2"></i>
              <span className="text-body2 font-bold text-neutral-400 group-hover:text-primary-700 uppercase">Nova Etapa</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <FunnelModal
        isOpen={isFunnelModalOpen}
        onClose={() => setIsFunnelModalOpen(false)}
        onSave={handleSaveFunnel}
        editingFunnel={editingFunnel}
      />

      <Modal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        title={editingColumn ? "Renomear Etapa" : "Nova Etapa"}
        maxWidth="350px"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsColumnModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1" onClick={handleSaveColumn}>Salvar</Button>
          </div>
        }
      >
        <TextInput
          value={columnTitleInput}
          onChange={(e) => setColumnTitleInput(e.target.value)}
          placeholder="Nome da etapa"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveColumn();
            }
          }}
        />
      </Modal>

      <Modal
        isOpen={isDeleteColumnModalOpen}
        onClose={() => setIsDeleteColumnModalOpen(false)}
        title="Excluir Etapa"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteColumnModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={confirmDeleteColumn}>Excluir</Button>
          </div>
        }
      >
        <p className="text-body2 font-normal text-neutral-600">Deseja excluir esta etapa permanentemente?</p>
      </Modal>

      <LeadPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelectExisting}
        companyId={companyId}
      />

      <LeadCardModal
        isOpen={isLeadCardModalOpen}
        onClose={() => setIsLeadCardModalOpen(false)}
        card={selectedCard}
        companyId={companyId || ''}
        teamMembers={teamMembers}
        funnelName={currentFunnel?.name}
        stageName={columns.find(col => col.cards.some(c => c.id === selectedCard?.id))?.title}
        onUpdate={() => {
          // Refresh board data when lead is updated
          if (currentFunnel?.id) fetchBoardData(currentFunnel.id);
        }}
      />

      <TasksSidebar
        isOpen={isTasksSidebarOpen}
        onClose={() => setIsTasksSidebarOpen(false)}
        funnelId={currentFunnel?.id || null}
        companyId={companyId || ''}
        onOpenLead={handleOpenLeadFromTask}
        onTasksChange={() => {
          if (companyId && currentFunnel) {
            fetchOpenTasksCount(companyId, currentFunnel.id);
          }
        }}
      />
    </div>
  );
};
