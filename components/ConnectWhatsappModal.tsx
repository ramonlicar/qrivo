
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { TextInput } from './TextInput';

interface ConnectWhatsappModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (number: string) => void;
}

export const ConnectWhatsappModal: React.FC<ConnectWhatsappModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoadingQr, setIsLoadingQr] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPhoneNumber('');
      setIsLoadingQr(false);
    }
  }, [isOpen]);

  const handleGenerateQr = () => {
    if (phoneNumber.length < 10) return;
    setStep(2);
    setIsLoadingQr(true);
    // Simulate QR generation
    setTimeout(() => {
      setIsLoadingQr(false);
    }, 2000);
  };

  const renderStep1 = () => (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col gap-2">
        <h4 className="text-h4 font-bold text-neutral-black leading-tight flex items-center gap-2">
          Automatize suas vendas agora mesmo! ✨
        </h4>
        <p className="text-body2 font-medium text-neutral-500 leading-relaxed">
          Insira o número que deseja conectar e depois leia o QR Code pelo WhatsApp.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-body2 font-bold text-neutral-700">
          WhatsApp <span className="text-neutral-400 font-medium">(Apenas números)</span>
        </label>
        <div className="flex items-center gap-0 bg-white border border-neutral-200 rounded-[8px] overflow-hidden focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-50 transition-all shadow-small h-[36px]">
          <div className="bg-neutral-50 border-r border-neutral-200 h-full flex items-center px-4 text-body2 font-bold text-neutral-900">
            +55
          </div>
          <input 
            type="text"
            placeholder="(DDD) 00000-0000"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
            maxLength={11}
            className="flex-1 h-full px-3 text-body2 font-medium text-neutral-black bg-transparent border-none focus:outline-none placeholder:text-neutral-300"
          />
        </div>
      </div>

      <div className="mt-2">
        <Button 
          variant="primary" 
          className="w-full !h-[36px] font-bold" 
          disabled={phoneNumber.length < 10}
          onClick={handleGenerateQr}
        >
          Gerar QR Code
        </Button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Instructions Box */}
      <div className="flex flex-row items-start p-5 gap-4 bg-neutral-50 rounded-[16px] border border-neutral-100">
        <div className="w-6 h-6 flex items-center justify-center flex-none mt-0.5">
           <i className="ph ph-question-circle text-neutral-black text-2xl"></i>
        </div>
        <div className="flex flex-col gap-2">
          <h6 className="text-body2 font-bold text-neutral-black leading-none">Siga os passos abaixo:</h6>
          <ol className="flex flex-col gap-1.5 list-none p-0 m-0">
             <li className="text-[12px] text-neutral-700 font-medium leading-relaxed">
               <span className="font-bold">1.</span> Abra o WhatsApp cadastrado no número: <span className="font-bold">+55 {phoneNumber}</span>
             </li>
             <li className="text-[12px] text-neutral-700 font-medium leading-relaxed">
               <span className="font-bold">2.</span> Clique no botão de Mais Opções ( <i className="ph ph-dots-three-vertical-bold align-middle"></i> no Android) ou em Configurações ( <i className="ph ph-gear-six-bold align-middle"></i> no iOS) no canto superior direito do APP
             </li>
             <li className="text-[12px] text-neutral-700 font-medium leading-relaxed">
               <span className="font-bold">3.</span> Clique em <span className="font-bold">"Dispositivos Conectados"</span> &gt; <span className="font-bold">"Conectar Dispositivo"</span>
             </li>
             <li className="text-[12px] text-neutral-700 font-medium leading-relaxed">
               <span className="font-bold">4.</span> Leia o QR Code abaixo para conectar
             </li>
          </ol>
        </div>
      </div>

      {/* QR Code Placeholder */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative w-[180px] h-[180px] bg-white border border-neutral-100 rounded-xl shadow-small flex items-center justify-center overflow-hidden">
          {isLoadingQr ? (
            <div className="grid grid-cols-4 gap-2 w-full h-full p-4 animate-pulse">
               {[...Array(16)].map((_, i) => (
                 <div key={i} className="bg-neutral-100 rounded-sm"></div>
               ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={() => onSuccess(phoneNumber)}>
               <i className="ph ph-qr-code text-[120px] text-neutral-900 group-hover:scale-105 transition-transform"></i>
               <div className="absolute inset-0 bg-primary-500/0 group-hover:bg-primary-500/10 transition-colors flex items-center justify-center">
                  <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Clique para Simular Sucesso</span>
               </div>
            </div>
          )}
        </div>
        <span className="text-[12px] font-bold text-neutral-400 mt-4 animate-pulse">
          {isLoadingQr ? 'Gerando novo QR Code...' : 'Carregando QR Code...'}
        </span>
      </div>
    </div>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Conectar WhatsApp"
      maxWidth="532px"
      className="!rounded-[24px]"
    >
      {step === 1 ? renderStep1() : renderStep2()}
    </Modal>
  );
};
