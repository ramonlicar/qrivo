import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { Funnel } from '../lib/funnelsService';

interface FunnelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, description?: string) => Promise<void>;
    editingFunnel?: Funnel | null;
}

export const FunnelModal: React.FC<FunnelModalProps> = ({ isOpen, onClose, onSave, editingFunnel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (editingFunnel) {
            setName(editingFunnel.name);
            setDescription(editingFunnel.description || '');
        } else {
            setName('');
            setDescription('');
        }
    }, [editingFunnel, isOpen]);

    const handleSave = async () => {
        if (!name.trim()) {
            alert('O nome do funil é obrigatório.');
            return;
        }

        try {
            setIsLoading(true);
            await onSave(name, description);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar funil.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingFunnel ? 'Editar Funil' : 'Novo Funil de Vendas'}
            maxWidth="400px"
            footer={
                <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button variant="primary" className="flex-1" onClick={handleSave} disabled={isLoading}>
                        {isLoading ? <i className="ph ph-spinner animate-spin"></i> : editingFunnel ? 'Salvar' : 'Criar Funil'}
                    </Button>
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-body2 font-bold text-neutral-black">Nome do Funil</label>
                    <TextInput
                        placeholder="Ex: Vendas Q1, Prospecção B2B..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-body2 font-bold text-neutral-black">Descrição (Opcional)</label>
                    <TextInput
                        placeholder="Breve descrição do objetivo deste funil"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
};
