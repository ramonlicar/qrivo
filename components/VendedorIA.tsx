
import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { Dropdown } from './Dropdown';
import { Badge } from './Badge';
import { Modal } from './Modal';
import { IconButton } from './IconButton';
import { Switch } from './Switch';
import { aiService } from '../lib/aiService';
import { AgentTestWidget } from './AgentTestWidget';
import { getUserCompanyId, supabase } from '../lib/supabase';
import { evolutionService } from '@/services/evolutionService';
import { v4 as uuidv4 } from 'uuid';

const ESTILOS_PROMPTS: Record<string, string> = {
  'Amigável': 'Use um tom acolhedor, trate o cliente pelo nome sempre que possível e utilize emojis de brilho e sorrisos. Seja paciente e mostre empatia genuína.',
  'Profissional': 'Seja direto, eficiente e educado. Use vocabulário padrão, evite gírias e foque em resolver a dúvida do cliente com precisão técnica.',
  'Descontraído': 'Use uma linguagem leve, pode utilizar gírias comuns do nicho e emojis divertidos. Trate o cliente como um amigo próximo da marca.',
  'Elegante': 'Utilize um vocabulário rico e sofisticado. Mantenha um distanciamento respeitoso, transmitindo exclusividade e autoridade no segmento de luxo.'
};

const TAMANHO_RESPOSTA_PROMPTS: Record<string, string> = {
  'Conciso': 'Seja extremamente objetivo e breve. Priorize a eficiência, entregando a informação solicitada em poucas palavras. Evite saudações longas, explicações excessivas ou rodeios. Ideal para respostas rápidas e diretas.',
  'Normal': 'Mantenha um equilíbrio entre brevidade e cordialidade. Responda de forma completa, mas sem exageros. Use uma estrutura clara e fácil de ler. É o padrão ideal para garantir clareza sem ser cansativo.',
  'Detalhado': 'Adote uma postura consultiva e minuciosa. Explique detalhadamente cada aspecto, ofereça contexto adicional e antecipe possíveis dúvidas. Não tenha pressa; o objetivo é educar e encantar o cliente com o máximo de informações úteis.'
};

const TAMANHO_RESPOSTA_CONFIG = [
  {
    id: 'Conciso',
    label: 'Conciso',
    icon: 'ph ph-chat-circle-dots',
    desc: 'Direto ao ponto.',
    hint: 'Ideal para lojas de conveniência ou produtos simples.'
  },
  {
    id: 'Normal',
    label: 'Normal',
    icon: 'ph ph-chats-circle',
    desc: 'Equilibrado.',
    hint: 'O padrão ideal para a maioria dos comércios locais.'
  },
  {
    id: 'Detalhado',
    label: 'Detalhado',
    icon: 'ph ph-article',
    desc: 'Consultivo.',
    hint: 'Perfeito para vendas técnicas ou produtos de luxo.'
  }
];

const MODOS_FUNCIONAMENTO = [
  {
    id: 'Sempre',
    label: 'Sempre Ativo 24/7',
    icon: 'ph ph-infinity',
    desc: 'Atendimento ininterrupto.',
    hint: 'A IA responderá a qualquer hora do dia ou da noite.'
  },
  {
    id: 'ForaComercial',
    label: 'Fora do Horário',
    icon: 'ph ph-moon',
    desc: 'IA Noturna/Folgas.',
    hint: 'A IA assume quando sua equipe humana termina o expediente.'
  },
  {
    id: 'HorarioComercial',
    label: 'Horário Comercial',
    icon: 'ph ph-briefcase',
    desc: 'Suporte em tempo real.',
    hint: 'A IA auxilia sua equipe durante o período de maior demanda.'
  }
];

const FAQ_CATEGORIES = [
  { label: 'Produtos', value: 'Produtos' },
  { label: 'Horários', value: 'Horários' },
  { label: 'Envios', value: 'Envios' },
  { label: 'Pagamentos', value: 'Pagamentos' },
  { label: 'Devoluções', value: 'Devoluções' },
  { label: 'Reembolso', value: 'Reembolso' },
  { label: 'Outros', value: 'Outros' }
];

const AREA_ATUACAO_OPTIONS = [
  { label: 'Moda e Acessórios', value: 'Moda e Acessórios' },
  { label: 'Eletrônicos', value: 'Eletrônicos' },
  { label: 'Casa e Decoração', value: 'Casa e Decoração' },
  { label: 'Alimentação', value: 'Alimentação' },
  { label: 'Beleza e Cosméticos', value: 'Beleza e Cosméticos' },
  { label: 'Varejo em Geral', value: 'Varejo em Geral' },
  { label: 'Serviços', value: 'Serviços' }
];

