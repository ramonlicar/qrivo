
import React, { useState, useEffect } from 'react';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { Dropdown } from './Dropdown';
import { Button } from './Button';
import { Product } from '../types';
import { CategoriesModal } from './CategoriesModal';
import { aiService } from '../lib/aiService';

interface ProductFormPageProps {
  onBack: () => void;
  onSave: (product: Partial<Product>) => void;
  product?: Product | null;
}

export const ProductFormPage: React.FC<ProductFormPageProps> = ({ onBack, onSave, product }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: '',
    image: '',
    availability: 'ATIVO',
    shortDescription: '',
    longDescription: ''
  });
  const [priceDisplay, setPriceDisplay] = useState('');
  const [isGeneratingShort, setIsGeneratingShort] = useState(false);
  const [isGeneratingLong, setIsGeneratingLong] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
      setPriceDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price));
    }
  }, [product]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const numericValue = Number(value) / 100;
    setFormData(prev => ({ ...prev, price: numericValue }));
    setPriceDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numericValue));
  };

  const handleGenerateDesc = async (type: 'short' | 'long') => {
    if (!formData.name) {
      alert("Por favor, informe o nome do item para gerar uma sugestão.");
      return;
    }

    const isShort = type === 'short';
    isShort ? setIsGeneratingShort(true) : setIsGeneratingLong(true);

    try {
      const prompt = `Como um redator especializado em e-commerce, escreva uma descrição ${isShort ? 'curta e impactante (máximo 150 caracteres)' : 'detalhada e técnica (máximo 500 caracteres)'} para o produto "${formData.name}". Use um tom de voz vendedora e persuasiva. Retorne apenas o texto puro, sem formatação markdown.`;

      const text = await aiService.generateContent(prompt);
      setFormData(prev => ({
        ...prev,
        [isShort ? 'shortDescription' : 'longDescription']: text?.trim() || ''
      }));
    } catch (error: any) {
      console.error("Erro ao gerar descrição com IA:", error);
      if (error.message === "LIMIT_EXCEEDED") {
        alert("Limite de uso da IA excedido. Tente novamente mais tarde.");
      }
    } finally {
      isShort ? setIsGeneratingShort(false) : setIsGeneratingLong(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in duration-500 overflow-hidden relative">
      {/* Header Fixo */}
      <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[12px] lg:gap-[16px] w-full min-h-[64px] lg:min-h-[72px] border-b border-neutral-200 bg-white z-10">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-[36px] h-[36px] rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 shadow-small flex-none active:scale-95 transition-all"
        >
          <i className="ph ph-bold ph-arrow-left text-neutral-800 text-lg"></i>
        </button>
        <h1 className="text-h5 font-bold text-neutral-black truncate flex-1">
          {product ? "Editar Item" : "Cadastro do Item"}
        </h1>
        <Button
          variant="primary"
          className="!h-[36px] px-8 shadow-sm"
          onClick={() => onSave(formData)}
          isLoading={isSaving}
        >
          Salvar Produto
        </Button>
      </div>

      {/* Área de Scroll Centralizada */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white flex justify-center">
        {/* Container Principal (Frame 313990) */}
        <div className="flex flex-col xl:flex-row items-start gap-10 max-w-[750px] w-full pb-24">

          {/* Área de Upload */}
          <div className="w-[164px] h-[164px] bg-[#F4F4F1] border border-dashed border-[#E8E8E3] rounded-[12px] flex flex-col items-center justify-center gap-[9px] flex-none cursor-pointer hover:bg-neutral-50 transition-colors group self-start">
            <div className="w-5 h-5 flex items-center justify-center border-[1.5px] border-[#0AB86D] rounded-sm relative">
              <i className="ph ph-plus text-[#0AB86D] text-[12px] font-bold"></i>
            </div>
            <span className="text-[13px] font-medium leading-[140%] text-[#0AB86D] flex items-center">
              Anexar arquivo
            </span>
          </div>

          {/* Form Area (Frame 314105) */}
          <div className="flex-1 flex flex-col gap-6 w-full max-w-[562px]">

            {/* Linha 1: Nome do Item */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-col">
                <label className="text-[13px] font-medium leading-[140%] text-[#01040E]">Nome do Item</label>
                <span className="text-[12px] font-normal leading-[17px] text-[#2C2C2A]">Informe o nome comercial do produto.</span>
              </div>
              <TextInput
                placeholder="Padrão"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                containerClassName="!h-[32px] !bg-white !border-[#DDDDD5] !px-3 shadow-cards"
                className="!text-[13px] !font-normal placeholder:!text-[#9B9B97]"
              />
            </div>

            {/* Linha 2: Preço e Categoria na mesma linha */}
            <div className="flex flex-col md:flex-row gap-6 w-full">
              {/* Preço */}
              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <div className="flex flex-col">
                  <label className="text-[13px] font-medium leading-[140%] text-[#01040E]">Preço</label>
                  <span className="text-[12px] font-normal leading-[17px] text-[#2C2C2A]">Valor de venda.</span>
                </div>
                <TextInput
                  placeholder="Padrão"
                  value={priceDisplay}
                  onChange={handlePriceChange}
                  containerClassName="!h-[32px] !bg-white !border-[#DDDDD5] !px-3 shadow-cards"
                  className="!text-[13px] !font-normal placeholder:!text-[#9B9B97]"
                />
              </div>

              {/* Categoria */}
              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <div className="flex flex-row justify-between items-center w-full">
                  <div className="flex flex-col">
                    <label className="text-[13px] font-medium leading-[140%] text-[#1F1F1E]">Categoria</label>
                  </div>
                  <button
                    onClick={() => setIsCategoriesModalOpen(true)}
                    className="flex items-center gap-2 px-0.5 rounded-lg text-[13px] font-medium text-[#0AB86D] hover:underline"
                  >
                    Gerenciar
                  </button>
                </div>
                <Dropdown
                  label="Selecione"
                  value={formData.category}
                  onChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                  options={[
                    { label: 'Escrivaninhas', value: 'Escrivaninhas' },
                    { label: 'Cadeiras', value: 'Cadeiras' },
                    { label: 'Cômodas', value: 'Cômodas' }
                  ]}
                  className="!h-[32px] w-full"
                />
              </div>
            </div>

            {/* Linha 3: Descrição Breve */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-row justify-between items-center w-full">
                <div className="flex flex-col">
                  <label className="text-[13px] font-medium leading-[140%] text-[#01040E]">Descrição Breve</label>
                  <span className="text-[12px] font-normal leading-[17px] text-[#2C2C2A]">Destaque as principais características.</span>
                </div>
                <button
                  className="flex items-center gap-2 px-0.5 rounded-lg text-[13px] font-medium text-[#0AB86D] hover:underline disabled:opacity-50"
                  onClick={() => handleGenerateDesc('short')}
                  disabled={isGeneratingShort}
                >
                  {isGeneratingShort ? <i className="ph ph-circle-notch animate-spin"></i> : <i className="ph ph-sparkle"></i>}
                  IA Sugestão
                </button>
              </div>
              <TextInput
                placeholder="Padrão"
                value={formData.shortDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                containerClassName="!h-[32px] !bg-white !border-[#DDDDD5] !px-3 shadow-cards"
                className="!text-[13px] !font-normal placeholder:!text-[#9B9B97]"
              />
            </div>

            {/* Linha 4: Descrição Longa */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-row justify-between items-center w-full">
                <div className="flex flex-col">
                  <label className="text-[13px] font-medium leading-[140%] text-[#01040E]">Descrição Longa</label>
                  <span className="text-[12px] font-normal leading-[17px] text-[#2C2C2A]">Materiais, medidas e detalhes técnicos.</span>
                </div>
                <button
                  className="flex items-center gap-2 px-0.5 rounded-lg text-[13px] font-medium text-[#0AB86D] hover:underline disabled:opacity-50"
                  onClick={() => handleGenerateDesc('long')}
                  disabled={isGeneratingLong}
                >
                  {isGeneratingLong ? <i className="ph ph-circle-notch animate-spin"></i> : <i className="ph ph-sparkle"></i>}
                  IA Sugestão
                </button>
              </div>
              <TextArea
                placeholder="Padrão"
                value={formData.longDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, longDescription: e.target.value }))}
                containerClassName="!h-[100px] !bg-white !border-[#DDDDD5] shadow-cards"
                className="!text-[13px] !font-normal placeholder:!text-[#9B9B97]"
                autoResize={false}
              />
            </div>

          </div>
        </div>
      </div>

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        categories={['Escrivaninhas', 'Cadeiras', 'Cômodas', 'Estantes e Cristaleiras']}
      />
    </div>
  );
};
