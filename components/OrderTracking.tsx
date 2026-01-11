
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ordersService, supabase } from '../lib/services';
import { Order, OrderActivity } from '../types';
import { Badge } from './Badge';

const ORDER_STATUS_MAP: Record<string, { label: string; variant: 'error' | 'success' | 'warning' | 'neutral' | 'purple' }> = {
    'new': { label: 'Novo', variant: 'error' },
    'confirmed': { label: 'Confirmado', variant: 'error' },
    'preparing': { label: 'Em Separação', variant: 'warning' },
    'shipped': { label: 'Em Entrega', variant: 'purple' },
    'delivered': { label: 'Entregue', variant: 'success' },
    'canceled': { label: 'Cancelado', variant: 'neutral' },
    'archived': { label: 'Arquivado', variant: 'neutral' },
    'NOVO': { label: 'Novo', variant: 'error' },
    'CONFIRMADO': { label: 'Confirmado', variant: 'error' },
    'PREPARANDO': { label: 'Em Separação', variant: 'warning' },
    'ENVIADO': { label: 'Em Entrega', variant: 'purple' },
    'ENTREGUE': { label: 'Entregue', variant: 'success' },
    'CANCELADO': { label: 'Cancelado', variant: 'neutral' },
    'ARQUIVADO': { label: 'Arquivado', variant: 'neutral' },
};

