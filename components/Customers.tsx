
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { customersService, companiesService } from '../lib/services';
import { Button } from './Button';
import { Select } from './Select';
import { TextInput } from './TextInput';
import { Dropdown } from './Dropdown';
import { Pagination } from './Pagination';
import { IconButton } from './IconButton';
import { Modal } from './Modal';
import { Switch } from './Switch';
import { CustomerFormModal } from './CustomerFormModal';
import { LeadDetailsSidebar } from './LeadDetailsSidebar';
import { Customer, KanbanCard, KanbanTag, KanbanNote } from '../types';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  // Filters and Sorting
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [allCompanyTags, setAllCompanyTags] = useState<KanbanTag[]>([]);
  const [sortOrder, setSortOrder] = useState<'name-asc' | 'name-desc' | 'date-newest' | 'date-oldest' | 'spent-highest' | 'spent-lowest'>('name-asc');

  // Estados do Modal de Formulário
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Estados do Modal de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Estados do Sidebar de Detalhes
  const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);

  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: company, error } = await companiesService.getMyCompany(user.id);
      if (company) {
        setCompanyId(company.id);
        await Promise.all([
          loadCustomers(company.id),
          fetchCompanyTags(company.id)
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar clientes.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomers = async (cId: string) => {
    // Buscando uma quantidade maior para permitir filtro no cliente por enquanto
    // Idealmente isso seria paginado no server com filtro via API
    const { data, error } = await customersService.getCustomers(cId, 1, 1000);
    if (data) {
      setCustomers(data);
    }
  };

  const fetchCompanyTags = async (id: string) => {
    const { data } = await customersService.getCompanyTags(id);
    if (data) {
      setAllCompanyTags(data.map((t: any) => ({ text: t.name, color: t.color })));
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ? true :
          statusFilter === 'active' ? customer.isAiEnabled :
            !customer.isAiEnabled;

      const matchesTag = tagFilter === '' || (customer.tags && customer.tags.some(t => t.text === tagFilter));

      return matchesSearch && matchesStatus && matchesTag;
    }).sort((a, b) => {
      switch (sortOrder) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'date-newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'spent-highest':
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        case 'spent-lowest':
          return (a.totalSpent || 0) - (b.totalSpent || 0);
        default:
          return 0;
      }
    });
  }, [customers, searchTerm, statusFilter, tagFilter, sortOrder]);

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCustomers.slice(start, start + itemsPerPage);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTagFilter('');
    setSortOrder('name-asc');
  };

  const handleOpenNewModal = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleRowClick = async (customer: Customer) => {
    const card: KanbanCard = {
      id: `kc-${customer.id}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      customerAvatar: customer.avatar,
      lastInteraction: 'Visualizado em Clientes',
      value: customer.totalSpent,
      totalOrders: customer.totalOrders,
      tags: customer.tags || [],
      isAiEnabled: customer.isAiEnabled,
      notes: [],
      agentName: 'Atendimento Geral'
    };
    setSelectedCard(card);
    setIsDetailsSidebarOpen(true);

    try {
      const { data: notes, error } = await customersService.getNotes(card.customerId);
      if (!error && notes) {
        setSelectedCard(prev => prev && prev.id === card.id ? { ...prev, notes } : prev);
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    }
  };


  const handleUpdateCardTags = (tags: KanbanTag[]) => {
    if (selectedCard) {
      setSelectedCard({ ...selectedCard, tags });
      // Update local list
      setCustomers(prev => prev.map(c => c.id === selectedCard.customerId ? { ...c, tags } : c));
    }
  };

  const handleToggleAiFromSidebar = async (newStatus: boolean) => {
    if (!selectedCard) return;

    // Optimistic Update
    setSelectedCard({ ...selectedCard, isAiEnabled: newStatus });
    setCustomers(prev => prev.map(c => c.id === selectedCard.customerId ? { ...c, isAiEnabled: newStatus } : c));

    try {
      const { error } = await customersService.toggleCustomerActive(selectedCard.customerId, newStatus);
      if (error) throw error;
      showToast(newStatus ? 'IA ativada' : 'IA pausada');
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar IA');
      // Revert
      setSelectedCard({ ...selectedCard, isAiEnabled: !newStatus });
      setCustomers(prev => prev.map(c => c.id === selectedCard.customerId ? { ...c, isAiEnabled: !newStatus } : c));
    }
  };

  const handleAddCardNote = async (text: string) => {
    if (!selectedCard) return;
    if (!companyId) {
      alert('Erro: ID da empresa não encontrado. Tente recarregar a página.');
      return;
    }

    const tempNote: KanbanNote = {
      id: `temp-${Date.now()}`,
      text,
      author: 'Você',
      createdAt: new Date().toLocaleString()
    };

    const previousNotes = selectedCard.notes || [];
    const optimisticNotes = [tempNote, ...previousNotes];
    setSelectedCard({ ...selectedCard, notes: optimisticNotes });

    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      if (!userId) throw new Error("User not authenticated");

      const { data: newNote, error } = await customersService.addNote(companyId, selectedCard.customerId, text, userId);

      if (error) {
        console.error("Supabase Error adding note:", error);
        throw error;
      }
      if (!newNote) throw new Error("No data returned");

      const realNotes = [newNote, ...previousNotes];
      setSelectedCard(prev => prev && prev.id === selectedCard.id ? { ...prev, notes: realNotes } : prev);
      showToast('Anotação adicionada!');
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || JSON.stringify(err);
      alert(`Falha ao salvar: ${errorMsg}`);
      showToast('Erro ao salvar anotação.');
      setSelectedCard({ ...selectedCard, notes: previousNotes });
    }
  };

  const handleDeleteCardNote = async (noteId: string) => {
    if (!selectedCard) return;

    const previousNotes = selectedCard.notes || [];
    const updatedNotes = previousNotes.filter(n => n.id !== noteId);
    setSelectedCard({ ...selectedCard, notes: updatedNotes });

    try {
      const { error } = await customersService.deleteNote(noteId);
      if (error) throw error;
      showToast('Anotação removida.');
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover anotação.');
      setSelectedCard({ ...selectedCard, notes: previousNotes });
    }
  };

  const handleSaveCustomer = async (data: Partial<Customer>) => {
    if (!companyId) return;

    try {
      if (data.id) {
        // Edit
        const { error } = await customersService.updateCustomer(data.id, data);
        if (error) throw error;
        showToast("Cliente atualizado!");
      } else {
        // Create
        const { error } = await customersService.createCustomer(companyId, data);
        if (error) throw error;
        showToast("Cliente cadastrado com sucesso!");
      }

      await loadCustomers(companyId);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast("Erro ao salvar cliente.");
    }
  };

  const handleOpenDeleteModal = (e: React.MouseEvent, customer: Customer) => {
    e.stopPropagation();
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteCustomer = async () => {
    if (customerToDelete && companyId) {
      try {
        const { error } = await customersService.deleteCustomer(customerToDelete.id);
        if (error) throw error;

        showToast(`Cliente ${customerToDelete.name} removido.`);
        await loadCustomers(companyId);
      } catch (error) {
        console.error(error);
        showToast("Erro ao excluir cliente.");
      }
    }
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  };

  const toggleAgent = async (customer: Customer) => {
    const newStatus = !customer.isAiEnabled;

    // Otimistic update
    setCustomers(prev => prev.map(c =>
      c.id === customer.id ? { ...c, isAiEnabled: newStatus } : c
    ));

    // Update selected card if it matches the toggled customer
    if (selectedCard && selectedCard.customerId === customer.id) {
      setSelectedCard({ ...selectedCard, isAiEnabled: newStatus });
    }

    try {
      const { error } = await customersService.toggleCustomerActive(customer.id, newStatus);
      if (error) throw error;
      showToast(newStatus ? 'IA ativada para este cliente' : 'IA pausada para este cliente');
    } catch (error) {
      console.error(error);
      showToast('Erro ao atualizar status da IA.');
      // Revert on error
      setCustomers(prev => prev.map(c =>
        c.id === customer.id ? { ...c, isAiEnabled: !newStatus } : c
      ));

      // Revert selected card info
      if (selectedCard && selectedCard.customerId === customer.id) {
        setSelectedCard({ ...selectedCard, isAiEnabled: !newStatus });
      }
    }
  };





  // Grid responsiva: esconde colunas em telas menores para evitar scroll horizontal
  // Grid responsiva: esconde colunas em telas menores para evitar scroll horizontal
  const tableGridClass = "grid grid-cols-[1fr_80px_80px] sm:grid-cols-[1fr_140px_120px_80px_80px] lg:grid-cols-[1fr_140px_120px_160px_100px_90px] items-center px-4 sm:px-6 gap-3 sm:gap-4";

  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in duration-500 overflow-hidden relative">
      {/* Toast Feedback */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 bg-primary-100 border border-primary-500 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <i className="ph ph-check-circle ph-fill text-primary-600 text-xl"></i>
          <span className="text-body2 font-bold text-primary-900">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col w-full bg-white flex-none border-b border-neutral-200">
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[12px] lg:gap-[16px] w-full min-h-[64px] lg:min-h-[72px]">
          <div className="flex flex-col items-start p-0 gap-[1px] flex-1 overflow-hidden">
            <h1 className="text-h4 font-bold text-neutral-black tracking-tight m-0 truncate w-full">Clientes</h1>
            <p className="hidden sm:block text-body2 font-normal text-neutral-500 m-0 truncate w-full">Gerencie sua base de contatos e histórico de compras.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" className="!h-[36px]" leftIcon="ph ph-plus" onClick={handleOpenNewModal}>Novo Cliente</Button>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[16px] w-full bg-white border-t border-neutral-100">
          <div className="flex flex-row items-center gap-[12px] flex-1 overflow-x-auto no-scrollbar py-1">
            <TextInput
              placeholder="Pesquisar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon="ph-magnifying-glass"
              containerClassName="w-[280px] shrink-0 !h-[36px]"
            />

            <Dropdown
              label="Tags"
              value={tagFilter}
              onChange={setTagFilter}
              options={allCompanyTags.map(t => ({ label: t.text, value: t.text, color: t.color }))}
              className="min-w-[140px] shrink-0 h-[36px]"
            />

            <Dropdown
              label="Status"
              value={statusFilter === 'all' ? '' : statusFilter}
              onChange={(val) => setStatusFilter(val || 'all')}
              options={[
                { label: 'IA Ativa', value: 'active', color: 'bg-primary-500' },
                { label: 'IA Inativa', value: 'inactive', color: 'bg-neutral-400' }
              ]}
              className="min-w-[140px] shrink-0 h-[36px]"
              allowClear={true}
            />

            {(searchTerm || statusFilter !== 'all' || tagFilter !== '' || sortOrder !== 'name-asc') && (
              <Button
                variant="danger-light"
                onClick={clearFilters}
                className="!h-[36px]"
                leftIcon="ph ph-x-circle"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Sort Layout Fixed to Right */}
          <div className="flex-none pl-4 border-l border-neutral-100">
            <Dropdown
              label="Ordenar por"
              value={sortOrder}
              onChange={setSortOrder}
              options={[
                { label: 'A-Z', value: 'name-asc' },
                { label: 'Z-A', value: 'name-desc' },
                { label: 'Mais Recentes', value: 'date-newest' },
                { label: 'Mais Antigos', value: 'date-oldest' },
                { label: 'Maior Valor', value: 'spent-highest' },
                { label: 'Menor Valor', value: 'spent-lowest' }
              ]}
              className="min-w-[140px] shrink-0 h-[36px]"
              align="right"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 p-4 lg:p-6 bg-white overflow-y-auto custom-scrollbar">
        <div className="bg-white border border-neutral-200 shadow-small rounded-[12px] overflow-hidden">
          <div className="w-full overflow-hidden">
            <div className="w-full">
              {/* Table Header */}
              <div className={`${tableGridClass} h-[40px] bg-secondary-700 sticky top-0 z-20`}>
                <span className="text-[13px] font-semibold text-white">Cliente</span>
                <span className="hidden sm:block text-[13px] font-semibold text-white">Etiquetas</span>
                <span className="hidden sm:block text-[13px] font-semibold text-white">Valor Gasto</span>
                <span className="hidden lg:block text-[13px] font-semibold text-white">Cadastrado em</span>
                <span className="text-[13px] font-semibold text-white text-center">Agente IA</span>
                <span></span>
              </div>

              {/* Table Body */}
              <div className="flex flex-col divide-y divide-neutral-100 min-h-[200px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center p-10 gap-3">
                    <i className="ph ph-spinner animate-spin text-3xl text-primary-500"></i>
                    <p className="text-body2 text-neutral-500">Carregando clientes...</p>
                  </div>
                ) : paginatedCustomers.length > 0 ? (
                  paginatedCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleRowClick(customer)}
                      className={`${tableGridClass} min-h-[64px] py-2 bg-white hover:bg-neutral-25 transition-all group cursor-pointer`}
                    >
                      {/* Cliente Col */}
                      <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-neutral-100 bg-neutral-50 flex-none overflow-hidden shadow-small flex items-center justify-center">
                          {customer.avatar ? (
                            <img src={customer.avatar} alt={customer.name} className="w-full h-full object-cover" />
                          ) : (
                            <i className="ph ph-user text-neutral-400 text-lg"></i>
                          )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-body2 font-bold text-neutral-black truncate group-hover:text-primary-700 transition-colors">
                            {customer.name}
                          </span>
                          <span className="text-[11px] font-medium text-neutral-400 truncate">
                            {customer.phone.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '+$1 ($2) $3-$4')}
                          </span>
                        </div>
                      </div>

                      {/* Etiquetas Col (Moved to left of Spent) */}
                      <div className="hidden sm:flex flex-wrap gap-1 overflow-hidden">
                        {(customer.tags || []).slice(0, 2).map((tag, i) => (
                          <span key={i} className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-white ${tag.color || 'bg-emerald-500'} shadow-sm truncate max-w-full`}>
                            {tag.text}
                          </span>
                        ))}
                        {(customer.tags || []).length > 2 && (
                          <span className="text-[9px] text-neutral-400 font-bold">+{(customer.tags || []).length - 2}</span>
                        )}
                      </div>

                      {/* Valor Gasto Col */}
                      <div className="hidden sm:flex items-center gap-1 overflow-hidden">
                        <span className="text-body2 font-bold text-neutral-black tabular-nums truncate">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customer.totalSpent || 0)}
                        </span>
                      </div>


                      {/* Data Col (Hidden on tablets/mobile) */}
                      <div className="hidden lg:flex flex-col items-start overflow-hidden">
                        <span className="text-body2 font-bold text-neutral-900 tabular-nums">
                          {new Date(customer.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(customer.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Agente IA Col */}
                      <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                        <div className="scale-[0.85] sm:scale-100">
                          <Switch
                            checked={customer.isAiEnabled ?? true}
                            onChange={() => toggleAgent(customer)}
                          />
                        </div>
                      </div>

                      {/* Actions Col */}
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <IconButton
                          variant="edit"
                          icon="ph-pencil-simple"
                          onClick={(e) => handleOpenEditModal(e, customer)}
                          title="Editar Cliente"
                          size="sm"
                        />
                        <IconButton
                          variant="delete"
                          icon="ph-trash"
                          onClick={(e) => handleOpenDeleteModal(e, customer)}
                          title="Excluir Cliente"
                          size="sm"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
                      <i className="ph ph-users text-3xl text-neutral-200"></i>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-body2 font-bold text-neutral-900">Nenhum cliente encontrado</h4>
                      <p className="text-small text-neutral-500">Tente ajustar sua busca ou adicione um novo cliente.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4 border-t border-neutral-100 bg-white">
            <span className="text-body2 font-medium text-neutral-500 order-2 sm:order-1 text-center sm:text-left">
              Mostrando <span className="font-bold text-neutral-black">{paginatedCustomers.length}</span> de {filteredCustomers.length}
            </span>
            <div className="order-1 sm:order-2 overflow-x-auto w-full sm:w-auto flex justify-center">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Cadastro"
        maxWidth="400px"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 !h-[36px]" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" className="flex-1 !h-[36px] shadow-sm" onClick={confirmDeleteCustomer}>
              Confirmar Exclusão
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
              Deseja excluir o cadastro de "{customerToDelete?.name}"?
            </p>
            <p className="text-small text-neutral-500 leading-relaxed">
              Esta ação removerá permanentemente o cliente da sua base de dados. O histórico de compras também poderá ser afetado. Esta operação não pode ser desfeita.
            </p>
          </div>
        </div>
      </Modal>

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
      />

      {/* Sidebar de Detalhes do Cliente */}
      <LeadDetailsSidebar
        isOpen={isDetailsSidebarOpen}
        onClose={() => setIsDetailsSidebarOpen(false)}
        card={selectedCard}
        onUpdateTags={handleUpdateCardTags}
        onAddNote={handleAddCardNote}
        onDeleteNote={handleDeleteCardNote}
        onToggleAi={handleToggleAiFromSidebar}
        onEdit={() => {
          if (!selectedCard) return;
          const customer = customers.find(c => c.id === selectedCard.customerId);
          if (customer) {
            setEditingCustomer(customer);
            setIsModalOpen(true);
          }
        }}
        companyId={companyId || ''}
      />
    </div>
  );
};
