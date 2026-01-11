
import React, { useState, useEffect } from 'react';
import { KanbanCard, KanbanNote, KanbanTag, CartItem } from '../types';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { Switch } from './Switch';
import { useNavigate } from 'react-router-dom';
import { Badge } from './Badge';

import { customersService, ordersService } from '../lib/services';

interface LeadDetailsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  card: KanbanCard | null;
  onUpdateTags: (tags: KanbanTag[]) => void;
  onAddNote: (note: string) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleAi: (newStatus: boolean) => void;
  onEdit: () => void;
  companyId: string;
}

const TAG_COLORS = [
  { name: 'Neutral', class: 'bg-neutral-400' },
  { name: 'Primary', class: 'bg-primary-500' },
  { name: 'Info', class: 'bg-system-info-500' },
  { name: 'Warning', class: 'bg-system-warning-500' },
  { name: 'Error', class: 'bg-system-error-500' },
  { name: 'Highlight', class: 'bg-system-highlight-500' },
];

const ORDER_STATUS_MAP: Record<string, { label: string; variant: 'error' | 'success' | 'warning' | 'neutral' }> = {
  'new': { label: 'Novo', variant: 'warning' },
  'preparing': { label: 'Preparando', variant: 'warning' },
  'shipped': { label: 'Enviado', variant: 'warning' },
  'delivered': { label: 'Entregue', variant: 'success' },
  'canceled': { label: 'Cancelado', variant: 'neutral' },
  'archived': { label: 'Arquivado', variant: 'neutral' },
  'NOVO': { label: 'Novo', variant: 'warning' },
  'PREPARANDO': { label: 'Preparando', variant: 'warning' },
  'ENTREGUE': { label: 'Entregue', variant: 'success' },
  'CANCELADO': { label: 'Cancelado', variant: 'neutral' },
  'ARQUIVADO': { label: 'Arquivado', variant: 'neutral' },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'error' | 'warning' | 'neutral' }> = {
  'paid': { label: 'Pago', variant: 'success' },
  'pending': { label: 'Pendente', variant: 'warning' },
  'refunded': { label: 'Reembolsado', variant: 'error' },
  'canceled': { label: 'Cancelado', variant: 'neutral' },
  'PAGO': { label: 'Pago', variant: 'success' },
  'PENDENTE': { label: 'Pendente', variant: 'warning' },
  'REEMBOLSADO': { label: 'Reembolsado', variant: 'error' },
};

