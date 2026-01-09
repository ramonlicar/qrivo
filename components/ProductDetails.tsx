
import React, { useState, useEffect, useMemo } from 'react';
import { Product } from '../types';
import { Badge } from './Badge';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Switch } from './Switch';
import { AddVariationModal } from './AddVariationModal';
import { MOCK_PRODUCTS } from '../constants';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

interface ToastState {
  show: boolean;
  message: string;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onBack, onEdit, onDelete }) => {
  const [isAvailable, setIsAvailable] = useState(product.availability === 'ATIVO');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });
  const [isAddVariationModalOpen, setIsAddVariationModalOpen] = useState(false);

  // Filtra as variantes do produto atual do banco de dados (mock)
  const variants = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => p.parentId === product.id);
  }, [product.id]);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const showToast = (message: string) => {
    setToast({ show: true, message });
  };

  const handleToggleAvailability = (newState: boolean) => {
    setIsAvailable(newState);
    showToast(newState ? 'Produto marcado como Ativo' : 'Produto marcado como Inativo');
  };

  const handleGenerateVariants = (variantsToCreate: any[]) => {
    console.log('Gerando variantes:', variantsToCreate);
    setIsAddVariationModalOpen(false);
    showToast(`${variantsToCreate.length} variações criadas com sucesso!`);
  };

  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {/* Toast Feedback */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 bg-primary-100 border border-primary-500 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <i className="ph ph-check-circle ph-fill text-primary-600 text-xl"></i>
          <span className="text-body2 font-bold text-primary-900">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] bg-white border-b border-neutral-200 gap-4 min-h-[64px] lg:min-h-[72px] flex-none">
        <button 
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-white border border-neutral-200 hover:bg-neutral-50 transition-all shadow-small active:scale-95 flex-none"
        >
          <i className="ph ph-bold ph-arrow-left text-neutral-800 text-lg lg:text-xl"></i>
        </button>
        <div className="flex flex-col flex-1 overflow-hidden">
          <h2 className="text-h5 font-bold text-neutral-black tracking-tight m-0 truncate">{product.name}</h2>
          <span className="text-small text-neutral-400 font-medium truncate">Última Modificação em {product.lastModified || 'N/A'}</span>
        </div>
        
        <div className="flex items-center gap-2 flex-none">
          <IconButton 
            variant="edit" 
            icon="ph-pencil-simple" 
            size="md"
            onClick={() => onEdit(product)} 
            title="Editar Produto"
          />
          <IconButton 
            variant="delete" 
            icon="ph-trash" 
            size="md"
            onClick={() => onDelete(product)} 
            title="Excluir Produto"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-white">
        <div className="max-w-[840px] mx-auto w-full flex flex-col gap-5 pb-20">
          
          {/* Availability Card */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-4 flex items-center justify-between shadow-cards">
            <span className="text-body2 font-bold text-neutral-black">Disponibilidade do Item</span>
            <div className="flex items-center gap-4">
              <Badge variant={isAvailable ? 'success' : 'neutral'}>
                {isAvailable ? 'ATIVO' : 'INATIVO'}
              </Badge>
              <Switch 
                checked={isAvailable}
                onChange={handleToggleAvailability}
              />
            </div>
          </div>

          {/* Product Preview Card */}
          <div className="bg-neutral-25 border border-neutral-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-6 shadow-cards">
            <div className="w-full sm:w-[200px] aspect-square bg-white rounded-xl border border-neutral-200 overflow-hidden flex-none">
              <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col gap-2 text-center sm:text-left overflow-hidden">
              <span className="text-tag font-bold text-primary-500 uppercase tracking-widest">{product.category}</span>
              <h3 className="text-h3 font-black text-neutral-black leading-tight break-words">{product.name}</h3>
              <span className="text-h4 font-bold text-neutral-black mt-2">
                {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          {/* Short Description Card */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-6 flex flex-col gap-2 shadow-cards">
            <h4 className="text-body2 font-bold text-neutral-black uppercase tracking-wider">Descrição Breve</h4>
            <p className="text-body2 font-medium text-neutral-700 leading-relaxed">
              {product.shortDescription || 'Nenhuma descrição breve informada.'}
            </p>
          </div>

          {/* Long Description Card */}
          <div className="bg-white border border-neutral-100 rounded-2xl p-6 flex flex-col gap-2 shadow-cards">
            <h4 className="text-body2 font-bold text-neutral-black uppercase tracking-wider">Descrição Longa</h4>
            <div className="text-body2 font-medium text-neutral-700 leading-relaxed whitespace-pre-line">
              {product.longDescription || 'Nenhuma descrição detalhada informada.'}
            </div>
          </div>

          {/* Variations Section */}
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-h4 font-black text-neutral-black">Variações do Item</h3>
              {variants.length > 0 && (
                <Button 
                  variant="secondary" 
                  leftIcon="ph ph-plus" 
                  className="!h-[32px] !text-tag !font-bold"
                  onClick={() => setIsAddVariationModalOpen(true)}
                >
                  Adicionar Variação
                </Button>
              )}
            </div>

            {variants.length > 0 ? (
              <div className="flex flex-col w-full bg-white border border-neutral-200 rounded-2xl shadow-small overflow-hidden divide-y divide-neutral-100">
                {variants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-3 px-4 hover:bg-neutral-25 transition-all group">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-100 overflow-hidden flex-none">
                        <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-body2 font-bold text-neutral-black truncate leading-tight group-hover:text-primary-700 transition-colors">
                          {v.variantAttributes?.map(a => a.value).join(' / ') || v.name}
                        </span>
                        <span className="text-tag font-bold text-neutral-400 uppercase tabular-nums">
                          {v.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <IconButton variant="edit" icon="ph-pencil-simple" onClick={() => onEdit(v)} title="Editar Variação" />
                       <IconButton variant="delete" icon="ph-trash" onClick={() => onDelete(v)} title="Excluir Variação" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 bg-neutral-25 border border-neutral-100 border-dashed rounded-2xl flex flex-col items-center justify-center text-center gap-3">
                 <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-300 shadow-small">
                    <i className="ph ph-stack ph-bold text-2xl"></i>
                 </div>
                 <div className="flex flex-col gap-1">
                    <span className="text-body2 font-bold text-neutral-400">Nenhuma variação cadastrada</span>
                    <span className="text-small text-neutral-400">Crie cores, tamanhos ou materiais diferentes para este produto.</span>
                 </div>
                 <Button 
                  variant="secondary" 
                  leftIcon="ph ph-plus" 
                  className="mt-2 !h-[36px]"
                  onClick={() => setIsAddVariationModalOpen(true)}
                 >
                   Adicionar Variação
                 </Button>
              </div>
            )}
          </div>

        </div>
      </div>
      
      {/* Modals */}
      <AddVariationModal 
        isOpen={isAddVariationModalOpen}
        onClose={() => setIsAddVariationModalOpen(false)}
        productName={product.name}
        onGenerate={handleGenerateVariants}
      />
    </div>
  );
};
