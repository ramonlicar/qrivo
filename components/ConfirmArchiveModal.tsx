
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmArchiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ConfirmArchiveModal: React.FC<ConfirmArchiveModalProps> = ({ isOpen, onClose, onConfirm }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Confirmar Arquivamento"
            footer={
                <div className="flex gap-4">
                    <Button variant="secondary" className="flex-1 !h-[34px]" onClick={onClose}>Cancelar</Button>
                    <Button variant="danger" className="flex-1 !h-[34px]" onClick={onConfirm}>Confirmar Arquivamento</Button>
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                <p className="text-body2 text-neutral-700 leading-relaxed">
                    Ao confirmar, o status do pedido mudará para <span className="font-bold text-neutral-black">“Cancelado”</span> e ele será movido para o arquivo.
                </p>

                <div className="flex flex-row items-start p-4 gap-3 bg-neutral-50 rounded-[12px] border border-neutral-100">
                    <i className="ph ph-warning-circle ph-bold text-neutral-800 text-xl flex-none"></i>
                    <p className="text-body2 font-medium text-neutral-700 leading-tight">
                        Você poderá restaurar este pedido futuramente através da página de listagem, caso necessário.
                    </p>
                </div>
            </div>
        </Modal>
    );
};
