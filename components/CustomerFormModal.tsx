
import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { Switch } from './Switch';
import { Customer } from '../types';
import { customersService } from '../lib/services';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Partial<Customer>) => void;
  customer?: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  customer
}) => {
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    avatar: '',
    isAiEnabled: true
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format phone for display (masking)
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `+${numbers}`;
    if (numbers.length <= 4) return `+${numbers.slice(0, 2)} (${numbers.slice(2)}`;
    if (numbers.length <= 9) return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4)}`;
    return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
  };

  useEffect(() => {
    if (customer) {
      setFormData({
        ...customer,
        phone: formatPhone(customer.phone), // Mask on load
        isAiEnabled: customer.isAiEnabled ?? true
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        isAiEnabled: true,
        avatar: ''
      });
    }
  }, [customer, isOpen]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limit to 13 digits (2 DDI + 2 DDD + 9 Num)
    const rawValue = e.target.value.replace(/\D/g, '').slice(0, 13);
    setFormData({ ...formData, phone: formatPhone(rawValue) });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const publicUrl = await customersService.uploadCustomerAvatar(file);
      setFormData(prev => ({ ...prev, avatar: publicUrl }));
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      alert('Erro ao fazer upload da foto. Tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone) {
      alert("Nome e WhatsApp são campos obrigatórios.");
      return;
    }
    onSave(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? "Editar Cliente" : "Novo Cliente"}
      maxWidth="480px"
      zIndex={200}
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 !h-[36px]" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            className="flex-1 !h-[36px] shadow-sm"
            onClick={handleSave}
            disabled={isUploading}
          >
            {isUploading ? "Enviando Foto..." : (customer ? "Salvar Alterações" : "Cadastrar Cliente")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Avatar Preview & Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full border-2 border-neutral-100 overflow-hidden shadow-small bg-neutral-50 flex items-center justify-center relative group">
            {formData.avatar ? (
              <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
            ) : (
              <i className="ph ph-user text-3xl text-neutral-300"></i>
            )}

            {/* Loading Overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <i className="ph ph-spinner animate-spin text-white text-xl"></i>
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={isUploading}
            className="text-tag font-bold text-primary-600 hover:text-primary-700 hover:underline uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Enviando...' : 'Alterar Foto'}
          </button>
        </div>

        <div className="flex flex-col gap-5">
          {/* Nome */}
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">Nome Completo</label>
            <TextInput
              placeholder="Ex: João Silva"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              leftIcon="ph-user"
            />
          </div>

          {/* WhatsApp */}
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">WhatsApp</label>
            <TextInput
              placeholder="+55 (11) 98888-7777"
              value={formData.phone}
              onChange={handlePhoneChange}
              leftIcon="ph-whatsapp-logo"
            />
            <span className="text-[10px] text-neutral-400 font-medium italic px-1">Inclua o DDI e DDD (Apenas números)</span>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">E-mail</label>
            <TextInput
              placeholder="Ex: joao@email.com"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              leftIcon="ph-envelope-simple"
            />
          </div>

          {/* AI Toggle */}
          <div className="flex items-center justify-between p-4 bg-neutral-25 rounded-xl border border-neutral-100 mt-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-body2 font-bold text-neutral-black">Atendimento Automático</span>
              <p className="text-[11px] text-neutral-500 font-medium leading-tight">
                Permitir que o Agente de IA responda este cliente.
              </p>
            </div>
            <Switch
              checked={!!formData.isAiEnabled}
              onChange={(val) => setFormData({ ...formData, isAiEnabled: val })}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};
