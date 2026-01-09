
import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { customersService } from '../lib/services';
import { Customer } from '../types';

interface LeadPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (customer: Customer) => void;
  companyId?: string;
}

export const LeadPickerModal: React.FC<LeadPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  companyId
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && companyId) {
      fetchCustomers();
    }
  }, [isOpen, companyId]);

  const fetchCustomers = async () => {
    if (!companyId) return;
    setIsLoading(true);
    try {
      // Fetching a larger batch for client-side filtering support for now
      // Ideally we would add search to the service
      const { data } = await customersService.getCustomers(companyId, 1, 50);
      setCustomers(data);
    } catch (error) {
      console.error("Failed to fetch customers for picker", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(searchLower) ||
      c.phone.includes(searchTerm)
    );
  });

  const formatPhone = (phone: string) => {
    // Remove non-digits
    const digits = phone.replace(/\D/g, '');
    // Check if it looks like a BR number with DDI (12 or 13 digits usually, 55 + 2 digit DDD + 8 or 9 digit number)
    // Format: +55 (11) 98888-8888
    if (digits.length >= 12) {
      return `+${digits.substring(0, 2)} (${digits.substring(2, 4)}) ${digits.substring(4, 9)}-${digits.substring(9)}`;
    }
    // Fallback or just DDI+DDD+Num
    return phone;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adicionar Lead ao Funil"
      maxWidth="480px"
      noPadding
    >
      <div className="flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-neutral-100 bg-white sticky top-0 z-10">
          <TextInput
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon="ph-magnifying-glass"
            containerClassName="w-full !h-[36px]"
            autoFocus
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[400px] custom-scrollbar p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <i className="ph ph-circle-notch animate-spin text-2xl text-neutral-300"></i>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="flex flex-col gap-1">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => onSelect(customer)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors text-left group w-full"
                >
                  <div className="w-9 h-9 rounded-full bg-neutral-100 border border-neutral-100 overflow-hidden flex-none flex items-center justify-center text-neutral-400">
                    {customer.avatar ? (
                      <img src={customer.avatar} className="w-full h-full object-cover" alt={customer.name} />
                    ) : (
                      <span className="text-xs font-bold">{customer.name.substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-[14px] font-medium text-neutral-900 truncate">{customer.name}</span>
                    <span className="text-[12px] text-neutral-500 tabular-nums truncate">
                      {formatPhone(customer.phone)}
                    </span>
                  </div>
                  {/* Reuse check or arrow */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" className="!h-7 !px-3 !text-xs">Selecionar</Button>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300">
                <i className="ph ph-magnifying-glass text-xl"></i>
              </div>
              <div className="flex flex-col gap-1 px-8">
                <span className="text-[14px] font-medium text-neutral-600">Nenhum cliente encontrado</span>
                <span className="text-[12px] text-neutral-400">Verifique os termos da busca ou cadastre um novo cliente.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-3 bg-neutral-25 border-t border-neutral-100 flex items-center justify-center text-center">
          <p className="text-[11px] text-neutral-400">
            Dica: Gerencie seus clientes no menu <span className="font-medium text-neutral-600">Clientes</span>.
          </p>
        </div>
      </div>
    </Modal>
  );
};
