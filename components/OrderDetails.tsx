
import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { Badge } from './Badge';
import { Button } from './Button';
import { ConfirmPaymentModal } from './ConfirmPaymentModal';
import { CancelPaymentModal } from './CancelPaymentModal';
import { ViewReceiptModal } from './ViewReceiptModal';
import { ConfirmRefundModal } from './ConfirmRefundModal';
import { ConfirmRestoreModal } from './ConfirmRestoreModal';
import { ConfirmArchiveModal } from './ConfirmArchiveModal';
import { useParams } from 'react-router-dom';
import { ordersService } from '../lib/services';
import { getUserCompanyId, supabase } from '../lib/supabase';
import { CustomerSelectionModal } from './CustomerSelectionModal';
import { Customer, User, OrderActivity } from '../types';
import { Dropdown } from './Dropdown';
import { userService, teamService, companiesService } from '../lib/services';
import { ConfirmDeleteOrderModal } from './ConfirmDeleteOrderModal';
import { useNavigate } from 'react-router-dom';

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
  'ENVIADO': { label: 'Em Entrega', variant: 'purple' },
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
  'CANCELADO': { label: 'Cancelado', variant: 'neutral' },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  'pix': 'PIX',
  'transfer': 'Transferência',
  'credit_card': 'Cartão de Crédito',
  'debit_card': 'Cartão de Débito',
  'boleto': 'Boleto',
  'voucher': 'Voucher',
  'cash': 'Dinheiro',
  'other': 'Outros',
};



// ... (maps) ...

