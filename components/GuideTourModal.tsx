
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface GuideTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    title: "Bem-vindo ao Qrivo! 🚀",
    description: "Sua jornada para automatizar vendas e escalar seu atendimento começa aqui. Vamos fazer um tour rápido pelas ferramentas que vão transformar seu negócio.",
    icon: "ph-rocket-launch",
    color: "text-primary-500",
    bgColor: "bg-primary-50",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Painel de Pedidos",
    description: "Acompanhe em tempo real todas as vendas geradas pelas IAs no WhatsApp. Monitore status de pagamento, entrega e detalhes do cliente centralizados.",
    icon: "ph-shopping-cart",
    color: "text-amber-500",
    bgColor: "bg-amber-50",
    image: "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Agente 1: Vendedor IA",
    description: "O especialista em Catálogo. Este agente conhece todos os seus produtos cadastrados, tira dúvidas técnicas e ajuda o cliente a escolher a melhor opção entre vários itens.",
    icon: "ph-robot",
    color: "text-secondary-500",
    bgColor: "bg-secondary-50",
    image: "https://images.unsplash.com/photo-1531746790731-6c2079ce7010?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Agente 2: Funil de Vendas",
    description: "O estrategista Monoproduto. Diferente do Vendedor, este agente foca em uma única oferta irresistível, seguindo um roteiro (playbook) rigoroso para converter leads específicos.",
    icon: "ph-funnel",
    color: "text-system-highlight-500",
    bgColor: "bg-purple-50",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "CRM & Kanban",
    description: "Gerencie o relacionamento com precisão. Visualize em qual etapa cada cliente está, adicione anotações e mova leads manualmente se preferir intervir na venda.",
    icon: "ph-users",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Tudo pronto!",
    description: "Agora é com você. Comece conectando seu WhatsApp e configurando seus agentes. Se precisar de ajuda, nosso Assistente IA está sempre disponível no menu lateral.",
    icon: "ph-check-circle",
    color: "text-primary-600",
    bgColor: "bg-primary-100",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=800&auto=format&fit=crop"
  }
];

export const GuideTourModal: React.FC<GuideTourModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const step = TOUR_STEPS[currentStep];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black bg-neutral-900 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">Tour Guiado</span>
          <span className="text-tag font-bold text-neutral-400">{currentStep + 1} de {TOUR_STEPS.length}</span>
        </div>
      }
      maxWidth="520px"
      className="!rounded-[24px]"
      noPadding={true}
      footer={
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button variant="secondary" className="flex-1 !h-[36px]" onClick={handleBack}>
              Voltar
            </Button>
          )}
          <Button variant="primary" className="flex-[2] !h-[36px] font-bold shadow-sm" onClick={handleNext}>
            {currentStep === TOUR_STEPS.length - 1 ? 'Começar a usar agora' : 'Próximo passo'}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col animate-in fade-in zoom-in-95 duration-300">
        {/* Snapshot Container */}
        <div className="w-full aspect-[16/9] bg-neutral-100 relative overflow-hidden group">
          <img 
            src={step.image} 
            alt={step.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          
          {/* Floating Icon Over Image */}
          <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 ${step.bgColor} rounded-[20px] flex items-center justify-center ${step.color} shadow-lg border-4 border-white z-10 transition-transform duration-500 hover:scale-110`}>
            <i className={`ph ${step.icon} text-3xl`}></i>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center text-center gap-4 p-8 pt-10">
          <h3 className="text-h3 font-black text-neutral-black tracking-tight leading-tight">
            {step.title}
          </h3>
          <p className="text-body1 text-neutral-500 leading-relaxed font-medium">
            {step.description}
          </p>

          {/* Progress Dots */}
          <div className="flex gap-1.5 mt-4">
            {TOUR_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-primary-500 shadow-[0_0_8px_rgba(9,184,109,0.3)]' : 'w-1.5 bg-neutral-200'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