const AiSuggestionButton = ({ onClick, disabled, loading }: { onClick: () => void, disabled?: boolean, loading?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-full text-[10px] font-bold tracking-wide transition-all disabled:opacity-50 uppercase"
  >
    {loading ? <i className="ph ph-circle-notch animate-spin"></i> : <i className="ph-fill ph-sparkle"></i>}
    Sugestão IA
  </button>
);

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface DeliveryArea {
  id: string;
  name: string;
  price: string;
  time: string;
  regions: string[];
}

interface PaymentMethod {
  id: string;
  name: string;
  mode: string;
  method_type?: string;
  instructions: string;
}

export const VendedorIA: React.FC = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [agentId, setAgentId] = useState<string | null>(null);
  const [isAgentActive, setIsAgentActive] = useState(true);
  const [isGeneratingDescLoja, setIsGeneratingDescLoja] = useState(false);
  const [isGeneratingMsg, setIsGeneratingMsg] = useState<Record<string, boolean>>({});
  const [isTestWidgetOpen, setIsTestWidgetOpen] = useState(false);

  // Estados WhatsApp
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(false);
  const [isDisconnectWhatsappModalOpen, setIsDisconnectWhatsappModalOpen] = useState(false);
  const [isConnectWhatsappModalOpen, setIsConnectWhatsappModalOpen] = useState(false);
  const [whatsappAccordion, setWhatsappAccordion] = useState<number | null>(null);
  const [agentCompanyId, setAgentCompanyId] = useState<string | null>(null);

  // Estados para FAQ
  // Estados para FAQ
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isDeleteFaqModalOpen, setIsDeleteFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);
  const [faqFormData, setFaqFormData] = useState({ category: 'Outros', question: '', answer: '' });

  // Estados para Entrega
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState('');
  const [whatsappQrCode, setWhatsappQrCode] = useState('');
  const [isConnectingWhatsapp, setIsConnectingWhatsapp] = useState(false);
  const [whatsappConnectionStep, setWhatsappConnectionStep] = useState(1); // 1: Input, 2: QR, 3: Success
  const [whatsappDdi, setWhatsappDdi] = useState('+55');

  // Estados para Pagamento
  // Estados para Pagamento
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estado do Toast
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

  // Auto-Save State
  const [saveStatus, setSaveStatus] = useState<'saved' | 'pending' | 'saving' | 'error'>('saved');
  const lastSavedData = useRef<string>('');

  // Estados do Formulário de Perfil
  const [perfilData, setPerfilData] = useState({
    empresaNome: 'Qrivo Store',
    areaAtuacao: 'Moda e Acessórios',
    descricaoLoja: '',
    agenteNome: 'Maya',
    agenteGenero: 'Feminino',
    estiloComunicacao: 'Amigável',
    tamanhoResposta: 'Normal',
    palavrasNaoPermitidas: 'grátis, promoção enganosa, oferta limitada',
    emojisPermitidos: '✨,🛍️,👗,👠,💎',
    msgBoasVindas: '',
    msgConfirmacaoCompra: '',
    msgTransferenciaHumana: '',
    followUpAtivo: true,
    followUpTempo: '24',
    followUpUnidade: 'Horas',
    followUpIntervaloTempo: '24',
    followUpIntervaloUnidade: 'Horas',
    followUpTentativas: '3',
    modoFuncionamento: 'Sempre',
    horaInicio: '08:00',
    horaFim: '18:00',
    cepOrigem: '01001-000'
  });

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: 'ph-user-circle' },
    { id: 'followup', label: 'Follow-Up', icon: 'ph-arrows-clockwise' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'ph-whatsapp-logo' },
    { id: 'funcionamento', label: 'Funcionamento', icon: 'ph-clock' },
    { id: 'treinamento', label: 'Treinamento', icon: 'ph-graduation-cap' },
    { id: 'entrega', label: 'Entrega', icon: 'ph-truck' },
    { id: 'pagamento', label: 'Pagamento', icon: 'ph-wallet' }
  ];



  // Load Data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const companyId = await getUserCompanyId();
        if (!companyId) return;

        // Fetch Company Details for fallback
        const { data: companyData } = await supabase
          .from('companies')
          .select('name, business_area, business_description')
          .eq('id', companyId)
          .single();

        // Fetch Agent
        const { data: agents, error: agentError } = await supabase
          .from('agents')
          .select('*')
          .eq('company_id', companyId)
          .eq('type', 'sales')
          .limit(1);

        if (agentError) {
          console.error('Error fetching agent:', agentError);
        }

        const agent = agents?.[0];
        setAgentId(agent?.id || null);
        setAgentCompanyId(agent?.company_id || null);
        setIsAgentActive(agent?.is_active ?? true);

        let config = null;
        if (agent) {
          // Fetch Config
          const { data: existingConfig, error: configError } = await supabase
            .from('agent_configs')
            .select('*')
            .eq('agent_id', agent.id)
            .single();

          if (configError && configError.code !== 'PGRST116') {
            console.error('Error fetching config:', configError);
          }
          config = existingConfig;

          // Fetch FAQs
          const { data: fetchedFaqs, error: faqsError } = await supabase
            .from('agent_faqs')
            .select('*')
            .eq('agent_id', agent.id)
            .order('created_at', { ascending: false });

          if (faqsError) {
            console.error('Error fetching FAQs:', faqsError);
          } else {
            setFaqs(fetchedFaqs || []);
          }

          // Fetch Delivery Areas
          const { data: fetchedAreas, error: areasError } = await supabase
            .from('delivery_areas')
            .select('*')
            .eq('agent_id', agent.id)
            .order('created_at', { ascending: true });

          if (areasError) {
            console.error('Error fetching Delivery Areas:', areasError);
          } else {
            // Ensure regions is string[] even if DB returns string (legacy) or mixed
            const formattedAreas = (fetchedAreas || []).map(area => ({
              ...area,
              price: formatCurrency(Number(area.price) || 0),
              regions: Array.isArray(area.regions) ? area.regions : (typeof area.regions === 'string' ? area.regions.split(',').filter(Boolean) : [])
            }));
            setDeliveryAreas(formattedAreas);
          }
        }

        // Fetch Payment Methods
        if (agent) {
          const { data: fetchedPayments, error: paymentError } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('agent_id', agent.id)
            .order('created_at', { ascending: true });

          if (paymentError) {
            console.error('Error fetching Payment Methods:', paymentError);
          } else {
            const formattedPayments = (fetchedPayments || []).map(pm => ({
              id: pm.id,
              name: pm.name,
              mode: pm.method_type, // Map DB column to UI state
              instructions: pm.instructions
            }));
            setPaymentMethods(formattedPayments);
          }
        }




        // Fetch WhatsApp Integration Status
        if (agent) {
          const { data: whatsappData, error: whatsappError } = await supabase
            .from('agent_whatsapp_integrations')
            .select('*')
            .eq('agent_id', agent.id)
            .maybeSingle();

          if (whatsappData && whatsappData.status === 'connected') {
            setIsWhatsappConnected(true);
            setWhatsappPhoneNumber(whatsappData.phone_number || '');
          } else {
            setIsWhatsappConnected(false);
            setWhatsappPhoneNumber('');
          }
        }

        // Update State
        setPerfilData(prev => ({
          ...prev,
          agenteNome: agent?.name || prev.agenteNome,
          empresaNome: config?.company_display_name || companyData?.name || prev.empresaNome,
          // Prioritize config, then companyData, then keep previous default
          areaAtuacao: config?.business_area || companyData?.business_area || prev.areaAtuacao,
          descricaoLoja: config?.business_description || companyData?.business_description || prev.descricaoLoja,
          agenteGenero: config?.gender || prev.agenteGenero,
          estiloComunicacao: config?.communication_style || prev.estiloComunicacao,
          tamanhoResposta: config?.verbosity ? (config.verbosity === 'concise' ? 'Conciso' : config.verbosity === 'detailed' ? 'Detalhado' : 'Normal') : prev.tamanhoResposta,
          palavrasNaoPermitidas: config?.prohibited_words || prev.palavrasNaoPermitidas,
          emojisPermitidos: config?.allowed_emojis || prev.emojisPermitidos,
          msgBoasVindas: config?.welcome_message || prev.msgBoasVindas,
          msgConfirmacaoCompra: config?.order_confirmation_message || prev.msgConfirmacaoCompra,
          msgTransferenciaHumana: config?.human_handoff_message || prev.msgTransferenciaHumana,
          followUpAtivo: config?.follow_up_enabled ?? prev.followUpAtivo,
          followUpTempo: config?.follow_up_settings?.delay_amount?.toString() || prev.followUpTempo,
          followUpUnidade: config?.follow_up_settings?.delay_unit === 'minutes' ? 'Minutos' : config?.follow_up_settings?.delay_unit === 'hours' ? 'Horas' : config?.follow_up_settings?.delay_unit === 'days' ? 'Dias' : prev.followUpUnidade,
          followUpIntervaloTempo: config?.follow_up_settings?.interval_amount?.toString() || prev.followUpIntervaloTempo,
          followUpIntervaloUnidade: config?.follow_up_settings?.interval_unit === 'minutes' ? 'Minutos' : config?.follow_up_settings?.interval_unit === 'hours' ? 'Horas' : config?.follow_up_settings?.interval_unit === 'days' ? 'Dias' : prev.followUpIntervaloUnidade,
          followUpTentativas: config?.follow_up_settings?.max_attempts?.toString() || prev.followUpTentativas,
          modoFuncionamento: config?.operating_mode || prev.modoFuncionamento,
          horaInicio: config?.working_hours_start || prev.horaInicio,
          horaFim: config?.working_hours_end || prev.horaFim,
        }));

      } catch (error) {
        console.error('Error loading VendedorIA data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaveAll = async (isAutoSave = false) => {
    if (!isAutoSave) setIsSaving(true);
    setSaveStatus('saving');
    try {
      const companyId = await getUserCompanyId();
      if (!companyId) {
        if (!isAutoSave) showToast('Erro: Empresa não identificada');
        setSaveStatus('error');
        return;
      }

      // 1. Ensure Agent exists
      let { data: existingAgents } = await supabase
        .from('agents')
        .select('*')
        .eq('company_id', companyId)
        .eq('type', 'sales')
        .limit(1);

      let agent = existingAgents?.[0];
      let agentId = agent?.id;

      if (!agentId) {
        const { data: newAgent, error: createError } = await supabase
          .from('agents')
          .insert({
            company_id: companyId,
            name: perfilData.agenteNome,
            type: 'sales'
          })
          .select()
          .single();

        if (createError) throw createError;
        agentId = newAgent.id;
      }

      // Update Agent Config JSONB (Merge with existing)


      // Ensure existingConfig is an object
      const existingConfig = (typeof agent?.config === 'object' && agent?.config !== null) ? agent.config : {};

      const newProfileConfig = {
        company_name: perfilData.empresaNome,
        business_area: perfilData.areaAtuacao,
        business_description: perfilData.descricaoLoja,
        agent_name: perfilData.agenteNome,
        gender: perfilData.agenteGenero,
        communication_style_prompt: ESTILOS_PROMPTS[perfilData.estiloComunicacao] || '',
        verbosity_prompt: TAMANHO_RESPOSTA_PROMPTS[perfilData.tamanhoResposta] || '',
        prohibited_words: perfilData.palavrasNaoPermitidas,
        allowed_emojis: perfilData.emojisPermitidos
      };

      const mergedConfig = { ...existingConfig, ...newProfileConfig };

      const { error: agentUpdateError } = await supabase
        .from('agents')
        .update({
          name: perfilData.agenteNome,
          config: mergedConfig
        })
        .eq('id', agentId);

      if (agentUpdateError) {
        console.error('Error updating agent config json:', agentUpdateError);
        // We continue to save the relational config as well, or should we throw?
        // User asked to save to agents config. We should probably treat it as important.
        throw agentUpdateError;
      }

      // 2. Upsert Config
      const verbosityMap: Record<string, string> = { 'Conciso': 'concise', 'Normal': 'normal', 'Detalhado': 'detailed' };

      const configData = {
        agent_id: agentId,
        company_id: companyId,
        company_display_name: perfilData.empresaNome,
        business_area: perfilData.areaAtuacao,
        business_description: perfilData.descricaoLoja,
        communication_style: perfilData.estiloComunicacao,
        gender: perfilData.agenteGenero,
        verbosity: verbosityMap[perfilData.tamanhoResposta] || 'normal',
        prohibited_words: perfilData.palavrasNaoPermitidas,
        allowed_emojis: perfilData.emojisPermitidos,
        welcome_message: perfilData.msgBoasVindas,
        order_confirmation_message: perfilData.msgConfirmacaoCompra,
        human_handoff_message: perfilData.msgTransferenciaHumana,
        follow_up_enabled: perfilData.followUpAtivo,
        follow_up_settings: {
          delay_amount: Number(perfilData.followUpTempo),
          delay_unit: perfilData.followUpUnidade === 'Minutos' ? 'minutes' : perfilData.followUpUnidade === 'Horas' ? 'hours' : 'days',
          interval_amount: Number(perfilData.followUpIntervaloTempo),
          interval_unit: perfilData.followUpIntervaloUnidade === 'Minutos' ? 'minutes' : perfilData.followUpIntervaloUnidade === 'Horas' ? 'hours' : 'days',
          max_attempts: Number(perfilData.followUpTentativas)
        },
        operating_mode: perfilData.modoFuncionamento,
        working_hours_start: perfilData.horaInicio,
        working_hours_end: perfilData.horaFim
      };

      const { error: upsertError } = await supabase
        .from('agent_configs')
        .upsert(configData, { onConflict: 'agent_id' });

      if (upsertError) throw upsertError;

      if (upsertError) throw upsertError;

      // 3. Upsert Delivery Areas
      if (deliveryAreas.length > 0) {
        const areasToUpsert = deliveryAreas.map(area => ({
          id: area.id,
          agent_id: agentId,
          name: area.name,
          price: parseFloat(String(area.price).replace(/[^\d,]/g, '').replace(',', '.')) || 0,
          time: area.time,
          regions: area.regions as any, // Cast to any to avoid TS/Supabase type mismatch with JSONB
          updated_at: new Date().toISOString()
        }));

        const { error: areaError } = await supabase
          .from('delivery_areas')
          .upsert(areasToUpsert);

        if (areaError) throw areaError;
      }

      // 4. Upsert Payment Methods
      if (paymentMethods.length > 0 && agentId) {
        const paymentsToUpsert = paymentMethods.map(pm => ({
          id: pm.id.length < 20 ? undefined : pm.id,
          agent_id: agentId,
          name: pm.name,
          method_type: pm.mode,
          instructions: pm.instructions,
          updated_at: new Date().toISOString()
        }));

        const { error: paymentError } = await supabase
          .from('payment_methods')
          .upsert(paymentsToUpsert, { onConflict: 'id' });

        if (paymentError) throw paymentError;
      }



      if (!isAutoSave) showToast('Configurações salvas com sucesso!');
      setSaveStatus('saved');
      lastSavedData.current = JSON.stringify({ perfil: perfilData, delivery: deliveryAreas, payment: paymentMethods });

    } catch (error) {
      console.error('Error saving data:', error);
      if (!isAutoSave) showToast('Erro ao salvar as configurações.');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-Save Effect
  useEffect(() => {
    if (isLoading) return;
    const currentDataStr = JSON.stringify({ perfil: perfilData, delivery: deliveryAreas, payment: paymentMethods });

    // Initialize loaded data as saved
    if (lastSavedData.current === '') {
      lastSavedData.current = currentDataStr;
      return;
    }

    if (currentDataStr === lastSavedData.current) {
      if (saveStatus !== 'saved' && saveStatus !== 'saving') setSaveStatus('saved');
      return;
    }

    setSaveStatus('pending');
    const timer = setTimeout(() => {
      handleSaveAll(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [perfilData, deliveryAreas, paymentMethods, isLoading]);

  const handleToggleAgent = async (checked: boolean) => {
    setIsAgentActive(checked);
    if (!agentId) return;

    try {
      const { error } = await supabase.from('agents').update({ is_active: checked }).eq('id', agentId);
      if (error) throw error;
      showToast(`Agente ${checked ? 'ativado' : 'desativado'} com sucesso.`);
    } catch (e) {
      console.error('Error toggling agent:', e);
      showToast('Erro ao atualizar status do agente.');
      setIsAgentActive(!checked);
    }
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message: string) => setToast({ show: true, message });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleGenerateDescLoja = async () => {
    if (!perfilData.empresaNome || !perfilData.areaAtuacao) {
      alert("Por favor, preencha o nome e a área de atuação primeiro.");
      return;
    }

    setIsGeneratingDescLoja(true);
    try {
      const prompt = `Crie uma descrição institucional cativante e profissional para a loja "${perfilData.empresaNome}", que atua no segmento de "${perfilData.areaAtuacao}". O texto deve ser vendedora e passar confiança para clientes no WhatsApp. Máximo 500 caracteres. Retorne apenas o texto.`;

      const text = await aiService.generateContent(prompt);
      setPerfilData(prev => ({ ...prev, descricaoLoja: text || '' }));
    } catch (error: any) {
      console.error("Erro ao gerar descrição da loja:", error);
      if (error.message === "LIMIT_EXCEEDED") {
        alert("Limite de uso da IA excedido. Tente novamente mais tarde.");
      }
    } finally {
      setIsGeneratingDescLoja(false);
    }
  };

  const handleGenerateMessage = async (type: string, field: keyof typeof perfilData) => {
    setIsGeneratingMsg(prev => ({ ...prev, [field]: true }));
    try {
      let prompt = '';

      if (type === 'Palavras não permitidas') {
        prompt = `Liste 10 palavras ou expressões que NÃO devem ser usadas por um vendedor da loja "${perfilData.empresaNome}" (${perfilData.areaAtuacao}).
         Considere o estilo de comunicação: "${perfilData.estiloComunicacao}".
         Evite termos ofensivos, gírias inadequadas para o público, ou promessas enganosas comuns neste nicho.
         Retorne APENAS as palavras/expressões separadas por vírgulas, sem numeração ou texto adicional.`;
      } else if (type === 'Emojis permitidos') {
        prompt = `Sugira 10 emojis que combinam com a identidade visual e tom de voz da loja "${perfilData.empresaNome}" (${perfilData.areaAtuacao}).
         Estilo: "${perfilData.estiloComunicacao}".
         Retorne APENAS os emojis separados por vírgula, sem texto adicional.`;
      } else if (type === 'Transferência Humana') {
        prompt = `Atue como a IA "${perfilData.agenteNome}" da loja "${perfilData.empresaNome}". O cliente solicitou falar com uma pessoa real ou o assunto é complexo demais.
        Crie uma mensagem curta informando que você irá transferir o atendimento para um especialista humano.
        Seja prestativa e mantenha o estilo: "${perfilData.estiloComunicacao}".
        Não se apresente como o humano. Você é a IA fazendo a transferência.
        Retorne APENAS o texto da mensagem.`;
      } else {
        const promptContext = type;
        prompt = `Como um vendedor chamado ${perfilData.agenteNome} da loja ${perfilData.empresaNome} (${perfilData.areaAtuacao}), crie uma mensagem de ${promptContext} curta e eficaz para WhatsApp. 
        Estilo: ${perfilData.estiloComunicacao}. 
        Emojis permitidos: ${perfilData.emojisPermitidos}.
        Retorne apenas o texto da mensagem.`;
      }

      const text = await aiService.generateContent(prompt);
      let finalValue = text || '';

      // Cleanup for lists
      if (type === 'Palavras não permitidas' || type === 'Emojis permitidos') {
        finalValue = finalValue.replace(/\n/g, ', ').replace(/\.|;/g, ',');
      }

      setPerfilData(prev => ({ ...prev, [field]: finalValue }));
    } catch (error: any) {
      console.error(`Erro ao gerar ${type}:`, error);
      if (error.message === "LIMIT_EXCEEDED") {
        alert("Limite de uso da IA excedido. Tente novamente mais tarde.");
      }
    } finally {
      setIsGeneratingMsg(prev => ({ ...prev, [field]: false }));
    }
  };

  const handleGenerateFaqAnswer = async () => {
    if (!faqFormData.question) {
      alert("Preencha a pergunta primeiro.");
      return;
    }

    setIsGeneratingMsg(prev => ({ ...prev, 'faqAnswer': true }));
    try {
      const prompt = `Atue como um especialista em e-commerce e direito do consumidor brasileiro. O cliente perguntou: "${faqFormData.question}".
      Crie uma resposta objetiva, cordial e juridicamente correta para ser enviada por WhatsApp.
      Se a pergunta for sobre prazos (arrependimento, troca), cite a lei se apropriado.
      Limite a resposta a 200 caracteres.
      Retorne APENAS o texto da mensagem.`;

      const text = await aiService.generateContent(prompt);
      setFaqFormData(prev => ({ ...prev, answer: text || '' }));
    } catch (error: any) {
      console.error("Erro ao gerar resposta FAQ:", error);
      if (error.message === "LIMIT_EXCEEDED") {
        alert("Limite de uso da IA excedido. Tente novamente mais tarde.");
      }
    } finally {
      setIsGeneratingMsg(prev => ({ ...prev, 'faqAnswer': false }));
    }
  };

  /* WhatsApp Connection Logic */
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const qrRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const pollConnectionStatus = async (agentId: string, fullPhoneNumber?: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (qrRefreshIntervalRef.current) clearInterval(qrRefreshIntervalRef.current);

    // 1. QR Refresh Interval (Every 25 seconds)
    if (fullPhoneNumber) {
      qrRefreshIntervalRef.current = setInterval(async () => {
        try {
          console.log('Refreshing QR Code...');
          const connectData = await evolutionService.connectInstance(agentId, fullPhoneNumber);
          if (connectData && (connectData.base64 || connectData.code)) {
            setWhatsappQrCode(connectData.base64 || connectData.code || '');
          }
        } catch (e) {
          console.error('Error refreshing QR:', e);
        }
      }, 25000);
    }

    // Poll every 1 second checking connection state
    pollIntervalRef.current = setInterval(async () => {
      try {
        const stateData = await evolutionService.getConnectionState(agentId);
        // 'open' usually means connected in Evolution API (Baileys)
        if (stateData.instance?.state === 'open') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

          // Persist connection in DB FIRST
          const companyId = agentCompanyId || await getUserCompanyId();
          console.log('Poll pollConnectionStatus: upserting with:', { agentId, companyId, whatsappPhoneNumber });
          if (companyId) {
            const { error: upsertError } = await supabase.from('agent_whatsapp_integrations').upsert({
              agent_id: agentId,
              company_id: companyId,
              phone_number: whatsappPhoneNumber,
              status: 'connected',
              session_id: agentId
            }, { onConflict: 'agent_id' });

            if (!upsertError) {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              if (qrRefreshIntervalRef.current) clearInterval(qrRefreshIntervalRef.current);
              setIsWhatsappConnected(true);
              setWhatsappConnectionStep(3);
              setIsConnectWhatsappModalOpen(false); // Close modal automatically
              showToast('WhatsApp conectado com sucesso!');
            } else {
              console.error('Error saving whatsapp status:', upsertError);
              showToast('Erro ao salvar conexão no banco.');
            }
          }
        } else if (stateData.instance?.state === 'close') {
          // Do nothing, keep polling
        }
      } catch (e) {
        console.error('Error polling status:', e);
      }
    }, 1000);

    // Stop polling after 3 minutes
    setTimeout(() => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (qrRefreshIntervalRef.current) clearInterval(qrRefreshIntervalRef.current);
    }, 180000);
  };

  const handleStartWhatsappConnection = async () => {
    if (!whatsappPhoneNumber || !agentId) {
      showToast(agentId ? "Informe o número primeiro." : "Agente não identificado. Salve as configurações antes.");
      return;
    }
    setIsConnectingWhatsapp(true);
    const fullPhoneNumber = `${whatsappDdi.replace('+', '')}${whatsappPhoneNumber.replace(/\D/g, '')}`;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const companyId = agentCompanyId || await getUserCompanyId();
      console.log('WhatsApp connection attempt:', {
        agentId,
        companyId,
        userId: user?.id,
        authRole: user?.role
      });

      if (!companyId) throw new Error('Company not found');

      // 0. Check for existing integration record
      const { data: existingIntegration } = await supabase
        .from('agent_whatsapp_integrations')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (existingIntegration) {
        console.log('Existing integration found. Testing connection...', existingIntegration);
        try {
          const stateData = await evolutionService.getConnectionState(agentId);
          if (stateData.instance?.state === 'open') {
            console.log('Connection is already open. Updating state.');
            setIsWhatsappConnected(true);
            setWhatsappConnectionStep(3);
            showToast('WhatsApp já está conectado!');
            return;
          }
        } catch (stateErr) {
          console.warn('Could not check state of existing instance, proceeding to recreate/connect:', stateErr);
        }
      }

      // 1. Generate Token (Migration from n8n) - Using raw number without DDI as suffix
      const instanceToken = evolutionService.generateToken(whatsappPhoneNumber);
      console.log('Generated token for instance:', instanceToken);

      // 2. Create Instance (Direct)
      let instanceToUse = agentId;
      let qrFromCreate = '';
      try {
        console.log('Creating instance direct for agent:', agentId);
        const createResult = await evolutionService.createInstance(fullPhoneNumber, agentId, companyId, instanceToken);
        console.log('Instance creation result:', createResult);

        if (createResult?.instance?.instanceName) {
          instanceToUse = createResult.instance.instanceName;
        }

        // Se a API retornar o QR Code direto na criação, guardamos para usar depois das configurações
        if (createResult?.qrcode?.base64 || createResult?.qrcode?.code) {
          qrFromCreate = createResult.qrcode.base64 || createResult.qrcode.code || '';
        }
      } catch (e: any) {
        console.error('Instance creation error details:', e.response?.data || e);
        const status = e.response?.status;

        // Se for 403 ou 409, a instância já existe. Podemos prosseguir para o connect.
        if (status !== 403 && status !== 409) {
          const apiData = e.response?.data;
          let failMsg = '';

          if (Array.isArray(apiData?.message)) {
            failMsg = apiData.message.join(', ');
          } else {
            failMsg = apiData?.message || apiData?.error || e.message || 'Falha ao criar instância.';
          }

          showToast(`Erro na criação: ${failMsg}`);
          setIsConnectingWhatsapp(false);
          return;
        }
        console.warn('Instance already exists, proceeding to config...');
      }

      // 3. Persist Early in Database (status 'connecting')
      try {
        console.log('Saving initial status to DB. IDs:', { agentId, companyId, fullPhoneNumber });
        const { error: upsertError } = await supabase.from('agent_whatsapp_integrations').upsert({
          agent_id: agentId,
          company_id: companyId,
          phone_number: fullPhoneNumber,
          status: 'connecting',
          session_id: instanceToUse
        }, { onConflict: 'agent_id' });

        if (upsertError) {
          console.error('Error saving initial status:', upsertError);
        }
      } catch (dbError) {
        console.error('Fatal DB error during early persistence:', dbError);
      }

      // 4. Configure Webhook and Settings (Migration from n8n steps)
      try {
        console.log('Configuring instance webhook and settings...');
        await evolutionService.setWebhook(instanceToUse, 'https://qrivo-n8n.2nqwg8.easypanel.host/webhook/qrivo');

        await evolutionService.setSettings(instanceToUse, {
          rejectCall: true,
          groupsIgnore: true,
          alwaysOnline: true,
          readMessages: true
        });
        console.log('Configuration successful');
      } catch (configError: any) {
        console.warn('Configuration warning (non-fatal):', configError.response?.data || configError.message);
        // We continue even if config fails as the instance is created
      }



      // 5. Connect (Get QR)
      if (qrFromCreate) {
        console.log('Using QR from creation response');
        setWhatsappQrCode(qrFromCreate);
        setWhatsappConnectionStep(2);
        pollConnectionStatus(instanceToUse, fullPhoneNumber);
      } else {
        // Pequeno delay de segurança para propagação
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('Connecting instance for QR...', instanceToUse);
        try {
          const connectData = await evolutionService.connectInstance(instanceToUse, fullPhoneNumber);

          if (connectData && (connectData.base64 || connectData.code)) {
            const qr = connectData.base64 || connectData.code || '';
            setWhatsappQrCode(qr);
            setWhatsappConnectionStep(2);
            pollConnectionStatus(instanceToUse, fullPhoneNumber);
          } else {
            console.error('No QR data in response:', connectData);
            showToast('Não foi possível gerar o QR Code. Tente novamente.');
          }
        } catch (error: any) {
          console.error('Connection (QR) error details:', error.response?.data || error);
          showToast(`Erro ao obter QR: ${error.response?.data?.message || error.message}`);
        }
      }

    } catch (error: any) {
      console.error('Connection error details:', error);
      const status = error.response?.status;
      const errorMsg = error.response?.data?.message || (error.response?.data?.error === 'Unauthorized' ? 'Não autorizado' : error.message) || 'Erro ao iniciar conexão.';

      if (status === 404) {
        showToast('Erro 404: Instância não encontrada na Evolution API. Tente novamente em instantes.');
      } else if (status === 401) {
        showToast('Erro 401: Não autorizado. Verifique a API Key da Evolution.');
      } else {
        showToast(`Falha na conexão: ${errorMsg}`);
      }
    } finally {
      setIsConnectingWhatsapp(false);
    }
  };

  const handleOpenConnectModal = async () => {
    if (!agentId) {
      showToast("Agente não identificado. Salve as configurações antes.");
      return;
    }

    try {
      // 1. Check for existing integration record regardless of status
      const { data: existingIntegration } = await supabase
        .from('agent_whatsapp_integrations')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (existingIntegration) {
        console.log('Existing integration found. Validating state with API...', existingIntegration);
        try {
          const stateData = await evolutionService.getConnectionState(agentId);
          if (stateData.instance?.state === 'open') {
            console.log('Connection is already open. Updating state only.');
            setIsWhatsappConnected(true);
            setWhatsappPhoneNumber(existingIntegration.phone_number || '');
            showToast('WhatsApp já está conectado!');
            return;
          } else {
            console.log('Instance exists but is NOT connected. Cleaning up DB record...');
            await supabase.from('agent_whatsapp_integrations').delete().eq('agent_id', agentId);
          }
        } catch (stateErr: any) {
          console.warn('API error during state check, assuming instance is invalid. Cleaning up...', stateErr.response?.data || stateErr.message);
          // If 404 or other error, it means the instance is likely gone from API
          await supabase.from('agent_whatsapp_integrations').delete().eq('agent_id', agentId);
        }
      }

      // If we reach here, either no record existed or it was deleted/invalid
      setIsConnectWhatsappModalOpen(true);
    } catch (err) {
      console.error('Error in handleOpenConnectModal pre-check:', err);
      // Fallback: open modal anyway to allow user to try
      setIsConnectWhatsappModalOpen(true);
    }
  };

  const handleDisconnectWhatsapp = async () => {
    setIsDisconnectWhatsappModalOpen(false);
    try {
      if (agentId) {
        await evolutionService.deleteInstance(agentId);
        await supabase.from('agent_whatsapp_integrations').delete().eq('agent_id', agentId);
      }
      setIsWhatsappConnected(false);
      setWhatsappPhoneNumber('');
      showToast("WhatsApp desconectado.");
    } catch (e) {
      console.error('Error disconnecting:', e);
      showToast("Erro ao desconectar manualmente.");
      // Force UI disconnect
      setIsWhatsappConnected(false);
      setWhatsappPhoneNumber('');
    }
  };

  // FAQ Handlers
  const handleOpenFaqModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqFormData({ category: faq.category, question: faq.question, answer: faq.answer });
    } else {
      setEditingFaq(null);
      setFaqFormData({ category: 'Produtos', question: '', answer: '' });
    }
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = async () => {
    if (!faqFormData.question || !faqFormData.answer) {
      alert("Pergunta e resposta são obrigatórias.");
      return;
    }

    if (!agentId) {
      showToast("Agente não identificado.");
      return;
    }

    try {
      if (editingFaq) {
        const { error } = await supabase
          .from('agent_faqs')
          .update({
            category: faqFormData.category,
            question: faqFormData.question,
            answer: faqFormData.answer,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFaq.id);

        if (error) throw error;

        setFaqs(faqs.map(f => f.id === editingFaq.id ? { ...f, ...faqFormData } : f));
        showToast("FAQ atualizada com sucesso!");
      } else {
        const { data: newFaq, error } = await supabase
          .from('agent_faqs')
          .insert({
            agent_id: agentId,
            category: faqFormData.category,
            question: faqFormData.question,
            answer: faqFormData.answer
          })
          .select()
          .single();

        if (error) throw error;

        setFaqs([newFaq, ...faqs]);
        showToast("Nova FAQ cadastrada!");
      }
      setIsFaqModalOpen(false);
    } catch (error) {
      console.error('Error saving FAQ:', error);
      showToast("Erro ao salvar FAQ.");
    }
  };

  const handleDeleteFaqClick = (faq: FAQ) => {
    setFaqToDelete(faq);
    setIsDeleteFaqModalOpen(true);
  };

  const confirmDeleteFaq = async () => {
    if (faqToDelete) {
      try {
        const { error } = await supabase
          .from('agent_faqs')
          .delete()
          .eq('id', faqToDelete.id);

        if (error) throw error;

        setFaqs(faqs.filter(f => f.id !== faqToDelete.id));
        showToast("FAQ removida com sucesso.");
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        showToast("Erro ao remover FAQ.");
      }
    }
    setIsDeleteFaqModalOpen(false);
    setFaqToDelete(null);
  };

  // Delivery Handlers
  const handleAddDeliveryArea = () => {
    const newArea: DeliveryArea = {
      id: crypto.randomUUID(),
      name: '',
      price: formatCurrency(0),
      time: '',
      regions: []
    };
    setDeliveryAreas([...deliveryAreas, newArea]);
  };

  const handleDuplicateDeliveryArea = (id: string) => {
    const areaToDuplicate = deliveryAreas.find(area => area.id === id);
    if (areaToDuplicate) {
      const newArea: DeliveryArea = {
        ...areaToDuplicate,
        id: crypto.randomUUID(),
        name: `${areaToDuplicate.name} (Cópia)`
      };
      setDeliveryAreas([...deliveryAreas, newArea]);
      showToast("Área duplicada com sucesso.");
    }
  };

  const handleUpdateDeliveryArea = <K extends keyof DeliveryArea>(id: string, field: K, value: DeliveryArea[K]) => {
    setDeliveryAreas(deliveryAreas.map(area => {
      if (area.id === id) {
        return { ...area, [field]: value };
      }
      return area;
    }));
  };

  const handleDeliveryPriceChange = (id: string, rawValue: string) => {
    const cleanValue = rawValue.replace(/\D/g, '');
    const numericValue = Number(cleanValue) / 100;
    handleUpdateDeliveryArea(id, 'price', formatCurrency(numericValue));
  };

  const handleDeleteDeliveryArea = async (id: string) => {
    try {
      const { error } = await supabase
        .from('delivery_areas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDeliveryAreas(deliveryAreas.filter(area => area.id !== id));
      showToast("Área de entrega removida.");
    } catch (error) {
      console.error('Error deleting delivery area:', error);
      showToast("Erro ao remover área de entrega.");
    }
  };

  // Payment Handlers
  const handleAddPaymentMethod = () => {
    const newMethod: PaymentMethod = {
      id: crypto.randomUUID(),
      name: '',
      mode: '',
      instructions: ''
    };
    setPaymentMethods([...paymentMethods, newMethod]);
  };

  const handleDuplicatePaymentMethod = (id: string) => {
    const methodToDuplicate = paymentMethods.find(m => m.id === id);
    if (methodToDuplicate) {
      const newMethod: PaymentMethod = {
        ...methodToDuplicate,
        id: crypto.randomUUID(),
        name: `${methodToDuplicate.name} (Cópia)`
      };
      setPaymentMethods([...paymentMethods, newMethod]);
      showToast("Forma de pagamento duplicada.");
    }
  };

  const handleUpdatePaymentMethod = (id: string, field: keyof PaymentMethod, value: string) => {
    setPaymentMethods(paymentMethods.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleDeletePaymentMethod = async (id: string) => {
    try {
      // Optimistic update
      setPaymentMethods(paymentMethods.filter(m => m.id !== id));

      // If it's a valid UUID, try to delete from DB
      if (id.length > 20) {
        const { error } = await supabase
          .from('payment_methods')
          .delete()
          .eq('id', id);

        if (error) throw error;
      }

      showToast("Método de pagamento removido.");
    } catch (error) {
      console.error('Error deleting payment method:', error);
      showToast("Erro ao remover método de pagamento.");
      // Rollback not implemented for simplicity, but could refetch
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'perfil':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px]">
              <h5 className="text-h5 font-bold text-[#09090B]">Dados da Empresa</h5>
              <div className="box-border flex flex-col items-start p-4 gap-6 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[16px]">
                <div className="flex flex-row items-start gap-6 w-full">
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-body2 font-medium text-neutral-black">Nome da Empresa</label>
                    <TextInput
                      placeholder="Ex: Qrivo Store"
                      value={perfilData.empresaNome}
                      onChange={(e) => setPerfilData({ ...perfilData, empresaNome: e.target.value })}
                      containerClassName=""
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-body2 font-medium text-neutral-black">Área de Atuação</label>
                    <Dropdown
                      label="Selecione"
                      value={perfilData.areaAtuacao}
                      onChange={(val) => setPerfilData({ ...perfilData, areaAtuacao: val })}
                      options={[
                        ...AREA_ATUACAO_OPTIONS,
                        // Add current value if not in options
                        ...(perfilData.areaAtuacao && !AREA_ATUACAO_OPTIONS.find(o => o.value === perfilData.areaAtuacao)
                          ? [{ label: perfilData.areaAtuacao, value: perfilData.areaAtuacao }]
                          : [])
                      ]}
                      className=""
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center w-full">
                    <label className="text-body2 font-medium text-neutral-black">Descrição da Loja</label>
                    <AiSuggestionButton
                      onClick={handleGenerateDescLoja}
                      disabled={isGeneratingDescLoja}
                      loading={isGeneratingDescLoja}
                    />
                  </div>
                  <TextArea
                    placeholder="Explique o que sua loja faz, sua missão e valores..."
                    value={perfilData.descricaoLoja}
                    onChange={(e) => setPerfilData({ ...perfilData, descricaoLoja: e.target.value })}
                    containerClassName="min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px]">
              <h5 className="text-h5 font-bold text-[#09090B]">Dados do Agente</h5>
              <div className="box-border flex flex-col items-start p-4 gap-6 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[16px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col gap-2">
                    <label className="text-body2 font-medium text-neutral-black">Nome do Agente</label>
                    <TextInput
                      placeholder="Ex: Maya"
                      value={perfilData.agenteNome}
                      onChange={(e) => setPerfilData({ ...perfilData, agenteNome: e.target.value })}
                      containerClassName=""
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-body2 font-medium text-neutral-black">Gênero</label>
                    <Dropdown
                      label="Selecione"
                      value={perfilData.agenteGenero}
                      onChange={(val) => setPerfilData({ ...perfilData, agenteGenero: val })}
                      options={[
                        { label: 'Feminino', value: 'Feminino' },
                        { label: 'Masculino', value: 'Masculino' },
                        { label: 'Neutro', value: 'Neutro' }
                      ]}
                      className=""
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-body2 font-medium text-neutral-black">Estilo de Comunicação</label>
                    <Dropdown
                      label="Selecione um estilo"
                      value={perfilData.estiloComunicacao}
                      onChange={(val) => setPerfilData({ ...perfilData, estiloComunicacao: val })}
                      options={[
                        { label: 'Amigável e acolhedor', value: 'Amigável' },
                        { label: 'Profissional e direto', value: 'Profissional' },
                        { label: 'Descontraído e jovem', value: 'Descontraído' },
                        { label: 'Elegante e sofisticado', value: 'Elegante' }
                      ]}
                      className=""
                    />
                    {perfilData.estiloComunicacao && (
                      <div className="mt-1 p-3 bg-white border border-neutral-200 rounded-lg animate-in slide-in-from-top-1">
                        <span className="text-tag font-bold text-neutral-400 uppercase">Resumo do Prompt de Estilo</span>
                        <p className="text-small text-neutral-600 italic mt-1 leading-relaxed">
                          "{ESTILOS_PROMPTS[perfilData.estiloComunicacao]}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full h-[1px] bg-neutral-200"></div>

                <div className="flex flex-col gap-3 w-full">
                  <div className="flex flex-col">
                    <div className="flex flex-col">
                      <label className="text-body2 font-medium text-neutral-black">Volume das Respostas</label>
                      <span className="text-small text-neutral-500">Determine o quão prolixa a IA deve ser ao atender um cliente.</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    {TAMANHO_RESPOSTA_CONFIG.map((opt) => {
                      const isSelected = perfilData.tamanhoResposta === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setPerfilData({ ...perfilData, tamanhoResposta: opt.id })}
                          className={`
                            flex flex-col items-center justify-center p-4 gap-2 rounded-xl border transition-all relative overflow-hidden group
                            ${isSelected
                              ? 'bg-secondary-50 border-secondary-500 ring-2 ring-secondary-100'
                              : 'bg-white border-neutral-200 hover:border-neutral-300'}
                          `}
                        >
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center transition-all
                            ${isSelected ? 'bg-secondary-500 text-white' : 'bg-neutral-50 text-neutral-400 group-hover:text-neutral-600'}
                          `}>
                            <i className={`${opt.icon} text-xl`}></i>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className={`text-body2 font-bold ${isSelected ? 'text-secondary-700' : 'text-neutral-900'}`}>{opt.label}</span>
                            <span className="text-[10px] text-neutral-500 font-medium text-center">{opt.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {perfilData.tamanhoResposta && (
                    <div className="mt-1 p-3 bg-white border border-neutral-200 rounded-lg animate-in slide-in-from-top-1">
                      <span className="text-tag font-bold text-neutral-400 uppercase">Resumo do Prompt de Volume</span>
                      <p className="text-small text-neutral-600 italic mt-1 leading-relaxed">
                        "{TAMANHO_RESPOSTA_PROMPTS[perfilData.tamanhoResposta]}"
                      </p>
                    </div>
                  )}
                </div>

                <div className="w-full h-[1px] bg-neutral-200"></div>

                <div className="flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center w-full">
                      <label className="text-body2 font-medium text-neutral-black">Palavras não permitidas</label>
                      <AiSuggestionButton
                        onClick={() => handleGenerateMessage('Palavras não permitidas', 'palavrasNaoPermitidas')}
                        disabled={isGeneratingMsg['palavrasNaoPermitidas']}
                        loading={isGeneratingMsg['palavrasNaoPermitidas']}
                      />
                    </div>
                    <TextInput
                      placeholder="Separe por vírgulas"
                      value={perfilData.palavrasNaoPermitidas}
                      onChange={(e) => setPerfilData({ ...perfilData, palavrasNaoPermitidas: e.target.value })}
                      containerClassName=""
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center w-full">
                      <label className="text-body2 font-medium text-neutral-black">Emojis permitidos</label>
                      <AiSuggestionButton
                        onClick={() => handleGenerateMessage('Emojis permitidos', 'emojisPermitidos')}
                        disabled={isGeneratingMsg['emojisPermitidos']}
                        loading={isGeneratingMsg['emojisPermitidos']}
                      />
                    </div>
                    <TextInput
                      placeholder="Ex: ✨, 🛍️, ✅"
                      value={perfilData.emojisPermitidos}
                      onChange={(e) => setPerfilData({ ...perfilData, emojisPermitidos: e.target.value })}
                      containerClassName=""
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px]">
              <h5 className="text-h5 font-bold text-[#09090B]">Mensagens Personalizadas</h5>
              <div className="box-border flex flex-col items-start p-4 gap-8 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[16px]">

                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center w-full">
                    <label className="text-body2 font-bold text-neutral-black">Mensagem de Boas-vindas</label>
                    <AiSuggestionButton
                      onClick={() => handleGenerateMessage('Boas-vindas', 'msgBoasVindas')}
                      disabled={isGeneratingMsg['msgBoasVindas']}
                      loading={isGeneratingMsg['msgBoasVindas']}
                    />
                  </div>
                  <TextArea
                    placeholder="Ex: Olá! Bem-vindo à Qrivo Store. Como posso ajudar você hoje?"
                    value={perfilData.msgBoasVindas}
                    onChange={(e) => setPerfilData({ ...perfilData, msgBoasVindas: e.target.value })}
                    containerClassName="min-h-[80px]"
                  />
                </div>

                <div className="w-full h-[1px] bg-neutral-200"></div>

                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center w-full">
                    <label className="text-body2 font-bold text-neutral-black">Confirmação de Compra</label>
                    <AiSuggestionButton
                      onClick={() => handleGenerateMessage('Confirmação de Compra', 'msgConfirmacaoCompra')}
                      disabled={isGeneratingMsg['msgConfirmacaoCompra']}
                      loading={isGeneratingMsg['msgConfirmacaoCompra']}
                    />
                  </div>
                  <TextArea
                    placeholder="Ex: Seu pedido foi recebido com sucesso! Estamos preparando tudo com carinho."
                    value={perfilData.msgConfirmacaoCompra}
                    onChange={(e) => setPerfilData({ ...perfilData, msgConfirmacaoCompra: e.target.value })}
                    containerClassName="min-h-[80px]"
                  />
                </div>

                <div className="w-full h-[1px] bg-neutral-200"></div>

                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center w-full">
                    <label className="text-body2 font-bold text-neutral-black">Transferência Humana</label>
                    <AiSuggestionButton
                      onClick={() => handleGenerateMessage('Transferência Humana', 'msgTransferenciaHumana')}
                      disabled={isGeneratingMsg['msgTransferenciaHumana']}
                      loading={isGeneratingMsg['msgTransferenciaHumana']}
                    />
                  </div>
                  <TextArea
                    placeholder="Ex: Vou transferir você para um de nossos especialistas humanos para ajudar com essa questão específica."
                    value={perfilData.msgTransferenciaHumana}
                    onChange={(e) => setPerfilData({ ...perfilData, msgTransferenciaHumana: e.target.value })}
                    containerClassName="min-h-[80px]"
                  />
                  <p className="text-xs text-neutral-500 mt-1 flex items-start gap-1">
                    <i className="ph-fill ph-info text-neutral-400 mt-0.5"></i>
                    <span>O agente ficará inativo para o cliente em questão e um membro humano da equipe deverá enviar mensagens manualmente pelo WhatsApp.</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Follow-Up Removed from here */}
          </div>
        );
      case 'followup':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px]">
              <div className="flex flex-row justify-between items-center w-full">
                <h5 className="text-h5 font-bold text-[#09090B]">Follow-Up Automático</h5>
                <Switch
                  checked={perfilData.followUpAtivo}
                  onChange={(val) => setPerfilData({ ...perfilData, followUpAtivo: val })}
                />
              </div>
              <div className={`box-border flex flex-col items-start p-4 gap-6 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[16px] transition-opacity ${perfilData.followUpAtivo ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <div className="flex flex-col gap-2">
                  <p className="text-body2 text-neutral-500 leading-relaxed">
                    Defina quando e quantas vezes o Agente deve tentar reengajar clientes que pararam de responder após o envio de uma mensagem.
                  </p>
                </div>

                <div className="flex flex-col gap-6 w-full">
                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-body2 font-bold text-neutral-black">Aguardar por</label>
                    <span className="text-body2 font-normal text-neutral-500">Tempo de espera antes de enviar a primeira mensagem de follow-up.</span>
                    <div className="flex gap-2 w-full">
                      <TextInput
                        type="number"
                        placeholder="Ex: 24"
                        value={perfilData.followUpTempo}
                        onChange={(e) => setPerfilData({ ...perfilData, followUpTempo: e.target.value })}
                        containerClassName="flex-1"
                      />
                      <Dropdown
                        label="Unidade"
                        value={perfilData.followUpUnidade}
                        onChange={(val) => setPerfilData({ ...perfilData, followUpUnidade: val })}
                        options={[
                          { label: 'Minutos', value: 'Minutos' },
                          { label: 'Horas', value: 'Horas' },
                          { label: 'Dias', value: 'Dias' }
                        ]}
                        className="w-[120px] !h-[34px]"
                        align="right"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-body2 font-bold text-neutral-black">Número de Tentativas</label>
                    <span className="text-body2 font-normal text-neutral-500">Quantas vezes a IA tentará retomar o contato.</span>
                    <TextInput
                      type="number"
                      placeholder="Ex: 3"
                      value={perfilData.followUpTentativas}
                      onChange={(e) => setPerfilData({ ...perfilData, followUpTentativas: e.target.value })}
                      containerClassName="w-full"
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-body2 font-bold text-neutral-black">Intervalo de Tempo</label>
                    <span className="text-body2 font-normal text-neutral-500">Tempo de espera entre cada tentativa de contato subsequente.</span>
                    <div className="flex gap-2 w-full">
                      <TextInput
                        type="number"
                        placeholder="Ex: 24"
                        value={perfilData.followUpIntervaloTempo}
                        onChange={(e) => setPerfilData({ ...perfilData, followUpIntervaloTempo: e.target.value })}
                        containerClassName="flex-1"
                      />
                      <Dropdown
                        label="Unidade"
                        value={perfilData.followUpIntervaloUnidade}
                        onChange={(val) => setPerfilData({ ...perfilData, followUpIntervaloUnidade: val })}
                        options={[
                          { label: 'Minutos', value: 'Minutos' },
                          { label: 'Horas', value: 'Horas' },
                          { label: 'Dias', value: 'Dias' }
                        ]}
                        className="w-[120px] !h-[34px]"
                        align="right"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'whatsapp':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className={`
              flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl gap-6 border transition-all duration-300
              ${isWhatsappConnected
                ? 'bg-primary-50 border-primary-500'
                : 'bg-neutral-25 border-neutral-200'}
            `}>
              <div className="flex items-center gap-5">
                <div className={`
                  w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-small flex-none transition-colors
                  ${isWhatsappConnected ? 'text-[#25D366]' : 'text-neutral-300'}
                `}>
                  <i className={`ph-fill ph-whatsapp-logo text-4xl`}></i>
                </div>
                <div className="flex flex-col gap-0.5">
                  <h4 className="text-body1 font-bold text-neutral-900 leading-tight">
                    {isWhatsappConnected ? 'WhatsApp conectado com sucesso!' : 'WhatsApp aguardando conexão'}
                  </h4>
                  <p className="text-body2 text-neutral-600">
                    {isWhatsappConnected ? (
                      <>Seu número <span className="font-bold text-neutral-900">{whatsappPhoneNumber}</span> está pronto para trabalhar.</>
                    ) : (
                      'Conecte seu celular para que o Vendedor IA possa atender seus clientes.'
                    )}
                  </p>
                </div>
              </div>

              {isWhatsappConnected ? (
                <Button
                  variant="danger"
                  className="!h-[36px] w-full sm:w-auto px-8 font-bold"
                  onClick={() => setIsDisconnectWhatsappModalOpen(true)}
                >
                  Desconectar
                </Button>
              ) : (
                <Button
                  variant="primary"
                  className="!h-[36px] w-full sm:w-auto px-8 shadow-sm font-bold"
                  onClick={handleOpenConnectModal}
                >
                  Conectar Agora
                </Button>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <h3 className="text-body1 font-bold text-neutral-black">Como integrar o seu vendedor com o WhatsApp?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 1, title: 'Clique em "Conectar Agora"', desc: 'Insira o número de WhatsApp válido que deseja conectar ao seu Vendedor IA.', icon: 'ph-qr-code' },
                  { id: 2, title: 'Abra o WhatsApp', desc: 'Acesse Configurações no seu celular e clique em Dispositivos Conectados.', icon: 'ph-device-mobile' },
                  { id: 3, title: 'Conecte um dispositivo', desc: 'Toque em Conectar dispositivo e leia o QR Code gerado no painel.', icon: 'ph-scan' },
                  { id: 4, title: 'Teste a conexão', desc: 'Após a leitura, clique em Testar Conexão para validar a integração.', isLast: true }
                ].map((step) => (
                  <div key={step.id} className="flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden group shadow-small hover:shadow-cards transition-all">
                    <div className="aspect-[4/3] bg-neutral-50 flex items-center justify-center relative p-6">
                      {step.isLast ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-small transition-colors ${isWhatsappConnected ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-300'}`}>
                            <i className={`ph-fill ${isWhatsappConnected ? 'ph-check-circle' : 'ph-clock'} text-3xl`}></i>
                          </div>
                          <Button variant="neutral" className={`!h-[36px] shadow-lg !bg-[#084A44] ${!isWhatsappConnected ? 'opacity-50 pointer-events-none' : ''}`}>Testar</Button>
                        </div>
                      ) : (
                        <div className="w-full h-full border-2 border-neutral-200 rounded-xl bg-white shadow-inner flex flex-col items-center justify-center gap-3 p-4 group-hover:border-primary-200 transition-colors">
                          <i className={`ph ${step.icon} text-4xl text-neutral-300 group-hover:text-primary-500 transition-all`}></i>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-neutral-900 text-white text-[10px] font-black flex items-center justify-center">{step.id}</div>
                    </div>
                    <div className="p-4 flex flex-col gap-1">
                      <h5 className="text-body2 font-bold text-neutral-black leading-tight">{step.title}</h5>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="text-body1 font-bold text-neutral-black">Dúvidas Frequentes sobre a Conexão</h3>
              <div className="flex flex-col gap-2 bg-neutral-25 border border-neutral-200 rounded-2xl overflow-hidden shadow-small p-1.5">
                {[
                  { id: 1, title: 'QR Code expirou ou não está funcionando.', text: 'O QR Code de conexão tem validade curta. Se expirar, basta atualizar a página e gerar um novo.' },
                  { id: 2, title: 'O WhatsApp está solicitando um código.', text: 'Isso ocorre se você tentar conectar via notificação. Use sempre o QR Code no menu Dispositivos Conectados do seu celular.' },
                  { id: 3, title: 'IA não responde após conectar.', text: 'Verifique se o Modo de Funcionamento permite respostas no horário atual e se a IA tem produtos cadastrados no catálogo.' }
                ].map((item) => (
                  <div key={item.id} className="border-b last:border-b-0 border-neutral-100 bg-white">
                    <button
                      onClick={() => setWhatsappAccordion(whatsappAccordion === item.id ? null : item.id)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="text-body2 font-bold text-neutral-900">{item.title}</span>
                      <i className={`ph ph-caret-down text-neutral-400 transition-transform ${whatsappAccordion === item.id ? 'rotate-180' : ''}`}></i>
                    </button>
                    {whatsappAccordion === item.id && (
                      <div className="p-4 pt-0 text-body2 text-neutral-600 leading-relaxed animate-in slide-in-from-top-1">
                        {item.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'funcionamento':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px]">
              <h5 className="text-h5 font-bold text-[#09090B]">Horário de Funcionamento do Agente</h5>
              <div className="box-border flex flex-col items-start p-6 gap-8 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[16px]">
                <div className="flex flex-col gap-2 w-full">
                  <label className="text-body2 font-bold text-neutral-black">Quando o agente deve atuar?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    {MODOS_FUNCIONAMENTO.map((opt) => {
                      const isSelected = perfilData.modoFuncionamento === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setPerfilData({ ...perfilData, modoFuncionamento: opt.id })}
                          className={`
                            flex flex-col items-center justify-center p-4 gap-2 rounded-xl border transition-all relative group
                            ${isSelected
                              ? 'bg-secondary-50 border-secondary-500 ring-2 ring-secondary-100'
                              : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-small'}
                          `}
                        >
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center transition-all
                            ${isSelected ? 'bg-secondary-500 text-white' : 'bg-neutral-50 text-neutral-400 group-hover:text-neutral-600'}
                          `}>
                            <i className={`${opt.icon} text-xl`}></i>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className={`text-body2 font-bold ${isSelected ? 'text-secondary-700' : 'text-neutral-900'}`}>{opt.label}</span>
                            <span className="text-[10px] text-neutral-500 font-medium text-center">{opt.desc}</span>
                          </div>
                          <div className={`mt-2 text-[9px] font-bold uppercase tracking-tight text-center px-2 py-1 rounded leading-tight ${isSelected ? 'bg-secondary-200 text-secondary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                            {opt.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(perfilData.modoFuncionamento === 'ForaComercial' || perfilData.modoFuncionamento === 'HorarioComercial') && (
                  <div className="flex flex-col gap-4 w-full animate-in slide-in-from-top-4 duration-300">
                    <div className="w-full h-[1px] bg-neutral-200"></div>
                    <div className="flex flex-col gap-2">
                      <label className="text-body2 font-bold text-neutral-black">Gerenciar Horário</label>
                      <p className="text-small text-neutral-500">Defina o intervalo de tempo em que a IA deve assumir o atendimento.</p>
                    </div>
                    <div className="flex flex-row gap-6 w-full">
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-body2 font-medium text-neutral-black">Início</label>
                        <TextInput
                          type="time"
                          value={perfilData.horaInicio}
                          onChange={(e) => setPerfilData({ ...perfilData, horaInicio: e.target.value })}
                          containerClassName=""
                        />
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-body2 font-medium text-neutral-black">Fim</label>
                        <TextInput
                          type="time"
                          value={perfilData.horaFim}
                          onChange={(e) => setPerfilData({ ...perfilData, horaFim: e.target.value })}
                          containerClassName=""
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 'treinamento':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px] self-stretch">
              <div className="flex justify-between items-center w-full">
                <h5 className="text-h5 font-bold text-[#09090B]">Conhecimento do Agente (FAQs)</h5>
              </div>
              <div className="flex flex-col gap-4 w-full">
                {faqs.length > 0 ? (
                  faqs.map((faq) => (
                    <div key={faq.id} className="p-4 bg-white border border-[#DDDDD5] rounded-xl flex flex-col gap-4 shadow-small group transition-all hover:border-primary-200">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <Badge variant="neutral">{faq.category}</Badge>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconButton variant="edit" icon="ph-pencil-simple" onClick={() => handleOpenFaqModal(faq)} title="Editar" />
                            <IconButton variant="delete" icon="ph-trash" onClick={() => handleDeleteFaqClick(faq)} title="Excluir" />
                          </div>
                        </div>
                        <p className="text-body2 font-bold text-neutral-900">{faq.question}</p>
                        <p className="text-small text-neutral-600 leading-relaxed bg-neutral-25 p-3 rounded-lg border border-neutral-100">{faq.answer}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-500 w-full bg-white border border-neutral-200 rounded-[16px] shadow-small">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 text-neutral-300">
                      <i className="ph ph-chat-circle-dots text-3xl"></i>
                    </div>
                    <div className="max-w-[320px] flex flex-col gap-1">
                      <h4 className="text-body2 font-bold text-neutral-900">Nenhum FAQ cadastrada</h4>
                      <p className="text-small text-neutral-500">Adicione perguntas frequentes.</p>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => handleOpenFaqModal()} className="flex flex-row justify-center items-center gap-2 w-full h-[34px] bg-white border border-[#E8E8E3] shadow-small rounded-[8px] text-body2 font-medium">
                <i className="ph ph-plus text-base"></i> Nova FAQ
              </button>
            </div>
          </div>
        );
      case 'entrega':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px] self-stretch">
              <h5 className="text-h5 font-bold text-[#09090B]">Áreas de Entrega</h5>
              <div className="flex flex-col gap-4 w-full">
                {deliveryAreas.length > 0 ? (
                  deliveryAreas.map((area) => (
                    <div key={area.id} className="box-border flex flex-col items-start p-4 gap-6 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-small rounded-[16px]">
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-body2 font-medium text-neutral-black">Nome da Área</label>
                          <span className="text-body2 font-normal text-neutral-500">Dê um nome para esta área ou modalidade de entrega.</span>
                        </div>
                        <TextInput value={area.name} onChange={(e) => handleUpdateDeliveryArea(area.id, 'name', e.target.value)} containerClassName="" placeholder="Ex: Entrega Padrão" />
                      </div>
                      <div className="flex flex-row gap-6 w-full">
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-body2 font-medium text-neutral-black">Preço</label>
                            <span className="text-body2 font-normal text-neutral-500">Valor cobrado pela entrega.</span>
                          </div>
                          <TextInput value={area.price} onChange={(e) => handleDeliveryPriceChange(area.id, e.target.value)} containerClassName="" />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-body2 font-medium text-neutral-black">Prazo</label>
                            <span className="text-body2 font-normal text-neutral-500">Tempo estimado (ex: 30-50).</span>
                          </div>
                          <div className="flex gap-2">
                            <TextInput
                              value={area.time.replace(/\s(Minutos|Horas|Dias)$/, '').trim()}
                              onChange={(e) => {
                                const currentUnit = area.time.match(/(Minutos|Horas|Dias)$/)?.[0] || 'Minutos';
                                handleUpdateDeliveryArea(area.id, 'time', `${e.target.value} ${currentUnit}`);
                              }}
                              containerClassName="flex-1"
                              placeholder="Ex: 30"
                            />
                            <Dropdown
                              label="Unidade"
                              value={area.time.match(/(Minutos|Horas|Dias)$/)?.[0] || 'Minutos'}
                              onChange={(val) => {
                                const currentValue = area.time.replace(/\s(Minutos|Horas|Dias)$/, '').trim();
                                handleUpdateDeliveryArea(area.id, 'time', `${currentValue} ${val}`);
                              }}
                              options={[
                                { label: 'Minutos', value: 'Minutos' },
                                { label: 'Horas', value: 'Horas' },
                                { label: 'Dias', value: 'Dias' }
                              ]}
                              className="w-[110px] !h-[34px]"
                              align="right"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-body2 font-medium text-neutral-black">Locais</label>
                          <span className="text-body2 font-normal text-neutral-500">Liste os bairros, cidade e estados separados por vírgula.</span>
                        </div>
                        <div className="box-border flex flex-wrap items-center p-1.5 gap-1.5 min-h-[36px] bg-white border border-neutral-200 rounded-md focus-within:border-neutral-900 transition-all shadow-sm">
                          {Array.isArray(area.regions) && area.regions.map((region, idx) => (
                            <Badge key={idx} variant="neutral" className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 !px-1.5 !py-0.5 !rounded-md text-[12px] font-medium text-neutral-700">
                              {region}
                              <button
                                onClick={() => {
                                  const newRegions = area.regions.filter((_, i) => i !== idx);
                                  handleUpdateDeliveryArea(area.id, 'regions', newRegions);
                                }}
                                className="text-neutral-400 hover:text-neutral-900 transition-colors ml-1"
                              >
                                <i className="ph-bold ph-x text-[10px]"></i>
                              </button>
                            </Badge>
                          ))}
                          <input
                            className="flex-1 bg-transparent border-none text-[13px] font-medium text-neutral-black placeholder:text-neutral-400 focus:outline-none min-w-[120px] h-[24px]"
                            placeholder={area.regions.length === 0 ? "Ex: Centro, Bela Vista, Jardins" : "Adicionar local..."}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                const val = e.currentTarget.value.trim();
                                if (val) {
                                  const newRegions = [...(area.regions || []), val];
                                  handleUpdateDeliveryArea(area.id, 'regions', newRegions);
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                            onBlur={(e) => {
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                const newRegions = [...(area.regions || []), val];
                                handleUpdateDeliveryArea(area.id, 'regions', newRegions);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between w-full mt-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleDuplicateDeliveryArea(area.id)}
                          className="!h-[32px] text-xs px-3"
                          leftIcon="ph ph-copy"
                        >
                          Duplicar
                        </Button>
                        <IconButton variant="delete" icon="ph-trash" onClick={() => handleDeleteDeliveryArea(area.id)} title="Excluir" size="md" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-500 w-full bg-white border border-neutral-200 rounded-[16px] shadow-small">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 text-neutral-300">
                      <i className="ph ph-map-pin text-3xl"></i>
                    </div>
                    <div className="max-w-[320px] flex flex-col gap-1">
                      <h4 className="text-body2 font-bold text-neutral-900">Nenhuma área de entrega</h4>
                      <p className="text-small text-neutral-500">Cadastre regiões, preços e prazos.</p>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={handleAddDeliveryArea}
                className="w-full !h-[34px]"
                leftIcon="ph ph-plus"
                disabled={deliveryAreas.some(area => !area.name || !area.price || !area.time || area.regions.length === 0)}
              >
                Nova Área
              </Button>
            </div>
          </div>
        );
      case 'pagamento':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px] self-stretch">
              <h5 className="text-h5 font-bold text-[#09090B]">Formas de Pagamentos</h5>
              <div className="flex flex-col gap-4 w-full">
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((method) => (
                    <div key={method.id} className="box-border flex flex-col items-start p-4 gap-6 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-small rounded-[16px]">
                      <div className="flex flex-row gap-6 w-full">
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-body2 font-medium text-neutral-black">Nome</label>
                            <span className="text-body2 font-normal text-neutral-500">Nome exibido no checkout (ex: Pix com Desconto).</span>
                          </div>
                          <TextInput value={method.name} onChange={(e) => handleUpdatePaymentMethod(method.id, 'name', e.target.value)} containerClassName="" placeholder="Ex: Pix da Loja" />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-body2 font-medium text-neutral-black">Modo</label>
                            <span className="text-body2 font-normal text-neutral-500">Tipo de processamento do pagamento.</span>
                          </div>
                          <Dropdown
                            label="Selecione"
                            value={method.mode}
                            onChange={(v) => handleUpdatePaymentMethod(method.id, 'mode', v)}
                            options={[
                              { label: 'Pix', value: 'pix' },
                              { label: 'Transferência Bancária', value: 'transfer' },
                              { label: 'Cartão de Crédito', value: 'credit_card' },
                              { label: 'Cartão de Débito', value: 'debit_card' },
                              { label: 'Boleto', value: 'boleto' },
                              { label: 'Voucher / Vale', value: 'voucher' },
                              { label: 'Dinheiro', value: 'cash' },
                              { label: 'Outro', value: 'other' }
                            ]}
                            className=""
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-body2 font-medium text-neutral-black">Instruções</label>
                          <span className="text-body2 font-normal text-neutral-500">Orientações para o cliente realizar o pagamento.</span>
                        </div>
                        <TextArea
                          value={method.instructions}
                          onChange={(e) => handleUpdatePaymentMethod(method.id, 'instructions', e.target.value)}
                          containerClassName="!min-h-[100px]"
                          placeholder="Ex: Chave Pix: 00.000.000/0001-00&#10;Titular: Minha Loja LTDA&#10;Envie o comprovante..."
                        />
                      </div>
                      <div className="flex justify-between w-full mt-2">
                        <Button
                          variant="secondary"
                          onClick={() => handleDuplicatePaymentMethod(method.id)}
                          className="!h-[32px] text-xs px-3"
                          leftIcon="ph ph-copy"
                        >
                          Duplicar
                        </Button>
                        <IconButton variant="delete" icon="ph-trash" onClick={() => handleDeletePaymentMethod(method.id)} title="Excluir" size="md" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-500 w-full bg-white border border-neutral-200 rounded-[16px] shadow-small">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 text-neutral-300">
                      <i className="ph ph-wallet text-3xl"></i>
                    </div>
                    <div className="max-w-[320px] flex flex-col gap-1">
                      <h4 className="text-body2 font-bold text-neutral-900">Nenhuma forma de pagamento</h4>
                      <p className="text-small text-neutral-500">Cadastre Pix, cartões ou outras opções.</p>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={handleAddPaymentMethod}
                className="w-full !h-[34px]"
                leftIcon="ph ph-plus"
                disabled={paymentMethods.some(m => !m.name || !m.mode || !m.instructions)}
              >
                Nova Forma de Pagamento
              </Button>
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
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 bg-primary-100 border border-primary-500 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <i className="ph ph-check-circle ph-fill text-primary-600 text-xl"></i>
          <span className="text-body1 font-bold text-primary-900">{toast.message}</span>
        </div>
      )}

      <div className="fixed bottom-6 right-6 z-[140]">
        <button
          onClick={() => setIsTestWidgetOpen(!isTestWidgetOpen)}
          className={`flex items-center gap-3 px-6 h-[34px] rounded-full shadow-lg transition-all ${isTestWidgetOpen ? 'bg-secondary-900 text-white' : 'bg-primary-500 text-white'}`}
        >
          {isTestWidgetOpen ? <i className="ph ph-x ph-bold text-xl"></i> : <><i className="ph-fill ph-robot text-2xl"></i><span className="text-body1 font-bold">Testar Agente</span></>}
        </button>
      </div>

      <AgentTestWidget
        isOpen={isTestWidgetOpen}
        onClose={() => setIsTestWidgetOpen(false)}
        config={{
          agentName: perfilData.agenteNome,
          storeName: perfilData.empresaNome,
          style: perfilData.estiloComunicacao,
          stylePrompt: ESTILOS_PROMPTS[perfilData.estiloComunicacao] || '',
          responseVolume: perfilData.tamanhoResposta,
          prohibitedWords: perfilData.palavrasNaoPermitidas,
          allowedEmojis: perfilData.emojisPermitidos,
          welcomeMsg: perfilData.msgBoasVindas,
          faqs: faqs.map(f => ({ question: f.question, answer: f.answer }))
        }}
      />

      <header className="flex flex-col w-full bg-white flex-none border-b border-neutral-200">
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[12px] lg:gap-[16px] w-full min-h-[64px] lg:min-h-[72px]">
          <div className="flex flex-col items-start p-0 gap-[1px] flex-1 overflow-hidden">
            <h1 className="text-h4 font-bold text-neutral-black tracking-tight m-0 truncate w-full">Vendedor IA</h1>
            <p className="hidden sm:block text-body2 font-normal text-neutral-500 m-0 truncate w-full">Configure o comportamento e conhecimento do seu agente de vendas.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 mr-4 border-r border-neutral-200 pr-6 h-[24px]">
              <Switch
                checked={isAgentActive}
                onChange={handleToggleAgent}
                disabled={!agentId || isSaving}
              />
              <span className={`text-body2 font-medium ${isAgentActive ? 'text-success-600' : 'text-neutral-500'}`}>
                {isAgentActive ? 'Agente Ativo' : 'Agente Inativo'}
              </span>
            </div>
            <div className="flex flex-col items-end justify-center">
              {saveStatus === 'pending' && <span className="text-body2 font-normal text-neutral-700">Atualização Pendente</span>}
              {saveStatus === 'saving' && <span className="text-body2 font-normal text-neutral-700">Salvando...</span>}
              {saveStatus === 'saved' && <span className="text-body2 font-normal text-neutral-700">Salvo</span>}
              {saveStatus === 'error' && <span className="text-body2 font-normal text-danger-500">Erro ao salvar</span>}
            </div>
            <Button
              variant="primary"
              className="!h-[36px] shadow-sm px-6 font-bold"
              onClick={() => handleSaveAll(false)}
              disabled={isSaving || isLoading}
              leftIcon="ph-check"
            >
              {isSaving ? 'Salvando...' : 'Salvar Dados'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-white">
        <div className="w-full lg:w-[240px] p-4 lg:p-8 bg-white border-b lg:border-b-0 lg:border-r border-neutral-100 flex-none flex flex-col items-center">
          <nav className="flex flex-col gap-1 w-full max-w-[240px] bg-neutral-50 p-1.5 rounded-2xl border border-neutral-100">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  className={`
                    flex items-center gap-3 px-4 h-[36px] rounded-xl transition-all whitespace-nowrap w-full group
                    ${isActive
                      ? 'bg-secondary-700 text-white shadow-small'
                      : 'text-neutral-black hover:bg-neutral-100'}
                  `}
                >
                  <i className={`ph ${isActive ? 'ph-fill' : 'ph-bold'} ${tab.icon} text-lg transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-neutral-700'}`}></i>
                  <span className={`text-body2 leading-none ${isActive ? 'font-bold' : 'font-medium'}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 flex flex-col items-center">
          <div className="max-w-[880px] w-full">
            {renderTabContent()}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDisconnectWhatsappModalOpen}
        onClose={() => setIsDisconnectWhatsappModalOpen(false)}
        title={<span className="text-body1 font-bold text-neutral-900">Desconectar WhatsApp</span>}
        maxWidth="400px"
        footer={
          <div className="flex gap-3">
            <Button variant="danger" className="flex-1 !h-[34px] shadow-sm" onClick={handleDisconnectWhatsapp}>Desconectar</Button>
            <Button variant="secondary" className="flex-1 !h-[34px]" onClick={() => setIsDisconnectWhatsappModalOpen(false)}>Cancelar</Button>
          </div>
        }
      >
        <p className="text-body2 text-neutral-700">
          Tem certeza que deseja desconectar? O Vendedor IA deixará de responder neste número.
        </p>
      </Modal>

      <Modal
        isOpen={isConnectWhatsappModalOpen}
        onClose={() => {
          setIsConnectWhatsappModalOpen(false);
          setWhatsappQrCode('');
          setWhatsappConnectionStep(1);
          setIsConnectingWhatsapp(false);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          if (qrRefreshIntervalRef.current) clearInterval(qrRefreshIntervalRef.current);
        }}
        title={<span className="text-body1 font-bold text-neutral-900">Conectar WhatsApp</span>}
        maxWidth="500px"
        footer={null}
      >
        <div className="flex flex-col gap-6">
          {whatsappConnectionStep === 1 && (
            <>
              <div className="flex flex-col gap-5">
                <p className="text-body2 text-neutral-600 leading-relaxed">
                  Insira o número do WhatsApp que será utilizado pelo Vendedor IA.
                  Certifique-se de que o número está correto e ativo.
                </p>
                <div className="flex flex-col gap-2">
                  <label className="text-body2 font-bold text-neutral-black">Número do WhatsApp</label>
                  <div className="flex gap-2">
                    <Dropdown
                      label="DDI"
                      value={whatsappDdi}
                      onChange={(val) => setWhatsappDdi(val)}
                      options={[
                        { label: '🇧🇷 +55', value: '+55' },
                        { label: '🇺🇸 +1', value: '+1' },
                        { label: '🇵🇹 +351', value: '+351' },
                        { label: '🇦🇴 +244', value: '+244' },
                        { label: '🇲🇿 +258', value: '+258' },
                        { label: '🇨🇻 +238', value: '+238' },
                      ]}
                      className="w-[120px]"
                      allowClear={false}
                    />
                    <TextInput
                      value={whatsappPhoneNumber}
                      onChange={(e) => setWhatsappPhoneNumber(e.target.value)}
                      placeholder="99999-9999"
                      containerClassName="flex-1"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-400 font-medium">Formato: DDD + Número (ex: 11999999999)</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <Button variant="secondary" className="flex-1 !h-[34px]" onClick={() => setIsConnectWhatsappModalOpen(false)}>Cancelar</Button>
                <Button
                  variant="primary"
                  className="flex-1 !h-[34px] shadow-sm"
                  onClick={handleStartWhatsappConnection}
                  isLoading={isConnectingWhatsapp}
                  disabled={!whatsappPhoneNumber || whatsappPhoneNumber.length < 8}
                >
                  Gerar QR Code
                </Button>
              </div>
            </>
          )}

          {whatsappConnectionStep === 2 && (
            <div className="flex flex-col items-center justify-center gap-6 py-4">
              {whatsappQrCode ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white border border-neutral-200 rounded-xl shadow-small">
                    {/* Check if base64 includes prefix, generic handler */}
                    <img
                      src={whatsappQrCode.startsWith('data:') ? whatsappQrCode : `data:image/png;base64,${whatsappQrCode}`}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64"
                    />
                  </div>
                  <div className="flex flex-col items-center text-center gap-2 max-w-sm">
                    <h5 className="text-body1 font-bold text-neutral-900">Escaneie o QR Code</h5>
                    <p className="text-small text-neutral-500">
                      Abra o WhatsApp no seu celular, vá em <strong>Aparelhos conectados {'>'} Conectar aparelho</strong> e aponte a câmera.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full text-xs font-bold animate-pulse">
                    <i className="ph-fill ph-spinner animate-spin"></i>
                    Aguardando conexão...
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <i className="ph ph-spinner animate-spin text-4xl text-primary-500"></i>
                  <p className="text-body2 text-neutral-500">Gerando instância e QR Code...</p>
                </div>
              )}
            </div>
          )}
          {whatsappConnectionStep === 3 && (
            <div className="flex flex-col items-center justify-center gap-6 py-6">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                <i className="ph-fill ph-check-circle text-5xl"></i>
              </div>
              <div className="text-center flex flex-col gap-2">
                <h4 className="text-h5 font-bold text-neutral-900">WhatsApp Conectado!</h4>
                <p className="text-body2 text-neutral-500">Seu Vendedor IA já está pronto para atender no WhatsApp.</p>
              </div>
              <Button variant="primary" className="w-full" onClick={() => setIsConnectWhatsappModalOpen(false)}>
                Concluir
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        title={<span className="text-body1 font-bold text-neutral-900">{editingFaq ? "Editar FAQ" : "Nova FAQ"}</span>}
        footer={<div className="flex gap-3"><Button variant="secondary" className="flex-1 !h-[34px]" onClick={() => setIsFaqModalOpen(false)}>Cancelar</Button><Button variant="primary" className="flex-1 !h-[34px] shadow-sm" onClick={handleSaveFaq}>Salvar</Button></div>}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">Categoria</label>
            <Dropdown label="Selecione" value={faqFormData.category} onChange={(val) => setFaqFormData({ ...faqFormData, category: val })} options={FAQ_CATEGORIES} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">Pergunta</label>
            <TextInput placeholder="Ex: Qual o prazo?" value={faqFormData.question} onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center w-full">
              <label className="text-body2 font-bold text-neutral-black">Resposta</label>
              <AiSuggestionButton
                onClick={handleGenerateFaqAnswer}
                disabled={isGeneratingMsg['faqAnswer']}
                loading={isGeneratingMsg['faqAnswer']}
              />
            </div>
            <TextArea placeholder="Resposta..." value={faqFormData.answer} onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })} containerClassName="min-h-[120px]" />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteFaqModalOpen}
        onClose={() => setIsDeleteFaqModalOpen(false)}
        title={<span className="text-body1 font-bold text-neutral-900">Excluir FAQ</span>}
        maxWidth="400px"
        footer={<div className="flex gap-3"><Button variant="danger" className="flex-1 !h-[34px]" onClick={confirmDeleteFaq}>Excluir</Button><Button variant="secondary" className="flex-1 !h-[34px]" onClick={() => setIsDeleteFaqModalOpen(false)}>Cancelar</Button></div>}
      >
        <p className="text-body2 text-neutral-700">Tem certeza que deseja excluir esta FAQ?</p>
      </Modal>
    </div >
  );
};
