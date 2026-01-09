/**
 * ATENÇÃO AO DESENVOLVEDOR:
 * ESTA É A PÁGINA PRINCIPAL DE OPERAÇÃO DE VENDAS (HOME/PEDIDOS).
 * NÃO REALIZE ALTERAÇÕES NESTE CÓDIGO A MENOS QUE SEJA EXPLICITAMENTE SOLICITADO PELO USUÁRIO.
 * MANTENHA A PADRONIZAÇÃO VISUAL E AS REGRAS DE NEGÓCIO DE FLUXO DE PEDIDOS.
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Badge } from './Badge';
import { Dropdown } from './Dropdown';
import { Pagination } from './Pagination';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { StatsCard } from './StatsCard';
import { Order, Stats } from '../types';
import { ordersService } from '../lib/services';
import { getUserCompanyId } from '../lib/supabase';

const ORDER_STATUS_MAP: Record<string, { label: string; variant: 'error' | 'success' | 'warning' | 'neutral' }> = {
  'new': { label: 'Novo', variant: 'error' },
  'preparing': { label: 'Preparando', variant: 'warning' },
  'shipped': { label: 'Enviado', variant: 'warning' },
  'delivered': { label: 'Entregue', variant: 'success' },
  'canceled': { label: 'Cancelado', variant: 'neutral' },
  'archived': { label: 'Arquivado', variant: 'neutral' },
  'NOVO': { label: 'Novo', variant: 'error' },
  'PREPARANDO': { label: 'Preparando', variant: 'warning' },
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
}

export const Home: React.FC<HomeProps> = ({ onOrderSelect, onOpenSidebar }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Debug: Log quando o componente é montado
  useEffect(() => {
    console.log('Home component mounted');
  }, []);

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
      const { data, count, error } = await ordersService.getOrders(companyId, currentPage, itemsPerPage);
      if (error) {
        console.error("Erro ao buscar pedidos:", error);
        setOrders([]);
        setTotalCount(0);
      } else {
        setOrders(data || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      setOrders([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const stats = useMemo((): Stats => {
    const paidOnes = orders.filter(o => o.payment_status?.toLowerCase() === 'paid' || o.paymentStatus === 'PAGO');
    const revenue = paidOnes.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    return {
      totalOrders: totalCount,
      newOrders: orders.filter(o => o.order_status?.toLowerCase() === 'new' || o.status === 'NOVO').length,
      paidOrders: paidOnes.length,
      totalRevenue: revenue,
      averageTicket: paidOnes.length > 0 ? revenue / paidOnes.length : 0
    };
  }, [orders, totalCount]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const name = (order.customer_name || '').toLowerCase();
      const code = (order.code || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase()) || code.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === '' || order.order_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

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
            <IconButton icon="ph-arrows-clockwise" variant="neutral" onClick={loadOrders} className={isLoading ? 'animate-spin' : ''} title="Sincronizar" />
            <Button variant="primary" className="!h-[36px] font-bold" leftIcon="ph ph-plus">Novo Pedido</Button>
          </div>
        </div>

        {/* Barra de Filtros Padronizada */}
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[16px] w-full bg-white border-t border-neutral-100">
          <div className="flex flex-row items-center gap-[12px] flex-1 overflow-x-auto no-scrollbar py-1">
            <div className="relative group w-full max-w-[320px] shrink-0">
              <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-primary-500"></i>
              <input
                type="text"
                placeholder="Buscar cliente ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-[36px] bg-white border border-neutral-200 rounded-lg pl-10 pr-4 text-body2 font-medium focus:outline-none focus:border-primary-500 transition-all shadow-small"
              />
            </div>
            <Dropdown
              label="Status do Pedido"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Todos', value: '' },
                { label: 'Novos', value: 'new', color: 'bg-system-error-500' },
                { label: 'Entregues', value: 'delivered', color: 'bg-primary-500' },
                { label: 'Cancelados', value: 'canceled', color: 'bg-neutral-400' }
              ]}
              className="min-w-[160px] shrink-0 h-[36px]"
            />
            {(searchTerm || statusFilter) && (
              <Button
                variant="tertiary"
                onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
                className="text-system-error-500 !h-[36px]"
                leftIcon="ph ph-x-circle"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 flex flex-col gap-6">

        {/* Métricas Compactas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label="Pedidos Totais"
            value={isLoading ? '...' : totalCount}
            icon="ph-receipt"
            iconBgColor="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatsCard
            label="Aguardando"
            value={isLoading ? '...' : stats.newOrders}
            icon="ph-clock"
            iconBgColor="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatsCard
            label="Pagos"
            value={isLoading ? '...' : stats.paidOrders}
            icon="ph-check-circle"
            iconBgColor="bg-primary-50"
            iconColor="text-primary-600"
          />
          <StatsCard
            label="Receita"
            value={isLoading ? '...' : stats.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            icon="ph-bank"
            iconBgColor="bg-indigo-50"
            iconColor="text-indigo-600"
          />
        </div>

        {/* Listagem de Pedidos */}
        <div className="bg-white border border-neutral-200 shadow-small rounded-[12px] overflow-hidden mb-10">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[900px] w-full">
              {/* Table Header */}
              <div className={`${tableGridClass} h-[40px] bg-secondary-700 sticky top-0 z-20`}>
                <span className="text-body2 font-semibold text-white">Cliente</span>
                <span className="text-body2 font-semibold text-white">Código</span>
                <span className="text-body2 font-semibold text-white">Valor</span>
                <span className="text-body2 font-semibold text-white text-center">Status</span>
                <span className="text-body2 font-semibold text-white">Pagamento</span>
                <span className="text-body2 font-semibold text-white">Data</span>
                <span></span>
              </div>

              {/* Table Body */}
              <div className="flex flex-col divide-y divide-neutral-100">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <i className="ph ph-circle-notch animate-spin text-3xl text-neutral-300"></i>
                    <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest">Sincronizando...</span>
                  </div>
                ) : filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => {
                    const payStatus = PAYMENT_STATUS_MAP[order.payment_status] || PAYMENT_STATUS_MAP['pending'];
                    const ordStatus = ORDER_STATUS_MAP[order.order_status] || ORDER_STATUS_MAP['new'];
                    return (
                      <div
                        key={order.id}
                        onClick={() => onOrderSelect(order)}
                        className={`${tableGridClass} min-h-[64px] py-2 hover:bg-neutral-25 transition-all group cursor-pointer`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-9 h-9 rounded-full border border-neutral-100 bg-neutral-50 flex-none overflow-hidden shadow-small">
                            <img src={`https://ui-avatars.com/api/?name=${order.customer_name}&background=0AB86D&color=fff&bold=true`} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-body2 font-bold text-neutral-black truncate group-hover:text-primary-700 transition-colors">{order.customer_name}</span>
                            <span className="text-[11px] text-neutral-400 font-medium truncate">{order.customer_phone}</span>
                          </div>
                        </div>

                        <span className="text-body2 font-bold text-neutral-600 tabular-nums bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100 w-fit">{order.code}</span>

                        <span className="text-body2 font-black text-neutral-900 tabular-nums">
                          {(Number(order.total) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>

                        <div className="flex justify-center">
                          <Badge variant={ordStatus.variant}>{ordStatus.label}</Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${payStatus.variant === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                          <span className="text-tag font-bold text-neutral-700 uppercase tracking-tight">{payStatus.label}</span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-body2 font-bold text-neutral-800 tabular-nums">{new Date(order.created_at).toLocaleDateString('pt-BR')}</span>
                          <span className="text-[10px] font-bold text-neutral-400">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>

                        <div className="flex justify-end pr-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-50 text-neutral-300 group-hover:bg-primary-50 group-hover:text-primary-600 transition-all border border-neutral-100">
                            <i className="ph ph-caret-right ph-bold"></i>
                          </div>
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

          <div className="flex items-center justify-between p-4 border-t border-neutral-100 bg-neutral-50/30">
            <span className="text-body2 font-medium text-neutral-500">
              Exibindo <span className="font-bold text-neutral-black">{filteredOrders.length}</span> resultados
            </span>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>
    </div>
  );
};
