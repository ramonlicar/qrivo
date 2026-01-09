
import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (file: File | null) => void;
}

export const ConfirmPaymentModal: React.FC<ConfirmPaymentModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Confirmar Pagamento"
      footer={
        <div className="flex gap-4">
          <Button variant="secondary" className="flex-1 !h-[34px]" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" className="flex-1 !h-[34px]" onClick={() => onConfirm(selectedFile)}>Confirmar</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <p className="text-body2 text-neutral-700 leading-relaxed">
          Insira o comprovante de pagamento recebido para confirmar a venda no sistema.
        </p>
        
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
        
        <div 
          onClick={() => fileInputRef.current?.click()} 
          className="flex flex-col items-center justify-center p-6 gap-3 bg-neutral-25 border border-dashed border-neutral-200 rounded-[12px] group cursor-pointer hover:bg-neutral-50 transition-colors"
        >
          {!selectedFile ? (
            <>
              <i className="ph ph-upload-simple ph-bold text-primary-500 text-2xl group-hover:scale-110 transition-transform"></i>
              <span className="text-body2 font-bold text-primary-500">Anexar comprovante</span>
            </>
          ) : (
            <div className="flex items-center gap-3 w-full">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                <i className="ph ph-file-text text-xl"></i>
              </div>
              <span className="text-body2 font-bold text-neutral-900 truncate flex-1">{selectedFile.name}</span>
              <button onClick={handleRemoveFile} className="p-2 hover:bg-neutral-200 rounded-lg text-system-error-500 transition-colors">
                <i className="ph ph-trash-simple text-lg"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
