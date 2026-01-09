
import React, { useState, useRef } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ImportProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportProductsModal: React.FC<ImportProductsModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
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

  const handleImport = () => {
    if (!selectedFile) return;
    setIsImporting(true);
    
    // Simulação de processo de importação
    setTimeout(() => {
      setIsImporting(false);
      setSelectedFile(null);
      onClose();
      alert('Importação concluída com sucesso!');
    }, 2000);
  };

  const downloadTemplate = () => {
    // Definindo o conteúdo do CSV de referência
    const headers = ['Nome', 'Categoria', 'Preço', 'Descrição Breve', 'Descrição Longa'];
    const exampleRow = ['Camiseta Qrivo Algodão', 'Moda', '89.90', 'Camiseta básica de alta qualidade.', 'Nossa camiseta é feita com 100% algodão penteado, oferecendo conforto extremo e durabilidade para o dia a dia.'];
    
    // Construindo o conteúdo CSV (separado por ponto e vírgula para melhor compatibilidade com Excel em PT-BR)
    const csvContent = [
      headers.join(';'),
      exampleRow.join(';')
    ].join('\n');

    // Criando o Blob e o link de download
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_qrivo.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Importar Produtos"
      maxWidth="480px"
      footer={
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            className="flex-1 !h-[36px] !font-bold" 
            onClick={onClose}
            disabled={isImporting}
          >
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            className="flex-1 !h-[36px] !font-bold shadow-sm" 
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            isLoading={isImporting}
          >
            Iniciar Importação
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Instruções */}
        <div className="flex flex-col gap-2">
          <h4 className="text-body2 font-bold text-neutral-900">Como importar?</h4>
          <p className="text-body2 text-neutral-500 leading-relaxed">
            Para garantir que seus produtos sejam cadastrados corretamente, utilize nosso modelo padrão de planilha.
          </p>
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-bold text-body2 transition-colors w-fit mt-1 group"
          >
            <i className="ph ph-download-simple group-hover:translate-y-0.5 transition-transform"></i>
            Baixar modelo de importação (.csv)
          </button>
        </div>

        <div className="h-[1px] bg-neutral-100 w-full"></div>

        {/* Área de Upload */}
        <div className="flex flex-col gap-2">
          <label className="text-body2 font-bold text-neutral-black">Arquivo da Planilha</label>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange} 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
          />
          
          <div 
            onClick={() => !isImporting && fileInputRef.current?.click()} 
            className={`
              flex flex-col items-center justify-center p-8 gap-3 bg-neutral-25 border border-dashed rounded-[12px] group transition-all
              ${selectedFile ? 'border-primary-500 bg-primary-50/30' : 'border-neutral-200 hover:bg-neutral-50 cursor-pointer'}
              ${isImporting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {!selectedFile ? (
              <>
                <div className="w-12 h-12 bg-white rounded-full shadow-small flex items-center justify-center text-neutral-400 group-hover:text-primary-500 group-hover:scale-110 transition-all">
                  <i className="ph ph-cloud-arrow-up text-2xl"></i>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-body2 font-bold text-neutral-900">Clique para selecionar</span>
                  <span className="text-[11px] text-neutral-400 font-medium">Arraste seu arquivo CSV ou Excel aqui</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-sm">
                  <i className="ph ph-file-spreadsheet text-2xl"></i>
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-body2 font-bold text-neutral-900 truncate">{selectedFile.name}</span>
                  <span className="text-[11px] text-neutral-500 uppercase font-bold">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                {!isImporting && (
                  <button 
                    onClick={handleRemoveFile}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white text-neutral-400 hover:text-system-error-500 transition-colors"
                  >
                    <i className="ph ph-trash text-lg"></i>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tip Informativo */}
        <div className="flex flex-row items-start p-3 gap-3 bg-neutral-50 rounded-[8px] border border-neutral-100">
          <i className="ph ph-info ph-bold text-neutral-400 text-base flex-none mt-0.5"></i>
          <p className="text-[11px] font-medium text-neutral-500 leading-normal">
            Arquivos suportados: .csv, .xls, .xlsx. Limite máximo de 1.000 linhas por importação.
          </p>
        </div>
      </div>
    </Modal>
  );
};
