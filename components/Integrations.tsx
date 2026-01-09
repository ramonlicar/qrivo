
import React from 'react';
import { Button } from './Button';
import { Badge } from './Badge';

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: string;
  status: 'Conectado' | 'Pendente' | 'Disponível' | 'Em breve';
  onAction: () => void;
  brandColor?: string;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ title, description, icon, status, onAction, brandColor }) => {
  const isComingSoon = status === 'Em breve';
  const statusVariant = status === 'Conectado' ? 'success' : status === 'Pendente' ? 'warning' : 'neutral';

  return (
    <div className={`
      flex flex-col p-5 bg-white border border-neutral-200 rounded-2xl shadow-small transition-all group
      ${isComingSoon ? 'opacity-60 grayscale-[0.2]' : 'hover:shadow-cards hover:border-primary-200'}
    `}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm transition-transform ${brandColor || 'bg-neutral-900'} ${!isComingSoon ? 'group-hover:scale-110' : ''}`}>
          <i className={`ph ${icon} text-2xl`}></i>
        </div>
        <Badge variant={statusVariant}>{status}</Badge>
      </div>
      
      <div className="flex flex-col gap-1 mb-6">
        <h4 className="text-body1 font-bold text-neutral-black leading-tight">{title}</h4>
        <p className="text-small text-neutral-500 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      <Button 
        variant={status === 'Conectado' ? 'secondary' : 'primary'} 
        className="w-full !h-[34px] !font-bold" 
        onClick={onAction}
        disabled={isComingSoon}
      >
        {isComingSoon ? 'Em breve' : (status === 'Conectado' ? 'Configurar' : 'Conectar')}
      </Button>
    </div>
  );
};

interface IntegrationsProps {
  onNavigate: (path: string) => void;
}

export const Integrations: React.FC<IntegrationsProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in duration-500 overflow-hidden">
      <header className="flex flex-col w-full bg-white flex-none border-b border-neutral-200">
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[12px] lg:gap-[16px] w-full min-h-[64px] lg:min-h-[72px]">
          <div className="flex flex-col items-start p-0 gap-[1px] flex-1 overflow-hidden">
            <h1 className="text-h5 font-bold text-neutral-black tracking-tight m-0 truncate w-full">
              Integrações
            </h1>
            <p className="hidden sm:block text-body2 font-normal text-neutral-500 m-0 truncate w-full">
              Conecte suas ferramentas favoritas para turbinar suas vendas.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 bg-white">
        <div className="max-w-[1000px] mx-auto w-full flex flex-col gap-12 pb-20">
          
          {/* Seção: Canais de Uso */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <i className="ph ph-chat-circle-dots text-primary-500 text-xl"></i>
              <h3 className="text-body2 font-bold text-neutral-900 uppercase tracking-wider">Canais de Venda</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <IntegrationCard 
                title="WhatsApp"
                description="Automatize suas vendas no app de mensagens mais usado do mundo."
                icon="ph-whatsapp-logo"
                status="Conectado"
                brandColor="bg-[#25D366]"
                onAction={() => onNavigate('/integracoes/whatsapp')}
              />
              <IntegrationCard 
                title="Instagram DM"
                description="Responda seus clientes e venda diretamente pelo direct do Instagram."
                icon="ph-instagram-logo"
                status="Em breve"
                brandColor="bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]"
                onAction={() => {}}
              />
            </div>
          </div>

          {/* Seção: Pagamentos */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-neutral-100 pb-2">
              <i className="ph ph-credit-card text-primary-500 text-xl"></i>
              <h3 className="text-body2 font-bold text-neutral-900 uppercase tracking-wider">Pagamentos</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <IntegrationCard 
                title="Mercado Pago"
                description="Receba pagamentos via Pix, Crédito e Boleto de forma segura."
                icon="ph-wallet"
                status="Em breve"
                brandColor="bg-[#009EE3]"
                onAction={() => {}}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
