import React, { useState, useEffect, useCallback } from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { Dropdown } from './Dropdown';
import { Pagination } from './Pagination';
import { IconButton } from './IconButton';
import { CategoriesModal } from './CategoriesModal';
import { ImportProductsModal } from './ImportProductsModal';
import { Modal } from './Modal';
import { Product } from '../types';
import { productsService, companiesService } from '../lib/services';
import { supabase } from '../lib/supabase';

interface ProductsProps {
  onEdit: (product: Product) => void;
  onAddNew: () => void;
  onViewDetails: (product: Product) => void;
}

export const Products: React.FC<ProductsProps> = ({ onEdit, onAddNew, onViewDetails }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('A-Z');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Estados para exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter, sortBy]);

  // Fetch Company ID
  useEffect(() => {
    const fetchCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: company } = await companiesService.getMyCompany(user.id);
        if (company) setCompanyId(company.id);
      }
    };
    fetchCompany();
  }, []);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    if (!companyId) return;

    setIsLoading(true);
    try {
      const { data, count } = await productsService.getProducts(
        companyId,
        currentPage,
        itemsPerPage,
        {
          search: debouncedSearch,
          category: categoryFilter,
          status: statusFilter,
          sortBy: sortBy as any
        }
      );
      setProducts(data);
      setTotalCount(count);

      // Fetch categories
      const cats = await productsService.getCategories(companyId);
      setCategories(cats.map((c: any) => ({ id: c.id, name: c.name })));
    } catch (error) {
      console.error('Error fetching products:', error);
      showToast('Erro ao carregar produtos.');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, currentPage, itemsPerPage, debouncedSearch, categoryFilter, statusFilter, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleDeleteProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete && companyId) {
      const { error } = await productsService.deleteProduct(productToDelete.id);
      if (error) {
        showToast('Erro ao excluir produto.');
        console.error(error);
      } else {
        showToast(`Produto "${productToDelete.name}" removido com sucesso.`);
        // Refresh list
        fetchProducts();
      }
    }
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleEditClick = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    onEdit(product);
  };



  const tableGridClass = "grid grid-cols-[1fr_120px_180px_130px_120px_90px] items-center px-6";

  return (
    <div className="flex flex-col w-full h-full bg-white animate-in fade-in duration-500 overflow-hidden relative">
      {/* Toast Feedback */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-3 bg-primary-100 border border-primary-500 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <i className="ph ph-check-circle ph-fill text-primary-600 text-xl"></i>
          <span className="text-body2 font-bold text-primary-900">{toast.message}</span>
        </div>
      )}

      <div className="flex flex-col w-full bg-white flex-none border-b border-neutral-200">
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[12px] lg:gap-[16px] w-full min-h-[64px] lg:min-h-[72px]">
          <div className="flex flex-col items-start p-0 gap-[1px] flex-1 overflow-hidden">
            <h1 className="text-h4 font-bold text-neutral-black tracking-tight m-0 truncate w-full">Produtos</h1>
            <p className="hidden sm:block text-body2 font-normal text-neutral-500 m-0 truncate w-full">Organize seu catálogo de forma prática.</p>
          </div>
          <div className="flex items-center gap-3">

            <Button variant="secondary" leftIcon="ph ph-upload-simple" className="hidden sm:flex !h-[36px]" onClick={() => setIsImportModalOpen(true)}>Importar</Button>
            <Button
              variant="secondary"
              className="hidden sm:flex !h-[36px]"
              onClick={() => setIsCategoriesModalOpen(true)}
            >
              Categorias ({categories.length})
            </Button>
            <Button variant="primary" className="!h-[36px] font-bold shadow-sm" leftIcon="ph ph-plus" onClick={onAddNew}>Novo Produto</Button>
          </div>
        </div>
        <div className="flex flex-row items-center p-[12px_20px] lg:p-[12px_24px] gap-[16px] w-full bg-white border-t border-neutral-100">
          <div className="flex flex-row items-center gap-[12px] flex-1 overflow-x-auto no-scrollbar py-1">
            <TextInput placeholder="Pesquisar produto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} leftIcon="ph-magnifying-glass" containerClassName="w-[280px] shrink-0 !h-[36px]" />
            <Dropdown
              label="Categoria"
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categories.map((c: any) => ({ label: c.name, value: c.id }))}
              className="min-w-[140px] shrink-0 h-[36px]"
            />
            <Dropdown
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Ativo', value: 'ATIVO', color: 'bg-primary-500' },
                { label: 'Inativo', value: 'INATIVO', color: 'bg-neutral-400' }
              ]}
              className="min-w-[120px] shrink-0 h-[36px]"
            />
            {(searchTerm || categoryFilter || statusFilter) && (
              <Button
                variant="danger-light"
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('');
                  setStatusFilter('');
                }}
                className="!h-[36px]"
                leftIcon="ph ph-x-circle"
              >
                Limpar
              </Button>
            )}
          </div>

          {/* Sort Layout Fixed to Right */}
          <div className="flex-none pl-4 border-l border-neutral-100">
            <Dropdown
              label="Ordenar por"
              value={sortBy}
              onChange={setSortBy}
              options={[
                { label: 'A-Z', value: 'A-Z' },
                { label: 'Z-A', value: 'Z-A' },
                { label: 'Menor Preço', value: 'PRICE_ASC' },
                { label: 'Maior Preço', value: 'PRICE_DESC' }
              ]}
              className="min-w-[140px] shrink-0 h-[36px]"
              align="right"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-6 bg-white overflow-y-auto custom-scrollbar">
        <div className="bg-white border border-neutral-200 shadow-small rounded-[12px] overflow-hidden">
          <div className="w-full overflow-x-auto">
            <div className="min-w-[800px] w-full">
              {/* Table Header */}
              <div className={`${tableGridClass} h-[40px] bg-secondary-700 sticky top-0 z-20`}>
                <span className="text-body2 font-semibold text-white">Produto</span>
                <span className="text-body2 font-semibold text-white">Variações</span>
                <span className="text-body2 font-semibold text-white">Categoria</span>
                <span className="text-body2 font-semibold text-white">Preço</span>
                <span className="text-body2 font-semibold text-white text-center">Status</span>
                <span></span>
              </div>
              <div className="flex flex-col divide-y divide-neutral-100">
                {isLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <i className="ph ph-circle-notch animate-spin text-3xl text-primary-500"></i>
                  </div>
                ) : products.length > 0 ? (
                  products.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => onViewDetails(p)}
                      className={`${tableGridClass} min-h-[64px] py-2 hover:bg-neutral-25 transition-all group cursor-pointer`}
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-11 h-11 rounded-lg border border-neutral-100 bg-neutral-25 flex-none overflow-hidden shadow-small">
                          {p.image ? (
                            <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-300">
                              <i className="ph ph-image text-xl"></i>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 justify-center">
                          <span className="text-body2 font-bold text-neutral-black tracking-tight group-hover:text-primary-600 transition-colors">{p.name}</span>
                          {p.ref && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-neutral-400 font-medium">Ref: {p.ref}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-0.5">
                        <span className="text-body2 font-bold text-neutral-black">{p.variantCount} {p.variantCount === 1 ? 'Item' : 'Itens'}</span>
                      </div>

                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className="text-body2 font-medium text-neutral-600 truncate">{p.category}</span>
                      </div>

                      <span className="text-body2 font-bold text-neutral-black tabular-nums">
                        {p.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>

                      <div className="flex justify-center">
                        <Badge variant={p.availability === 'ATIVO' ? 'success' : 'neutral'}>
                          {p.availability}
                        </Badge>
                      </div>
                      <div className="flex justify-end gap-2 pr-2">
                        <IconButton
                          variant="edit"
                          icon="ph-pencil-simple"
                          size="sm"
                          onClick={(e) => handleEditClick(e, p)}
                          title="Editar Produto"
                        />
                        <IconButton
                          variant="delete"
                          icon="ph-trash"
                          size="sm"
                          onClick={(e) => handleDeleteProduct(e, p)}
                          title="Excluir Produto"
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                    <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mb-4 border border-neutral-100">
                      <i className="ph ph-package text-3xl text-neutral-200"></i>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h4 className="text-body2 font-bold text-neutral-900">Nenhum produto encontrado</h4>
                      <p className="text-small text-neutral-500">Tente ajustar sua busca ou filtros.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-neutral-100 bg-white">
            <span className="text-body2 font-medium text-neutral-500">
              Exibindo <span className="font-bold text-neutral-black">{products.length}</span> de <span className="font-bold text-neutral-black">{totalCount}</span> Resultado(s)
            </span>
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>

      <CategoriesModal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        companyId={companyId}
        onUpdate={fetchProducts}
      />

      <ImportProductsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={(msg) => {
          fetchProducts();
          if (msg) showToast(msg);
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Produto"
        maxWidth="400px"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 !h-[36px]" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" className="flex-1 !h-[36px] shadow-sm" onClick={confirmDeleteProduct}>
              Excluir Produto
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center justify-center py-2">
            <div className="w-16 h-16 bg-system-error-50 rounded-full flex items-center justify-center text-system-error-500 mb-2 border border-system-error-100 shadow-sm">
              <i className="ph ph-trash ph-bold text-3xl"></i>
            </div>
          </div>
          <div className="flex flex-col gap-2 text-center">
            <p className="text-body2 font-bold text-neutral-black">
              Deseja excluir "{productToDelete?.name}"?
            </p>
            <p className="text-small text-neutral-500 leading-relaxed">
              Esta ação removerá permanentemente o item do seu catálogo. Esta operação não pode ser desfeita.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