export const LeadDetailsSidebar: React.FC<LeadDetailsSidebarProps> = ({
  isOpen,
  onClose,
  card,
  onUpdateTags,
  onAddNote,
  onDeleteNote,
  onToggleAi,
  onEdit,
  companyId
}) => {
  const navigate = useNavigate();
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState('bg-neutral-400');
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [availableTags, setAvailableTags] = useState<KanbanTag[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<KanbanTag[]>([]);
  const [isInputFocused, setIsInputFocused] = useState(false);

  // View State (details, orders, cart)
  const [currentView, setCurrentView] = useState<'details' | 'orders' | 'cart'>('details');
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoadingCart, setIsLoadingCart] = useState(false);

  useEffect(() => {
    if (card && companyId) {
      if (currentView === 'orders') fetchOrders();
      if (currentView === 'cart') fetchCart();
    }
  }, [currentView, card, companyId]);

  const fetchCart = async () => {
    if (!card) return;
    setIsLoadingCart(true);
    try {
      const { data } = await customersService.getCartItems(card.customerId);
      setCartItems(data || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setIsLoadingCart(false);
    }
  };

  const fetchOrders = async () => {
    if (!card) return;
    setIsLoadingOrders(true);
    try {
      const { data } = await ordersService.getOrdersByCustomer(companyId, card.customerId);
      setCustomerOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset state on close
      setCurrentView('details');
      setCustomerOrders([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isEditingTags && companyId) {
      fetchAvailableTags();
    }
  }, [isEditingTags, companyId]);

  useEffect(() => {
    const existingTexts = (card?.tags || []).map(t => t.text.toLowerCase());

    if (tagInput.trim()) {
      const lowerInput = tagInput.toLowerCase();
      const suggestions = availableTags
        .filter(t => t.text.toLowerCase().includes(lowerInput) && !existingTexts.includes(t.text.toLowerCase()))
        .slice(0, 5);
      setFilteredSuggestions(suggestions);
    } else if (isInputFocused) {
      // Show all available tags (minus existing ones) when focused and empty
      const suggestions = availableTags
        .filter(t => !existingTexts.includes(t.text.toLowerCase()))
        .slice(0, 10); // Limit to 10 for initial dropdown
      setFilteredSuggestions(suggestions);
    } else {
      setFilteredSuggestions([]);
    }
  }, [tagInput, availableTags, card?.tags, isInputFocused]);

  const fetchAvailableTags = async () => {
    try {
      const { data } = await customersService.getCompanyTags(companyId);
      if (data) {
        const tags = data.map((t: any) => ({ text: t.name, color: t.color }));
        setAvailableTags(tags);
      }
    } catch (err) {
      console.error("Failed to fetch tags", err);
    }
  };

  // Local state is optional if we trust the parent, but let's keep it sync
  // Actually simpler: derive from card
  const isAiEnabled = card?.isAiEnabled ?? true;

  if (!card) return null;

  const handleSaveNote = () => {
    if (!newNote.trim()) return;
    onAddNote(newNote);
    setNewNote('');
    setIsAddingNote(false);
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    const currentTags = card.tags || [];
    const text = tagInput.trim();

    // Optimistic update
    // Optimistic update
    if (!currentTags.some(t => t.text.toLowerCase() === text.toLowerCase())) {
      const newTag = { text, color: selectedTagColor };
      onUpdateTags([...currentTags, newTag]);

      // If this is a new tag (not in available), we might want to refresh available tags later or add it locally
      if (!availableTags.some(t => t.text.toLowerCase() === text.toLowerCase())) {
        setAvailableTags([...availableTags, newTag]);
      }

      try {
        await customersService.addTag(companyId, card.customerId, text, selectedTagColor);
      } catch (error) {
        console.error("Failed to add tag to DB:", error);
        // Revert on error? Or just toast.
        // onUpdateTags(currentTags);
      }
    }
    setTagInput('');
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const currentTags = card.tags || [];
    onUpdateTags(currentTags.filter(t => t.text !== tagToRemove));

    try {
      await customersService.removeTag(companyId, card.customerId, tagToRemove);
    } catch (error) {
      console.error("Failed to remove tag from DB:", error);
    }
  };


  const handleRemoveCartItem = async (id: string) => {
    try {
      await customersService.removeCartItem(id);
      setCartItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error removing cart item:", error);
    }
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[150] animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`
        fixed top-0 right-0 z-[160] h-screen w-full max-w-[880px] bg-white shadow-2xl
        transition-transform duration-300 ease-out border-l border-neutral-200
        flex flex-col overflow-hidden
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header Padronizado com Tabs */}
        <div className="flex flex-col flex-none bg-white border-b border-neutral-100">
          <div className="box-border flex flex-row justify-between items-center px-6 h-[64px]">
            <div className="flex-1 text-left flex items-center gap-3">
              <h5 className="text-h5 font-bold text-neutral-black leading-tight m-0">
                Detalhes do Cliente
              </h5>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onEdit}
                className="box-border flex flex-row justify-center items-center w-[36px] h-[36px] border border-neutral-200 rounded-[8px] hover:bg-neutral-50 transition-all flex-none text-neutral-500 hover:text-primary-600"
                title="Editar Cliente"
              >
                <i className="ph ph-pencil-simple ph-bold text-lg"></i>
              </button>
              <button
                onClick={onClose}
                className="box-border flex flex-row justify-center items-center w-[36px] h-[36px] border border-neutral-200 rounded-[8px] hover:bg-neutral-50 transition-all flex-none"
              >
                <i className="ph ph-x ph-bold text-neutral-700 text-lg"></i>
              </button>
            </div>
          </div>

          {/* Bar de Abas */}
          <div className="flex px-6 h-[44px] items-center gap-2 border-t border-neutral-50 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setCurrentView('details')}
              className={`h-full px-4 flex items-center justify-center text-[13px] font-medium transition-all border-b-[3px] -mb-[1px] whitespace-nowrap ${currentView === 'details' ? 'border-[#0AB86D] text-[#01040E] font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
            >
              Dados Gerais
            </button>
            <button
              onClick={() => setCurrentView('orders')}
              className={`h-full px-4 flex items-center justify-center text-[13px] font-medium transition-all border-b-[3px] -mb-[1px] whitespace-nowrap ${currentView === 'orders' ? 'border-[#0AB86D] text-[#01040E] font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
            >
              Pedidos
            </button>
            <button
              onClick={() => setCurrentView('cart')}
              className={`h-full px-4 flex items-center justify-center text-[13px] font-medium transition-all border-b-[3px] -mb-[1px] whitespace-nowrap ${currentView === 'cart' ? 'border-[#0AB86D] text-[#01040E] font-bold' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
            >
              Carrinho
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8 flex flex-col gap-6">

          {/* View: Pedidos (Orders History) */}
          {currentView === 'orders' && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-300 pb-12">
              {isLoadingOrders ? (
                <div className="flex justify-center py-10">
                  <i className="ph ph-spinner animate-spin text-2xl text-primary-500"></i>
                </div>
              ) : customerOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-neutral-25/50 border border-dashed border-neutral-200 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-300 shadow-small">
                    <i className="ph ph-receipt text-2xl"></i>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-body2 font-bold text-neutral-500">Nenhum pedido</p>
                    <p className="text-small text-neutral-400 max-w-[200px]">Este cliente ainda não possui nenhum pedido registrado.</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {customerOrders.map(order => {
                    const payStatus = PAYMENT_STATUS_MAP[order.payment_status] || { label: order.payment_status, variant: 'neutral' };
                    // const ordStatus = ORDER_STATUS_MAP[order.order_status] || { label: order.order_status, variant: 'neutral' }; // Uncomment if we decide to show order status too

                    return (
                      <div
                        key={order.id}
                        className="p-4 border border-neutral-100 rounded-xl bg-white shadow-sm flex flex-col gap-3 cursor-pointer hover:border-primary-200 hover:shadow-md transition-all group"
                        onClick={() => navigate(`/pedidos/${order.id}`)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-small font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">Pedido #{order.code || order.id.slice(0, 6)}</span>
                            <span className="text-[11px] text-neutral-500">
                              {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <Badge variant={payStatus.variant as any}>
                            {payStatus.label}
                          </Badge>
                        </div>

                        <div className="h-px bg-neutral-50 w-full" />

                        <div className="flex justify-between items-center">
                          <span className="text-[11px] text-neutral-500 font-medium">Items: {order.items?.length || 0}</span>
                          <span className="text-body2 font-bold text-neutral-900 tabular-nums">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total || 0)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* View: Carrinho (Items of Interest) */}
          {currentView === 'cart' && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-right duration-300 pb-12">
              <div className="flex items-center justify-between">
                <h5 className="text-body1 font-bold text-neutral-black">Itens do carrinho de compras</h5>
              </div>

              {isLoadingCart ? (
                <div className="flex justify-center py-10">
                  <i className="ph ph-spinner animate-spin text-2xl text-primary-500"></i>
                </div>
              ) : cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-neutral-25/50 border border-dashed border-neutral-200 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-300 shadow-small">
                    <i className="ph ph-shopping-cart text-2xl"></i>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-body2 font-bold text-neutral-500">Carrinho Vazio</p>
                    <p className="text-small text-neutral-400 max-w-[200px]">O cliente não possui nenhum item de interesse pendente</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {cartItems.map(item => (
                    <div key={item.id} className="group relative p-4 bg-white border border-neutral-100 rounded-xl shadow-small flex justify-between items-center transition-all hover:border-neutral-200">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="text-body2 font-bold text-neutral-900 truncate pr-8">{item.product_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-neutral-400">{item.quantity}x</span>
                          <span className="text-small font-bold text-primary-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price || 0)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCartItem(item.id)}
                        className="p-1.5 text-neutral-300 hover:text-system-error-500 hover:bg-system-error-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all ml-2"
                        title="Remover item"
                      >
                        <i className="ph ph-trash text-lg"></i>
                      </button>
                    </div>
                  ))}

                </div>
              )}
            </div>
          )}

          {/* View: Dados Gerais */}
          {currentView === 'details' && (
            <div className="flex flex-col gap-6">
              {/* Nome, Avatar e Switch IA */}
              <div className="flex items-center gap-6 mb-2">
                <div className="w-20 h-20 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-center shadow-small flex-none overflow-hidden">
                  {card.customerAvatar ? (
                    <img src={card.customerAvatar} className="w-full h-full object-cover" />
                  ) : (
                    <i className="ph ph-user text-4xl text-neutral-300"></i>
                  )}
                </div>

                <div className="flex flex-col gap-2 flex-1 overflow-hidden">
                  <h3 className="text-h3 font-bold text-neutral-black leading-tight truncate">{card.customerName}</h3>

                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all ${isAiEnabled ? 'bg-primary-50 border-primary-100' : 'bg-neutral-50 border-neutral-200'}`}>
                      <span className={`text-[10px] font-black uppercase tracking-tight ${isAiEnabled ? 'text-primary-700' : 'text-neutral-400'}`}>
                        Agente IA {isAiEnabled ? 'Ativo' : 'Pausado'}
                      </span>
                      <div className="scale-75 origin-right">
                        <Switch checked={isAiEnabled} onChange={onToggleAi} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Container: Informações de Contato */}
              <section className="flex flex-col gap-4 p-4 border border-neutral-100 rounded-2xl bg-white shadow-small">
                <div className="flex items-center justify-between">
                  <h5 className="text-body1 font-bold text-neutral-black">Informações do contato</h5>
                  <button
                    onClick={() => window.open(`https://wa.me/${card.customerPhone.replace(/\D/g, '')}`, '_blank')}
                    className="text-body2 font-medium text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1.5 transition-all"
                  >
                    <i className="ph ph-whatsapp-logo text-lg"></i>
                    WhatsApp
                  </button>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1">
                    <span className="text-body2 font-medium text-neutral-400">WhatsApp</span>
                    <p className="text-body2 font-medium text-neutral-black tabular-nums">
                      {card.customerPhone.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '+$1 ($2) $3-$4')}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-body2 font-medium text-neutral-400">Email</span>
                    <p className="text-body2 font-medium text-neutral-black">{card.customerEmail || 'emailnaoinformado@gmail.com'}</p>
                  </div>
                </div>
              </section>

              {/* Container: Indicadores (Valor Gasto e Total Pedidos) */}
              <section className="grid grid-cols-2 gap-4">
                {/* Card Valor Gasto */}
                <div className="flex flex-col gap-3 p-4 border border-neutral-100 rounded-2xl bg-white shadow-small justify-between">
                  <span className="text-small font-medium text-neutral-500">Valor Gasto</span>
                  <h4 className="text-h4 font-bold text-neutral-black tracking-tight tabular-nums">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(card.value)}
                  </h4>
                </div>

                {/* Card Total Pedidos */}
                <div className="flex flex-col gap-3 p-4 border border-neutral-100 rounded-2xl bg-white shadow-small relative group justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-small font-medium text-neutral-500">Total Pedidos</span>
                  </div>
                  <h4 className="text-h4 font-bold text-neutral-black tracking-tight tabular-nums">
                    {card.totalOrders || 0}
                  </h4>
                </div>
              </section>

              {/* Container: Etiquetas */}
              <section className="flex flex-col gap-4 p-4 border border-neutral-100 rounded-2xl bg-white shadow-small">
                <div className="flex items-center justify-between">
                  <h5 className="text-body1 font-bold text-neutral-black">Etiquetas</h5>
                  <button
                    onClick={() => setIsEditingTags(!isEditingTags)}
                    className="text-body2 font-medium text-primary-500 hover:text-primary-600 hover:underline"
                  >
                    {isEditingTags ? 'Concluir' : 'Editar'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {card.tags?.map((tag) => (
                    <div
                      key={tag.text}
                      className={`relative group flex items-center gap-1.5 px-3 h-[34px] ${tag.color} border border-black/5 rounded-lg shadow-small animate-in zoom-in-95 duration-200 cursor-default`}
                    >
                      <span className="text-body2 font-medium text-white">
                        {tag.text}
                      </span>

                      {/* Delete button */}
                      <button
                        onClick={() => handleRemoveTag(tag.text)}
                        className={`
                        ${isEditingTags ? 'w-5 opacity-100 ml-1.5' : 'w-0 opacity-0 ml-0 group-hover:w-5 group-hover:opacity-100 group-hover:ml-1.5'} 
                        flex items-center justify-center text-white/90 hover:text-white transition-all duration-200 overflow-hidden
                      `}
                        title="Remover etiqueta"
                      >
                        <i className="ph ph-x text-lg"></i>
                      </button>
                    </div>
                  ))}

                  {isEditingTags && (
                    <div className="flex flex-col gap-4 w-full mt-2 p-4 bg-neutral-25 rounded-xl border border-neutral-100 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Escolha a cor</span>
                        <div className="flex gap-2">
                          {TAG_COLORS.map((color) => (
                            <button
                              key={color.class}
                              onClick={() => setSelectedTagColor(color.class)}
                              className={`w-6 h-6 rounded-full ${color.class} border-2 transition-all shadow-small ${selectedTagColor === color.class ? 'border-neutral-900 scale-110' : 'border-transparent hover:scale-105'}`}
                              title={color.name}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 relative">
                        <TextInput
                          placeholder="Nome da etiqueta..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onFocus={() => setIsInputFocused(true)}
                          onBlur={() => setTimeout(() => setIsInputFocused(false), 200)} // Delay to allow click
                          onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                          containerClassName="!h-[32px] flex-1"
                        />
                        <button
                          onClick={handleAddTag}
                          disabled={!tagInput.trim()}
                          className={`w-8 h-8 rounded-lg ${selectedTagColor} text-white flex items-center justify-center shadow-small transition-all active:scale-95 disabled:opacity-50`}
                        >
                          <i className="ph ph-plus text-lg"></i>
                        </button>

                        {/* Suggestions Dropdown */}
                        {filteredSuggestions.length > 0 && isInputFocused && (
                          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-neutral-100 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[150px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-100">
                            {filteredSuggestions.map((suggestion) => (
                              <button
                                key={suggestion.text}
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Prevent blur before click
                                  setTagInput(suggestion.text);
                                  setSelectedTagColor(suggestion.color);

                                  const currentTags = card.tags || [];
                                  if (!currentTags.some(t => t.text.toLowerCase() === suggestion.text.toLowerCase())) {
                                    const newTag = { text: suggestion.text, color: suggestion.color };
                                    onUpdateTags([...currentTags, newTag]);
                                    customersService.addTag(companyId, card.customerId, suggestion.text, suggestion.color).catch(console.error);
                                    setTagInput('');
                                    setFilteredSuggestions([]);
                                  }
                                }}
                                className="px-3 py-2 text-left text-small font-medium text-neutral-700 hover:bg-neutral-50 flex items-center justify-between group/suggestion transition-colors"
                              >
                                <span>{suggestion.text}</span>
                                <span className={`w-3 h-3 rounded-full ${suggestion.color} border border-black/10`} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isEditingTags && (!card.tags || card.tags.length === 0) && (
                    <span className="text-body2 font-normal text-neutral-400 italic">Nenhuma etiqueta atribuída.</span>
                  )}
                </div>
              </section >

              {/* Container: Anotações */}
              <section className="flex flex-col gap-6 p-4 border border-neutral-100 rounded-2xl bg-white shadow-small mb-12" >
                <div className="flex items-center justify-between">
                  <h5 className="text-body1 font-bold text-neutral-black">Anotações</h5>
                  <button
                    onClick={() => setIsAddingNote(true)}
                    className="text-body2 font-medium text-primary-500 hover:text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <i className="ph ph-plus"></i>
                    Adicionar anotação
                  </button>
                </div>

                {isAddingNote && (
                  <div className="flex flex-col gap-3 p-2 bg-neutral-50 border border-neutral-200 rounded-[12px] animate-in slide-in-from-top-4 duration-300">
                    <TextArea
                      placeholder="Escreva sua observação sobre o cliente..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      containerClassName="!bg-white !border-neutral-200 shadow-inner min-h-[100px]"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" onClick={() => setIsAddingNote(false)} className="!h-[32px]">Cancelar</Button>
                      <Button variant="primary" onClick={handleSaveNote} className="!h-[32px] px-6">Salvar</Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {card.notes && card.notes.length > 0 ? (
                    card.notes.map((note) => (
                      <div key={note.id} className="relative p-2 bg-neutral-25 border border-neutral-100 rounded-[12px] shadow-small flex flex-col gap-2 group transition-all hover:border-neutral-200">
                        <p className="text-body2 font-normal text-neutral-800 leading-relaxed pr-6">
                          {note.text}
                        </p>
                        <span className="text-small font-medium text-neutral-400 tracking-tight">
                          Por <span className="text-neutral-500">{note.author}</span> em {note.createdAt}
                        </span>

                        {/* Delete Note Button */}
                        <button
                          onClick={() => onDeleteNote(note.id)}
                          className="absolute top-2 right-2 p-1.5 text-neutral-400 hover:text-system-error-500 hover:bg-system-error-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          title="Excluir anotação"
                        >
                          <i className="ph ph-trash text-lg"></i>
                        </button>
                      </div>
                    ))
                  ) : !isAddingNote && (
                    <div className="py-12 flex flex-col items-center justify-center text-center gap-3 bg-neutral-25/50 border border-dashed border-neutral-200 rounded-[12px]">
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-300 shadow-small">
                        <i className="ph ph-note-pencil text-2xl"></i>
                      </div>
                      <p className="text-body2 font-normal text-neutral-400 max-w-[200px]">Sem anotações registradas para este cliente ainda.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Footer: Total (Only for Carrinho view) */}
        {currentView === 'cart' && (
          <div className="flex-none p-6 border-t border-neutral-100 bg-white flex justify-between items-center animate-in slide-in-from-bottom duration-300">
            <span className="text-small font-black text-neutral-400 uppercase tracking-widest">Total</span>
            <span className="text-h3 font-black text-neutral-900 tracking-tight tabular-nums">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
              )}
            </span>
          </div>
        )}
      </aside>
    </>
  );
};
