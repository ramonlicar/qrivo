
import React, { useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ViewReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptUrl?: string;
  onEdit: (file: File) => void;
  onDownload: () => void;
  onDelete: () => void;
}

export const ViewReceiptModal: React.FC<ViewReceiptModalProps> = ({ isOpen, onClose, receiptUrl, onEdit, onDownload, onDelete }) => {
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onEdit(e.target.files[0]);
    }
  };

  const isPdf = receiptUrl?.endsWith('.pdf') && !receiptUrl.startsWith('blob:');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="text-body1 font-bold text-neutral-900">Comprovante de Pagamento</span>}
      maxWidth="500px"
      footer={
        <div className="flex items-center justify-between gap-3 w-full">
          <Button
            variant="danger-light"
            className="w-9 h-9 !p-0 flex items-center justify-center flex-none"
            onClick={onDelete}
            disabled={!receiptUrl}
            title="Excluir Comprovante"
          >
            <i className="ph ph-bold ph-trash text-lg"></i>
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              className="px-4"
              leftIcon="ph ph-bold ph-download-simple"
              onClick={onDownload}
              disabled={!receiptUrl}
            >
              Download
            </Button>
            <Button
              variant="primary"
              className="px-4"
              leftIcon="ph ph-bold ph-pencil-simple"
              onClick={() => editFileInputRef.current?.click()}
            >
              Trocar Arquivo
            </Button>
          </div>
        </div>
      }
    >
      <input
        type="file"
        ref={editFileInputRef}
        className="hidden"
        onChange={handleEditChange}
        accept="image/*,application/pdf"
      />
      <div className="w-full aspect-[4/3] bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden flex items-center justify-center relative group">
        {isPdf ? (
          <div className="flex flex-col items-center gap-4">
            <i className="ph ph-file-pdf ph-bold text-6xl text-system-error-500"></i>
            <span className="text-body2 font-semibold text-neutral-600">Documento PDF</span>
            <Button variant="secondary" onClick={() => window.open(receiptUrl, '_blank')}>Abrir em nova aba</Button>
          </div>
        ) : receiptUrl ? (
          <img src={receiptUrl} alt="Comprovante" className="w-full h-full object-contain" />
        ) : (
          <span className="text-body2 text-neutral-400">Nenhum comprovante disponível</span>
        )}
      </div>
    </Modal>
  );
};