export const OrderTracking: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [history, setHistory] = useState<OrderActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrderData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                const { data: orderData, error: orderError } = await ordersService.getOrderById(id);
                console.log('[OrderTracking] Fetch order result:', { data: orderData, error: orderError });
                if (orderError || !orderData) {
                    console.error('[OrderTracking] Order not found or error:', orderError);
                    throw new Error('Pedido não encontrado ou erro de acesso.');
                }
                setOrder(orderData);

                console.log('[OrderTracking] Attempting to fetch order history for order ID:', id);
                const { data: historyData, error: historyError } = await ordersService.getOrderHistory(id);
                console.log('[OrderTracking] Fetch history result:', { data: historyData, error: historyError });
                setHistory(historyData || []);
            } catch (err: any) {
                console.error('[OrderTracking] Error during data fetch:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
                console.log('[OrderTracking] Data fetching complete.');
            }
        };

        fetchOrderData();

        // Real-time subscription
        if (!id) return;
        console.log('[OrderTracking] Setting up real-time subscription for order ID:', id);
        const channel = supabase
            .channel(`order-tracking-${id}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
                (payload) => {
                    console.log('[OrderTracking] Real-time Order Update:', payload);
                    setOrder(prev => prev ? { ...prev, ...(payload.new as Order) } : (payload.new as Order));
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'order_history', filter: `order_id=eq.${id}` },
                (payload) => {
                    console.log('[OrderTracking] Real-time History Insert:', payload);
                    setHistory(prev => [payload.new as OrderActivity, ...prev]);
                }
            )
            .subscribe();
        console.log('[OrderTracking] Real-time subscription established.');

        return () => {
            console.log('[OrderTracking] Cleaning up real-time subscription for order ID:', id);
            supabase.removeChannel(channel);
        };
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral-25 flex flex-col items-center justify-center p-6 gap-4 font-sans">
                <i className="ph ph-circle-notch animate-spin text-4xl text-primary-500"></i>
                <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest">Localizando pedido...</span>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-neutral-25 flex flex-col items-center justify-center p-6 text-center font-sans">
                <div className="w-16 h-16 rounded-full bg-error-50 flex items-center justify-center mb-4">
                    <i className="ph ph-x-circle text-3xl text-error-500"></i>
                </div>
                <h2 className="text-h2 font-bold text-neutral-900 mb-2">Ops! Algo deu errado</h2>
                <p className="text-body1 text-neutral-500 max-w-md">{error || 'Não conseguimos encontrar as informações deste pedido.'}</p>
            </div>
        );
    }

    const steps = [
        { id: 'new', label: 'Novo', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
        { id: 'confirmed', label: 'Confirmado', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
        { id: 'preparing', label: 'Separação', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
        { id: 'shipped', label: 'Entrega', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
        { id: 'delivered', label: 'Entregue', bg: 'bg-[#DBFBED]', text: 'text-[#09B86D]', border: 'border-[#09B86D]/20' },
    ];

    const statusIdxMap: Record<string, number> = {
        'new': 0, 'NOVO': 0,
        'confirmed': 1, 'CONFIRMADO': 1,
        'preparing': 2, 'PREPARANDO': 2,
        'shipped': 3, 'ENVIADO': 3,
        'delivered': 4, 'ENTREGUE': 4
    };

    const currentIdx = statusIdxMap[order.order_status] ?? -1;

    return (
        <div className="min-h-screen bg-neutral-50 font-sans p-4 sm:p-6 lg:p-10 flex flex-col items-center overflow-y-auto">
            <div className="w-full max-w-3xl flex flex-col gap-8">

                {/* Header/Logo */}
                <div className="flex flex-col items-center gap-2 mb-2">
                    <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                        <i className="ph-bold ph-package text-white text-2xl"></i>
                    </div>
                    <h1 className="text-h3 font-bold text-neutral-900">Acompanhamento de Pedido</h1>
                    <p className="text-body2 text-neutral-500 font-medium tracking-tight">Código do Pedido: <span className="text-neutral-900 font-bold uppercase">{order.code}</span></p>
                </div>

                {/* Status Tracker */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center justify-between">
                        <h5 className="text-h5 font-bold text-neutral-black">Progresso do Pedido</h5>
                        <Badge variant={ORDER_STATUS_MAP[order.order_status]?.variant || 'neutral'}>
                            {ORDER_STATUS_MAP[order.order_status]?.label || order.order_status}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {steps.map((step, idx) => {
                            const isCurrent = idx === currentIdx;
                            const isPast = idx < currentIdx;
                            const isFuture = idx > currentIdx;

                            return (
                                <React.Fragment key={step.id}>
                                    <div className={`
                    flex-1 min-w-[100px] h-11 rounded-xl flex items-center justify-center px-4 text-body2 font-semibold border transition-all duration-300
                    ${isCurrent ? `${step.bg} ${step.text} ${step.border} shadow-sm border-2` : ''}
                    ${isPast ? `bg-neutral-50 text-neutral-400 border-neutral-100` : ''}
                    ${isFuture ? `bg-white text-neutral-300 border-neutral-100` : ''}
                  `}>
                                        {step.label}
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <i className={`ph-bold ph-caret-right text-[10px] ${isPast ? 'text-neutral-400' : 'text-neutral-200'} hidden sm:block`}></i>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Summary */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 h-full">
                            <h5 className="text-h5 font-bold text-neutral-black">Resumo do Pedido</h5>

                            <div className="flex flex-col gap-4">
                                {(order.items || []).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-neutral-50 last:border-none">
                                        <div className="flex flex-col">
                                            <span className="text-body2 font-bold text-neutral-900">{item.quantity}x {item.name_snapshot}</span>
                                        </div>
                                        <span className="text-body2 font-bold text-neutral-900">
                                            {(item.price_snapshot * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto pt-6 border-t border-neutral-100 flex flex-col gap-2">
                                <div className="flex justify-between items-center text-body2 text-neutral-500 font-medium">
                                    <span>Subtotal</span>
                                    <span>{order.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <div className="flex justify-between items-center text-body2 text-neutral-500 font-medium">
                                    <span>Taxa de Entrega</span>
                                    <span className="text-primary-600">{order.shipping_fee === 0 ? 'Grátis' : order.shipping_fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                                <div className="flex justify-between items-center text-h4 font-bold text-neutral-900 mt-2">
                                    <span>Total</span>
                                    <span>{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer & Delivery */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
                            <h5 className="text-h5 font-bold text-neutral-black">Informações de Entrega</h5>

                            <div className="flex flex-col gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                                        <i className="ph-bold ph-user text-neutral-900 text-xl"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Cliente</span>
                                        <p className="text-body2 font-bold text-neutral-900">{order.customer_name}</p>
                                        <p className="text-[12px] text-neutral-500 mt-0.5">{order.customer_phone}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                                        <i className="ph-bold ph-map-pin text-neutral-900 text-xl"></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Endereço</span>
                                        {order.shipping_address ? (
                                            <p className="text-body2 font-medium text-neutral-700 leading-snug">
                                                {order.shipping_address.street}, {order.shipping_address.number}<br />
                                                {order.shipping_address.city} - {order.shipping_address.state}
                                            </p>
                                        ) : (
                                            <p className="text-body2 font-medium text-neutral-400">Não informado</p>
                                        )}
                                    </div>
                                </div>

                                {order.observations && (
                                    <div className="p-4 bg-neutral-25 rounded-xl border border-neutral-100">
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Observações</span>
                                        <p className="text-[12px] text-neutral-600 italic">"{order.observations}"</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Qrivo branding seal */}
                        <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100 flex items-center justify-between gap-4">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <i className="ph-bold ph-sparkle text-primary-500"></i>
                                    <span className="text-body2 font-bold text-primary-900">Atendimento IA Ativo</span>
                                </div>
                                <p className="text-[12px] text-primary-700 font-medium">Este pedido foi processado com inteligência artificial.</p>
                            </div>
                            <div className="flex flex-col items-end flex-none">
                                <span className="text-[10px] text-primary-400 font-bold uppercase tracking-widest leading-none mb-1">Tecnologia</span>
                                <span className="text-body2 font-black text-primary-600 tracking-tight">QRIVO</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Timeline */}
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col gap-8 mb-10">
                    <h5 className="text-h5 font-bold text-neutral-black">Histórico do Pedido</h5>

                    <div className="flex flex-col gap-8 relative ml-4 border-l-2 border-neutral-100 pl-8 pb-4">
                        {history.length === 0 ? (
                            <div className="text-neutral-400 font-medium text-body2 py-4">Aguardando atividades...</div>
                        ) : (
                            history.map((item, idx) => {
                                const config = (() => {
                                    switch (item.action_type) {
                                        case 'restore': return { icon: 'ph-arrow-counter-clockwise', color: 'bg-primary-500' };
                                        case 'archive': return { icon: 'ph-archive', color: 'bg-neutral-500' };
                                        case 'confirmed': return { icon: 'ph-check-circle', color: 'bg-red-500' };
                                        case 'preparing': return { icon: 'ph-package', color: 'bg-amber-500' };
                                        case 'shipped': return { icon: 'ph-truck', color: 'bg-purple-500' };
                                        case 'delivery': return { icon: 'ph-truck', color: 'bg-primary-500' };
                                        case 'payment_confirm': return { icon: 'ph-check-circle', color: 'bg-primary-500' };
                                        case 'payment_cancel': return { icon: 'ph-x-circle', color: 'bg-red-500' };
                                        case 'refund': return { icon: 'ph-clock-counter-clockwise', color: 'bg-red-500' };
                                        case 'receipt_update': return { icon: 'ph-file-arrow-up', color: 'bg-primary-500' };
                                        case 'customer_linked': return { icon: 'ph-user-plus', color: 'bg-primary-500' };
                                        default: return { icon: 'ph-info', color: 'bg-neutral-400' };
                                    }
                                })();

                                return (
                                    <div key={item.id || idx} className="relative animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <div className={`absolute -left-[41px] top-0 w-[18px] h-[18px] rounded-full ${config.color} ring-4 ring-white flex items-center justify-center`}>
                                            <i className={`ph ${config.icon} text-[10px] text-white`}></i>
                                        </div>
                                        <p className="text-body2 font-bold text-neutral-800 leading-snug mb-1" dangerouslySetInnerHTML={{ __html: item.description }}></p>
                                        <p className="text-tag font-bold text-neutral-400 uppercase tracking-widest">
                                            {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col items-center gap-4 py-10 opacity-60">
                    <p className="text-body2 text-neutral-400 font-medium tracking-tight">Sistema de Gestão de Vendas desenvolvido pela <span className="text-neutral-900 font-bold">QRIVO</span></p>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
