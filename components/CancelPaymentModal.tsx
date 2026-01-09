
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface CancelPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CancelPaymentModal: React.FC<CancelPaymentModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Cancelar Pagamento"
      footer={
        <div className="flex gap-4">
          <Button variant="secondary" className="flex-1 !h-[34px]" onClick={onClose}>Fechar</Button>
          <Button variant="danger" className="flex-1 !h-[34px]" onClick={onConfirm}>Confirmar Cancelamento</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-body2 text-neutral-700 leading-relaxed">
          Se você cancelar, o comprovante será removido e o status do pedido voltará para <span className="font-bold text-neutral-black">“Pendente”</span>.
        </p>
        
        <div className="flex flex-row items-start p-4 gap-3 bg-neutral-50 rounded-[12px] border border-neutral-100">
          <i className="ph ph-warning-circle ph-bold text-neutral-800 text-xl flex-none"></i>
          <p className="text-body2 font-medium text-neutral-700 leading-tight">
            Certifique-se de informar ao cliente sobre qualquer alteração no status do seu pedido.
          </p>
        </div>
      </div>
    </Modal>
  );
};
