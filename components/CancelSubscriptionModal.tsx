
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CancelSubscriptionModal: React.FC<CancelSubscriptionModalProps> = ({ isOpen, onClose }) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const reasons = [
    { id: 'price', label: 'O preço está muito alto' },
    { id: 'difficulty', label: 'A plataforma é difícil de usar' },
    { id: 'features', label: 'Faltam recursos que eu preciso' },
    { id: 'competitor', label: 'Vou migrar para um concorrente' },
    { id: 'sales', label: 'Não estou vendendo o suficiente' },
    { id: 'other', label: 'Outro motivo' },
  ];

  const handleConfirm = () => {
    // Simulação de cancelamento
    alert(`Assinatura cancelada. Motivo: ${selectedReason}`);
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Cancelar Assinatura"
      maxWidth="480px"
      className="!rounded-[24px]"
      footer={
        <div className="flex flex-col gap-3">
          <Button 
            variant="primary" 
            className="w-full !h-[36px] !rounded-lg !bg-secondary-700 !border-secondary-900" 
            onClick={onClose}
          >
            Manter Assinatura
          </Button>
          <Button 
            variant="ghost" 
            className="w-full !h-[36px] !rounded-lg !text-system-error-500 hover:!bg-red-50 !border-none" 
            onClick={handleConfirm}
            disabled={!selectedReason}
          >
            Confirmar Cancelamento
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-body1 font-medium text-neutral-800 leading-relaxed">
            Sentimos muito em ver você partir. Antes de confirmar, poderia nos contar o motivo do cancelamento?
          </p>
          <p className="text-body2 text-neutral-500">
            Seu feedback é muito importante para nós e nos ajuda a melhorar a plataforma.
          </p>
        </div>

        {/* Choices List */}
        <div className="flex flex-col gap-2">
          {reasons.map((reason) => (
            <label 
              key={reason.id}
              className={`
                flex items-center p-3.5 rounded-xl border transition-all cursor-pointer group
                ${selectedReason === reason.id 
                  ? 'border-primary-500 bg-primary-50/30' 
                  : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-25'}
              `}
              onClick={() => setSelectedReason(reason.id)}
            >
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all mr-3 flex-none
                ${selectedReason === reason.id 
                  ? 'border-primary-500 bg-primary-500' 
                  : 'border-neutral-300 group-hover:border-neutral-400'}
              `}>
                {selectedReason === reason.id && (
                  <div className="w-2 h-2 rounded-full bg-white shadow-sm"></div>
                )}
              </div>
              <span className={`text-body2 font-semibold ${selectedReason === reason.id ? 'text-primary-700' : 'text-neutral-700'}`}>
                {reason.label}
              </span>
            </label>
          ))}
        </div>

        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start gap-3">
          <i className="ph ph-warning-circle ph-bold text-system-warning-500 text-xl mt-0.5"></i>
          <p className="text-small text-neutral-600 leading-normal">
            Ao cancelar, sua conta voltará para o plano gratuito ao final do ciclo de faturamento atual e você perderá acesso aos recursos premium.
          </p>
        </div>
      </div>
    </Modal>
  );
};
