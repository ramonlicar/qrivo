
import React, { useState, useEffect } from 'react';
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
import { DisconnectWhatsappModal } from './DisconnectWhatsappModal';
import { ConnectWhatsappModal } from './ConnectWhatsappModal';

const ESTILOS_PROMPTS: Record<string, string> = {
  'Amigável': 'Use um tom acolhedor, trate o cliente pelo nome sempre que possível e utilize emojis de brilho e sorrisos. Seja paciente e mostre empatia genuína.',
  'Profissional': 'Seja direto, eficiente e educado. Use vocabulário padrão, evite gírias e foque em resolver a dúvida do cliente com precisão técnica.',
  'Descontraído': 'Use uma linguagem leve, pode utilizar gírias comuns do nicho e emojis divertidos. Trate o cliente como um amigo próximo da marca.',
  'Elegante': 'Utilize um vocabulário rico e sofisticado. Mantenha um distanciamento respeitoso, transmitindo exclusividade e autoridade no segmento de luxo.'
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
  regions: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  mode: string;
  instructions: string;
}

export const VendedorIA: React.FC = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [isGeneratingDescLoja, setIsGeneratingDescLoja] = useState(false);
  const [isGeneratingMsg, setIsGeneratingMsg] = useState<Record<string, boolean>>({});
  const [isTestWidgetOpen, setIsTestWidgetOpen] = useState(false);

  // Estados WhatsApp
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(true);
  const [isDisconnectWhatsappModalOpen, setIsDisconnectWhatsappModalOpen] = useState(false);
  const [isConnectWhatsappModalOpen, setIsConnectWhatsappModalOpen] = useState(false);
  const [whatsappAccordion, setWhatsappAccordion] = useState<number | null>(null);

  // Estados para FAQ
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: '1',
      category: 'Devoluções',
      question: 'Como funciona a troca de produtos?',
      answer: 'Você tem até 7 dias após o recebimento para solicitar a troca via WhatsApp. O produto deve estar com a etiqueta original e sem sinais de uso.'
    }
  ]);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isDeleteFaqModalOpen, setIsDeleteFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);
  const [faqFormData, setFaqFormData] = useState({ category: 'Outros', question: '', answer: '' });

  // Estados para Entrega
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([
    { id: '1', name: 'Região Principal', price: 'R$ 15,00', time: 'Receba em até 24h', regions: 'Mooca, São Paulo, Rio de Janeiro, Brasil' }
  ]);

  // Estados para Pagamento
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      name: 'Pix da Loja',
      mode: 'Pix',
      instructions: 'Chave Pix: 00.000.000/0001-18\nTitular: Minha Empresa LTDA\nApós o pagamento envie o comprovante por whatsapp'
    }
  ]);

  // Estado do Toast
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' });

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
    followUpTentativas: '3',
    modoFuncionamento: 'Sempre',
    horaInicio: '08:00',
    horaFim: '18:00',
    cepOrigem: '01001-000'
  });

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: 'ph-user-circle' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'ph-whatsapp-logo' },
    { id: 'funcionamento', label: 'Funcionamento', icon: 'ph-clock' },
    { id: 'treinamento', label: 'Treinamento', icon: 'ph-graduation-cap' },
    { id: 'entrega', label: 'Entrega', icon: 'ph-truck' },
    { id: 'pagamento', label: 'Pagamento', icon: 'ph-wallet' }
  ];

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

  const handleGenerateMessage = async (type: 'Boas-vindas' | 'Confirmação de Compra' | 'Transferência Humana', field: keyof typeof perfilData) => {
    setIsGeneratingMsg(prev => ({ ...prev, [field]: true }));
    try {
      const prompt = `Como um vendedor chamado ${perfilData.agenteNome} da loja ${perfilData.empresaNome} (${perfilData.areaAtuacao}), crie uma mensagem de ${type} curta e eficaz para WhatsApp. 
      Estilo: ${perfilData.estiloComunicacao}. 
      Emojis permitidos: ${perfilData.emojisPermitidos}.
      Retorne apenas o texto da mensagem.`;

      const text = await aiService.generateContent(prompt);
      setPerfilData(prev => ({ ...prev, [field]: text || '' }));
    } catch (error: any) {
      console.error(`Erro ao gerar mensagem de ${type}:`, error);
      if (error.message === "LIMIT_EXCEEDED") {
        alert("Limite de uso da IA excedido. Tente novamente mais tarde.");
      }
    } finally {
      setIsGeneratingMsg(prev => ({ ...prev, [field]: false }));
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

  const handleSaveFaq = () => {
    if (!faqFormData.question || !faqFormData.answer) {
      alert("Pergunta e resposta são obrigatórias.");
      return;
    }

    if (editingFaq) {
      setFaqs(faqs.map(f => f.id === editingFaq.id ? { ...f, ...faqFormData } : f));
      showToast("FAQ atualizada com sucesso!");
    } else {
      const newFaq = { id: Date.now().toString(), ...faqFormData };
      setFaqs([newFaq, ...faqs]);
      showToast("Nova FAQ cadastrada!");
    }
    setIsFaqModalOpen(false);
  };

  const handleDeleteFaqClick = (faq: FAQ) => {
    setFaqToDelete(faq);
    setIsDeleteFaqModalOpen(true);
  };

  const confirmDeleteFaq = () => {
    if (faqToDelete) {
      setFaqs(faqs.filter(f => f.id !== faqToDelete.id));
      showToast("FAQ removida com sucesso.");
    }
    setIsDeleteFaqModalOpen(false);
    setFaqToDelete(null);
  };

  // Delivery Handlers
  const handleAddDeliveryArea = () => {
    const newArea: DeliveryArea = {
      id: Date.now().toString(),
      name: '',
      price: formatCurrency(0),
      time: '',
      regions: ''
    };
    setDeliveryAreas([...deliveryAreas, newArea]);
  };

  const handleUpdateDeliveryArea = (id: string, field: keyof DeliveryArea, value: string) => {
    setDeliveryAreas(deliveryAreas.map(area => area.id === id ? { ...area, [field]: value } : area));
  };

  const handleDeliveryPriceChange = (id: string, rawValue: string) => {
    const cleanValue = rawValue.replace(/\D/g, '');
    const numericValue = Number(cleanValue) / 100;
    handleUpdateDeliveryArea(id, 'price', formatCurrency(numericValue));
  };

  const handleDeleteDeliveryArea = (id: string) => {
    setDeliveryAreas(deliveryAreas.filter(area => area.id !== id));
    showToast("Área de entrega removida.");
  };

  // Payment Handlers
  const handleAddPaymentMethod = () => {
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      name: '',
      mode: '',
      instructions: ''
    };
    setPaymentMethods([...paymentMethods, newMethod]);
  };

  const handleUpdatePaymentMethod = (id: string, field: keyof PaymentMethod, value: string) => {
    setPaymentMethods(paymentMethods.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const handleDeletePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(m => m.id !== id));
    showToast("Método de pagamento removido.");
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
                      containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                    />
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <label className="text-body2 font-medium text-neutral-black">Área de Atuação</label>
                    <Dropdown
                      label="Selecione"
                      value={perfilData.areaAtuacao}
                      onChange={(val) => setPerfilData({ ...perfilData, areaAtuacao: val })}
                      options={[
                        { label: 'Moda e Acessórios', value: 'Moda e Acessórios' },
                        { label: 'Eletrônicos', value: 'Eletrônicos' },
                        { label: 'Casa e Decoração', value: 'Casa e Decoração' },
                        { label: 'Alimentação', value: 'Alimentação' },
                        { label: 'Beleza e Cosméticos', value: 'Beleza e Cosméticos' }
                      ]}
                      className="!h-[34px]"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center w-full">
                    <label className="text-body2 font-medium text-neutral-black">Descrição da Loja</label>
                    <button
                      onClick={handleGenerateDescLoja}
                      disabled={isGeneratingDescLoja}
                      className="flex items-center gap-1.5 px-2 py-0.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg text-tag font-bold transition-all disabled:opacity-50"
                    >
                      {isGeneratingDescLoja ? <i className="ph ph-circle-notch animate-spin"></i> : <i className="ph-fill ph-sparkle"></i>}
                      SUGESTÃO IA
                    </button>
                  </div>
                  <TextArea
                    placeholder="Explique o que sua loja faz, sua missão e valores..."
                    value={perfilData.descricaoLoja}
                    onChange={(e) => setPerfilData({ ...perfilData, descricaoLoja: e.target.value })}
                    containerClassName="!bg-white !border-[#DDDDD5] min-h-[80px]"
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
                      containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
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
                      className="!h-[34px]"
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
                      className="!h-[34px]"
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
                    <label className="text-body2 font-bold text-neutral-black">Volume das Respostas</label>
                    <span className="text-[11px] text-neutral-500">Determine o quão prolixa a IA deve ser ao atender um cliente.</span>
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
                          <div className={`mt-2 text-[9px] font-bold uppercase tracking-tight text-center px-1 py-0.5 rounded ${isSelected ? 'bg-secondary-200 text-secondary-800' : 'bg-neutral-100 text-neutral-400'}`}>
                            {opt.hint}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="w-full h-[1px] bg-neutral-200"></div>

                <div className="flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-2">
                    <label className="text-body2 font-medium text-neutral-black">Palavras não permitidas</label>
                    <TextInput
                      placeholder="Separe por vírgulas"
                      value={perfilData.palavrasNaoPermitidas}
                      onChange={(e) => setPerfilData({ ...perfilData, palavrasNaoPermitidas: e.target.value })}
                      containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-body2 font-medium text-neutral-black">Emojis permitidos</label>
                    <TextInput
                      placeholder="Ex: ✨, 🛍️, ✅"
                      value={perfilData.emojisPermitidos}
                      onChange={(e) => setPerfilData({ ...perfilData, emojisPermitidos: e.target.value })}
                      containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
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
                    <button
                      onClick={() => handleGenerateMessage('Boas-vindas', 'msgBoasVindas')}
                      disabled={isGeneratingMsg['msgBoasVindas']}
                      className="flex items-center gap-1.5 px-2 py-0.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg text-tag font-bold transition-all disabled:opacity-50"
                    >
                      {isGeneratingMsg['msgBoasVindas'] ? <i className="ph ph-circle-notch animate-spin"></i> : <i className="ph-fill ph-sparkle"></i>}
                      SUGESTÃO IA
                    </button>
                  </div>
                  <TextArea
                    placeholder="Ex: Olá! Bem-vindo à Qrivo Store. Como posso ajudar você hoje?"
                    value={perfilData.msgBoasVindas}
                    onChange={(e) => setPerfilData({ ...perfilData, msgBoasVindas: e.target.value })}
                    containerClassName="!bg-white !border-[#DDDDD5] min-h-[80px]"
                  />
                </div>

                <div className="w-full h-[1px] bg-neutral-200"></div>

                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center w-full">
                    <label className="text-body2 font-bold text-neutral-black">Confirmação de Compra</label>
                    <button
                      onClick={() => handleGenerateMessage('Confirmação de Compra', 'msgConfirmacaoCompra')}
                      disabled={isGeneratingMsg['msgConfirmacaoCompra']}
                      className="flex items-center gap-1.5 px-2 py-0.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg text-tag font-bold transition-all disabled:opacity-50"
                    >
                      {isGeneratingMsg['msgConfirmacaoCompra'] ? <i className="ph ph-circle-notch animate-spin"></i> : <i className="ph-fill ph-sparkle"></i>}
                      SUGESTÃO IA
                    </button>
                  </div>
                  <TextArea
                    placeholder="Ex: Seu pedido foi recebido com sucesso! Estamos preparando tudo com carinho."
                    value={perfilData.msgConfirmacaoCompra}
                    onChange={(e) => setPerfilData({ ...perfilData, msgConfirmacaoCompra: e.target.value })}
                    containerClassName="!bg-white !border-[#DDDDD5] min-h-[80px]"
                  />
                </div>

                <div className="w-full h-[1px] bg-neutral-200"></div>

                <div className="flex flex-col gap-2 w-full">
                  <div className="flex justify-between items-center w-full">
                    <label className="text-body2 font-bold text-neutral-black">Transferência Humana</label>
                    <button
                      onClick={() => handleGenerateMessage('Transferência Humana', 'msgTransferenciaHumana')}
                      disabled={isGeneratingMsg['msgTransferenciaHumana']}
                      className="flex items-center gap-1.5 px-2 py-0.5 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg text-tag font-bold transition-all disabled:opacity-50"
                    >
                      {isGeneratingMsg['msgTransferenciaHumana'] ? <i className="ph ph-circle-notch animate-spin"></i> : <i className="ph-fill ph-sparkle"></i>}
                      SUGESTÃO IA
                    </button>
                  </div>
                  <TextArea
                    placeholder="Ex: Vou transferir você para um de nossos especialistas humanos para ajudar com essa questão específica."
                    value={perfilData.msgTransferenciaHumana}
                    onChange={(e) => setPerfilData({ ...perfilData, msgTransferenciaHumana: e.target.value })}
                    containerClassName="!bg-white !border-[#DDDDD5] min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            {/* Nova Seção: Follow-Up */}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col gap-2">
                    <label className="text-body2 font-bold text-neutral-black">Aguardar por</label>
                    <div className="flex gap-2">
                      <TextInput
                        type="number"
                        placeholder="Ex: 24"
                        value={perfilData.followUpTempo}
                        onChange={(e) => setPerfilData({ ...perfilData, followUpTempo: e.target.value })}
                        containerClassName="flex-1 !h-[34px] !bg-white !border-[#DDDDD5]"
                      />
                      <Dropdown
                        label="Unidade"
                        value={perfilData.followUpUnidade}
                        onChange={(val) => setPerfilData({ ...perfilData, followUpUnidade: val })}
                        options={[
                          { label: 'Horas', value: 'Horas' },
                          { label: 'Dias', value: 'Dias' }
                        ]}
                        className="w-[120px] !h-[34px]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-body2 font-bold text-neutral-black">Número de Tentativas</label>
                    <TextInput
                      type="number"
                      placeholder="Ex: 3"
                      value={perfilData.followUpTentativas}
                      onChange={(e) => setPerfilData({ ...perfilData, followUpTentativas: e.target.value })}
                      containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                    />
                    <span className="text-[10px] text-neutral-400 font-medium italic px-1">Quantas vezes a IA tentará retomar o contato.</span>
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
                      <>Seu número <span className="font-bold text-neutral-900">+55 (98) 92002-1417</span> está pronto for trabalhar.</>
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
                  onClick={() => setIsConnectWhatsappModalOpen(true)}
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
                          containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                        />
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-body2 font-medium text-neutral-black">Fim</label>
                        <TextInput
                          type="time"
                          value={perfilData.horaFim}
                          onChange={(e) => setPerfilData({ ...perfilData, horaFim: e.target.value })}
                          containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
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
                    <Button variant="tertiary" className="mt-4" onClick={() => handleOpenFaqModal()} leftIcon="ph ph-plus-circle">Adicionar FAQ</Button>
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
                {deliveryAreas.map((area) => (
                  <div key={area.id} className="box-border flex flex-col items-start p-4 gap-6 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-small rounded-[16px]">
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-body2 font-medium text-neutral-black">Nome da Área</label>
                      <TextInput value={area.name} onChange={(e) => handleUpdateDeliveryArea(area.id, 'name', e.target.value)} containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]" />
                    </div>
                    <div className="flex flex-row gap-6 w-full">
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-body2 font-medium text-neutral-black">Preço</label>
                        <TextInput value={area.price} onChange={(e) => handleDeliveryPriceChange(area.id, e.target.value)} containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]" />
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-body2 font-medium text-neutral-black">Prazo</label>
                        <TextInput value={area.time} onChange={(e) => handleUpdateDeliveryArea(area.id, 'time', e.target.value)} containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-body2 font-medium text-neutral-black">Locais</label>
                      <TextInput value={area.regions} onChange={(e) => handleUpdateDeliveryArea(area.id, 'regions', e.target.value)} containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]" />
                    </div>
                    <div className="flex justify-between w-full">
                      <Button variant="primary" onClick={() => showToast('Salvo!')} className="!h-[34px] px-8">Salvar</Button>
                      <IconButton variant="delete" icon="ph-trash" onClick={() => handleDeleteDeliveryArea(area.id)} title="Excluir" size="md" />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" onClick={handleAddDeliveryArea} className="w-full !h-[34px]" leftIcon="ph ph-plus">Nova Área</Button>
            </div>
          </div>
        );
      case 'pagamento':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px] self-stretch">
              <h5 className="text-h5 font-bold text-[#09090B]">Formas de Pagamentos</h5>
              <div className="flex flex-col gap-4 w-full">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="box-border flex flex-col items-start p-4 gap-6 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-small rounded-[16px]">
                    <div className="flex flex-row gap-6 w-full">
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-body2 font-medium text-neutral-black">Nome</label>
                        <TextInput value={method.name} onChange={(e) => handleUpdatePaymentMethod(method.id, 'name', e.target.value)} containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]" />
                      </div>
                      <div className="flex flex-col gap-2 flex-1">
                        <label className="text-body2 font-medium text-neutral-black">Modo</label>
                        <Dropdown label="Selecione" value={method.mode} onChange={(v) => handleUpdatePaymentMethod(method.id, 'mode', v)} options={[{ label: 'Pix', value: 'Pix' }, { label: 'Cartão', value: 'Cartão' }]} className="!h-[34px]" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <label className="text-body2 font-medium text-neutral-black">Instruções</label>
                      <TextArea value={method.instructions} onChange={(e) => handleUpdatePaymentMethod(method.id, 'instructions', e.target.value)} containerClassName="!bg-white !border-[#DDDDD5] !min-h-[100px]" />
                    </div>
                    <div className="flex justify-between w-full">
                      <Button variant="primary" onClick={() => showToast('Salvo!')} className="!h-[34px] px-8">Salvar</Button>
                      <IconButton variant="delete" icon="ph-trash" onClick={() => handleDeletePaymentMethod(method.id)} title="Excluir" size="md" />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="secondary" onClick={handleAddPaymentMethod} className="w-full !h-[34px]" leftIcon="ph ph-plus">Nova Forma de Pagamento</Button>
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
          <Button variant="primary" className="!h-[34px] !bg-[#0AB86D] !border-[#059E5D] shadow-sm">Salvar Tudo</Button>
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

      <DisconnectWhatsappModal
        isOpen={isDisconnectWhatsappModalOpen}
        onClose={() => setIsDisconnectWhatsappModalOpen(false)}
        onConfirm={() => {
          setIsWhatsappConnected(false);
          setIsDisconnectWhatsappModalOpen(false);
          showToast('WhatsApp desconectado.');
        }}
      />

      <ConnectWhatsappModal
        isOpen={isConnectWhatsappModalOpen}
        onClose={() => setIsConnectWhatsappModalOpen(false)}
        onSuccess={() => {
          setIsWhatsappConnected(true);
          setIsConnectWhatsappModalOpen(false);
          showToast('WhatsApp conectado com sucesso!');
        }}
      />

      <Modal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        title={editingFaq ? "Editar FAQ" : "Nova FAQ"}
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
            <label className="text-body2 font-bold text-neutral-black">Resposta</label>
            <TextArea placeholder="Resposta..." value={faqFormData.answer} onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })} containerClassName="min-h-[120px]" />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteFaqModalOpen}
        onClose={() => setIsDeleteFaqModalOpen(false)}
        title="Excluir FAQ"
        maxWidth="400px"
        footer={<div className="flex gap-3"><Button variant="danger" className="flex-1 !h-[34px]" onClick={confirmDeleteFaq}>Excluir</Button><Button variant="secondary" className="flex-1 !h-[34px]" onClick={() => setIsDeleteFaqModalOpen(false)}>Cancelar</Button></div>}
      >
        <p className="text-body2 text-neutral-700">Tem certeza que deseja excluir esta FAQ?</p>
      </Modal>
    </div>
  );
};
