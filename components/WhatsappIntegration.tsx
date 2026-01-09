
import React, { useState } from 'react';
import { Button } from './Button';
import { Badge } from './Badge';
import { DisconnectWhatsappModal } from './DisconnectWhatsappModal';
import { ConnectWhatsappModal } from './ConnectWhatsappModal';

interface WhatsappIntegrationProps {
  onBack: () => void;
}

export const WhatsappIntegration: React.FC<WhatsappIntegrationProps> = ({ onBack }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      title: 'Clique em "Conectar Agora"',
      desc: 'Digite o número de WhatsApp válido que deseja conectar ao seu Vendedor IA. Então clique em Gerar QR Code.',
      image: 'ph-qr-code'
    },
    {
      id: 2,
      title: 'Abra o WhatsApp',
      desc: 'Clique no botão de Mais Opções ( : no Android) ou em Configurações ( ⚙️ no iOS) no canto superior direito e, em seguida, em Dispositivos Conectados.',
      image: 'ph-device-mobile'
    },
    {
      id: 3,
      title: 'Conecte um dispositivo',
      desc: 'Toque em Conectar dispositivo e leia o QR Code gerado na etapa 1.',
      image: 'ph-scan'
    },
    {
      id: 4,
      title: 'Teste a conexão',
      desc: 'Após confirmação de sucesso do WhatsApp, clique em Testar Conexão para validar a integração.',
      isLast: true
    }
  ];

  const commonErrors = [
    { 
      id: 1, 
      title: 'QR Code expirou ou não está funcionando.', 
      details: [
        { label: 'Causa', text: 'O QR Code de conexão tem validade curta (cerca de 1 minuto).' },
        { label: 'Solução', text: 'Desconectar → Atualizar página → Refazer conexão. Um novo QR Code será gerado automaticamente.' }
      ]
    },
    { 
      id: 2, 
      title: 'O WhatsApp está solicitando um código.', 
      details: [
        { label: 'Causa', text: 'Esse aviso aparece quando você tenta conectar um novo dispositivo clicando diretamente na notificação do WhatsApp.' },
        { label: 'Solução', text: 'Desconectar → Atualizar página → Refazer conexão. A leitura do novo QR Code substituirá automaticamente a necessidade de inserir código manual.' },
        { label: 'Fluxo Correto de Conexão', text: 'Gere o QR Code no Painel da Qrivo → Abra o aplicativo do WhatsApp que deseja conectar → Clique no botão de 3 Pontinhos no canto superior direito → Clique em "Dispositivos Conectados" e depois em "Conectar Dispositivo" → Leia o QR Code da Qrivo → Nomeie o Dispositivo (Ex: \'Qrivo\') → Teste a conexão.' }
      ]
    },
    { 
      id: 3, 
      title: 'QR Code não aparece.', 
      details: [
        { label: 'Causa', text: 'Isso pode ocorrer quando uma tentativa anterior de conexão ainda está ativa, o número do WhatsApp foi digitado incorretamente ou não foi encontrado, ou houve demora no processamento.' },
        { label: 'Solução', text: 'Desconectar → Atualizar página → Refazer conexão. Verifique se o número informado está correto e se existe uma conta do WhatsApp vinculada a ele.' }
      ]
    }
  ];

  const toggleAccordion = (id: number) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  const handleConfirmDisconnect = () => {
    setIsConnected(false);
    setIsDisconnectModalOpen(false);
  };

  const handleConnectSuccess = (number: string) => {
    setIsConnected(true);
    setIsConnectModalOpen(false);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in duration-500 overflow-hidden">
      {/* Header */}
      <header className="flex flex-col w-full bg-white flex-none border-b border-neutral-200">
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[12px] lg:gap-[16px] w-full min-h-[64px] lg:min-h-[72px]">
          <button 
            onClick={onBack}
            className="flex items-center justify-center w-[36px] h-[36px] rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 shadow-small flex-none active:scale-95"
          >
            <i className="ph ph-bold ph-arrow-left text-neutral-800"></i>
          </button>
          
          <div className="flex flex-col items-start p-0 gap-[1px] flex-1 overflow-hidden">
            <h1 className="text-h5 font-bold text-neutral-black tracking-tight m-0 truncate w-full">
              Integrar WhatsApp
            </h1>
            <p className="hidden sm:block text-body2 font-normal text-neutral-500 m-0 truncate w-full">
              Permita que seu vendedor IA responda seus clientes e crie pedidos automaticamente.
            </p>
          </div>

          <Badge variant={isConnected ? 'success' : 'neutral'}>
            {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
          </Badge>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 bg-white">
        <div className="max-w-[880px] mx-auto w-full flex flex-col gap-10 pb-20">
          
          {/* Status Banner */}
          <div className={`
            flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl gap-6 border transition-all duration-300
            ${isConnected 
              ? 'bg-primary-50 border-primary-500' 
              : 'bg-neutral-25 border-neutral-200'}
          `}>
            <div className="flex items-center gap-5">
              <div className={`
                w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-small flex-none transition-colors
                ${isConnected ? 'text-[#25D366]' : 'text-neutral-300'}
              `}>
                <i className={`ph-fill ph-whatsapp-logo text-4xl`}></i>
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="text-body1 font-bold text-neutral-900 leading-tight">
                  {isConnected ? 'WhatsApp conectado com sucesso!' : 'WhatsApp aguardando conexão'}
                </h4>
                <p className="text-body2 text-neutral-600">
                  {isConnected ? (
                    <>Seu número <span className="font-bold text-neutral-900">+55 (98) 92002-1417</span> está pronto para trabalhar.</>
                  ) : (
                    'Conecte seu celular para que o Vendedor IA possa atender seus clientes.'
                  )}
                </p>
              </div>
            </div>
            
            {isConnected ? (
              <Button 
                variant="danger" 
                className="!h-[36px] w-full sm:w-auto px-8 font-bold"
                onClick={() => setIsDisconnectModalOpen(true)}
              >
                Desconectar
              </Button>
            ) : (
              <Button 
                variant="primary" 
                className="!h-[36px] w-full sm:w-auto px-8 shadow-sm font-bold"
                onClick={() => setIsConnectModalOpen(true)}
              >
                Conectar Agora
              </Button>
            )}
          </div>

          {/* Tutorial Section */}
          <div className="flex flex-col gap-6">
            <h3 className="text-body1 font-bold text-neutral-black">Como integrar o seu vendedor com o WhatsApp?</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step) => (
                <div key={step.id} className="flex flex-col bg-white border border-neutral-200 rounded-2xl overflow-hidden group shadow-small hover:shadow-cards transition-all">
                  <div className="aspect-[4/3] bg-neutral-50 flex items-center justify-center relative p-6">
                    {step.isLast ? (
                      <div className="flex flex-col items-center gap-4">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-small transition-colors ${isConnected ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-300'}`}>
                           <i className={`ph-fill ${isConnected ? 'ph-check-circle' : 'ph-clock'} text-3xl`}></i>
                         </div>
                         <Button variant="neutral" className={`!h-[36px] shadow-lg !bg-[#084A44] ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}>Testar Conexão</Button>
                      </div>
                    ) : (
                      <div className="w-full h-full border-2 border-neutral-200 rounded-xl bg-white shadow-inner flex flex-col items-center justify-center gap-3 p-4 group-hover:border-primary-200 transition-colors">
                         <i className={`ph ${step.image} text-4xl text-neutral-300 group-hover:text-primary-500 transition-all`}></i>
                         <div className="w-full h-1.5 bg-neutral-100 rounded-full"></div>
                         <div className="w-2/3 h-1.5 bg-neutral-100 rounded-full"></div>
                      </div>
                    )}
                    {/* Step Number Badge */}
                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-neutral-900 text-white text-[10px] font-black flex items-center justify-center shadow-sm">
                      {step.id}
                    </div>
                  </div>
                  <div className="p-5 flex flex-col gap-2">
                    <h5 className="text-body2 font-bold text-neutral-black leading-tight">
                      {step.id}. {step.title}
                    </h5>
                    <p className="text-[12px] text-neutral-500 leading-relaxed font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Erros Comuns Section */}
          <div className="flex flex-col gap-4">
            <h3 className="text-body1 font-bold text-neutral-black">Erros comuns</h3>
            
            <div className="flex flex-col gap-2 bg-neutral-25 border border-neutral-200 rounded-2xl overflow-hidden shadow-small p-1.5">
              {commonErrors.map((error) => {
                const isOpen = openAccordion === error.id;
                return (
                  <div key={error.id} className="border-b last:border-b-0 border-neutral-100 first:rounded-t-xl last:rounded-b-xl overflow-hidden">
                    <button 
                      onClick={() => toggleAccordion(error.id)}
                      className={`w-full flex items-center justify-between p-4 transition-colors text-left ${isOpen ? 'bg-neutral-50' : 'bg-white hover:bg-neutral-50'}`}
                    >
                      <span className="text-body2 font-bold text-neutral-900">{error.id}. {error.title}</span>
                      <i className={`ph ph-caret-down text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    {isOpen && (
                      <div className="p-5 pt-4 bg-white animate-in slide-in-from-top-1 duration-200">
                        <div className="flex flex-col gap-4 max-w-[800px]">
                          {error.details.map((detail, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row items-start gap-1 sm:gap-2">
                               <span className="text-body2 font-bold text-neutral-black whitespace-nowrap min-w-[80px]">
                                 → {detail.label}:
                               </span>
                               <p className="text-body2 text-neutral-700 leading-relaxed">
                                 {detail.text}
                               </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Modals */}
      <DisconnectWhatsappModal 
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirm={handleConfirmDisconnect}
      />

      <ConnectWhatsappModal 
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onSuccess={handleConnectSuccess}
      />
    </div>
  );
};
