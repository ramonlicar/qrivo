
import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from './Modal';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { productsService } from '../lib/services';

interface CategoryItem {
  id: string;
  name: string;
  count: number;
}

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string | null;
  onUpdate?: () => void;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({ isOpen, onClose, companyId, onUpdate }) => {
  const [newCategory, setNewCategory] = useState('');
  const [categoryList, setCategoryList] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetchCategories = useCallback(async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      const data = await productsService.getCategoriesWithCount(companyId);
      setCategoryList(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

  const handleAdd = async () => {
    if (!newCategory.trim() || !companyId) return;
    setIsProcessing(true);
    try {
      const { data, error } = await productsService.createCategory(companyId, newCategory.trim());
      if (error) throw error;
      setNewCategory('');
      fetchCategories();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error adding category:", error);
      alert("Erro ao criar categoria. Verifique se o nome já existe.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) return;
    setIsProcessing(true);
    try {
      const { error } = await productsService.updateCategory(id, editingName.trim());
      if (error) throw error;
      setEditingId(null);
      fetchCategories();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error updating category:", error);
      alert("Erro ao atualizar categoria.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (item: CategoryItem) => {
    if (item.count > 0) {
      alert(`Não é possível excluir a categoria "${item.name}" pois ela possui ${item.count} produtos vinculados.`);
      return;
    }

    // No confirmation needed for empty categories as per user request

    setIsProcessing(true);
    try {
      const { error } = await productsService.deleteCategory(item.id);
      if (error) throw error;
      fetchCategories();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Erro ao excluir categoria.");
    } finally {
      setIsProcessing(false);
    }
  };

  const startEditing = (item: CategoryItem) => {
    setEditingId(item.id);
    setEditingName(item.name);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Minhas Categorias" maxWidth="532px" noPadding={true}>
      <div className="flex flex-col w-full h-full bg-white max-h-[80vh]">
        <div className="p-6 flex flex-col gap-6 w-full border-b border-neutral-100">
          <div className="flex flex-row items-end gap-3 w-full">
            <div className="flex flex-col gap-2 flex-1">
              <label className="text-body2 font-bold text-neutral-black leading-none tracking-tight">Nova Categoria</label>
              <TextInput
                placeholder="Ex: Acessórios"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                containerClassName="w-full !h-[36px]"
                disabled={isProcessing}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <Button
              variant="primary"
              onClick={handleAdd}
              className="!h-[36px] px-6 font-bold"
              leftIcon="ph ph-plus"
              isLoading={isProcessing && !editingId}
              disabled={!newCategory.trim() || isProcessing}
            >
              ADD
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col gap-1">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <i className="ph ph-circle-notch animate-spin text-2xl text-primary-500"></i>
            </div>
          ) : categoryList.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 text-body2 font-medium">
              Nenhuma categoria cadastrada.
            </div>
          ) : (
            categoryList.map((item) => (
              <div key={item.id} className="flex justify-between items-center px-4 py-3 bg-neutral-25 rounded-xl border border-neutral-100 group transition-all hover:border-primary-200">
                <div className="flex flex-col flex-1 mr-4">
                  {editingId === item.id ? (
                    <div className="flex gap-2 items-center">
                      <TextInput
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        containerClassName="!h-[32px] flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdate(item.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                      />
                      <button
                        onClick={() => handleUpdate(item.id)}
                        className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                      >
                        <i className="ph ph-check text-lg"></i>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 rounded-lg bg-neutral-50 text-neutral-400 hover:bg-neutral-100 transition-colors"
                      >
                        <i className="ph ph-x text-lg"></i>
                      </button>
                    </div>
                  ) : (
                    <>
                      <span
                        className="text-body2 font-bold text-neutral-900 cursor-pointer hover:text-primary-600 transition-colors"
                        onClick={() => startEditing(item)}
                      >
                        {item.name}
                      </span>
                      <span className="text-[10px] font-bold text-neutral-400 tracking-widest">{item.count} produtos</span>
                    </>
                  )}
                </div>
                <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                  {!editingId && (
                    <>
                      <IconButton
                        variant="edit"
                        icon="ph-pencil-simple"
                        size="sm"
                        onClick={() => startEditing(item)}
                        title="Editar"
                      />
                      <IconButton
                        variant="delete"
                        icon="ph-trash"
                        size="sm"
                        onClick={() => handleDelete(item)}
                        title={item.count > 0 ? "Não é possível excluir categorias com produtos" : "Excluir"}
                        disabled={item.count > 0}
                        className={item.count > 0 ? "!opacity-30 !text-neutral-400 grayscale cursor-not-allowed" : ""}
                      />
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};
