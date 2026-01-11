
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmRestoreModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ConfirmRestoreModal: React.FC<ConfirmRestoreModalProps> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirmar Restauração"
            footer={
                <div className="flex gap-4">
                    <Button variant="secondary" className="flex-1 !h-[34px]" onClick={onClose}>Cancelar</Button>
                    <Button variant="primary" className="flex-1 !h-[34px]" onClick={onConfirm}>Restaurar Pedido</Button>
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                <p className="text-body2 text-neutral-700 leading-relaxed">
                    Ao confirmar, o status do pedido voltará para <span className="font-bold text-neutral-black">“Novo”</span> e o status de pagamento para <span className="font-bold text-neutral-black">“Pendente”</span>.
                </p>

                <div className="flex flex-row items-start p-4 gap-3 bg-neutral-50 rounded-[12px] border border-neutral-100">
                    <i className="ph ph-info ph-bold text-neutral-800 text-xl flex-none"></i>
                    <p className="text-body2 font-medium text-neutral-700 leading-tight">
                        Use esta ação caso o pedido precise ser processado novamente ou se foi arquivado por engano.
                    </p>
                </div>
            </div>
        </Modal>
    );
};
