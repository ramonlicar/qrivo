
import React, { useState, useEffect, useMemo } from 'react';
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
import { MOCK_PRODUCTS } from '../constants';
import { Product } from '../types';

const ESTILOS_PROMPTS: Record<string, string> = {
  'Amigável': 'Use um tom acolhedor, trate o cliente pelo nome sempre que possível e utilize emojis de brilho e sorrisos. Seja paciente e some empatia genuína.',
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
  { label: 'Objeção: Preço', value: 'Objeção: Preço' },
  { label: 'Objeção: Confiança', value: 'Objeção: Confiança' },
  { label: 'Objeção: Prazo', value: 'Objeção: Prazo' },
  { label: 'Produtos', value: 'Produtos' },
  { label: 'Horários', value: 'Horários' },
  { label: 'Envios', value: 'Envios' },
  { label: 'Pagamentos', value: 'Pagamentos' },
  { label: 'Outros', value: 'Outros' }
];

const FUNNEL_TEMPLATES = [
  { title: 'Boas Vindas', instruction: 'O objetivo desta etapa é identificar a origem do lead e dar as boas-vindas. Pergunte como o cliente chegou até nós e agradeça o contato inicial.' },
  { title: 'Triagem de Intenção', instruction: 'Identifique se o cliente deseja realizar uma compra imediata, se está apenas avalisando opções ou se possui uma dúvida técnica específica.' },
  { title: 'Qualificação', instruction: 'Entenda o perfil do cliente, sua urgência de compra e qual o uso pretendido para o produto/serviço.' },
  { title: 'Enquadramento do Problema', instruction: 'Mostre as consequências negativas de não resolver o problema atual do cliente e crie uma identificação com a solução proposta.' },
  { title: 'Validação de Interesse', instruction: 'Busque um "micro-sim" do cliente antes de apresentar a oferta principal, confirmando que ele está interessado em ouvir mais detalhes.' },
  { title: 'Apresentação da Solução', instruction: 'Apresente os benefícios claros do produto usando uma linguagem simples e direta, focando no valor que entrega.' },
  { title: 'Prova de Valor / Confiança', instruction: 'Apresente um mini-case de sucesso ou um número simples que gere autoridade e confiança na marca.' },
  { title: 'Oferta/Pitch', instruction: 'Apresente o que está incluso, para quem é a solução e quais são as condições de pagamento e bônus de forma clara.' },
  { title: 'Chamada para Ação', instruction: 'Defina um próximo passo único e simples para o cliente seguir (ex: enviar comprovante, agendar call).' },
  { title: 'Conversão', instruction: 'Conclua a venda removendo qualquer fricção final e envie o link de checkout ou instruções de pagamento.' }
];

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface FunnelStep {
  id: string;
  title: string;
  instruction: string;
}

interface PlaybookTemplate {
  id: string;
  name: string;
  steps: FunnelStep[];
}

