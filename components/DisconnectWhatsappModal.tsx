
import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface DisconnectWhatsappModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DisconnectWhatsappModal: React.FC<DisconnectWhatsappModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Desconectar Número"
      maxWidth="532px"
      className="!rounded-[24px]"
      footer={
        <div className="flex gap-3">
          <Button 
            variant="danger" 
            className="flex-1 !h-[36px] !rounded-[8px] font-bold" 
            onClick={onConfirm}
          >
            Desconectar Agora
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1 !h-[36px] !rounded-[8px] font-bold" 
            onClick={onClose}
          >
            Cancelar
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-body2 font-normal text-neutral-500 leading-relaxed">
          Ao prosseguir, a integração atual será removida e o atendimento pelo Qrivo ficará indisponível até que você reconecte.
        </p>

        {/* Informational Box: Quando usar? */}
        <div className="flex flex-row items-start p-6 gap-4 bg-neutral-50 rounded-[16px] border border-neutral-100">
          <div className="w-6 h-6 flex items-center justify-center flex-none mt-0.5">
             <i className="ph ph-warning-circle text-neutral-black text-2xl"></i>
          </div>
          <div className="flex flex-col gap-2">
            <h6 className="text-body2 font-bold text-neutral-black leading-none">Quando usar?</h6>
            <ul className="flex flex-col gap-1 list-none p-0 m-0">
               <li className="flex items-start gap-2 text-body2 text-neutral-700 font-normal">
                 <span className="text-neutral-400 mt-1.5 w-1 h-1 rounded-full bg-neutral-400 flex-none"></span>
                 <span>O QR Code expirou e você precisa de um novo.</span>
               </li>
               <li className="flex items-start gap-2 text-body2 text-neutral-700 font-normal">
                 <span className="text-neutral-400 mt-1.5 w-1 h-1 rounded-full bg-neutral-400 flex-none"></span>
                 <span>Vai trocar de número ou reiniciar a conexão.</span>
               </li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
};
