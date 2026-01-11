import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDeleteOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting?: boolean;
}

export const ConfirmDeleteOrderModal: React.FC<ConfirmDeleteOrderModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isDeleting = false
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Excluir Pedido"
            maxWidth="400px"
            footer={
                <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1 !h-[36px]" onClick={onClose} disabled={isDeleting}>Cancelar</Button>
                    <Button variant="danger" className="flex-1 !h-[36px] shadow-sm" onClick={onConfirm} isLoading={isDeleting}>
                        Confirmar Exclusão
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-col items-center justify-center py-2">
                    <div className="w-16 h-16 bg-system-error-50 rounded-full flex items-center justify-center text-system-error-500 mb-2 border border-system-error-100 shadow-sm">
                        <i className="ph ph-trash ph-bold text-3xl"></i>
                    </div>
                </div>
                <div className="flex flex-col gap-2 text-center">
                    <p className="text-body2 font-bold text-neutral-black">
                        Deseja excluir este pedido permanentemente?
                    </p>
                    <p className="text-small text-neutral-500 leading-relaxed">
                        Esta ação removerá o pedido da sua base de dados. O histórico financeiro será afetado e esta operação não poderá ser desfeita.
                    </p>
                </div>
            </div>
        </Modal>
    );
};