export const FunilVendas: React.FC = () => {
  const [activeTab, setActiveTab] = useState('produto-servico');
  const [isGeneratingDescLoja, setIsGeneratingDescLoja] = useState(false);
  const [isGeneratingMsg, setIsGeneratingMsg] = useState<Record<string, boolean>>({});
  const [isTestWidgetOpen, setIsTestWidgetOpen] = useState(false);

  // Estados WhatsApp
  const [isWhatsappConnected, setIsWhatsappConnected] = useState(true);
  const [isDisconnectWhatsappModalOpen, setIsDisconnectWhatsappModalOpen] = useState(false);
  const [isConnectWhatsappModalOpen, setIsConnectWhatsappModalOpen] = useState(false);
  const [whatsappAccordion, setWhatsappAccordion] = useState<number | null>(null);

  // Estados para FAQ/Objeções
  const [faqs, setFaqs] = useState<FAQ[]>([
    {
      id: '1',
      category: 'Objeção: Preço',
      question: 'O cliente disse que achou caro.',
      answer: 'Entendo perfeitamente. O valor reflete a durabilidade premium e o acabamento feito à mão que você não encontra em lojas de departamento. É um investimento em uma peça que durará anos, não apenas uma estação.'
    }
  ]);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isDeleteFaqModalOpen, setIsDeleteFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqToDelete, setFaqToDelete] = useState<FAQ | null>(null);
  const [faqFormData, setFaqFormData] = useState({ category: 'Objeção: Preço', question: '', answer: '' });

  // Estados do Playbook (Funil)
  const [funnelSteps, setFunnelSteps] = useState<FunnelStep[]>([
    { id: '1', title: 'Boas-vindas e Qualificação', instruction: 'Receba o cliente com entusiasmo, confirme o interesse dele pelo produto específico e faça uma pergunta para entender se ele já conhece a marca ou se é a primeira vez.' },
    { id: '2', title: 'Apresentação de Benefícios', instruction: 'Destaque os diferenciais competitivos do item. Foque em como o produto resolve a dor do cliente. Use gatilhos mentais de prova social.' },
    { id: '3', title: 'Fechamento de Venda', instruction: 'Encaminhe o cliente para a finalização do pedido. Explique as formas de pagamento disponíveis e ofereça suporte caso ele tenha dificuldade em concluir.' }
  ]);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<FunnelStep | null>(null);
  const [stepFormData, setStepFormData] = useState({ title: '', instruction: '' });
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Estados de Modelos de Playbook Salvos
  const [savedPlaybooks, setSavedPlaybooks] = useState<PlaybookTemplate[]>([
    { id: 't1', name: 'Funil de Alta Conversão', steps: [...funnelSteps] }
  ]);
  const [isSaveModelModalOpen, setIsSaveModelModalOpen] = useState(false);
  const [isRenameModelModalOpen, setIsRenameModelModalOpen] = useState(false);
  const [modelNameInput, setModelNameInput] = useState('');
  const [editingModel, setEditingModel] = useState<PlaybookTemplate | null>(null);

  // Estados Produto/Serviço do Funil
  const [funnelProduct, setFunnelProduct] = useState({
    name: '',
    price: 0,
    usp: '',
    shortDescription: '',
    longDescription: '',
    image: '',
    paymentLink: ''
  });
  const [priceDisplay, setPriceDisplay] = useState('');
  const [isGeneratingShort, setIsGeneratingShort] = useState(false);
  const [isGeneratingLong, setIsGeneratingLong] = useState(false);
  const [isGeneratingUSP, setIsGeneratingUSP] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [catalogSearchTerm, setCatalogSearchTerm] = useState('');

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
    { id: 'produto-servico', label: 'Produto/Serviço', icon: 'ph-package' },
    { id: 'perfil', label: 'Perfil', icon: 'ph-user-circle' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'ph-whatsapp-logo' },
    { id: 'funcionamento', label: 'Funcionamento', icon: 'ph-clock' },
    { id: 'treinamento', label: 'Treinamento', icon: 'ph-graduation-cap' },
    { id: 'playbook', label: 'Playbook', icon: 'ph-list-checks' },
  ];

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ show: false, message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message: string) => setToast({ show: true, message });

  // Handlers de Produto/Serviço
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numericValue = Number(value) / 100;
    setFunnelProduct(prev => ({ ...prev, price: numericValue }));
    setPriceDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue));
  };

  const handlePickProduct = (product: Product) => {
    setFunnelProduct({
      name: product.name,
      price: product.price,
      usp: '',
      shortDescription: product.shortDescription || '',
      longDescription: product.longDescription || '',
      image: product.image,
      paymentLink: ''
    });
    setPriceDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price));
    setIsProductPickerOpen(false);
    setCatalogSearchTerm(''); // Reset search
    showToast('Dados do produto carregados!');
  };

  const filteredCatalogProducts = useMemo(() => {
    const products = MOCK_PRODUCTS.filter(p => !p.parentId);
    if (!catalogSearchTerm.trim()) return products;

    return products.filter(p =>
      p.name.toLowerCase().includes(catalogSearchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(catalogSearchTerm.toLowerCase())
    );
  }, [catalogSearchTerm]);

  const handleGenerateDesc = async (type: 'short' | 'long' | 'usp') => {
    if (!funnelProduct.name) {
      alert("Por favor, informe o nome do item primeiro.");
      return;
    }

    if (type === 'short') setIsGeneratingShort(true);
    else if (type === 'long') setIsGeneratingLong(true);
    else setIsGeneratingUSP(true);

    try {
      let prompt = "";
      if (type === 'usp') {
        prompt = `Como um mestre em copywriting e marketing, escreva uma Proposta Única de Valor (USP) poderosa e irresistível de no máximo 120 caracteres para o produto/serviço "${funnelProduct.name}". O foco deve ser o benefício principal exclusivo que ninguém mais oferece. Retorne apenas o texto.`;
      } else {
        prompt = `Como um redator de e-commerce persuasivo, escreva uma descrição ${type === 'short' ? 'curta e impactante (máximo 150 caracteres)' : 'detalhada (máximo 500 caracteres)'} para o produto/serviço "${funnelProduct.name}". Foque nos benefícios. Retorne apenas o texto.`;
      }

      const text = await aiService.generateContent(prompt);

      const fieldName = type === 'short' ? 'shortDescription' : type === 'long' ? 'longDescription' : 'usp';
      setFunnelProduct(prev => ({
        ...prev,
        [fieldName]: text?.trim() || ''
      }));
    } catch (error: any) {
      console.error("Erro ao gerar conteúdo:", error);
      if (error.message === "LIMIT_EXCEEDED") {
        alert("Limite de uso da IA excedido. Tente novamente mais tarde.");
      }
    } finally {
      if (type === 'short') setIsGeneratingShort(false);
      else if (type === 'long') setIsGeneratingLong(false);
      else setIsGeneratingUSP(false);
    }
  };

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newList = [...funnelSteps];
    const item = newList[draggedItemIndex];
    newList.splice(draggedItemIndex, 1);
    newList.splice(index, 0, item);
    setFunnelSteps(newList);
    setDraggedItemIndex(index);
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
    showToast('Ordem das etapas atualizada!');
  };

  // Step Modal Handlers
  const handleOpenStepModal = (step?: FunnelStep) => {
    if (step) {
      setEditingStep(step);
      setStepFormData({ title: step.title, instruction: step.instruction });
      setIsStepModalOpen(true);
    } else {
      setEditingStep(null);
      setStepFormData({ title: '', instruction: '' });
      setIsTemplateModalOpen(true);
    }
  };

  const handleSelectTemplate = (template: typeof FUNNEL_TEMPLATES[0]) => {
    setStepFormData({ title: template.title, instruction: template.instruction });
    setIsTemplateModalOpen(false);
    setIsStepModalOpen(true);
  };

  const handleSaveStep = () => {
    if (!stepFormData.title || !stepFormData.instruction) {
      alert("Título e instrução são obrigatórios.");
      return;
    }

    if (editingStep) {
      setFunnelSteps(funnelSteps.map(s => s.id === editingStep.id ? { ...s, ...stepFormData } : s));
      showToast('Etapa atualizada!');
    } else {
      const newStep = { id: Date.now().toString(), ...stepFormData };
      setFunnelSteps([...funnelSteps, newStep]);
      showToast('Nova etapa adicionada!');
    }
    setIsStepModalOpen(false);
  };

  const handleDeleteStep = (id: string) => {
    setFunnelSteps(funnelSteps.filter(s => s.id !== id));
    showToast('Etapa removida.');
  };

  // Playbook Model Handlers
  const handleOpenSaveModelModal = () => {
    if (funnelSteps.length === 0) {
      alert("Adicione pelo menos uma etapa para salvar como modelo.");
      return;
    }
    setModelNameInput('');
    setIsSaveModelModalOpen(true);
  };

  const handleSaveModel = () => {
    if (!modelNameInput.trim()) {
      alert("Dê um nome para o seu modelo.");
      return;
    }
    const newTemplate: PlaybookTemplate = {
      id: Date.now().toString(),
      name: modelNameInput,
      steps: [...funnelSteps]
    };
    setSavedPlaybooks([newTemplate, ...savedPlaybooks]);
    setIsSaveModelModalOpen(false);
    showToast('Modelo salvo com sucesso!');
  };

  const handleUseModel = (model: PlaybookTemplate) => {
    if (confirm(`Deseja carregar o modelo "${model.name}"? Isso substituirá as etapas atuais.`)) {
      setFunnelSteps([...model.steps]);
      showToast('Estrutura de funil carregada!');
    }
  };

  const handleOpenRenameModel = (model: PlaybookTemplate) => {
    setEditingModel(model);
    setModelNameInput(model.name);
    setIsRenameModelModalOpen(true);
  };

  const handleRenameModel = () => {
    if (!modelNameInput.trim() || !editingModel) return;
    setSavedPlaybooks(savedPlaybooks.map(m => m.id === editingModel.id ? { ...m, name: modelNameInput } : m));
    setIsRenameModelModalOpen(false);
    showToast('Modelo renomeado!');
  };

  const handleDeleteModel = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este modelo permanentemente?')) {
      setSavedPlaybooks(savedPlaybooks.filter(m => m.id !== id));
      showToast('Modelo excluído.');
    }
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

  const handleOpenFaqModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqFormData({ category: faq.category, question: faq.question, answer: faq.answer });
    } else {
      setEditingFaq(null);
      setFaqFormData({ category: 'Objeção: Preço', question: '', answer: '' });
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
      showToast("Conhecimento atualizado com sucesso!");
    } else {
      const newFaq = { id: Date.now().toString(), ...faqFormData };
      setFaqs([newFaq, ...faqs]);
      showToast("Novo treinamento cadastrado!");
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
      showToast("Removido com sucesso.");
    }
    setIsDeleteFaqModalOpen(false);
    setFaqToDelete(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'produto-servico':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px] self-stretch">
              <div className="flex flex-row justify-between items-center w-full">
                <div className="flex flex-col gap-1">
                  <h5 className="text-h5 font-bold text-[#09090B]">O que você está vendendo neste funil?</h5>
                  <p className="text-small text-neutral-500">Configure o item principal que a IA irá oferecer.</p>
                </div>
                <Button
                  variant="secondary"
                  leftIcon="ph ph-magnifying-glass"
                  className="!h-[32px] !text-tag font-bold !bg-white"
                  onClick={() => setIsProductPickerOpen(true)}
                >
                  Buscar no Catálogo
                </Button>
              </div>

              <div className="flex flex-col xl:flex-row items-start gap-10 w-full bg-white p-6 rounded-xl border border-[#DDDDD5] shadow-small">
                {/* Upload Placeholder */}
                <div className="w-[164px] h-[164px] bg-[#F4F4F1] border border-dashed border-[#E8E8E3] rounded-[12px] flex flex-col items-center justify-center gap-[9px] flex-none cursor-pointer hover:bg-neutral-50 transition-colors group">
                  {funnelProduct.image ? (
                    <img src={funnelProduct.image} className="w-full h-full object-cover rounded-[12px]" />
                  ) : (
                    <>
                      <div className="w-5 h-5 flex items-center justify-center border-[1.5px] border-[#0AB86D] rounded-sm relative">
                        <i className="ph ph-plus text-[#0AB86D] text-[12px] font-bold"></i>
                      </div>
                      <span className="text-[13px] font-medium leading-[140%] text-[#0AB86D]">Anexar foto</span>
                    </>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-6 w-full">
                  {/* Linha 1: Nome */}
                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-[13px] font-bold text-[#01040E]">Nome do Produto/Serviço</label>
                    <TextInput
                      placeholder="Ex: Consultoria VIP"
                      value={funnelProduct.name}
                      onChange={(e) => setFunnelProduct({ ...funnelProduct, name: e.target.value })}
                      containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                    />
                  </div>

                  {/* Linha 2: Preço e Link */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-[#01040E]">Preço de Venda</label>
                      <TextInput
                        placeholder="R$ 0,00"
                        value={priceDisplay}
                        onChange={handlePriceChange}
                        containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[13px] font-bold text-[#01040E]">Link de Pagamento (Checkout)</label>
                      <TextInput
                        placeholder="https://..."
                        value={funnelProduct.paymentLink}
                        onChange={(e) => setFunnelProduct({ ...funnelProduct, paymentLink: e.target.value })}
                        containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                        leftIcon="ph ph-link"
                      />
                    </div>
                  </div>

                  {/* Linha 3: Proposta Única de Valor (USP) */}
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-center">
                      <label className="text-[13px] font-bold text-[#01040E]">Proposta Única de Valor (USP)</label>
                      <button onClick={() => handleGenerateDesc('usp')} disabled={isGeneratingUSP} className="text-tag font-bold text-primary-600 hover:underline flex items-center gap-1">
                        {isGeneratingUSP ? <i className="ph ph-circle-notch animate-spin"></i> : <i className="ph-fill ph-sparkle"></i>}
                        IA Sugestão
                      </button>
                    </div>
                    <TextArea
                      placeholder="O que torna seu produto irresistível e único? (Ex: Atendimento em 15min, Garantia vitalícia...)"
                      value={funnelProduct.usp}
                      onChange={(e) => setFunnelProduct({ ...funnelProduct, usp: e.target.value })}
                      containerClassName="!min-h-[60px] !bg-white !border-[#DDDDD5]"
                    />
                  </div>

                  {/* Linha 4: Descrição Breve */}
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-center">
                      <label className="text-[13px] font-bold text-[#01040E]">Descrição Breve</label>
                      <button onClick={() => handleGenerateDesc('short')} disabled={isGeneratingShort} className="text-tag font-bold text-primary-600 hover:underline flex items-center gap-1">
                        {isGeneratingShort ? <i className="ph ph-circle-notch animate-spin"></i> : <i className="ph-fill ph-sparkle"></i>}
                        IA Sugestão
                      </button>
                    </div>
                    <TextInput
                      placeholder="Resumo em uma frase..."
                      value={funnelProduct.shortDescription}
                      onChange={(e) => setFunnelProduct({ ...funnelProduct, shortDescription: e.target.value })}
                      containerClassName="!h-[34px] !bg-white !border-[#DDDDD5]"
                    />
                  </div>

                  {/* Linha 5: Descrição Longa */}
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex justify-between items-center">
                      <label className="text-[13px] font-bold text-[#01040E]">Descrição Detalhada</label>
                      <button onClick={() => handleGenerateDesc('long')} disabled={isGeneratingLong} className="text-tag font-bold text-primary-600 hover:underline flex items-center gap-1">
                        {isGeneratingLong ? <i className="ph ph-circle-notch animate-spin"></i> : <i className="ph-fill ph-sparkle"></i>}
                        IA Sugestão
                      </button>
                    </div>
                    <TextArea
                      placeholder="Detalhes técnicos, bônus, garantia..."
                      value={funnelProduct.longDescription}
                      onChange={(e) => setFunnelProduct({ ...funnelProduct, longDescription: e.target.value })}
                      containerClassName="!min-h-[100px] !bg-white !border-[#DDDDD5]"
                    />
                  </div>

                  <div className="pt-2">
                    <Button variant="primary" className="px-10 !h-[36px]" onClick={() => showToast('Produto do funil salvo!')}>Salvar Configuração</Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'playbook':
        return (
          <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px] self-stretch">
              <div className="flex flex-row justify-between items-start w-full">
                <div className="flex flex-col gap-1">
                  <h5 className="text-h5 font-bold text-[#09090B]">Estrutura do Funil (Playbook)</h5>
                  <p className="text-small text-neutral-500">Defina a ordem lógica e as diretrizes de cada etapa do atendimento da IA. Arraste para reordenar.</p>
                </div>
                <Button
                  variant="secondary"
                  leftIcon="ph ph-floppy-disk"
                  className="!h-[32px] !text-tag font-bold !bg-white"
                  onClick={handleOpenSaveModelModal}
                >
                  Salvar Modelo
                </Button>
              </div>

              <div className="flex flex-col gap-3 w-full mt-2">
                {funnelSteps.map((step, index) => (
                  <div
                    key={step.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, index)}
                    onDragOver={(e) => onDragOver(e, index)}
                    onDragEnd={onDragEnd}
                    className={`
                      box-border flex flex-row items-center p-4 gap-4 w-full bg-white border border-[#DDDDD5] rounded-[16px] shadow-small transition-all cursor-grab active:cursor-grabbing group
                      ${draggedItemIndex === index ? 'opacity-40 scale-[0.98] border-primary-500' : 'hover:border-primary-200'}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center w-10 h-10 bg-neutral-50 rounded-full text-neutral-400 group-hover:text-primary-500 transition-colors flex-none">
                      <i className="ph ph-dots-six-vertical text-xl"></i>
                    </div>

                    <div className="flex flex-col flex-1 gap-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest bg-neutral-25 px-2 py-0.5 rounded-full border border-neutral-100">Etapa {index + 1}</span>
                        <h6 className="text-body2 font-bold text-neutral-900 truncate">{step.title}</h6>
                      </div>
                      <p className="text-small text-neutral-500 line-clamp-1 italic">"{step.instruction}"</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <IconButton
                        variant="edit"
                        icon="ph-pencil-simple"
                        onClick={(e) => { e.stopPropagation(); handleOpenStepModal(step); }}
                        title="Editar Etapa"
                      />
                      <IconButton
                        variant="delete"
                        icon="ph-trash"
                        onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id); }}
                        title="Excluir Etapa"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-full pt-4 border-t border-neutral-100 mt-2">
                <Button
                  variant="secondary"
                  onClick={() => handleOpenStepModal()}
                  className="w-full !h-[36px] font-bold"
                  leftIcon="ph ph-plus-circle"
                >
                  Criar nova Etapa
                </Button>
              </div>
            </div>

            <div className="p-5 bg-secondary-50 rounded-xl border border-secondary-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary-500 flex items-center justify-center text-white flex-none shadow-sm">
                <i className="ph ph-info text-2xl"></i>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-body2 font-bold text-secondary-900">Como funciona o Playbook?</span>
                <p className="text-small text-secondary-700 leading-relaxed">
                  As etapas do playbook funcionam como a "bússola" do seu vendedor IA. Ele tentará conduzir o cliente através de cada uma dessas fases sucessivamente, garantindo que o atendimento não seja apenas reativo, mas focado em conversão.
                </p>
              </div>
            </div>

            {/* Listagem de Modelos Salvos */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
                <i className="ph ph-folder-star text-primary-500 text-xl"></i>
                <h3 className="text-body2 font-bold text-neutral-900 uppercase tracking-wider">Meus Modelos Salvos</h3>
              </div>

              {savedPlaybooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedPlaybooks.map((model) => (
                    <div key={model.id} className="p-4 bg-white border border-neutral-200 rounded-2xl shadow-small flex flex-col gap-4 group hover:border-primary-200 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          <span className="text-body2 font-bold text-neutral-900 truncate">{model.name}</span>
                          <span className="text-tag font-bold text-neutral-400 uppercase">{model.steps.length} etapas configuradas</span>
                        </div>
                        <div className="flex gap-1.5">
                          <IconButton variant="ghost" icon="ph-pencil-simple" onClick={() => handleOpenRenameModel(model)} title="Renomear" />
                          <IconButton variant="ghost" icon="ph-trash" onClick={() => handleDeleteModel(model.id)} title="Excluir" className="hover:!text-system-error-500" />
                        </div>
                      </div>
                      <Button variant="secondary" className="w-full !h-[34px] !bg-neutral-50 !border-neutral-200 hover:!bg-primary-50 hover:!text-primary-600 hover:!border-primary-200 font-bold" onClick={() => handleUseModel(model)}>
                        Aplicar Estrutura
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center justify-center bg-neutral-25 border border-dashed border-neutral-200 rounded-2xl text-center">
                  <p className="text-small text-neutral-400 font-medium">Você ainda não salvou nenhum modelo personalizado.</p>
                </div>
              )}
            </div>
          </div>
        );
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

            {/* Nova Seção: Follow-Up Automático (Duplicado do Vendedor IA) */}
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
                    Defina quando e quantas vezes o Agente de Funil deve tentar reengajar clientes que pararam de responder após o envio de uma proposta ou mensagem.
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
                    <span className="text-[10px] text-neutral-400 font-medium italic px-1">Quantas vezes a IA tentará retomar o contato no funil.</span>
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
                      <>Seu número <span className="font-bold text-neutral-900">+55 (98) 92002-1417</span> está pronto para trabalhar.</>
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
                <h5 className="text-h5 font-bold text-[#09090B]">Treinamento de Vendas & Objeções</h5>
              </div>
              <p className="text-small text-neutral-500 px-1">Ensine a IA como lidar com dúvidas e objeções frequentes para aumentar a conversão.</p>
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
                      <h4 className="text-body2 font-bold text-neutral-900">Nenhum treinamento cadastrado</h4>
                      <p className="text-small text-neutral-500">Adicione objeções e respostas para treinar seu vendedor.</p>
                    </div>
                    <Button variant="tertiary" className="mt-4" onClick={() => handleOpenFaqModal()} leftIcon="ph ph-plus-circle">Adicionar Objeção</Button>
                  </div>
                )}
              </div>
              <button onClick={() => handleOpenFaqModal()} className="flex flex-row justify-center items-center gap-2 w-full h-[34px] bg-white border border-[#E8E8E3] shadow-small rounded-[8px] text-body2 font-medium">
                <i className="ph ph-plus text-base"></i> Nova Objeção / Resposta
              </button>
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
          {isTestWidgetOpen ? <i className="ph ph-x ph-bold text-xl"></i> : <><i className="ph-fill ph-robot text-2xl"></i><span className="text-body1 font-bold">Testar Funil</span></>}
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
            <h1 className="text-h4 font-bold text-neutral-black tracking-tight m-0 truncate w-full">Funil de Vendas</h1>
            <p className="hidden sm:block text-body2 font-normal text-neutral-500 m-0 truncate w-full">Gerencie as etapas de conversão e automação do seu funil.</p>
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

      {/* Modal para Escolher Template de Etapa */}
      <Modal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        title="Escolha um Modelo de Etapa"
        maxWidth="640px"
      >
        <div className="flex flex-col gap-3">
          <p className="text-body2 text-neutral-500 mb-2 px-1">Selecione um ponto de partida estratégico para sua nova etapa do funil:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto custom-scrollbar pr-2">
            {FUNNEL_TEMPLATES.map((template, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectTemplate(template)}
                className="flex flex-col items-start p-4 bg-white border border-neutral-200 rounded-xl hover:border-primary-500 hover:bg-primary-50/30 transition-all text-left group shadow-small"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center text-[10px] font-black text-neutral-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">{idx + 1}</span>
                  <h6 className="text-body2 font-bold text-neutral-900 truncate">{template.title}</h6>
                </div>
                <p className="text-small text-neutral-500 line-clamp-2 leading-tight">
                  {template.instruction}
                </p>
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <Button
              variant="ghost"
              className="w-full !h-[36px]"
              onClick={() => {
                setIsTemplateModalOpen(false);
                setIsStepModalOpen(true);
              }}
            >
              Criar sem modelo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal para Etapas do Playbook */}
      <Modal
        isOpen={isStepModalOpen}
        onClose={() => setIsStepModalOpen(false)}
        title={editingStep ? "Editar Etapa" : "Nova Etapa do Funil"}
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 !h-[34px]" onClick={() => setIsStepModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1 !h-[34px] shadow-sm" onClick={handleSaveStep}>Salvar Etapa</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">Título da Etapa</label>
            <TextInput
              placeholder="Ex: Qualificação de Lead"
              value={stepFormData.title}
              onChange={(e) => setStepFormData({ ...stepFormData, title: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">O que a IA deve fazer? (Instrução)</label>
            <TextArea
              placeholder="Descreva detalhadamente o comportamento da IA nesta fase específica..."
              value={stepFormData.instruction}
              onChange={(e) => setStepFormData({ ...stepFormData, instruction: e.target.value })}
              containerClassName="min-h-[140px]"
            />
          </div>
        </div>
      </Modal>

      {/* Modal para Salvar Modelo de Playbook */}
      <Modal
        isOpen={isSaveModelModalOpen}
        onClose={() => setIsSaveModelModalOpen(false)}
        title="Salvar Estrutura como Modelo"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 !h-[34px]" onClick={() => setIsSaveModelModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1 !h-[34px] shadow-sm" onClick={handleSaveModel}>Salvar Modelo</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-body2 text-neutral-500">Salve esta sequência de etapas para carregar em outros momentos com apenas 1 clique.</p>
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">Nome do Modelo</label>
            <TextInput
              placeholder="Ex: Funil de Lançamento"
              value={modelNameInput}
              onChange={(e) => setModelNameInput(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Modal para Renomear Modelo de Playbook */}
      <Modal
        isOpen={isRenameModelModalOpen}
        onClose={() => setIsRenameModelModalOpen(false)}
        title="Renomear Modelo"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 !h-[34px]" onClick={() => setIsRenameModelModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" className="flex-1 !h-[34px] shadow-sm" onClick={handleRenameModel}>Salvar Alteração</Button>
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          <label className="text-body2 font-bold text-neutral-black">Novo Nome</label>
          <TextInput
            placeholder="Digite o novo nome..."
            value={modelNameInput}
            onChange={(e) => setModelNameInput(e.target.value)}
          />
        </div>
      </Modal>

      {/* Modal para Escolher Produto do Catálogo */}
      <Modal
        isOpen={isProductPickerOpen}
        onClose={() => setIsProductPickerOpen(false)}
        title="Selecione um Produto do Catálogo"
        maxWidth="500px"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-body2 text-neutral-500 mb-2 px-1">Importe as informações de um item já cadastrado no seu sistema:</p>
            <TextInput
              placeholder="Pesquisar por nome ou categoria..."
              value={catalogSearchTerm}
              onChange={(e) => setCatalogSearchTerm(e.target.value)}
              leftIcon="ph-magnifying-glass"
              containerClassName="!h-[36px] !bg-white !border-neutral-200 shadow-small"
            />
          </div>

          <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
            {filteredCatalogProducts.length > 0 ? (
              filteredCatalogProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handlePickProduct(product)}
                  className="flex items-center gap-4 p-3 bg-white border border-neutral-200 rounded-xl hover:border-primary-500 hover:bg-primary-50/30 transition-all text-left group shadow-small"
                >
                  <div className="w-12 h-12 rounded-lg border border-neutral-100 overflow-hidden flex-none">
                    <img src={product.image} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-body2 font-bold text-neutral-900 truncate">{product.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-tag font-bold text-primary-600">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      <span className="text-[10px] text-neutral-400">•</span>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">{product.category}</span>
                    </div>
                  </div>
                  <i className="ph ph-plus-circle text-xl text-neutral-300 group-hover:text-primary-500 transition-colors"></i>
                </button>
              ))
            ) : (
              <div className="py-10 flex flex-col items-center justify-center text-center gap-2 bg-neutral-25 rounded-xl border border-dashed border-neutral-200">
                <i className="ph ph-magnifying-glass text-3xl text-neutral-300"></i>
                <span className="text-body2 font-bold text-neutral-400">Nenhum produto encontrado</span>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isFaqModalOpen}
        onClose={() => setIsFaqModalOpen(false)}
        title={editingFaq ? "Editar Treinamento" : "Novo Treinamento"}
        footer={<div className="flex gap-3"><Button variant="secondary" className="flex-1 !h-[34px]" onClick={() => setIsFaqModalOpen(false)}>Cancelar</Button><Button variant="primary" className="flex-1 !h-[34px] shadow-sm" onClick={handleSaveFaq}>Salvar</Button></div>}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">Categoria</label>
            <Dropdown label="Selecione" value={faqFormData.category} onChange={(val) => setFaqFormData({ ...faqFormData, category: val })} options={FAQ_CATEGORIES} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">Objeção / Pergunta do Cliente</label>
            <TextInput placeholder="Ex: Está muito caro..." value={faqFormData.question} onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">Como a IA deve responder?</label>
            <TextArea placeholder="Instrua a IA sobre o melhor argumento de venda..." value={faqFormData.answer} onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })} containerClassName="min-h-[120px]" />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isDeleteFaqModalOpen}
        onClose={() => setIsDeleteFaqModalOpen(false)}
        title="Remover Treinamento"
        maxWidth="400px"
        footer={<div className="flex gap-3"><Button variant="danger" className="flex-1 !h-[34px]" onClick={confirmDeleteFaq}>Remover</Button><Button variant="secondary" className="flex-1 !h-[34px]" onClick={() => setIsDeleteFaqModalOpen(false)}>Cancelar</Button></div>}
      >
        <p className="text-body2 text-neutral-700">Tem certeza que deseja excluir este treinamento de objeção?</p>
      </Modal>
    </div>
  );
};
