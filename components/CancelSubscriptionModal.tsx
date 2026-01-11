
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
      title={<span className="text-body1 font-bold text-neutral-black">Cancelar Assinatura</span>}
      maxWidth="480px"
      className="!rounded-[16px]"
      footer={
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            className="w-full !h-[40px] !rounded-lg"
            onClick={onClose}
          >
            Manter Assinatura
          </Button>
          <Button
            variant="danger-light"
            className="w-full !h-[40px] !rounded-lg"
            onClick={handleConfirm}
            disabled={!selectedReason}
          >
            Confirmar Cancelamento
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <p className="text-body2 font-medium text-neutral-900 leading-relaxed">
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
                flex items-center p-3 rounded-lg border transition-all cursor-pointer group
                ${selectedReason === reason.id
                  ? 'border-primary-500 bg-primary-50/50'
                  : 'border-neutral-100 hover:border-neutral-200 hover:bg-neutral-25'}
              `}
              onClick={() => setSelectedReason(reason.id)}
            >
              <div className={`
                w-4 h-4 rounded-full border flex items-center justify-center transition-all mr-3 flex-none
                ${selectedReason === reason.id
                  ? 'border-primary-500'
                  : 'border-neutral-300 group-hover:border-neutral-400'}
              `}>
                {selectedReason === reason.id && (
                  <div className="w-2 h-2 rounded-full bg-primary-500 shadow-sm"></div>
                )}
              </div>
              <span className={`text-body2 font-medium ${selectedReason === reason.id ? 'text-neutral-900' : 'text-neutral-700'}`}>
                {reason.label}
              </span>
            </label>
          ))}
        </div>

        <div className="p-4 bg-neutral-25 rounded-lg border border-neutral-100 flex items-start gap-3">
          <i className="ph ph-warning-circle ph-bold text-system-warning-500 text-lg mt-0.5"></i>
          <p className="text-body2 text-neutral-600 leading-normal">
            Ao cancelar, sua conta voltará para o plano gratuito ao final do ciclo de faturamento atual e você perderá acesso aos recursos premium.
          </p>
        </div>
      </div>
    </Modal>
  );
};
