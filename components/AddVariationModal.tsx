
import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { TextInput } from './TextInput';

interface Attribute {
  id: string;
  name: string;
  values: string[];
}

interface AddVariationModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  onGenerate: (variants: any[]) => void;
}

export const AddVariationModal: React.FC<AddVariationModalProps> = ({ isOpen, onClose, productName, onGenerate }) => {
  const [attributes, setAttributes] = useState<Attribute[]>([
    { id: '1', name: 'Cor', values: [] },
    { id: '2', name: 'Tamanho', values: [] }
  ]);
  const [newAttrName, setNewAttrName] = useState('');

  const handleAddValue = (attrId: string, value: string) => {
    if (!value.trim()) return;
    setAttributes(prev => prev.map(attr => 
      attr.id === attrId ? { ...attr, values: Array.from(new Set([...attr.values, value.trim()])) } : attr
    ));
  };

  const handleRemoveValue = (attrId: string, value: string) => {
    setAttributes(prev => prev.map(attr => 
      attr.id === attrId ? { ...attr, values: attr.values.filter(v => v !== value) } : attr
    ));
  };

  const handleAddAttribute = () => {
    if (!newAttrName.trim()) return;
    setAttributes(prev => [...prev, { id: Date.now().toString(), name: newAttrName, values: [] }]);
    setNewAttrName('');
  };

  const combinations = useMemo(() => {
    const activeAttrs = attributes.filter(a => a.values.length > 0);
    if (activeAttrs.length === 0) return [];

    let results: any[] = [[]];
    activeAttrs.forEach(attr => {
      const newResults: any[] = [];
      results.forEach(res => {
        attr.values.forEach(val => {
          newResults.push([...res, { name: attr.name, value: val }]);
        });
      });
      results = newResults;
    });

    return results.map(comb => ({
      name: `${productName} - ${comb.map((c: any) => c.value).join(' - ')}`,
      attributes: comb
    }));
  }, [attributes, productName]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Configurar Variações"
      maxWidth="600px"
      footer={
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1 !h-[36px]" onClick={onClose}>Cancelar</Button>
          <Button 
            variant="primary" 
            className="flex-1 !h-[36px]" 
            disabled={combinations.length === 0}
            onClick={() => onGenerate(combinations)}
          >
            Gerar {combinations.length} Variantes
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <p className="text-body2 text-neutral-500">
            Defina as características que variam neste produto. O sistema gerará automaticamente todas as combinações possíveis.
          </p>
        </div>

        {/* Atributos Section */}
        <div className="flex flex-col gap-6">
          {attributes.map(attr => (
            <div key={attr.id} className="flex flex-col gap-3 p-4 bg-neutral-25 rounded-xl border border-neutral-100">
              <div className="flex items-center justify-between">
                <span className="text-body2 font-bold text-neutral-black">{attr.name}</span>
                <button 
                  onClick={() => setAttributes(prev => prev.filter(a => a.id !== attr.id))}
                  className="text-tag font-bold text-system-error-500 uppercase hover:underline"
                >
                  Remover Atributo
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {attr.values.map(val => (
                  <div key={val} className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-200 rounded-lg shadow-small">
                    <span className="text-[12px] font-bold text-neutral-900">{val}</span>
                    <button onClick={() => handleRemoveValue(attr.id, val)} className="text-neutral-400 hover:text-system-error-500">
                      <i className="ph ph-x-circle ph-bold"></i>
                    </button>
                  </div>
                ))}
                <div className="relative group">
                  <input 
                    type="text"
                    placeholder="Novo valor..."
                    className="h-8 px-3 text-[12px] font-medium text-neutral-black bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-50 w-32 shadow-small transition-all placeholder:text-neutral-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddValue(attr.id, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <span className="absolute left-0 -bottom-5 text-[9px] text-neutral-400 font-bold uppercase opacity-0 group-focus-within:opacity-100 transition-opacity">Pressione Enter</span>
                </div>
              </div>
            </div>
          ))}

          {/* Adicionar Atributo Manual */}
          <div className="flex gap-2 items-center pt-2">
            <TextInput 
              placeholder="Ex: Material, Voltagem..." 
              value={newAttrName}
              onChange={(e) => setNewAttrName(e.target.value)}
              containerClassName="flex-1 !h-[36px]"
            />
            <Button variant="secondary" className="!h-[36px]" leftIcon="ph ph-plus" onClick={handleAddAttribute}>Novo Atributo</Button>
          </div>
        </div>

        {/* Preview combinations if any */}
        {combinations.length > 0 && (
          <div className="flex flex-col gap-3">
             <div className="h-[1px] bg-neutral-100 w-full"></div>
             <h6 className="text-tag font-bold text-neutral-400 uppercase tracking-widest">Serão geradas:</h6>
             <div className="flex flex-col gap-1 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                {combinations.map((comb, i) => (
                  <div key={i} className="text-[12px] font-medium text-neutral-600 flex items-center gap-2">
                    <i className="ph ph-circle-fill text-[4px] text-primary-500"></i>
                    {comb.name}
                  </div>
                ))}
             </div>
             <div className="p-3 bg-primary-50 rounded-lg border border-primary-100 flex items-start gap-3 mt-2">
               <i className="ph ph-info ph-bold text-primary-600 mt-0.5"></i>
               <p className="text-[11px] text-primary-900 font-medium leading-tight">
                 Cada variação gerada consumirá 1 item do seu limite total de {combinations.length > 1 ? 'produtos' : 'produto'} do plano.
               </p>
             </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
