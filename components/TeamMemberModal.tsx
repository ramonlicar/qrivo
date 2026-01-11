
import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { Dropdown } from './Dropdown';
import { TeamMember } from '../types';
import { teamService } from '../lib/services';
import { getUserCompanyId } from '../lib/supabase';

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onSave: () => void;
  companyId?: string;
  currentUserRole?: 'owner' | 'admin' | 'manager' | 'agent';
}

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({ isOpen, onClose, member, onSave, currentUserRole }) => {
  const [formData, setFormData] = useState({
    firstName: 'Novo',
    lastName: 'Membro',
    email: '',
    role: 'member' as 'admin' | 'member'
  });
  const [isLoading, setIsLoading] = useState(false);

  // Filter options based on hierarchy
  const roleOptions = useMemo(() => {
    const allOptions = [
      { label: 'Administrador', value: 'admin', color: 'bg-primary-500' },
      { label: 'Membro', value: 'member', color: 'bg-neutral-500' }
    ];

    if (currentUserRole === 'owner') return allOptions;

    // If admin, they can manage members
    if (currentUserRole === 'admin') {
      return allOptions.filter(opt => opt.value !== 'admin');
    }

    // Fallback: If for some reason role is unknown but modal is open, show standard options
    return allOptions.filter(opt => opt.value !== 'admin');
  }, [currentUserRole]);

  useEffect(() => {
    if (member) {
      // Split full name if available
      const names = (member.full_name || '').split(' ');
      const first = names[0] || '';
      const last = names.slice(1).join(' ') || '';

      setFormData({
        firstName: first,
        lastName: last,
        email: member.email,
        role: (member.role === 'admin' ? 'admin' : 'member') as any
      });
    } else {
      setFormData({
        firstName: 'Novo',
        lastName: 'Membro',
        email: '',
        role: 'member'
      });
    }
  }, [member, isOpen]);

  const handleSave = async () => {
    if (!formData.email) {
      alert("Preencha o e-mail");
      return;
    }

    setIsLoading(true);
    try {
      const companyId = await getUserCompanyId();
      if (!companyId) return;

      if (member) {
        await teamService.updateMemberRole(member.id, companyId, formData.role);
        // Note: Update name logic for existing members would be separate or added to updateMemberRole if desired
      } else {
        const { error } = await teamService.inviteMember(
          formData.email,
          formData.role,
          companyId,
          formData.firstName,
          formData.lastName
        );
        if (error) throw error;
      }
      onSave();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        member
          ? <span className="text-body1 font-bold text-neutral-900">Editar Membro</span>
          : <span className="text-body1 font-bold text-neutral-900">Convidar novo colaborador</span>
      }
      maxWidth="480px"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 !h-[36px] font-bold" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1 !h-[36px] font-bold shadow-sm" onClick={handleSave} isLoading={isLoading}>
            {member ? "Salvar Alterações" : "Enviar Convite"}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-body2 text-neutral-500 leading-relaxed">
            {member
              ? "Ajuste o nível de acesso e as permissões deste membro na plataforma."
              : "Informe os dados do novo membro. Enviaremos um convite para o e-mail informado."}
          </p>
        </div>

        <div className="flex flex-col gap-5">

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-neutral-900">Nome</label>
              <TextInput
                placeholder="Nome"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                containerClassName="!h-[36px] bg-white"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-neutral-900">Sobrenome</label>
              <TextInput
                placeholder="Sobrenome"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                containerClassName="!h-[36px] bg-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-neutral-900">E-mail de acesso</label>
            <TextInput
              placeholder="exemplo@empresa.com"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!member}
              containerClassName={`!h-[36px] ${member ? "!bg-neutral-50" : "!bg-white"}`}
              leftIcon="ph-envelope-simple"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-neutral-900">Nível de acesso</label>
            <Dropdown
              label="Cargo"
              value={formData.role}
              onChange={(val) => setFormData({ ...formData, role: val })}
              options={roleOptions}
              className="!h-[36px]"
            />
          </div>
        </div>


      </div>
    </Modal>
  );
};
