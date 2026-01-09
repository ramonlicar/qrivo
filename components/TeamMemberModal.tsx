
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
    first_name: '',
    last_name: '',
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
      setFormData({
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        role: (member.role === 'admin' ? 'admin' : 'member') as any
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        role: 'member'
      });
    }
  }, [member, isOpen]);

  const handleSave = async () => {
    if (!formData.email || (!member && !formData.first_name)) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    setIsLoading(true);
    try {
      const companyId = await getUserCompanyId();
      if (!companyId) return;

      if (member) {
        await teamService.updateMemberRole(member.id, companyId, formData.role);
      } else {
        const { error } = await teamService.inviteMember(formData.email, formData.role, companyId);
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
      title={member ? "Editar Membro" : "Convidar novo colaborador"}
      maxWidth="480px"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 !h-[40px] font-bold" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1 !h-[40px] font-bold shadow-sm" onClick={handleSave} isLoading={isLoading}>
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
          {!member && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-tag font-bold text-neutral-700 px-1">Nome</label>
                <TextInput
                  placeholder="Ex: Ana"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  containerClassName="!h-[36px] !bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-tag font-bold text-neutral-700 px-1">Sobrenome</label>
                <TextInput
                  placeholder="Ex: Costa"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  containerClassName="!h-[36px] !bg-white"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-tag font-bold text-neutral-700 px-1">E-mail de acesso</label>
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
            <label className="text-tag font-bold text-neutral-700 px-1">Nível de acesso</label>
            <Dropdown
              label="Cargo"
              value={formData.role}
              onChange={(val) => setFormData({ ...formData, role: val })}
              options={roleOptions}
              className="!h-[36px]"
            />
          </div>
        </div>

        {!member && (
          <div className="p-4 bg-primary-50 rounded-xl border border-primary-100 flex items-start gap-3">
            <i className="ph ph-info ph-bold text-primary-600 mt-0.5"></i>
            <p className="text-[11px] text-primary-900 font-medium leading-tight italic">
              O novo colaborador receberá um link seguro para definir sua senha e acessar o painel da empresa.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};
