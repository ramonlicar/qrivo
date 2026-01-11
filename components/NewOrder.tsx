import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { Select } from './Select';
import { IconButton } from './IconButton';
import { customersService, productsService, teamService, ordersService, agentsService, deliveryService, companiesService } from '../lib/services';
import { getUserCompanyId, getSession } from '../lib/supabase';
import { Customer, Product, TeamMember, Order, DeliveryArea } from '../types';

interface NewOrderProps {
    onBack: () => void;
}

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

export const NewOrder: React.FC<NewOrderProps> = ({ onBack }) => {
    const { id: orderIdParam } = useParams();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [companyId, setCompanyId] = useState<string | null>(null);

    // Data Lists
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [deliveryOptions, setDeliveryOptions] = useState<DeliveryArea[]>([]);

    // Form State
    const [orderCode, setOrderCode] = useState<string | null>(null);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedResponsibleId, setSelectedResponsibleId] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [address, setAddress] = useState('');
    const [selectedDeliveryAreaId, setSelectedDeliveryAreaId] = useState('');
    const [notes, setNotes] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);

    // Product Search
    const [productSearch, setProductSearch] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, [orderIdParam]);

    const fetchInitialData = async () => {
        try {
            const session = await getSession();
            if (!session?.user) return;

            // Try to get actual company ID instead of just user ID
            const { data: myCompany } = await companiesService.getMyCompany(session.user.id);
            const cId = myCompany?.id || await getUserCompanyId();

            if (!cId) return;
            setCompanyId(cId);

            const [custData, prodData, teamData, agentData, deliveryData] = await Promise.all([
                customersService.getCustomers(cId, 1, 1000), // Fetching all for dropdown
                productsService.getProducts(cId, 1, 1000),
                teamService.getTeamMembers(cId),
                agentsService.getAgents(cId),
                deliveryService.getDeliveryAreas(cId)
            ]);

            if (custData.data) setCustomers(custData.data);
            if (prodData.data) setProducts(prodData.data);
            if (teamData.data) setTeamMembers(teamData.data as TeamMember[]);
            if (agentData?.data) setAgents(agentData.data);

            if (deliveryData.data) {
                console.log("Delivery areas fetched:", deliveryData.data);
                setDeliveryOptions(deliveryData.data);
            } else if (deliveryData.error) {
                console.error("Error fetching delivery areas:", deliveryData.error);
            }

            // Fetch and Pre-fill if editing (ID from URL)
            if (orderIdParam) {
                const { data: fetchedOrder } = await ordersService.getOrderById(orderIdParam);

                if (fetchedOrder) {
                    if (['delivered', 'ENTREGUE'].includes(fetchedOrder.order_status)) {
                        console.warn("Attempted to edit a delivered order. Redirecting...");
                        navigate('/');
                        return;
                    }
                    setOrderCode(fetchedOrder.code);
                    if (fetchedOrder.customer_id) setSelectedCustomerId(fetchedOrder.customer_id);
                    if (fetchedOrder.responsible_id) setSelectedResponsibleId(fetchedOrder.responsible_id);
                    if (fetchedOrder.payment_method) setPaymentMethod(fetchedOrder.payment_method);
                    if (fetchedOrder.order_summary) setNotes(fetchedOrder.order_summary);
                    if (fetchedOrder.delivery_area_id) setSelectedDeliveryAreaId(fetchedOrder.delivery_area_id);

                    if (fetchedOrder.shipping_address) {
                        setAddress(fetchedOrder.shipping_address);
                    } else {
                        setAddress('');
                    }

                    if (fetchedOrder.items && fetchedOrder.items.length > 0) {
                        const mappedItems: CartItem[] = fetchedOrder.items.map((item: any) => ({
                            productId: item.product_id || '',
                            name: item.name_snapshot,
                            price: item.price_snapshot,
                            quantity: item.quantity,
                            image: item.image_snapshot || ''
                        }));
                        setCart(mappedItems);
                    }
                }
            }

        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
                image: product.image
            }];
        });
    };

    const handleUpdateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleRemoveItem = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p =>
            p.name.toLowerCase().includes(productSearch.toLowerCase()) &&
            p.availability === 'ATIVO'
        );
    }, [products, productSearch]);

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shippingFee = useMemo(() => {
        const selected = deliveryOptions.find(d => d.id === selectedDeliveryAreaId);
        return selected?.fee || 0;
    }, [deliveryOptions, selectedDeliveryAreaId]);
    const total = subtotal + shippingFee;

    const handleSave = async () => {
        if (!companyId) return;
        if (!selectedCustomerId) {
            alert("Selecione um cliente.");
            return;
        }
        if (cart.length === 0) {
            alert("Adicione itens ao pedido.");
            return;
        }

        setIsSaving(true);
        try {
            const customer = customers.find(c => c.id === selectedCustomerId);

            const orderData = {
                customerId: selectedCustomerId,
                customerName: customer?.name || 'Cliente Desconhecido',
                customerPhone: customer?.phone || '',
                responsibleId: selectedResponsibleId || null,
                agentId: agents.length > 0 ? agents[0].id : null, // Uses first available agent
                total: total,
                subtotal: subtotal,
                paymentMethod: paymentMethod || 'credit_card', // Default
                items: cart,
                notes: notes,
                deliveryAreaId: selectedDeliveryAreaId || null,
                shippingFee: shippingFee,
                observations: notes,
                shippingAddress: address
            };

            let result;
            if (orderIdParam) {
                result = await ordersService.updateOrder(orderIdParam, orderData);
            } else {
                result = await ordersService.createOrder(companyId, orderData);
            }

            if (result.error) {
                throw result.error;
            }

            // Navigate to details page after successful save
            const savedOrderId = orderIdParam || result.data.id;
            navigate(`/pedidos/${savedOrderId}`);
        } catch (error: any) {
            console.error(`Erro ao ${orderIdParam ? 'atualizar' : 'criar'} pedido:`, error);
            alert(`Erro ao ${orderIdParam ? 'atualizar' : 'criar'} pedido: ${error.message || JSON.stringify(error)}`);
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
                    {orderIdParam ? `Editar Pedido #${orderCode || ''}` : 'Novo Pedido'}
                </h1>
                <Button
                    variant="primary"
                    onClick={handleSave}
                    isLoading={isSaving}
                    className="!h-[36px] px-6"
                >
                    {orderIdParam ? 'Salvar Alterações' : 'Criar Pedido'}
                </Button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white">
                <div className="max-w-[1200px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">

                    {/* Coluna da Esquerda: Detalhes */}
                    <div className="flex flex-col gap-6 bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                        <h2 className="text-base font-bold text-neutral-900 border-b border-neutral-100 pb-3">Detalhes do Pedido</h2>

                        <div className="flex flex-col gap-4">
                            {/* Cliente */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-900">Cliente</label>
                                <Select
                                    placeholder="Selecione o Cliente"
                                    value={selectedCustomerId}
                                    onChange={setSelectedCustomerId}
                                    options={customers.map(c => ({ label: c.name, value: c.id }))}
                                />
                            </div>

                            {/* Responsável */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-900">Responsável</label>
                                <Select
                                    placeholder="Selecione o Vendedor"
                                    value={selectedResponsibleId}
                                    onChange={setSelectedResponsibleId}
                                    options={teamMembers.map(t => ({ label: t.full_name || t.email, value: t.id }))}
                                />
                            </div>

                            {/* Método de Pagamento */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-900">Método de Pagamento</label>
                                <Select
                                    placeholder="Selecione"
                                    value={paymentMethod}
                                    onChange={setPaymentMethod}
                                    options={[
                                        { label: 'Cartão de Crédito', value: 'credit_card' },
                                        { label: 'Cartão de Débito', value: 'debit_card' },
                                        { label: 'PIX', value: 'pix' },
                                        { label: 'Boleto', value: 'boleto' },
                                        { label: 'Dinheiro', value: 'cash' },
                                    ]}
                                />
                            </div>

                            {/* Opção de Entrega */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-900">Opção de Entrega</label>
                                <Select
                                    placeholder="Selecione a Opção"
                                    value={selectedDeliveryAreaId}
                                    onChange={setSelectedDeliveryAreaId}
                                    options={[
                                        { label: 'Nenhuma / Retirada', value: '' },
                                        ...deliveryOptions.map(d => ({
                                            label: `${d.name} (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.fee)})`,
                                            value: d.id
                                        }))
                                    ]}
                                />
                            </div>

                            {/* Endereço */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-900">Endereço de Entrega</label>
                                <TextArea
                                    placeholder="Rua, Número, Bairro, CEP..."
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>

                            {/* Observações */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-neutral-900">Observações</label>
                                <TextArea
                                    placeholder="Alguma observação interna?"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Coluna da Direita: Itens */}
                    <div className="flex flex-col gap-6 h-full">

                        {/* Carrinho + Busca Integrada */}
                        <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[12px]">
                            <div className="flex items-center justify-between w-full">
                                <h5 className="text-h5 font-bold text-[#09090B]">Itens do Pedido</h5>
                                <span className="text-sm font-medium text-neutral-500">{cart.length} itens</span>
                            </div>

                            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] rounded-[16px] overflow-visible relative">

                                {/* Busca de Produtos com Dropdown */}
                                <div className="relative z-20 w-full">
                                    <TextInput
                                        placeholder="Buscar e adicionar produtos..."
                                        leftIcon="ph-magnifying-glass"
                                        value={productSearch}
                                        onChange={(e) => setProductSearch(e.target.value)}
                                        containerClassName="!h-[40px] !bg-white !border-[#DDDDD5]"
                                        autoComplete="off"
                                    />

                                    {productSearch && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                                            {isLoading ? (
                                                <div className="p-4 text-center text-neutral-400 text-sm">Carregando...</div>
                                            ) : filteredProducts.length === 0 ? (
                                                <div className="p-4 text-center text-neutral-400 text-sm">Nenhum produto encontrado.</div>
                                            ) : (
                                                <div className="flex flex-col p-1">
                                                    {filteredProducts.map(product => (
                                                        <button
                                                            key={product.id}
                                                            onClick={() => {
                                                                handleAddToCart(product);
                                                                setProductSearch('');
                                                            }}
                                                            className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-md transition-colors text-left group"
                                                        >
                                                            <div className="w-8 h-8 bg-neutral-100 rounded flex-none overflow-hidden">
                                                                {product.image ? (
                                                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                                        <i className="ph ph-cube"></i>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <div className="text-sm font-medium text-neutral-900 truncate">{product.name}</div>
                                                                <div className="text-xs text-neutral-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}</div>
                                                            </div>
                                                            <div className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <i className="ph ph-plus-circle text-lg"></i>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {cart.length === 0 ? (
                                    <div className="w-full py-8 text-center flex flex-col items-center gap-2 text-neutral-400 border border-dashed border-neutral-200 rounded-lg bg-neutral-25">
                                        <i className="ph ph-shopping-cart text-2xl"></i>
                                        <span className="text-sm">Nenhum item adicionado</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3 w-full">
                                        {cart.map(item => (
                                            <div key={item.productId} className="flex items-center gap-3 p-3 border border-neutral-100 rounded-lg hover:border-neutral-200 transition-colors bg-white">
                                                <div className="w-12 h-12 bg-neutral-100 rounded-md overflow-hidden flex-none">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                                            <i className="ph ph-image"></i>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-sm font-bold text-neutral-900 truncate">{item.name}</div>
                                                    <div className="text-xs text-neutral-500">
                                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 bg-neutral-50 rounded-md p-1">
                                                    <button onClick={() => handleUpdateQuantity(item.productId, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded shadow-sm text-neutral-600 transition-all disabled:opacity-50">
                                                        <i className="ph ph-minus text-xs"></i>
                                                    </button>
                                                    <span className="text-sm font-semibold tabular-nums w-4 text-center">{item.quantity}</span>
                                                    <button onClick={() => handleUpdateQuantity(item.productId, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-white rounded shadow-sm text-neutral-600 transition-all">
                                                        <i className="ph ph-plus text-xs"></i>
                                                    </button>
                                                </div>

                                                <div className="text-sm font-bold text-neutral-900 tabular-nums w-20 text-right">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price * item.quantity)}
                                                </div>

                                                <button onClick={() => handleRemoveItem(item.productId)} className="w-8 h-8 flex items-center justify-center hover:bg-red-50 text-neutral-400 hover:text-red-500 rounded-lg transition-colors">
                                                    <i className="ph ph-trash"></i>
                                                </button>
                                            </div>
                                        ))}

                                        <div className="mt-6 pt-6 border-t border-neutral-100 flex flex-col gap-3">
                                            <div className="flex justify-between items-center text-sm font-medium text-neutral-500">
                                                <span>Subtotal</span>
                                                <span className="text-neutral-900 font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-medium text-neutral-500">
                                                <span>Taxa de Entrega</span>
                                                <span className={shippingFee === 0 ? "text-emerald-500 font-semibold" : "text-neutral-900 font-semibold"}>
                                                    {shippingFee === 0 ? 'Grátis' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(shippingFee)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-lg font-bold text-neutral-900">Total</span>
                                                <span className="text-2xl font-bold text-neutral-900 tabular-nums">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
