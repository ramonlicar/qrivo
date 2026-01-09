
import React, { useState } from 'react';
import { Modal } from './Modal';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { IconButton } from './IconButton';

interface CategoryItem {
  id: string;
  name: string;
  count: number;
}

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose, categories }) => {
  const [newCategory, setNewCategory] = useState('');
  const [categoryList, setCategoryList] = useState<CategoryItem[]>(
    categories.map((cat, index) => ({ id: String(index), name: cat, count: index % 2 === 0 ? 5 : 0 }))
  );

  const handleAdd = () => {
    if (!newCategory.trim()) return;
    setCategoryList([{ id: Date.now().toString(), name: newCategory, count: 0 }, ...categoryList]);
    setNewCategory('');
  };

  const handleDelete = (id: string) => {
    setCategoryList(categoryList.filter(c => c.id !== id));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Minhas Categorias" maxWidth="532px" noPadding={true}>
      <div className="flex flex-col w-full h-full bg-white">
        <div className="p-6 flex flex-col gap-6 w-full">
          <div className="flex flex-row items-end gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-body2 font-bold text-neutral-black leading-none">Nova Categoria</label>
              <TextInput placeholder="Ex: Acessórios" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} containerClassName="w-full !h-[36px]" />
            </div>
            <Button variant="primary" onClick={handleAdd} className="!h-[36px] px-6 font-bold" leftIcon="ph ph-plus">ADD</Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-0 flex flex-col gap-2">
          {categoryList.map((item) => (
            <div key={item.id} className="flex justify-between items-center px-4 py-3 bg-neutral-25 rounded-xl border border-neutral-100 group">
              <div className="flex flex-col">
                <span className="text-body2 font-bold text-neutral-900">{item.name}</span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{item.count} produtos</span>
              </div>
              <IconButton variant="delete" icon="ph-trash" onClick={() => handleDelete(item.id)} title="Excluir Categoria" />
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};
