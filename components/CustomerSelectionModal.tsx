import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Customer } from '../types';
import { customersService } from '../lib/services';
import { TextInput } from './TextInput';
import { Button } from './Button';
import { getUserCompanyId } from '../lib/supabase';

interface CustomerSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (customer: Customer) => void;
}

export const CustomerSelectionModal: React.FC<CustomerSelectionModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadCustomers('');
        }
    }, [isOpen]);

    const loadCustomers = async (search: string) => {
        setLoading(true);
        try {
            const companyId = await getUserCompanyId();
            if (!companyId) return;

            // Assuming we can fetch all or search. For now, fetching first 50 to display list.
            // Ideally, specific search API.
            const { data } = await customersService.getCustomers(companyId, 1, 50); // Simple fetch
            if (data) {
                setCustomers(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Vincular Cliente"
            maxWidth="500px"
        >
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-hidden">
                <TextInput
                    placeholder="Buscar por nome, telefone ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon="ph-magnifying-glass"
                    autoFocus
                />

                <div className="flex-1 overflow-y-auto custom-scrollbar border border-neutral-100 rounded-lg">
                    {loading ? (
                        <div className="flex items-center justify-center p-8">
                            <i className="ph ph-spinner animate-spin text-2xl text-primary-500"></i>
                        </div>
                    ) : filteredCustomers.length > 0 ? (
                        <div className="divide-y divide-neutral-100">
                            {filteredCustomers.map(customer => (
                                <div
                                    key={customer.id}
                                    className="flex items-center gap-3 p-3 hover:bg-neutral-50 cursor-pointer transition-colors"
                                    onClick={() => onSelect(customer)}
                                >
                                    <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-none">
                                        {customer.avatar ? (
                                            <img src={customer.avatar} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <i className="ph ph-user text-neutral-400"></i>
                                        )}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-body2 font-bold text-neutral-900 truncate">{customer.name}</span>
                                        <span className="text-small text-neutral-500 truncate">{customer.phone}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-neutral-500 text-small">
                            Nenhum cliente encontrado.
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
