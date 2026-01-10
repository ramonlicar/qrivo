
import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { IconButton } from './IconButton';

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
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button variant="secondary" className="flex-1 !h-[36px] font-bold !rounded-lg" onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            className={`flex-1 !h-[36px] font-bold shadow-sm !rounded-lg ${combinations.length === 0 ? 'opacity-50 grayscale' : ''}`}
            disabled={combinations.length === 0}
            onClick={() => onGenerate(combinations)}
          >
            Gerar {combinations.length} Variantes
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <p className="text-body2 font-medium text-neutral-500 leading-relaxed">
            Defina as características que variam neste produto. O sistema gerará automaticamente todas as combinações possíveis.
          </p>
        </div>

        {/* Atributos Section */}
        <div className="flex flex-col gap-4">
          {/* Adicionar Atributo Manual */}
          <div className="flex flex-col sm:flex-row gap-3 items-center pb-2">
            <TextInput
              placeholder="Ex: Material, Voltagem..."
              value={newAttrName}
              onChange={(e) => setNewAttrName(e.target.value)}
              containerClassName="w-full sm:flex-1 !h-[36px] shadow-cards !rounded-lg"
              leftIcon="ph-list-plus"
            />
            <Button
              variant="secondary"
              className="w-full sm:w-auto !h-[36px] px-6 font-bold shadow-sm whitespace-nowrap !rounded-lg"
              leftIcon="ph ph-plus"
              onClick={handleAddAttribute}
              disabled={!newAttrName.trim()}
            >
              Novo Atributo
            </Button>
          </div>

          {attributes.map(attr => (
            <div key={attr.id} className="flex flex-col gap-4 p-3 bg-neutral-25 rounded-2xl border border-neutral-100 hover:shadow-sm transition-all group">
              <div className="flex items-center justify-between">
                <span className="text-body1 font-bold text-neutral-black tracking-tight">{attr.name}</span>
                <IconButton
                  variant="delete"
                  icon="ph-trash"
                  onClick={() => setAttributes(prev => prev.filter(a => a.id !== attr.id))}
                  title="Remover Atributo"
                  size="sm"
                  className="!rounded-lg"
                />
              </div>

              <div className="flex flex-wrap gap-2.5">
                {attr.values.map(val => (
                  <div key={val} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg shadow-small animate-in zoom-in-95 duration-200">
                    <span className="text-small font-bold text-neutral-900">{val}</span>
                    <button onClick={() => handleRemoveValue(attr.id, val)} className="text-neutral-400 hover:text-system-error-500 transition-colors">
                      <i className="ph ph-x ph-bold text-tag"></i>
                    </button>
                  </div>
                ))}

                <div className="relative flex-none">
                  <input
                    type="text"
                    placeholder="Novo valor..."
                    className="h-[36px] px-4 text-body2 font-medium text-neutral-black bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 w-[140px] shadow-cards transition-all placeholder:text-neutral-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddValue(attr.id, (e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <div className="absolute -top-6 left-0 text-tag font-bold text-primary-500 tracking-widest opacity-0 group-focus-within:opacity-100 transition-opacity">
                    <i className="ph ph-keyboard mr-1"></i>
                    Enter
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preview combinations if any */}
        {combinations.length > 0 ? (
          <div className="flex flex-col gap-4 mt-2 animate-in slide-in-from-top-4 duration-300">
            <div className="h-[1px] bg-neutral-100 w-full"></div>
            <div className="flex items-center justify-between">
              <h6 className="text-body2 font-medium text-neutral-500">Resumo das combinações ({combinations.length}):</h6>
              <Button
                variant="danger-light"
                className="!h-[28px] !text-[11px] !px-3 font-bold !rounded-md"
                onClick={() => setAttributes(prev => prev.map(a => ({ ...a, values: [] })))}
              >
                Limpar Tudo
              </Button>
            </div>
            <div className="flex flex-row flex-wrap gap-2 max-h-[140px] overflow-y-auto custom-scrollbar pr-2 p-1">
              {combinations.map((comb, i) => (
                <div key={i} className="px-3 py-1.5 bg-neutral-50 border border-neutral-100 rounded-lg text-tag font-bold text-neutral-600 flex items-center gap-2 shadow-xs group/item hover:bg-neutral-100 transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(10,184,109,0.4)]"></div>
                  {comb.name.split(' - ').slice(1).join(' - ')}
                </div>
              ))}
            </div>
            <div className="p-4 bg-primary-50/50 rounded-2xl border border-primary-100 flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 flex-none scale-90">
                <i className="ph ph-info ph-bold"></i>
              </div>
              <p className="text-small text-primary-900 font-medium leading-relaxed">
                Cada variação gerada consumirá 1 item do seu limite total de {combinations.length > 1 ? 'produtos' : 'produto'} do plano.
                <span className="block mt-0.5 opacity-70">Você pode editar os detalhes (preço, imagem, etc) de cada uma após gerar.</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4 p-8 border border-dashed border-neutral-200 rounded-3xl flex flex-col items-center justify-center text-center gap-3 bg-neutral-25/50">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-neutral-300 shadow-small border border-neutral-100">
              <i className="ph ph-stack ph-bold text-2xl"></i>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-body2 font-bold text-neutral-400">Nenhuma combinação gerada</span>
              <span className="text-small text-neutral-400 max-w-[280px]">Insira valores nos atributos acima para visualizar o preview das variantes.</span>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
