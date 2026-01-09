
import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { Badge } from './Badge';
import { Dropdown } from './Dropdown';
import { IconButton } from './IconButton';
import { Modal } from './Modal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { CancelSubscriptionModal } from './CancelSubscriptionModal';
import { TeamMemberModal } from './TeamMemberModal';
import { PlansTab } from './PlansTab';
import { TeamMember } from '../types';
import { teamService, userService, companiesService } from '../lib/services';
import { getUserCompanyId, supabase } from '../lib/supabase';
import { formatWhatsApp, cleanWhatsApp } from '../lib/utils';

type SettingsTab = 'perfil' | 'empresa' | 'equipe' | 'senha' | 'planos' | 'logout';

const ROLE_MAP: Record<string, { label: string, variant: 'success' | 'warning' | 'neutral' | 'error' }> = {
  owner: { label: 'Dono', variant: 'success' },
  admin: { label: 'Administrador', variant: 'success' },
  member: { label: 'Membro', variant: 'neutral' },
  // Compatibility for older records
  manager: { label: 'Gerente', variant: 'warning' },
  agent: { label: 'Vendedor', variant: 'neutral' },
};

interface AccountSettingsProps {
  initialTab?: SettingsTab;
  onLogout?: () => void;
  onProfileUpdate?: () => void;
  userSession?: any;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ initialTab, onLogout, onProfileUpdate, userSession }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || 'perfil');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isDeleteMemberModalOpen, setIsDeleteMemberModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' as 'success' | 'error' });
  const [debugError, setDebugError] = useState<{ message: string; details?: string; hint?: string; code?: string } | null>(null);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [teamSearch, setTeamSearch] = useState('');

  const [profileData, setProfileData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    avatar_url: '',
    whatsapp: ''
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [empresaData, setEmpresaData] = useState({
    id: '',
    nome: '',
    slug: '',
    business_area: '',
    business_description: '',
    owner_user_id: '',
  });

  const [passwordData, setPasswordData] = useState({
    atual: '',
    nova: '',
    confirmar: ''
  });

  // Carregar dados iniciais puxando corretamente da tabela de auth e perfis
  useEffect(() => {
    const loadData = async () => {
      if (!userSession?.user?.id) return;
      setIsLoading(true);
      try {
        const [profileRes, companyRes] = await Promise.all([
          userService.getMyProfile(userSession.user.id),
          companiesService.getMyCompany(userSession.user.id)
        ]);

        // Prioriza dados da tabela profiles, mas usa auth.users (user_metadata) como fallback
        if (profileRes.data) {
          const names = profileRes.data.full_name?.split(' ') || ['', ''];
          setProfileData({
            nome: names[0] || '',
            sobrenome: names.slice(1).join(' ') || '',
            email: profileRes.data.email || userSession.user.email || '',
            avatar_url: profileRes.data.avatar_url || userSession.user.user_metadata?.avatar_url || '',
            whatsapp: formatWhatsApp(profileRes.data.whatsapp || userSession.user.user_metadata?.whatsapp || '')
          });
        } else if (userSession.user) {
          const names = userSession.user.user_metadata?.full_name?.split(' ') || ['', ''];
          setProfileData({
            nome: names[0] || '',
            sobrenome: names.slice(1).join(' ') || '',
            email: userSession.user.email || '',
            avatar_url: userSession.user.user_metadata?.avatar_url || '',
            whatsapp: formatWhatsApp(userSession.user.user_metadata?.whatsapp || '')
          });
        }

        if (companyRes.data) {
          const companyObj = Array.isArray(companyRes.data) ? companyRes.data[0] : companyRes.data;
          if (!companyObj) return;

          // Normalização de dados legados (Códigos -> Labels)
          let normalizedArea = companyObj.business_area || '';

          const legacyMap: Record<string, string> = {
            'varejo': 'E-commerce / Varejo',
            'servicos': 'Serviços Especializados',
            'infoprodutos': 'Infoprodutos',
            'alimentacao': 'Alimentação',
            'imobiliario': 'Imobiliário'
          };

          if (legacyMap[normalizedArea]) {
            normalizedArea = legacyMap[normalizedArea];
          }

          setEmpresaData({
            id: companyObj.id,
            nome: companyObj.name,
            slug: companyObj.slug,
            business_area: normalizedArea,
            business_description: companyObj.business_description,
            owner_user_id: companyObj.owner_user_id,
          });
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userSession]);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
    if (activeTab === 'equipe' && empresaData.id) loadTeam();
  }, [initialTab, activeTab, empresaData.id]);

  const loadTeam = async () => {
    if (!empresaData.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await teamService.getTeamMembers(empresaData.id);
      if (error) throw error;
      console.log("Processed Team Data:", data);
      setTeamMembers(data as any);
    } catch (err: any) {
      console.error(err);
      setDebugError({
        message: err.message || 'Erro desconhecido',
        details: err.details || '',
        hint: err.hint || '',
        code: err.code || ''
      });
      showToast('Erro ao carregar equipe', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userSession?.user?.id) return;

    // Validação de tipo
    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione uma imagem válida.', 'error');
      return;
    }

    // Validação de tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('A imagem deve ter no máximo 5MB.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const publicUrl = await userService.uploadAvatar(userSession.user.id, file);
      setProfileData(prev => ({ ...prev, avatar_url: publicUrl }));
      showToast('Avatar atualizado com sucesso!');
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      console.error('Erro ao subir avatar:', err);
      showToast(err.message || 'Erro ao atualizar avatar', 'error');
    } finally {
      setIsSaving(true); // Manter o overlay por um momento
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!userSession?.user?.id) return;
    setIsSaving(true);
    try {
      await userService.removeAvatar(userSession.user.id);
      setProfileData(prev => ({ ...prev, avatar_url: '' }));
      showToast('Avatar removido com sucesso!');
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      console.error('Erro ao remover avatar:', err);
      showToast(err.message || 'Erro ao remover avatar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!userSession?.user?.id) return;
    setIsSaving(true);
    try {
      const fullName = `${profileData.nome} ${profileData.sobrenome}`.trim();
      const whatsappClean = cleanWhatsApp(profileData.whatsapp);

      const { error } = await userService.updateProfile(userSession.user.id, {
        full_name: fullName,
        whatsapp: whatsappClean, // Salva apenas números
        email: userSession.user.email,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;

      // Atualiza metadados do Auth também para manter sincronizado
      await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          whatsapp: whatsappClean // Salva apenas números
        }
      });

      showToast('Perfil atualizado com sucesso!');
      if (onProfileUpdate) onProfileUpdate();
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      showToast(err.message || 'Erro ao atualizar perfil', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveCompany = async () => {
    if (!empresaData.id) return;
    setIsSaving(true);
    try {
      const { error } = await companiesService.updateCompany(empresaData.id, {
        name: empresaData.nome,
        slug: empresaData.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        business_area: empresaData.business_area,
        business_description: empresaData.business_description,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      showToast('Dados da empresa atualizados!');
    } catch (err) {
      showToast('Erro ao atualizar empresa', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwordData.atual) {
      showToast('Informe sua senha atual', 'error');
      return;
    }
    if (!passwordData.nova || !passwordData.confirmar) {
      showToast('Preencha os campos de nova senha', 'error');
      return;
    }
    if (passwordData.nova !== passwordData.confirmar) {
      showToast('As senhas não coincidem', 'error');
      return;
    }
    if (passwordData.nova.length < 6) {
      showToast('A nova senha deve ter pelo menos 6 caracteres', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Re-autenticar para segurança
      const { error: reauthError } = await supabase.auth.reauthenticate({
        password: passwordData.atual
      });

      if (reauthError) {
        if (reauthError.status === 401 || reauthError.message.includes('Invalid login credentials')) {
          throw new Error('Senha atual incorreta');
        }
        throw reauthError;
      }

      // 2. Atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.nova
      });

      if (updateError) throw updateError;

      // 3. Invalidar outras sessões (segurança extra)
      await supabase.auth.signOut({ scope: 'others' } as any);

      showToast('Senha atualizada com sucesso!');
      setPasswordData({ atual: '', nova: '', confirmar: '' });
    } catch (err: any) {
      console.error('Password Update Error:', err);
      showToast(err.message || 'Erro ao atualizar senha', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToDelete || !empresaData.id) return;
    setIsSaving(true);
    try {
      const { error } = await teamService.removeMember(memberToDelete.id, empresaData.id);
      if (error) throw error;
      showToast('Membro removido da equipe');
      loadTeam();
    } catch (err) {
      showToast('Erro ao remover membro', 'error');
    } finally {
      setIsSaving(false);
      setIsDeleteMemberModalOpen(false);
      setMemberToDelete(null);
    }
  };

  const filteredTeam = useMemo(() => {
    return teamMembers.filter(m =>
      (m.full_name || '').toLowerCase().includes(teamSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(teamSearch.toLowerCase())
    );
  }, [teamMembers, teamSearch]);

  const myMembership = useMemo(() => {
    return teamMembers.find(m => m.user_id === userSession?.user?.id);
  }, [teamMembers, userSession?.user?.id]);

  const isCompanyOwner = userSession?.user?.id === empresaData.owner_user_id;
  const effectiveRole = useMemo(() => {
    if (isCompanyOwner) return 'owner';
    return myMembership?.role;
  }, [isCompanyOwner, myMembership?.role]);

  const canManageTeam = isCompanyOwner || myMembership?.role === 'owner' || myMembership?.role === 'admin';

  const menuItems = [
    { id: 'perfil' as SettingsTab, label: 'Minha Conta', icon: 'ph-user' },
    { id: 'empresa' as SettingsTab, label: 'Empresa', icon: 'ph-buildings' },
    { id: 'equipe' as SettingsTab, label: 'Equipe', icon: 'ph-users-three' },
    { id: 'senha' as SettingsTab, label: 'Alterar Senha', icon: 'ph-lock' },
    { id: 'planos' as SettingsTab, label: 'Planos e Consumo', icon: 'ph-stack' },
    { id: 'logout' as SettingsTab, label: 'Sair do Painel', icon: 'ph-sign-out' },
  ];



  if (isLoading && activeTab !== 'equipe') {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-4">
        <i className="ph ph-circle-notch animate-spin text-3xl text-primary-500"></i>
        <span className="text-tag font-bold text-neutral-400 uppercase">Carregando configurações...</span>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'perfil':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px]">
              <h5 className="text-h5 font-bold text-[#09090B]">Informações Pessoais</h5>
              <div className="box-border flex flex-col items-start p-6 gap-8 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-small rounded-[16px]">
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full">
                  <div className="relative w-[100px] h-[100px] rounded-2xl overflow-hidden border-2 border-white shadow-small flex-none">
                    <img src={profileData.avatar_url || `https://ui-avatars.com/api/?name=${profileData.nome}+${profileData.sobrenome}&background=09B86D&color=fff&size=128`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                      />
                      <Button
                        variant="secondary"
                        className="!h-[32px] !text-tag font-bold"
                        onClick={() => fileInputRef.current?.click()}
                        isLoading={isSaving && profileData.avatar_url === ''}
                      >
                        Alterar Foto
                      </Button>
                      {profileData.avatar_url && (
                        <Button
                          variant="ghost"
                          className="!h-[32px] !text-tag font-bold text-system-error-500"
                          onClick={handleRemoveAvatar}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 font-medium italic">Recomendado: 400x400px. PNG ou JPG.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col gap-2">
                    <label className="text-body2 font-bold text-neutral-black">Nome</label>
                    <TextInput value={profileData.nome} onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })} containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-body2 font-bold text-neutral-black">Sobrenome</label>
                    <TextInput value={profileData.sobrenome} onChange={(e) => setProfileData({ ...profileData, sobrenome: e.target.value })} containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-body2 font-bold text-neutral-black">E-mail de Acesso</label>
                    <TextInput value={profileData.email} disabled containerClassName="!h-[34px] !bg-neutral-100 !border-[#DDDDD5]" className="!text-neutral-400" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-body2 font-bold text-neutral-black">WhatsApp</label>
                    <TextInput
                      value={profileData.whatsapp}
                      onChange={(e) => setProfileData({ ...profileData, whatsapp: formatWhatsApp(e.target.value) })}
                      containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                      placeholder="(DD) 99999-9999"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="primary" className="px-10 !h-[36px] font-bold" onClick={handleSaveProfile} isLoading={isSaving}>Salvar Alterações</Button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'empresa':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px]">
              <h5 className="text-h5 font-bold text-[#09090B]">Dados do Negócio</h5>
              <div className="box-border flex flex-col items-start p-6 gap-8 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-small rounded-[16px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-body2 font-bold text-neutral-black">Nome da Empresa</label>
                    <TextInput value={empresaData.nome} onChange={(e) => setEmpresaData({ ...empresaData, nome: e.target.value })} containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]" />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-body2 font-bold text-neutral-black">Área de Atuação</label>
                    <Dropdown
                      label="Selecione"
                      value={empresaData.business_area}
                      onChange={(v) => setEmpresaData({ ...empresaData, business_area: v })}
                      options={[
                        { label: 'E-commerce / Varejo', value: 'E-commerce / Varejo' },
                        { label: 'Serviços Especializados', value: 'Serviços Especializados' },
                        { label: 'Infoprodutos', value: 'Infoprodutos' },
                        { label: 'Alimentação', value: 'Alimentação' },
                        { label: 'Imobiliário', value: 'Imobiliário' }
                      ]}
                      className="!h-[34px]"
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-body2 font-bold text-neutral-black">Descrição</label>
                    <TextArea
                      value={empresaData.business_description}
                      onChange={(e) => setEmpresaData({ ...empresaData, business_description: e.target.value })}
                      containerClassName="!bg-white !border-[#DDDDD5] min-h-[100px]"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="primary" className="px-10 !h-[36px] font-bold" onClick={handleSaveCompany} isLoading={isSaving}>Salvar Empresa</Button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'equipe':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px]">
              <div className="flex flex-row justify-between items-center w-full">
                <h5 className="text-h5 font-bold text-[#09090B]">Gestão da Equipe</h5>
                {canManageTeam && (
                  <Button variant="primary" leftIcon="ph ph-plus" className="!h-[34px] px-6 font-bold shadow-sm" onClick={() => { setMemberToEdit(null); setIsTeamModalOpen(true); }}>Convidar Membro</Button>
                )}
              </div>

              <div className="box-border flex flex-col p-0 w-full bg-white border border-[#DDDDD5] shadow-small rounded-[16px] overflow-hidden">
                <div className="p-4 border-b border-neutral-100 bg-[#F8F6F6]">
                  <TextInput
                    placeholder="Pesquisar por nome ou e-mail..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    leftIcon="ph ph-magnifying-glass"
                    containerClassName="!h-[34px] !bg-white"
                  />
                </div>

                <div className="flex flex-col divide-y divide-neutral-100 min-h-[300px]">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center flex-1 py-20 gap-4">
                      <div className="w-8 h-8 border-4 border-primary-100 border-t-primary-500 rounded-full animate-spin"></div>
                      <span className="text-tag font-bold text-neutral-400 uppercase tracking-widest">Carregando membros...</span>
                    </div>
                  ) : debugError ? (
                    <div className="flex flex-col items-start p-6 m-4 bg-red-50 border border-red-100 rounded-xl gap-3">
                      <div className="flex items-center gap-2 text-system-error-600 font-bold">
                        <i className="ph ph-warning-circle text-xl"></i>
                        <span>Erro Detalhado no Carregamento:</span>
                      </div>
                      <div className="flex flex-col gap-1 text-small font-mono text-red-800 break-all">
                        <p><strong>Mensagem:</strong> {debugError.message}</p>
                        {debugError.code && <p><strong>Código:</strong> {debugError.code}</p>}
                        {debugError.details && <p><strong>Detalhes:</strong> {debugError.details}</p>}
                        {debugError.hint && <p><strong>Dica:</strong> {debugError.hint}</p>}
                      </div>
                      <div className="flex flex-col gap-1 text-small italic text-neutral-500 mt-2">
                        <p>Empresa ID: <span className="font-mono">{empresaData.id || 'Nenhuma'}</span></p>
                        <p>Usuário ID: <span className="font-mono">{userSession?.user?.id || 'Nenhum'}</span></p>
                      </div>
                      <Button variant="secondary" className="!h-[32px] mt-2" onClick={() => { setDebugError(null); loadTeam(); }}>Tentar Novamente</Button>
                    </div>
                  ) : filteredTeam.length > 0 ? (
                    filteredTeam.map((member) => (
                      <div key={member.id} className="flex flex-row items-center justify-between p-4 bg-white hover:bg-neutral-25 transition-all group">
                        <div className="flex items-center gap-4 flex-1 overflow-hidden">
                          <div className="w-10 h-10 rounded-full bg-neutral-100 border border-neutral-200 overflow-hidden flex-none shadow-small">
                            <img
                              src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.full_name}&background=09B86D&color=fff&size=128`}
                              className="w-full h-full object-cover"
                              alt={member.full_name}
                            />
                          </div>
                          <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="text-body2 font-bold text-neutral-900 truncate">{member.full_name}</span>
                            <span className="text-small text-neutral-500 truncate">{member.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={ROLE_MAP[member.role]?.variant || 'neutral'}>
                            {ROLE_MAP[member.role]?.label || member.role}
                          </Badge>

                          {/* RBAC Action Logic */}
                          {canManageTeam && (
                            <>
                              {/* Can only edit if NOT self (owner/admin) and hierarchical rules apply */}
                              {(myMembership?.user_id !== member.user_id) && (
                                (myMembership?.role === 'owner' && member.role !== 'owner') ||
                                (myMembership?.role === 'admin' && member.role !== 'owner' && member.role !== 'admin')
                              ) && (
                                  <>
                                    <IconButton
                                      variant="edit"
                                      icon="ph-pencil-simple"
                                      onClick={() => { setMemberToEdit(member); setIsTeamModalOpen(true); }}
                                      title="Editar"
                                    />
                                    <IconButton
                                      variant="delete"
                                      icon="ph-trash"
                                      onClick={() => { setMemberToDelete(member); setIsDeleteMemberModalOpen(true); }}
                                      title="Remover"
                                    />
                                  </>
                                )}
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
                        <i className="ph ph-users-three text-3xl text-neutral-200"></i>
                      </div>
                      <div className="flex flex-col gap-1 text-center">
                        <h4 className="text-body2 font-bold text-neutral-900">Nenhum membro encontrado</h4>
                        <p className="text-small text-neutral-500">
                          {teamSearch ? "Nenhum membro corresponde à sua pesquisa." : "Sua equipe ainda está vazia."}
                        </p>
                      </div>

                      {canManageTeam && !teamSearch && (
                        <Button
                          variant="primary"
                          leftIcon="ph ph-plus"
                          className="!h-[36px] px-8 font-bold mt-4"
                          onClick={() => { setMemberToEdit(null); setIsTeamModalOpen(true); }}
                        >
                          Convidar Primeiro Membro
                        </Button>
                      )}

                      {/* Diagnostic Section */}
                      <div className="mt-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200 text-[10px] font-mono text-neutral-400 w-full max-w-[400px]">
                        <p className="font-bold border-b border-neutral-200 mb-2 pb-1 uppercase">DIAGNÓSTICO</p>
                        <p>User ID: {userSession?.user?.id}</p>
                        <p>Company ID: {empresaData.id}</p>
                        <p>Raw Count: {teamMembers.length}</p>
                        <p>Search Query: "{teamSearch}"</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'senha':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px]">
              <h5 className="text-h5 font-bold text-[#09090B]">Alterar Senha</h5>
              <div className="box-border flex flex-col items-start p-6 gap-6 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-small rounded-[16px]">
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-body2 font-bold text-neutral-black">Senha Atual</label>
                  <TextInput
                    type="password"
                    value={passwordData.atual}
                    onChange={(e) => setPasswordData({ ...passwordData, atual: e.target.value })}
                    containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                  />
                  <div className="flex justify-start">
                    <Button
                      variant="tertiary"
                      className="!p-0 !h-auto text-[11px] font-bold text-neutral-400 hover:text-primary-600 transition-colors"
                      onClick={() => setIsForgotModalOpen(true)}
                    >
                      Esqueci a senha?
                    </Button>
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-body2 font-bold text-neutral-black">Nova Senha</label>
                  <TextInput
                    type="password"
                    value={passwordData.nova}
                    onChange={(e) => setPasswordData({ ...passwordData, nova: e.target.value })}
                    containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                  />
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-body2 font-bold text-neutral-black">Confirmar Nova Senha</label>
                  <TextInput
                    type="password"
                    value={passwordData.confirmar}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmar: e.target.value })}
                    containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                  />
                </div>
                <div className="pt-2">
                  <Button variant="primary" className="px-10 !h-[36px] font-bold" onClick={handleUpdatePassword} isLoading={isSaving}>Alterar Senha</Button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'planos':
        return <PlansTab onCancelClick={() => setIsCancelModalOpen(true)} />;
      case 'logout':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px]">
              <h5 className="text-h5 font-bold text-[#09090B]">Sair do Painel</h5>
              <div className="box-border flex flex-col items-start p-6 gap-6 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-small rounded-[16px]">
                <p className="text-body2 text-neutral-600 mb-4">Tem certeza que deseja sair do painel?</p>
                <Button variant="danger" className="px-10 !h-[36px] font-bold" onClick={onLogout}>Sair</Button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in duration-500 overflow-hidden relative">
      {toast.show && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 ${toast.variant === 'success' ? 'bg-primary-100 border border-primary-500' : 'bg-system-error-100 border border-system-error-500'
          }`}>
          <i className={`ph ${toast.variant === 'success' ? 'ph-check-circle ph-fill text-primary-600' : 'ph-x-circle ph-fill text-system-error-600'} text-xl`}></i>
          <span className={`text-body1 font-bold ${toast.variant === 'success' ? 'text-primary-900' : 'text-system-error-900'}`}>{toast.message}</span>
        </div>
      )}

      {/* Header Global - Padronizado */}
      <header className="flex flex-col w-full bg-white flex-none border-b border-neutral-200">
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[12px] lg:gap-[16px] w-full min-h-[64px] lg:min-h-[72px]">
          <div className="flex flex-col items-start p-0 gap-[1px] flex-1 overflow-hidden">
            <h1 className="text-h4 font-bold text-neutral-black tracking-tight m-0 truncate w-full">
              Configurações
            </h1>
            <p className="hidden sm:block text-body2 font-normal text-neutral-500 m-0 truncate w-full">
              Gerencie seu perfil, equipe e preferências do sistema.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-white">
        {/* Sidebar Interno */}
        <div className="w-full lg:w-[240px] p-4 lg:p-8 bg-white border-b lg:border-b-0 lg:border-r border-neutral-100 flex-none flex flex-col items-center">
          <nav className="flex flex-col gap-1 w-full max-w-[240px] bg-neutral-50 p-1.5 rounded-2xl border border-neutral-100">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    flex items-center gap-3 px-4 h-[36px] rounded-xl transition-all whitespace-nowrap w-full group
                    ${isActive
                      ? 'bg-secondary-700 text-white shadow-small'
                      : 'text-neutral-black hover:bg-neutral-100'}
                  `}
                >
                  <i className={`ph ${isActive ? 'ph-fill' : 'ph-bold'} ${item.icon} text-lg transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-neutral-700'}`}></i>
                  <span className={`text-body2 truncate ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 overflow-hidden bg-white overflow-y-auto custom-scrollbar p-6 lg:p-10">
          <div className="max-w-[880px] mx-auto w-full">
            {renderTabContent()}
          </div>
        </div>
      </div>

      <TeamMemberModal
        isOpen={isTeamModalOpen}
        onClose={() => { setIsTeamModalOpen(false); setMemberToEdit(null); }}
        onSave={() => { loadTeam(); setIsTeamModalOpen(false); setMemberToEdit(null); }}
        member={memberToEdit}
        companyId={empresaData.id}
        currentUserRole={effectiveRole}
      />

      <Modal
        isOpen={isDeleteMemberModalOpen}
        onClose={() => { setIsDeleteMemberModalOpen(false); setMemberToDelete(null); }}
        title="Remover Membro"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 !h-[34px]" onClick={() => { setIsDeleteMemberModalOpen(false); setMemberToDelete(null); }}>Cancelar</Button>
            <Button variant="danger" className="flex-1 !h-[34px]" onClick={handleRemoveMember}>Remover</Button>
          </div>
        }
      >
        <p className="text-body2 text-neutral-700">
          Tem certeza que deseja remover {memberToDelete ? memberToDelete.full_name : 'este membro'} da equipe?
        </p>
      </Modal>

      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />
      <CancelSubscriptionModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} />
    </div>
  );
};