interface OrderDetailsProps {
  order?: Order;
  onBack: () => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order: initialOrder, onBack }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [localOrder, setLocalOrder] = useState<Order | null>(initialOrder || null);

  const [isLoading, setIsLoading] = useState(!initialOrder || (initialOrder && initialOrder.id !== id));
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptViewModalOpen, setIsReceiptViewModalOpen] = useState(false);
  const [isCancelPaymentModalOpen, setIsCancelPaymentModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isCustomerSelectionModalOpen, setIsCustomerSelectionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [history, setHistory] = useState<OrderActivity[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    if (id && (!localOrder || localOrder.id !== id)) {
      const fetchOrder = async () => {
        setIsLoading(true);
        try {
          // Fetch order by ID
          const orderId = id;
          const { data, error } = await supabase
            .from('orders')
            .select('*, items:order_items(*)')
            .eq('id', orderId)
            .single();

          if (data) setLocalOrder(data);
        } catch (error) {
          console.error('Error fetching order:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, localOrder]);

  const fetchHistory = async () => {
    if (!id) return;
    setIsLoadingHistory(true);
    try {
      const { data } = await ordersService.getOrderHistory(id);
      if (data) setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (id) fetchHistory();
  }, [id]);

  useEffect(() => {
    const fetchTeam = async () => {
      setIsLoadingMembers(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: company } = await companiesService.getMyCompany(user.id);
        if (!company) return;

        // Fetch team using the verified company ID
        const { data } = await teamService.getTeamMembers(company.id);

        if (data) {
          const users: User[] = data.map(tm => ({
            id: tm.id,
            email: tm.email,
            full_name: tm.full_name,
            avatar_url: tm.avatar_url,
            created_at: tm.created_at
          }));
          setTeamMembers(users);
        }
      } catch (err) {
        console.error('Error fetching team:', err);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    fetchTeam();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <i className="ph ph-circle-notch animate-spin text-4xl text-primary-500"></i>
      </div>
    );
  }

  if (!localOrder) return <div>Pedido não encontrado.</div>;

  // ... (rest of component uses localOrder) ...



  const showToast = (message: string) => setToast({ show: true, message });

  const handleRestoreOrder = async () => {
    // Optimistic
    setLocalOrder(prev => (prev ? { ...prev, payment_status: 'PENDENTE', order_status: 'NOVO', updated_at: new Date().toISOString() } : null));
    setIsRestoreModalOpen(false);
    showToast('Pedido restaurado com sucesso.');

    // Persistent
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'pending', order_status: 'new' })
        .eq('id', localOrder.id);
      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'restore', 'Pedido restaurado para o status Novo.');
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast('Erro ao restaurar pedido.');
    }
  };

  const handleArchiveOrder = async () => {
    // Optimistic
    setLocalOrder(prev => (prev ? { ...prev, order_status: 'CANCELADO', updated_at: new Date().toISOString() } : null));
    setIsArchiveModalOpen(false);
    showToast('Pedido arquivado!');

    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'canceled' })
        .eq('id', localOrder.id);
      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'archive', 'Pedido arquivado (cancelado).');
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast('Erro ao arquivar pedido.');
    }
  };

  const handleConfirmOrder = async () => {
    setLocalOrder(prev => (prev ? { ...prev, order_status: 'confirmed', updated_at: new Date().toISOString() } : null));
    showToast('Pedido confirmado!');
    try {
      const { error } = await supabase.from('orders').update({ order_status: 'confirmed' }).eq('id', localOrder.id);
      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'confirmed', 'Pedido confirmado.');
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast('Erro ao confirmar pedido.');
    }
  };

  const handleStartPreparing = async () => {
    setLocalOrder(prev => (prev ? { ...prev, order_status: 'preparing', updated_at: new Date().toISOString() } : null));
    showToast('Iniciando separação...');
    try {
      const { error } = await supabase.from('orders').update({ order_status: 'preparing' }).eq('id', localOrder.id);
      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'preparing', 'Pedido em separação.');
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast('Erro ao iniciar separação.');
    }
  };

  const handleStartShipping = async () => {
    setLocalOrder(prev => (prev ? { ...prev, order_status: 'shipped', updated_at: new Date().toISOString() } : null));
    showToast('Iniciando entrega...');
    try {
      const { error } = await supabase.from('orders').update({ order_status: 'shipped' }).eq('id', localOrder.id);
      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'shipped', 'Pedido em entrega.');
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast('Erro ao iniciar entrega.');
    }
  };

  const handleConfirmDelivery = async () => {
    // Optimistic
    setLocalOrder(prev => (prev ? { ...prev, order_status: 'delivered', updated_at: new Date().toISOString() } : null));
    showToast('Entrega confirmada!');

    try {
      const { error } = await supabase
        .from('orders')
        .update({ order_status: 'delivered' })
        .eq('id', localOrder.id);
      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'delivery', 'Entrega do pedido confirmada.');
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast('Erro ao confirmar entrega.');
    }
  };

  const handleConfirmPayment = async (file: File | null) => {
    let publicUrl = localOrder.receipt_url;

    if (file) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `receipts/${localOrder.id}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        publicUrl = data.publicUrl;
      } catch (err) {
        console.error('Error uploading receipt:', err);
        showToast('Erro ao fazer upload do comprovante.');
        return;
      }
    }

    // Optimistic
    setLocalOrder(prev => (prev ? { ...prev, payment_status: 'PAGO', receipt_url: publicUrl, updated_at: new Date().toISOString() } : null));
    setIsPaymentModalOpen(false);
    showToast('Pagamento confirmado com sucesso!');

    // Persistent
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid', receipt_url: publicUrl })
        .eq('id', localOrder.id);
      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'payment_confirm', 'Pagamento confirmado e comprovante enviado.');
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast('Erro ao confirmar pagamento.');
    }
  };

  const handleCancelPayment = async () => {
    // Optimistic
    setLocalOrder(prev => (prev ? { ...prev, payment_status: 'PENDENTE', receipt_url: undefined, updated_at: new Date().toISOString() } : null));
    setIsCancelPaymentModalOpen(false);
    showToast('Pagamento cancelado.');

    // Persistent
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'pending', receipt_url: null })
        .eq('id', localOrder.id);
      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'payment_cancel', 'Pagamento cancelado e comprovante removido.');
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast('Erro ao cancelar pagamento.');
    }
  };

  const handleConfirmRefund = async () => {
    // Optimistic
    setLocalOrder(prev => (prev ? { ...prev, payment_status: 'REEMBOLSADO', order_status: 'CANCELADO', updated_at: new Date().toISOString() } : null));
    setIsRefundModalOpen(false);
    showToast('Reembolso confirmado com sucesso.');

    // Persistent
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'refunded', order_status: 'canceled' })
        .eq('id', localOrder.id);
      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'refund', 'Reembolso confirmado. Pedido cancelado.');
      fetchHistory();
    } catch (err) {
      console.error(err);
      showToast('Erro ao confirmar reembolso.');
    }
  };

  const handleUpdateReceipt = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `receipts/${localOrder.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // Persist
      const { error } = await supabase
        .from('orders')
        .update({ receipt_url: publicUrl })
        .eq('id', localOrder.id);

      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'receipt_update', 'Comprovante de pagamento atualizado.');
      fetchHistory();

      // Optimistic
      setLocalOrder(prev => (prev ? { ...prev, receipt_url: publicUrl, updated_at: new Date().toISOString() } : null));
      showToast('Comprovante atualizado!');
    } catch (err) {
      console.error('Error updating receipt:', err);
      showToast('Erro ao atualizar comprovante.');
    }
  };

  const handleDownloadReceipt = () => {
    if (!localOrder.receipt_url) return;
    const link = document.createElement('a');
    link.href = localOrder.receipt_url;
    link.download = `comprovante_${localOrder.code}`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteReceipt = async () => {
    // Optimistic
    setLocalOrder(prev => (prev ? { ...prev, receipt_url: null, updated_at: new Date().toISOString() } : null));
    setIsReceiptViewModalOpen(false);
    showToast('Comprovante excluído.');

    try {
      const { error } = await supabase
        .from('orders')
        .update({ receipt_url: null })
        .eq('id', localOrder.id);

      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'receipt_delete', 'Comprovante de pagamento excluído.');
      fetchHistory();
    } catch (err) {
      console.error('Error deleting receipt:', err);
      showToast('Erro ao excluir comprovante.');
    }
  };

  const handleCustomerSelect = async (customer: Customer) => {
    // Optimistic update
    setLocalOrder(prev => ({
      ...prev!,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      updated_at: new Date().toISOString()
    }));
    setIsCustomerSelectionModalOpen(false);
    showToast('Cliente vinculado com sucesso!');

    // Update in Supabase
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          customer_id: customer.id,
          customer_name: customer.name,
          customer_phone: customer.phone,
          customer_email: customer.email
        })
        .eq('id', localOrder.id);

      if (error) throw error;
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'customer_linked', `Cliente ${customer.name} vinculado ao pedido.`);
      fetchHistory();
    } catch (err) {
      console.error('Error linking customer:', err);
      showToast('Erro ao salvar vínculo.');
    }
  };

  const handleDeleteOrder = async () => {
    if (!localOrder) return;
    setIsDeleting(true);
    try {
      const { error } = await ordersService.deleteOrder(localOrder.id);
      if (error) throw error;
      showToast('Pedido excluído com sucesso!');
      setTimeout(() => {
        onBack();
      }, 1000);
    } catch (err) {
      console.error('Error deleting order:', err);
      showToast('Erro ao excluir pedido.');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleResponsibleSelect = async (userId: string) => {
    setLocalOrder(prev => ({ ...prev!, responsible_id: userId, updated_at: new Date().toISOString() }));
    try {
      await supabase.from('orders').update({ responsible_id: userId }).eq('id', localOrder.id);
      const member = teamMembers.find(m => m.id === userId);
      await ordersService.addOrderActivity(localOrder.id, localOrder.company_id, 'responsible_update', `Responsável atualizado para: ${member?.full_name || 'Desconhecido'}`);
      fetchHistory();
      showToast('Responsável atualizado!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao atualizar responsável.');
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/rastreio/${localOrder.code}`;
    navigator.clipboard.writeText(link);
    showToast('Link copiado!');
  };

  const whatsappLink = `https://wa.me/${localOrder.customer_phone.replace(/\D/g, '')}`;

  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {toast.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center justify-center px-6 py-3 bg-neutral-900 rounded-lg shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-body2 font-medium text-white">{toast.message}</span>
        </div>
      )}

      {/* Header do Pedido */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-[12px_20px] lg:p-[12px_24px] bg-white border-b border-neutral-200 gap-4 min-h-[64px] lg:min-h-[72px] flex-none">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center justify-center w-[36px] h-[36px] rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 transition-all shadow-small active:scale-95 flex-none">
            <i className="ph ph-bold ph-arrow-left text-neutral-800 text-lg"></i>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="text-h5 font-bold text-neutral-black tracking-tight">Pedido {localOrder.code}</h2>
              <Badge variant={ORDER_STATUS_MAP[localOrder.order_status]?.variant || 'neutral'}>
                {ORDER_STATUS_MAP[localOrder.order_status]?.label || localOrder.order_status}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-small text-neutral-400 font-medium whitespace-nowrap">Criado em {new Date(localOrder.created_at).toLocaleDateString('pt-BR')} às {new Date(localOrder.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              {localOrder.updated_at && (
                <>
                  <span className="w-1 h-1 rounded-full bg-neutral-300 hidden sm:block"></span>
                  <span className="text-small text-neutral-400 font-medium whitespace-nowrap">Última modificação em {new Date(localOrder.updated_at).toLocaleDateString('pt-BR')} às {new Date(localOrder.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            leftIcon="ph ph-pencil-simple"
            className="!h-[36px] !px-3"
            onClick={() => navigate(`/pedidos/editar/${localOrder.id}`)}
            disabled={['delivered', 'ENTREGUE'].includes(localOrder.order_status)}
            title={['delivered', 'ENTREGUE'].includes(localOrder.order_status) ? "Pedidos entregues não podem ser editados" : "Editar Pedido"}
          />
          {localOrder.order_status === 'new' || localOrder.order_status === 'NOVO' ? (
            <>
              <Button variant="secondary" className="w-[114px] sm:flex-none !h-[36px]" onClick={() => setIsArchiveModalOpen(true)}>Arquivar</Button>
              <Button variant="danger" className="flex-1 sm:flex-none !h-[36px]" onClick={handleConfirmOrder}>Confirmar Pedido</Button>
            </>
          ) : localOrder.order_status === 'confirmed' ? (
            <>
              <Button variant="secondary" className="w-[114px] sm:flex-none !h-[36px]" onClick={() => setIsArchiveModalOpen(true)}>Arquivar</Button>
              <Button variant="neutral" className="flex-1 sm:flex-none !h-[36px]" onClick={handleStartPreparing}>Iniciar Separação</Button>
            </>
          ) : localOrder.order_status === 'preparing' || localOrder.order_status === 'PREPARANDO' ? (
            <>
              <Button variant="secondary" className="w-[114px] sm:flex-none !h-[36px]" onClick={() => setIsArchiveModalOpen(true)}>Arquivar</Button>
              <Button variant="primary" className="flex-1 sm:flex-none !h-[36px]" onClick={handleStartShipping}>Iniciar Entrega</Button>
            </>
          ) : localOrder.order_status === 'shipped' || localOrder.order_status === 'ENVIADO' ? (
            <>
              <Button variant="secondary" className="w-[114px] sm:flex-none !h-[36px]" onClick={() => setIsArchiveModalOpen(true)}>Arquivar</Button>
              <Button variant="primary" className="flex-1 sm:flex-none !h-[36px]" onClick={handleConfirmDelivery}>Confirmar Entrega</Button>
            </>
          ) : ['delivered', 'archived', 'canceled', 'ENTREGUE', 'CANCELADO', 'ARQUIVADO', 'ENVIADO'].includes(localOrder.order_status) ? (
            <Button variant="secondary" className="w-[114px] sm:flex-none !h-[36px]" onClick={() => setIsRestoreModalOpen(true)}>Restaurar</Button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6 bg-white">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_384px] gap-6 max-w-[1600px] mx-auto pb-20">

          {/* Coluna Esquerda: Itens e Entrega */}
          <div className="flex flex-col gap-6">
            {/* Tabela de Itens */}
            <div className="bg-white border border-neutral-200 rounded-xl shadow-cards overflow-hidden">
              {/* Table Header - body 2 font-semibold, No Uppercase */}
              <div className="grid grid-cols-12 gap-4 bg-secondary-700 h-[40px] px-6 items-center">
                <div className="col-span-12 md:col-span-5 text-body2 font-semibold text-white">Itens do pedido</div>
                <div className="hidden md:block md:col-span-3 text-body2 font-semibold text-white text-left">Unitário</div>
                <div className="hidden md:block md:col-span-2 text-body2 font-semibold text-white text-left">Qtd.</div>
                <div className="hidden md:block md:col-span-2 text-body2 font-semibold text-white text-left">Subtotal</div>
              </div>
              <div className="divide-y divide-neutral-100">
                {(localOrder.items || []).map((item) => (
                  <div key={item.id} className="flex flex-col md:grid md:grid-cols-12 p-3 sm:p-4 items-start md:items-center gap-4">
                    <div className="col-span-12 md:col-span-5 flex items-center gap-4 w-full">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-neutral-100 bg-neutral-25 flex items-center justify-center overflow-hidden flex-none shadow-small">
                        <img src={item.image_snapshot} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-body2 font-bold text-neutral-black leading-snug">{item.name_snapshot}</span>
                    </div>
                    <div className="md:col-span-3 text-body2 font-medium text-neutral-700 tabular-nums text-left flex md:block items-center gap-2">
                      <span className="md:hidden text-tag font-bold text-neutral-400 uppercase">Preço:</span>
                      {item.price_snapshot.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="md:col-span-2 text-body2 font-medium text-neutral-700 text-left flex md:block items-center gap-2">
                      <span className="md:hidden text-tag font-bold text-neutral-400 uppercase">Qtd:</span>
                      {item.quantity}x
                    </div>
                    <div className="md:col-span-2 text-body2 font-bold text-neutral-black tabular-nums text-left flex md:block items-center gap-2">
                      <span className="md:hidden text-tag font-bold text-neutral-400 uppercase">Subtotal:</span>
                      {(item.price_snapshot * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações de Entrega */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-cards overflow-hidden">
              <h5 className="text-h5 font-bold text-neutral-black mb-6">Informações de Entrega</h5>

              <div className="flex flex-col gap-6">
                {/* Resumo do Pedido */}
                <div className="flex items-start gap-4 pb-6 border-b border-neutral-50">
                  <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                    <i className="ph ph-bold ph-receipt text-neutral-900 text-xl"></i>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-body2 font-medium text-neutral-500 mb-1">Resumo do Pedido</span>
                    <p className="text-body2 font-bold text-neutral-black leading-tight">
                      {localOrder.order_summary || 'Não informado'}
                    </p>
                  </div>
                </div>

                {/* Endereço */}
                <div className="flex items-start gap-4 pb-6 border-b border-neutral-50">
                  <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                    <i className="ph ph-bold ph-map-pin text-neutral-900 text-xl"></i>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-body2 font-medium text-neutral-500 mb-1">Endereço Completo</span>
                    <p className="text-body2 font-bold text-neutral-black leading-tight">
                      {localOrder.shipping_address || 'Endereço não informado'}
                    </p>
                  </div>
                </div>

                {/* Opção de Entrega */}
                <div className="flex items-start gap-4 pb-6 border-b border-neutral-50">
                  <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                    <i className="ph ph-bold ph-truck text-neutral-900 text-xl"></i>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-body2 font-medium text-neutral-500 mb-1">Opção de Entrega</span>
                    <p className="text-body2 font-bold text-neutral-black leading-tight">
                      {localOrder.delivery_area?.name || 'Não informado'}
                    </p>
                  </div>
                </div>

                {/* Observações */}
                <div className="flex items-start gap-4 pt-2">
                  <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                    <i className="ph ph-bold ph-note text-neutral-900 text-xl"></i>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-body2 font-medium text-neutral-500 mb-1">Observações do Pedido</span>
                    <p className="text-body2 font-medium text-neutral-700 leading-relaxed italic bg-neutral-25 p-3 rounded-lg border border-neutral-100">
                      {localOrder.observations ? `"${localOrder.observations}"` : 'Nenhuma observação informada pelo cliente.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Container: Histórico do Pedido (Movido para cá) */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-cards flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-h5 font-bold text-neutral-black">Histórico</h5>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      className="!h-[32px] px-3 text-[11px]"
                      leftIcon="ph-bold ph-copy"
                      onClick={handleCopyLink}
                    >
                      Copiar link
                    </Button>
                    <Button
                      variant="secondary"
                      className="!h-[32px] px-3 text-[11px]"
                      leftIcon="ph-bold ph-share-network"
                      onClick={() => window.open(`${window.location.origin}/rastreio/${localOrder.code}`, '_blank')}
                    >
                      Página de Acompanhamento
                    </Button>
                  </div>
                </div>

                {/* Visual Status Tracker */}
                <div className="flex flex-wrap items-center gap-2 py-2">
                  {(() => {
                    const steps = [
                      { id: 'new', label: 'Novo', variant: 'error', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
                      { id: 'confirmed', label: 'Confirmado', variant: 'error', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100' },
                      { id: 'preparing', label: 'Separação', variant: 'warning', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
                      { id: 'shipped', label: 'Entrega', variant: 'purple', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
                      { id: 'delivered', label: 'Entregue', variant: 'success', bg: 'bg-[#DBFBED]', text: 'text-[#09B86D]', border: 'border-[#09B86D]/20' },
                    ];

                    const statusIdxMap: Record<string, number> = {
                      'new': 0, 'NOVO': 0,
                      'confirmed': 1,
                      'preparing': 2, 'PREPARANDO': 2,
                      'shipped': 3, 'ENVIADO': 3, 'shipped_internal': 3, // adding internal variants if any
                      'delivered': 4, 'ENTREGUE': 4
                    };

                    const currentIdx = statusIdxMap[localOrder.order_status] ?? -1;

                    return steps.map((step, idx) => {
                      const isCurrent = idx === currentIdx;
                      const isPast = idx < currentIdx;
                      const isFuture = idx > currentIdx;

                      return (
                        <React.Fragment key={step.id}>
                          <div className={`
                            flex-1 min-w-[100px] h-10 rounded-lg flex items-center justify-center px-2 py-1 text-body2 font-semibold border transition-all duration-300
                            ${isCurrent ? `${step.bg} ${step.text} ${step.border} shadow-sm scale-[1.02]` : ''}
                            ${isPast ? `bg-neutral-50 text-neutral-400 border-neutral-100` : ''}
                            ${isFuture ? `bg-white text-neutral-300 border-neutral-100` : ''}
                          `}>
                            {step.label}
                          </div>
                          {idx < steps.length - 1 && (
                            <i className={`ph-bold ph-caret-right text-[10px] ${isPast ? 'text-neutral-400' : 'text-neutral-200'}`}></i>
                          )}
                        </React.Fragment>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="flex flex-col gap-6 relative ml-4 border-l-2 border-neutral-100 pl-6 pb-2">
                {isLoadingHistory ? (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <i className="ph ph-circle-notch animate-spin"></i>
                    <span className="text-small">Carregando histórico...</span>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-neutral-400 text-small">Nenhuma atividade registrada ainda.</div>
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
                        case 'receipt_delete': return { icon: 'ph-trash', color: 'bg-red-500' };
                        case 'customer_linked': return { icon: 'ph-user-plus', color: 'bg-primary-500' };
                        case 'responsible_update': return { icon: 'ph-user-gear', color: 'bg-primary-500' };
                        default: return { icon: 'ph-info', color: 'bg-neutral-400' };
                      }
                    })();

                    return (
                      <div key={item.id || idx} className="relative">
                        <div className={`absolute -left-[31px] top-0 w-[14px] h-[14px] rounded-full ${config.color} ring-4 ring-white flex items-center justify-center animate-in zoom-in duration-300`}>
                          <i className={`ph ${config.icon} text-[8px] text-white`}></i>
                        </div>
                        <p className="text-small font-semibold text-neutral-800 leading-tight mb-1" dangerouslySetInnerHTML={{ __html: item.description }}></p>
                        <p className="text-[10px] text-neutral-400 font-medium">
                          {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Coluna Lateral: Resumo, Pagamento e Dados do Cliente */}
          <div className="flex flex-col gap-6 w-full">
            {/* Resumo Financeiro */}
            <div className="bg-white border border-neutral-200 rounded-xl shadow-cards p-6">
              <h3 className="text-h2 font-bold text-neutral-black mb-4">{localOrder.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-body2 font-medium text-neutral-500"><span>Subtotal</span><span className="text-neutral-black font-bold">{localOrder.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                <div className="flex justify-between items-center text-body2 font-medium text-neutral-500">
                  <span>Taxa de Entrega {localOrder.delivery_area?.name ? `(${localOrder.delivery_area.name})` : ''}</span>
                  <span className="text-primary-600 font-bold">{localOrder.shipping_fee === 0 ? 'Grátis' : localOrder.shipping_fee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              </div>
            </div>

            {/* Container: Pagamento */}
            <div className="bg-white border border-neutral-200 rounded-xl shadow-cards p-6">
              <div className="flex items-center justify-between mb-6">
                <h5 className="text-h5 font-bold text-neutral-black">Pagamento</h5>
                <Badge variant={PAYMENT_STATUS_MAP[localOrder.payment_status]?.variant || 'neutral'}>
                  {PAYMENT_STATUS_MAP[localOrder.payment_status]?.label || localOrder.payment_status}
                </Badge>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-body2 font-medium text-neutral-500">Método Escolhido</span>
                  <p className="text-body2 font-bold text-neutral-900">
                    {localOrder.payment_method ? (PAYMENT_METHOD_MAP[localOrder.payment_method] || localOrder.payment_method) : 'Não informado'}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-body2 font-medium text-neutral-500">Comprovante de Pagamento</span>
                  {localOrder.receipt_url ? (
                    <Button
                      variant="secondary"
                      className="!h-[36px] w-full"
                      leftIcon="ph ph-eye"
                      onClick={() => setIsReceiptViewModalOpen(true)}
                    >
                      Ver comprovante
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      className="!h-[36px] w-full"
                      leftIcon={['PAGO', 'paid'].includes(localOrder.payment_status) ? "ph ph-upload-simple" : "ph ph-eye"}
                      onClick={() => ['PAGO', 'paid'].includes(localOrder.payment_status) ? setIsPaymentModalOpen(true) : {}}
                      disabled={!['PAGO', 'paid'].includes(localOrder.payment_status)}
                    >
                      {['PAGO', 'paid'].includes(localOrder.payment_status) ? "Anexar comprovante" : "Ver comprovante"}
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-3 mt-4">
                  {localOrder.payment_status === 'PENDENTE' || localOrder.payment_status === 'pending' ? (
                    <Button variant="neutral" className="w-full !h-[36px]" onClick={() => setIsPaymentModalOpen(true)}>Marcar como Pago</Button>
                  ) : localOrder.payment_status === 'REEMBOLSADO' || localOrder.payment_status === 'refunded' ? (
                    <Button variant="secondary" className="w-full !h-[36px]" onClick={() => setIsRestoreModalOpen(true)}>Restaurar</Button>
                  ) : (
                    <>
                      <Button variant="secondary" className="w-full !h-[36px]" onClick={() => setIsCancelPaymentModalOpen(true)}>Cancelar Pagamento</Button>
                      <Button variant="danger" className="w-full !h-[36px]" onClick={() => setIsRefundModalOpen(true)}>Reembolsar</Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Container: Responsável pelo Pedido */}
            <div className="bg-white border border-neutral-200 rounded-xl shadow-cards p-6">
              <h5 className="text-h5 font-bold text-neutral-black mb-4">Responsável</h5>
              <div className="flex flex-col gap-1">
                <span className="text-body2 font-medium text-neutral-500">Membro da Equipe</span>
                <Dropdown
                  options={teamMembers.map(m => ({ label: m.full_name, value: m.id, icon: 'ph-user' }))}
                  value={localOrder.responsible_id || ''}
                  onChange={(val) => handleResponsibleSelect(val)}
                  label="Selecione um responsável"
                  className="w-full"
                />
              </div>
            </div>

            {/* Container: Dados do Cliente (Abaixo do Pagamento) */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-cards overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <h5 className="text-h5 font-bold text-neutral-black">Dados do Cliente</h5>
                <Button
                  variant="secondary"
                  leftIcon="ph-pencil-simple"
                  onClick={() => setIsCustomerSelectionModalOpen(true)}
                  className="!h-[32px] !px-3"
                >
                  {localOrder.customer_id ? 'Alterar' : 'Vincular'}
                </Button>
              </div>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <span className="text-body2 font-medium text-neutral-500">Nome Completo</span>
                  <p className="text-body2 font-bold text-neutral-black">{localOrder.customer_name}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-body2 font-medium text-neutral-500">WhatsApp</span>
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body2 font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors group"
                  >
                    {localOrder.customer_phone}
                    <i className="ph ph-arrow-square-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                  </a>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-body2 font-medium text-neutral-500">E-mail</span>
                  <p className="text-body2 font-bold text-neutral-black">{localOrder.customer_email || 'Não informado'}</p>
                </div>
              </div>
            </div>

            {/* Ações Secundárias */}
            <div className="px-2 mt-2">
              <Button
                variant="ghost"
                className="!text-danger-600 hover:!text-danger-700 !h-auto !p-0 !bg-transparent hover:!bg-transparent !justify-start w-fit group"
                onClick={() => setIsDeleteModalOpen(true)}
                leftIcon="ph ph-trash"
              >
                Excluir Pedido
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handleConfirmPayment}
      />

      <CancelPaymentModal
        isOpen={isCancelPaymentModalOpen}
        onClose={() => setIsCancelPaymentModalOpen(false)}
        onConfirm={handleCancelPayment}
      />

      <ConfirmRefundModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        onConfirm={handleConfirmRefund}
      />

      <ConfirmRestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={handleRestoreOrder}
      />

      <ConfirmArchiveModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={handleArchiveOrder}
      />

      <ViewReceiptModal
        isOpen={isReceiptViewModalOpen}
        onClose={() => setIsReceiptViewModalOpen(false)}
        receiptUrl={localOrder.receipt_url}
        onEdit={handleUpdateReceipt}
        onDownload={handleDownloadReceipt}
        onDelete={handleDeleteReceipt}
      />

      <CustomerSelectionModal
        isOpen={isCustomerSelectionModalOpen}
        onClose={() => setIsCustomerSelectionModalOpen(false)}
        onSelect={handleCustomerSelect}
      />

      <ConfirmDeleteOrderModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteOrder}
        isDeleting={isDeleting}
      />
    </div>
  );
};
