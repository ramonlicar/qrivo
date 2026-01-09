
import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { Badge } from './Badge';
import { Button } from './Button';
import { ConfirmPaymentModal } from './ConfirmPaymentModal';
import { CancelPaymentModal } from './CancelPaymentModal';
import { ViewReceiptModal } from './ViewReceiptModal';
import { ConfirmRefundModal } from './ConfirmRefundModal';

interface OrderDetailsProps {
  order: Order;
  onBack: () => void;
}

export const OrderDetails: React.FC<OrderDetailsProps> = ({ order, onBack }) => {
  const [localOrder, setLocalOrder] = useState<Order>(order);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptViewModalOpen, setIsReceiptViewModalOpen] = useState(false);
  const [isCancelPaymentModalOpen, setIsCancelPaymentModalOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message: string) => setToast({ show: true, message });

  const getStatusVariant = (status: string): 'success' | 'error' | 'neutral' | 'warning' => {
    switch (status) {
      case 'ENTREGUE':
      case 'PAGO': return 'success';
      case 'NOVO':
      case 'PENDENTE': return 'error';
      case 'CANCELADO':
      case 'REEMBOLSADO':
      case 'ARQUIVADO': return 'neutral';
      default: return 'warning';
    }
  };

  const handleConfirmPayment = (file: File | null) => {
    setLocalOrder(prev => ({ ...prev, paymentStatus: 'PAGO', receiptUrl: file ? URL.createObjectURL(file) : prev.receiptUrl }));
    setIsPaymentModalOpen(false);
    showToast('Pagamento confirmado com sucesso!');
  };

  const handleCancelPayment = () => {
    setLocalOrder(prev => ({ ...prev, paymentStatus: 'PENDENTE', receiptUrl: undefined }));
    setIsCancelPaymentModalOpen(false);
    showToast('Pagamento cancelado.');
  };

  const handleConfirmRefund = () => {
    setLocalOrder(prev => ({ ...prev, paymentStatus: 'REEMBOLSADO', status: 'CANCELADO' }));
    setIsRefundModalOpen(false);
    showToast('Reembolso confirmado com sucesso.');
  };

  const whatsappLink = `https://wa.me/${localOrder.customerPhone.replace(/\D/g, '')}`;

  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 bg-primary-100 border border-primary-500 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <i className="ph ph-check-circle ph-fill text-primary-600 text-xl"></i>
          <span className="text-body2 font-bold text-primary-900">{toast.message}</span>
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
              <Badge variant={getStatusVariant(localOrder.status)}>{localOrder.status}</Badge>
            </div>
            <span className="text-small text-neutral-400 font-medium">Criado em {localOrder.createdAt}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button variant="secondary" className="w-[114px] sm:flex-none !h-[36px]" onClick={() => showToast('Pedido arquivado!')} disabled={localOrder.status === 'ARQUIVADO'}>Arquivar</Button>
          <Button variant="primary" className="flex-1 sm:flex-none !h-[36px]" onClick={() => showToast('Entrega confirmada!')} disabled={localOrder.status === 'ENTREGUE'}>Confirmar Entrega</Button>
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
                        <img src={item.image} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-body2 font-bold text-neutral-black leading-snug">{item.name}</span>
                    </div>
                    <div className="md:col-span-3 text-body2 font-medium text-neutral-700 tabular-nums text-left flex md:block items-center gap-2">
                       <span className="md:hidden text-tag font-bold text-neutral-400 uppercase">Preço:</span>
                       {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                    <div className="md:col-span-2 text-body2 font-medium text-neutral-700 text-left flex md:block items-center gap-2">
                       <span className="md:hidden text-tag font-bold text-neutral-400 uppercase">Qtd:</span>
                       {item.quantity}x
                    </div>
                    <div className="md:col-span-2 text-body2 font-bold text-neutral-black tabular-nums text-left flex md:block items-center gap-2">
                       <span className="md:hidden text-tag font-bold text-neutral-400 uppercase">Subtotal:</span>
                       {(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações de Entrega */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-cards overflow-hidden">
               <h5 className="text-h5 font-bold text-neutral-black mb-6">Informações de Entrega</h5>
               
               <div className="flex flex-col gap-6">
                  {/* Endereço */}
                  <div className="flex items-start gap-4 pb-6 border-b border-neutral-50">
                    <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                      <i className="ph ph-bold ph-map-pin text-neutral-900 text-xl"></i>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest mb-1">Endereço Completo</span>
                      <p className="text-body2 font-bold text-neutral-black leading-tight">
                        {localOrder.address?.street}, {localOrder.address?.number} — {localOrder.address?.city} - {localOrder.address?.state}
                      </p>
                      <p className="text-body2 font-medium text-neutral-500">CEP: {localOrder.address?.zipCode}</p>
                    </div>
                  </div>

                  {/* Detalhes Adicionais */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                        <i className="ph ph-bold ph-truck text-neutral-900 text-xl"></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Opção de Entrega</span>
                        <p className="text-body2 font-bold text-neutral-black">{localOrder.deliveryEstimate || 'Não especificada'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                        <i className="ph ph-bold ph-clock text-neutral-900 text-xl"></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest mb-0.5">Preferência de Horário</span>
                        <p className="text-body2 font-bold text-neutral-black">{localOrder.timePreference || 'Sem preferência'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="flex items-start gap-4 pt-2">
                    <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-center flex-none">
                      <i className="ph ph-bold ph-note text-neutral-900 text-xl"></i>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest mb-1">Observações do Pedido</span>
                      <p className="text-body2 font-medium text-neutral-700 leading-relaxed italic bg-neutral-25 p-3 rounded-lg border border-neutral-100">
                        {localOrder.observations ? `"${localOrder.observations}"` : 'Nenhuma observação informada pelo cliente.'}
                      </p>
                    </div>
                  </div>
               </div>
            </div>
          </div>

          {/* Coluna Lateral: Resumo, Pagamento e Dados do Cliente */}
          <div className="flex flex-col gap-6 w-full">
            {/* Resumo Financeiro */}
            <div className="bg-white border border-neutral-200 rounded-xl shadow-cards p-6">
              <h3 className="text-h4 font-black text-neutral-black mb-4">{localOrder.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h3>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-body2 font-medium text-neutral-500"><span>Subtotal</span><span className="text-neutral-black font-bold">{localOrder.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
                <div className="flex justify-between items-center text-body2 font-medium text-neutral-500"><span>Taxa de Entrega</span><span className="text-primary-600 font-bold">{localOrder.shippingFee === 0 ? 'Grátis' : localOrder.shippingFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
              </div>
            </div>

            {/* Container: Pagamento */}
            <div className="bg-white border border-neutral-200 rounded-xl shadow-cards p-6">
              <div className="flex items-center justify-between mb-6">
                <h5 className="text-h5 font-bold text-neutral-black">Pagamento</h5>
                <Badge variant={getStatusVariant(localOrder.paymentStatus)}>{localOrder.paymentStatus}</Badge>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-tag font-bold text-neutral-400 uppercase">Método Escolhido</span>
                  <p className="text-body2 font-bold text-neutral-900">{localOrder.paymentMethod}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-tag font-bold text-neutral-400 uppercase">Comprovante de Pagamento</span>
                  <Button 
                    variant="secondary" 
                    className="!h-[36px] w-full" 
                    leftIcon="ph ph-eye" 
                    onClick={() => setIsReceiptViewModalOpen(true)} 
                    disabled={!localOrder.receiptUrl}
                  >
                    Ver comprovante
                  </Button>
                </div>
                <div className="flex flex-col gap-3 mt-4">
                  {localOrder.paymentStatus === 'PENDENTE' ? (
                    <Button variant="neutral" className="w-full !h-[36px]" onClick={() => setIsPaymentModalOpen(true)}>Marcar como Pago</Button>
                  ) : (
                    <>
                      <Button variant="secondary" className="w-full !h-[36px]" onClick={() => setIsCancelPaymentModalOpen(true)}>Cancelar Pagamento</Button>
                      <Button variant="danger" className="w-full !h-[36px]" onClick={() => setIsRefundModalOpen(true)}>Reembolsar</Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Container: Dados do Cliente (Abaixo do Pagamento) */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-cards overflow-hidden">
              <h5 className="text-h5 font-bold text-neutral-black mb-6">Dados do Cliente</h5>
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest">Nome Completo</span>
                  <p className="text-body2 font-bold text-neutral-black">{localOrder.customerName}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest">WhatsApp</span>
                  <a 
                    href={whatsappLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-body2 font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 transition-colors group"
                  >
                    {localOrder.customerPhone}
                    <i className="ph ph-arrow-square-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
                  </a>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest">E-mail</span>
                  <p className="text-body2 font-bold text-neutral-black">{localOrder.customerEmail || 'Não informado'}</p>
                </div>
              </div>
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

      <ViewReceiptModal 
        isOpen={isReceiptViewModalOpen} 
        onClose={() => setIsReceiptViewModalOpen(false)} 
        receiptUrl={localOrder.receiptUrl} 
        onEdit={(f) => showToast('Arquivo atualizado!')} 
        onDownload={() => {}} 
      />
    </div>
  );
};
