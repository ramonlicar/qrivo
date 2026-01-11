/**
 * ATENÇÃO AO DESENVOLVEDOR:
 * ESTA É A PÁGINA PRINCIPAL DE OPERAÇÃO DE VENDAS (HOME/PEDIDOS).
 * NÃO REALIZE ALTERAÇÕES NESTE CÓDIGO A MENOS QUE SEJA EXPLICITAMENTE SOLICITADO PELO USUÁRIO.
 * MANTENHA A PADRONIZAÇÃO VISUAL E AS REGRAS DE NEGÓCIO DE FLUXO DE PEDIDOS.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Badge } from './Badge';
import { Dropdown } from './Dropdown';
import { DateRangeFilter } from './DateRangeFilter';
import { TextInput } from './TextInput';
import { Pagination } from './Pagination';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { StatsCard } from './StatsCard';
import { ConfirmDeleteOrderModal } from './ConfirmDeleteOrderModal';
import { Order, Stats } from '../types';
import { ordersService } from '../lib/services';
import { getUserCompanyId, supabase } from '../lib/supabase';

const ORDER_STATUS_MAP: Record<string, { label: string; variant: 'error' | 'success' | 'warning' | 'neutral' | 'purple' }> = {
  'new': { label: 'Novo', variant: 'error' },
  'confirmed': { label: 'Confirmado', variant: 'error' },
  'preparing': { label: 'Em Separação', variant: 'warning' },
  'shipped': { label: 'Em Entrega', variant: 'purple' },
  'delivered': { label: 'Entregue', variant: 'success' },
  'canceled': { label: 'Cancelado', variant: 'neutral' },
  'archived': { label: 'Arquivado', variant: 'neutral' },
  'NOVO': { label: 'Novo', variant: 'error' },
  'PREPARANDO': { label: 'Em Separação', variant: 'warning' },
  'ENTREGUE': { label: 'Entregue', variant: 'success' },
  'CANCELADO': { label: 'Cancelado', variant: 'neutral' },
  'ARQUIVADO': { label: 'Arquivado', variant: 'neutral' },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; variant: 'success' | 'error' | 'warning' | 'neutral' }> = {
  'paid': { label: 'Pago', variant: 'success' },
  'pending': { label: 'Pendente', variant: 'error' },
  'refunded': { label: 'Reembolsado', variant: 'neutral' },
  'canceled': { label: 'Cancelado', variant: 'neutral' },
  'PAGO': { label: 'Pago', variant: 'success' },
  'PENDENTE': { label: 'Pendente', variant: 'error' },
  'REEMBOLSADO': { label: 'Reembolsado', variant: 'neutral' },
};

interface HomeProps {
  onOrderSelect: (order: Order) => void;
  onOpenSidebar: () => void;
  onNewOrder: () => void;
  onEditOrder: (order: Order) => void;
}

export const Home: React.FC<HomeProps> = ({ onOrderSelect, onOpenSidebar, onNewOrder, onEditOrder }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  // Stats state management
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    newOrders: 0,
    paidOrders: 0,
    totalRevenue: 0,
    averageTicket: 0

  });

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const companyId = await getUserCompanyId();
      if (!companyId) {
        console.warn("CompanyId não encontrado. Exibindo lista vazia.");
        setOrders([]);
        setTotalCount(0);
        setIsLoading(false);
        return;
      }

      // Prepare filters object
      const activeFilters = {
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        searchTerm: searchTerm || undefined,
        status: statusFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        paymentMethod: paymentMethodFilter || undefined
      };

      // Parallel fetch for orders and stats
      const [ordersRes, statsRes] = await Promise.all([
        ordersService.getOrders(companyId, currentPage, itemsPerPage, activeFilters, sortOption),
        ordersService.getOrdersStats(companyId, activeFilters)
      ]);

      if (ordersRes.error) {
        console.error("Erro ao buscar pedidos:", ordersRes.error);
        setOrders([]);
        setTotalCount(0);
      } else {
        setOrders(ordersRes.data || []);
        setTotalCount(ordersRes.count || 0);
      }

      if (!statsRes.error) {
        setStats({
          totalOrders: statsRes.totalOrders,
          newOrders: statsRes.newOrders,
          paidOrders: statsRes.paidOrders,
          totalRevenue: statsRes.totalRevenue,
          averageTicket: statsRes.averageTicket
        });
      }

    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, dateRange, searchTerm, statusFilter, paymentStatusFilter, paymentMethodFilter, sortOption]);

  useEffect(() => {
    loadOrders();
    let channel: any = null;

    const setupRealtime = async () => {
      try {
        const companyId = await getUserCompanyId();
        if (!companyId) return;

        console.log('[Home] Setting up real-time for company:', companyId);

        // Cleanup existing channel if any
        if (channel) {
          supabase.removeChannel(channel);
        }

        channel = supabase
          .channel(`orders-realtime-${companyId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'orders',
              filter: `company_id=eq.${companyId}`,
            },
            (payload) => {
              console.log('[Home] Real-time update received:', payload.eventType);
              loadOrders();
            }
          )
          .subscribe((status) => {
            console.log('[Home] Real-time subscription status:', status);
          });
      } catch (err) {
        console.error('[Home] Error setting up real-time:', err);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        console.log('[Home] Cleaning up real-time channel');
        supabase.removeChannel(channel);
      }
    };
  }, [loadOrders]);

  // Stats are now managed via state from backend response
  // const stats = useMemo(...) removed

  // Removed client-side filteredOrders memoization since filtering is now server-side
  const filteredOrders = orders; // Direct assignment as orders are already filtered by backend


  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const paginatedOrders = filteredOrders;

  const tableGridClass = "grid grid-cols-[1.5fr_100px_110px_120px_140px_100px_50px] gap-4 items-center px-6";

  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in duration-500 overflow-hidden relative">

      {/* Header Padronizado */}
      <header className="flex flex-col w-full bg-white flex-none border-b border-neutral-200">
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[12px] lg:gap-[16px] w-full min-h-[64px] lg:min-h-[72px]">
          <button onClick={onOpenSidebar} className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white border border-neutral-200 text-neutral-800 flex-none">
            <i className="ph ph-list text-lg"></i>
          </button>

          <div className="flex flex-col items-start p-0 gap-[1px] flex-1 overflow-hidden">
            <h1 className="text-h4 font-bold text-neutral-black tracking-tight m-0 truncate w-full">Pedidos</h1>
            <p className="hidden sm:block text-body2 font-normal text-neutral-500 m-0 truncate w-full">Acompanhe e gerencie as vendas realizadas pela sua IA.</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="primary" className="!h-[40px] font-bold shadow-sm" leftIcon="ph ph-plus" onClick={onNewOrder}>Novo Pedido</Button>
          </div>
        </div>

        {/* Barra de Filtros Padronizada */}
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[16px] w-full bg-white border-t border-neutral-100">
          <div className="flex flex-row items-center gap-[12px] flex-1 overflow-x-auto no-scrollbar py-1">
            <TextInput
              leftIcon="ph-magnifying-glass"
              placeholder="Buscar cliente ou código..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              containerClassName="w-full max-w-[320px] !h-[36px]"
            />
            {/* Filtro Status Pedido */}
            <Dropdown
              label="Status do Pedido"
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
              options={[
                { label: 'Novos', value: 'new', color: 'bg-system-error-500' },
                { label: 'Confirmados', value: 'confirmed', color: 'bg-blue-500' },
                { label: 'Preparando', value: 'preparing', color: 'bg-yellow-500' },
                { label: 'Enviados', value: 'shipped', color: 'bg-purple-500' },
                { label: 'Entregues', value: 'delivered', color: 'bg-primary-500' },
                { label: 'Cancelados', value: 'canceled', color: 'bg-neutral-400' }
              ]}
              className="min-w-[160px] shrink-0 h-[36px]"
            />
            {/* Filtro Status Pagamento */}
            <Dropdown
              label="Status Pagamento"
              value={paymentStatusFilter}
              onChange={(val) => { setPaymentStatusFilter(val); setCurrentPage(1); }}
              options={[
                { label: 'Pago', value: 'paid', color: 'bg-emerald-500' },
                { label: 'Pendente', value: 'pending', color: 'bg-amber-500' },
                { label: 'Reembolsado', value: 'refunded', color: 'bg-neutral-500' }
              ]}
              className="min-w-[160px] shrink-0 h-[36px]"
            />
            {/* Filtro Forma Pagamento */}
            <Dropdown
              label="Forma Pagamento"
              value={paymentMethodFilter}
              onChange={(val) => { setPaymentMethodFilter(val); setCurrentPage(1); }}
              options={[
                { label: 'PIX', value: 'pix' },
                { label: 'Cartão de Crédito', value: 'credit_card' },
                { label: 'Cartão de Débito', value: 'debit_card' },
                { label: 'Boleto', value: 'boleto' },
                { label: 'Dinheiro', value: 'cash' },
                { label: 'Transferência', value: 'transfer' }
              ]}
              className="min-w-[160px] shrink-0 h-[36px]"
            />
            {/* Filtro Data */}
            <DateRangeFilter
              startDate={dateRange.start}
              endDate={dateRange.end}
              onChange={(start, end) => { setDateRange({ start, end }); setCurrentPage(1); }}
              className="min-w-[140px] shrink-0 h-[36px]"
            />

            {(searchTerm || statusFilter || paymentStatusFilter || paymentMethodFilter || dateRange.start) && (
              <Button
                variant="danger-light"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setPaymentStatusFilter('');
                  setPaymentMethodFilter('');
                  setDateRange({ start: null, end: null });
                }}
                className="!h-[36px]"
                leftIcon="ph ph-x-circle"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Sort Layout Fixed to Right */}
          <div className="flex-none pl-4 border-l border-neutral-100 hidden lg:block">
            <Dropdown
              align="right"
              label=""
              leftIcon="ph-sort-ascending"
              value={sortOption}
              onChange={setSortOption}
              options={[
                { label: 'Mais Recentes', value: 'newest' },
                { label: 'Mais Antigos', value: 'oldest' },
                { label: 'Maior Valor', value: 'highest_value' },
                { label: 'Menor Valor', value: 'lowest_value' }
              ]}
              className="min-w-[160px] h-[36px]"
            />
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 flex flex-col gap-6">

        {/* Métricas Compactas */}
        <div className="bg-neutral-100 p-1.5 rounded-2xl">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-1.5">
            <StatsCard
              label="Total Pedidos"
              value={isLoading ? '...' : totalCount}
              icon="ph-receipt"
              iconBgColor="bg-[#F1E9FE]"
              iconColor="text-[#955CF6]"
            />
            <StatsCard
              label="Pedidos Novos"
              value={isLoading ? '...' : stats.newOrders}
              icon="ph-clock"
              iconBgColor="bg-[#FFE2E5]"
              iconColor="text-[#FF2F54]"
            />
            <StatsCard
              label="Pedidos Pagos"
              value={isLoading ? '...' : stats.paidOrders}
              icon="ph-check-circle"
              iconBgColor="bg-[#DCFBEE]"
              iconColor="text-[#0AB86D]"
            />
            <StatsCard
              label="Ticket Médio"
              value={isLoading ? '...' : stats.averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              icon="ph-tag-simple"
              iconBgColor="bg-[#DCFBEE]"
              iconColor="text-[#0AB86D]"
            />
            <StatsCard
              label="Faturamento"
              value={isLoading ? '...' : stats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              icon="ph-currency-dollar"
              iconBgColor="bg-[#DCFBEE]"
              iconColor="text-[#0AB86D]"
            />
          </div>
        </div>

        {/* Listagem de Pedidos */}
        <div className="bg-white border border-neutral-200 shadow-small rounded-[12px] overflow-hidden mb-10 h-auto flex-none">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[1000px] w-full">
              {/* Table Header */}
              <div className="grid grid-cols-[100px_minmax(250px,1.5fr)_180px_140px_140px_140px_100px] gap-4 items-center px-6 h-[40px] bg-secondary-700 sticky top-0 z-20">
                <span className="text-body2 font-semibold text-white text-left">Código</span>
                <span className="text-body2 font-semibold text-white text-left">Cliente</span>
                <span className="text-body2 font-semibold text-white text-left">Valor e Status</span>
                <span className="text-body2 font-semibold text-white text-left">Pagamento</span>
                <span className="text-body2 font-semibold text-white text-left">Status Pedido</span>
                <span className="text-body2 font-semibold text-white text-left">Data</span>
                <span className="text-body2 font-semibold text-white text-left"></span>
              </div>

              {/* Table Body */}
              <div className="flex flex-col divide-y divide-neutral-100 h-auto">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <i className="ph ph-circle-notch animate-spin text-3xl text-neutral-300"></i>
                    <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest">Sincronizando...</span>
                  </div>
                ) : paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => {
                    const payStatus = PAYMENT_STATUS_MAP[order.payment_status] || PAYMENT_STATUS_MAP['pending'];
                    const ordStatus = ORDER_STATUS_MAP[order.order_status] || ORDER_STATUS_MAP['new'];
                    return (
                      <div
                        key={order.id}
                        onClick={() => onOrderSelect(order)}
                        className="grid grid-cols-[100px_minmax(250px,1.5fr)_180px_140px_140px_140px_100px] gap-4 items-center px-6 min-h-[56px] py-2 hover:bg-neutral-25 transition-all group cursor-pointer"
                      >
                        {/* Código */}
                        <span
                          className="text-body2 font-bold text-neutral-600 tabular-nums hover:text-primary-600"
                        >
                          {order.code}
                        </span>

                        {/* Cliente */}
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-9 h-9 rounded-full border border-neutral-100 bg-neutral-50 flex-none overflow-hidden shadow-small">
                            <img src={`https://ui-avatars.com/api/?name=${order.customer_name}&background=0AB86D&color=fff&bold=true`} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-body2 font-bold text-neutral-black truncate group-hover:text-primary-700 transition-colors">{order.customer_name}</span>
                            <span className="text-[11px] text-neutral-400 font-medium truncate">
                              {order.customer_phone ? order.customer_phone.replace(/^(\d{2})(\d{2})(\d{5})(\d{4})$/, '+$1 ($2) $3-$4') : '-'}
                            </span>
                          </div>
                        </div>

                        {/* Valor e Status de Pagamento */}
                        <div className="flex flex-col gap-1 items-start text-left">
                          <span className="text-body2 font-bold text-neutral-900 tabular-nums">
                            {(Number(order.total) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <div className="flex items-center gap-1.5 justify-start">
                            <div className={`w-1.5 h-1.5 rounded-full ${payStatus.variant === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <span className={`text-[11px] font-medium uppercase tracking-tight ${payStatus.variant === 'success' ? 'text-emerald-700' : 'text-neutral-500'}`}>{payStatus.label}</span>
                          </div>
                        </div>

                        {/* Forma de Pagamento */}
                        <span className="text-body2 font-medium text-neutral-700 truncate text-left">
                          {ordersService.formatPaymentMethod ? ordersService.formatPaymentMethod(order.payment_method) : (order.payment_method || '-')}
                        </span>

                        {/* Status do Pedido */}
                        <div className="flex justify-start">
                          <Badge variant={ordStatus.variant}>{ordStatus.label}</Badge>
                        </div>

                        {/* Data */}
                        <div className="flex flex-col items-start text-left gap-0.5">
                          <span className="text-body2 font-bold text-neutral-900 tabular-nums">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                          <span className="text-[11px] font-medium text-neutral-400 tabular-nums">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center justify-start gap-2">
                          <IconButton
                            icon="ph-pencil-simple"
                            variant="neutral"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); onEditOrder(order); }}
                            disabled={['delivered', 'ENTREGUE'].includes(order.order_status)}
                            title={['delivered', 'ENTREGUE'].includes(order.order_status) ? "Pedidos entregues não podem ser editados" : "Editar Pedido"}
                          />
                          <IconButton
                            icon="ph-trash"
                            variant="delete"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setOrderToDelete(order);
                              setDeleteModalOpen(true);
                            }}
                            title="Excluir Pedido"
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
                      <i className="ph ph-shopping-cart text-3xl text-neutral-200"></i>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-body2 font-bold text-neutral-900">Nenhum pedido encontrado</h4>
                      <p className="text-small text-neutral-500">Tente ajustar seus filtros ou aguarde novas vendas.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-neutral-100 bg-white">
            <span className="text-body2 font-medium text-neutral-500">
              Exibindo <span className="font-bold text-neutral-black">{(currentPage - 1) * itemsPerPage + filteredOrders.length}</span> de <span className="font-bold text-neutral-black">{totalCount}</span> Resultado(s)
            </span>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>

      <ConfirmDeleteOrderModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setOrderToDelete(null);
        }}
        onConfirm={async () => {
          if (orderToDelete) {
            setIsDeleting(true);
            try {
              await ordersService.deleteOrder(orderToDelete.id);
              await loadOrders();
              setDeleteModalOpen(false);
              setOrderToDelete(null);
            } catch (error) {
              console.error("Failed to delete order", error);
              alert("Erro ao excluir pedido.");
            } finally {
              setIsDeleting(false);
            }
          }
        }}
        isDeleting={isDeleting}
      />
    </div>
  );
};
