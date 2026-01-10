
import React, { useState, useEffect } from 'react';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { Dropdown } from './Dropdown';
import { Button } from './Button';
import { Product } from '../types';
import { CategoriesModal } from './CategoriesModal';
import { aiService } from '../lib/aiService';
import { supabase } from '../lib/supabase';
import { productsService, companiesService } from '../lib/services';

import { useParams } from 'react-router-dom';

interface ProductFormPageProps {
  onBack: () => void;
  onSave: (product: Partial<Product>) => void;
  product?: Product | null;
  onCancel?: () => void;
}

export const ProductFormPage: React.FC<ProductFormPageProps> = ({ onBack, onSave, product, onCancel }) => {
  const { id } = useParams<{ id: string }>();
  // Track the ID of the product being edited.
  // Initialize with product prop if available, otherwise null.
  // It will be updated by effect if URL param is present.
  const [currentProductId, setCurrentProductId] = useState<string | null>(product?.id || null);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isGeneratingShort, setIsGeneratingShort] = useState(false);
  const [isGeneratingLong, setIsGeneratingLong] = useState(false);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: '',
    categoryId: '',
    image: '',
    availability: 'ATIVO',
    shortDescription: '',
    longDescription: '',
    ref: ''
  });

  const [priceDisplay, setPriceDisplay] = useState('');

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanyAndCategories();
  }, []);

  const fetchCompanyAndCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: company } = await companiesService.getMyCompany(user.id);
      if (company) {
        setCompanyId(company.id);
        const cats = await productsService.getCategories(company.id);
        setCategories(cats);
      }
    } catch (error) {
      console.error("Error fetching dependencies:", error);
    }
  };

  useEffect(() => {
    // If product is passed via props (navigation state), use it
    if (product) {
      setCurrentProductId(product.id);
      populateForm(product);
    } else if (id) {
      // If no product prop but ID exists in URL, fetch it
      // Also update currentProductId so we know we are editing
      setCurrentProductId(id);
      fetchProduct(id);
    } else {
      // New product mode
      setCurrentProductId(null);
    }
  }, [product, id]);

  const fetchProduct = async (productId: string) => {
    setIsLoadingProduct(true);
    try {
      const fetchedProduct = await productsService.getProductById(productId);
      if (fetchedProduct) {
        populateForm(fetchedProduct as Product);
      } else {
        alert('Produto não encontrado');
        if (onCancel) onCancel();
        else onBack();
      }
    } catch (error) {
      console.error("Erro ao buscar produto:", error);
      alert('Erro ao carregar produto.');
      if (onCancel) onCancel();
      else onBack();
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const populateForm = (p: Product) => {
    setFormData({
      ...p,
      category: p.category,
      categoryId: p.categoryId || ''
    });
    setPriceDisplay(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price));
    if (p.image) setImagePreview(p.image);
  };

  // When form data category changes (if it was just name), we might want to sync id.
  // Actually, dropdown will drive this. 

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
      } else {
        alert(`Erro na IA: ${error.message || "Erro desconhecido"}`);
      }
    } finally {
      isShort ? setIsGeneratingShort(false) : setIsGeneratingLong(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      alert("Nome e preço são obrigatórios.");
      return;
    }
    if (!companyId) {
      alert("Erro de autenticação: Empresa não encontrada.");
      return;
    }

    setIsSaving(true);
    try {
      let imageUrl = formData.image;

      if (imageFile) {
        try {
          imageUrl = await productsService.uploadImage(imageFile);
        } catch (uploadErr) {
          console.error("Erro upload:", uploadErr);
          alert("Erro ao fazer upload da imagem. Verifique se o bucket 'products' existe e tem permissão.");
          setIsSaving(false);
          return;
        }
      }

      const dataToSave = { ...formData, image: imageUrl };

      let savedData;
      // Check currentProductId instead of product.id
      if (currentProductId) {
        // Update
        const { data } = await productsService.updateProduct(currentProductId, dataToSave);
        savedData = data;
      } else {
        // Create
        const { data } = await productsService.createProduct(companyId, dataToSave);
        savedData = data;
      }

      // Map back to frontend Product type
      // We manually resolve the category name from our local list because the mutation might not return the joined relation perfectly without more complex query
      const categoryObj = categories.find(c => c.id === (formData.categoryId || savedData.category_id));

      const mappedProduct: Product = {
        id: savedData.id,
        name: savedData.name,
        categoryId: savedData.category_id,
        category: categoryObj?.name || 'Sem Categoria',
        price: savedData.price,
        availability: savedData.status === 'active' ? 'ATIVO' : 'INATIVO',
        image: savedData.image_url || '',
        shortDescription: savedData.short_description,
        longDescription: savedData.long_description || savedData.description,
        lastModified: new Date(savedData.updated_at || savedData.created_at).toLocaleString('pt-BR')
      };

      onSave(mappedProduct);
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Erro ao salvar produto. Tente novamente.");
    } finally {
      setIsSaving(false);
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
          {currentProductId ? "Editar Item" : "Cadastro do Item"}
        </h1>
        <Button
          variant="primary"
          className="!h-[36px] px-8 shadow-sm"
          onClick={handleSave}
          isLoading={isSaving}
        >
          {currentProductId ? "Salvar Edição" : "Salvar Produto"}
        </Button>
      </div>

      {/* Área de Scroll Centralizada */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white flex justify-center">
        {/* Container Principal (Frame 313990) */}
        <div className="flex flex-col xl:flex-row items-start gap-10 max-w-[750px] w-full pb-24">

          {/* Área de Upload */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-[164px] h-[164px] bg-[#F4F4F1] border border-dashed border-[#E8E8E3] rounded-[12px] flex flex-col items-center justify-center gap-[9px] flex-none cursor-pointer hover:bg-neutral-50 transition-colors group self-start relative overflow-hidden"
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <i className="ph ph-pencil-simple text-white text-xl"></i>
                  <span className="text-white text-xs font-medium">Trocar Imagem</span>
                  <button onClick={handleRemoveImage} className="mt-2 px-3 py-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full text-[10px] font-bold uppercase">
                    Remover
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="w-5 h-5 flex items-center justify-center border-[1.5px] border-[#0AB86D] rounded-sm relative">
                  <i className="ph ph-plus text-[#0AB86D] text-[12px] font-bold"></i>
                </div>
                <span className="text-[13px] font-medium leading-[140%] text-[#0AB86D] flex items-center">
                  Anexar arquivo
                </span>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
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
                placeholder="Ex: Cadeira de Escritório Ergonômica"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                containerClassName="!h-[36px] !bg-white !border-[#DDDDD5] !px-3 shadow-cards"
                className="!text-[13px] !font-normal placeholder:!text-[#9B9B97]"
              />
            </div>

            {/* Linha 2: Ref e Preço na mesma linha */}
            <div className="flex flex-col md:flex-row gap-6 w-full">
              {/* Código de Ref */}
              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <div className="flex flex-col">
                  <label className="text-[13px] font-medium leading-[140%] text-[#01040E]">Código de Ref (opcional)</label>
                  <span className="text-[12px] font-normal leading-[17px] text-[#2C2C2A]">Ex: SKU-001, REF-123.</span>
                </div>
                <TextInput
                  placeholder="Código de referência"
                  value={formData.ref || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, ref: e.target.value }))}
                  containerClassName="!h-[36px] !bg-white !border-[#DDDDD5] !px-3 shadow-cards"
                  className="!text-[13px] !font-normal placeholder:!text-[#9B9B97]"
                />
              </div>

              {/* Preço */}
              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <div className="flex flex-col">
                  <label className="text-[13px] font-medium leading-[140%] text-[#01040E]">Preço</label>
                  <span className="text-[12px] font-normal leading-[17px] text-[#2C2C2A]">Valor de venda.</span>
                </div>
                <TextInput
                  placeholder="R$ 0,00"
                  value={priceDisplay}
                  onChange={handlePriceChange}
                  containerClassName="!h-[36px] !bg-white !border-[#DDDDD5] !px-3 shadow-cards"
                  className="!text-[13px] !font-normal placeholder:!text-[#9B9B97]"
                />
              </div>
            </div>

            {/* Linha 3: Categoria */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-row justify-between items-center w-full">
                <div className="flex flex-col">
                  <label className="text-[13px] font-medium leading-[140%] text-[#1F1F1E]">Categoria</label>
                  <span className="text-[12px] font-normal leading-[17px] text-[#2C2C2A]">Selecione a categoria do item.</span>
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
                value={formData.categoryId || formData.category || ''}
                onChange={(val) => {
                  const selectedCat = categories.find(c => c.id === val);
                  setFormData(prev => ({ ...prev, categoryId: val, category: selectedCat?.name || '' }));
                }}
                options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
                className="!h-[36px] w-full"
              />
            </div>

            {/* Linha 4: Descrição Breve */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-row justify-between items-center w-full">
                <div className="flex flex-col">
                  <label className="text-[13px] font-medium leading-[140%] text-[#01040E]">Descrição Breve</label>
                  <span className="text-[12px] font-normal leading-[17px] text-[#2C2C2A]">Destaque as principais características.</span>
                </div>
                <button
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#EAFBF3] rounded-full text-[10px] font-bold text-[#0AB86D] hover:bg-[#D5F5E5] transition-colors disabled:opacity-50 uppercase tracking-widest"
                  onClick={() => handleGenerateDesc('short')}
                  disabled={isGeneratingShort}
                >
                  {isGeneratingShort ? <i className="ph ph-circle-notch animate-spin text-sm"></i> : <i className="ph ph-sparkle-fill text-sm"></i>}
                  Sugestão IA
                </button>
              </div>
              <TextInput
                placeholder="Ex: Assento estofado, regulagem de altura e apoio lombar."
                value={formData.shortDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                containerClassName="!h-[36px] !bg-white !border-[#DDDDD5] !px-3 shadow-cards"
                className="!text-[13px] !font-normal placeholder:!text-[#9B9B97]"
              />
            </div>

            {/* Linha 5: Descrição Longa */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex flex-row justify-between items-center w-full">
                <div className="flex flex-col">
                  <label className="text-[13px] font-medium leading-[140%] text-[#01040E]">Descrição Longa</label>
                  <span className="text-[12px] font-normal leading-[17px] text-[#2C2C2A]">Materiais, medidas e detalhes técnicos.</span>
                </div>
                <button
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#EAFBF3] rounded-full text-[10px] font-bold text-[#0AB86D] hover:bg-[#D5F5E5] transition-colors disabled:opacity-50 uppercase tracking-widest"
                  onClick={() => handleGenerateDesc('long')}
                  disabled={isGeneratingLong}
                >
                  {isGeneratingLong ? <i className="ph ph-circle-notch animate-spin text-sm"></i> : <i className="ph ph-sparkle-fill text-sm"></i>}
                  Sugestão IA
                </button>
              </div>
              <textarea
                placeholder="Ex: Estrutura em aço cromado, revestimento em couro sintético, suporta até 120kg..."
                value={formData.longDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, longDescription: e.target.value }))}
                className="w-full min-h-[100px] bg-white border border-[#DDDDD5] rounded-md shadow-cards text-[13px] font-normal text-[#01040E] p-3 pb-8 placeholder:text-[#9B9B97] focus:outline-none focus:border-neutral-900 transition-all resize-y custom-scrollbar"
              />
            </div>

          </div>
        </div>
      </div>

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        companyId={companyId}
        onUpdate={fetchCompanyAndCategories}
      />
    </div>
  );
};
