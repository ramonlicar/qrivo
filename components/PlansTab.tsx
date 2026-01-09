import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { plansService, Plan, Subscription } from '../lib/services';
import { getUserCompanyId } from '../lib/supabase';

interface PlansTabProps {
    onCancelClick: () => void;
}

type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

export const PlansTab: React.FC<PlansTabProps> = ({ onCancelClick }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const companyId = await getUserCompanyId();
                if (companyId) {
                    const [plansRes, subRes] = await Promise.all([
                        plansService.getPlans(),
                        plansService.getSubscription(companyId)
                    ]);
                    setPlans(plansRes.data || []);
                    setSubscription(subRes.data);
                }
            } catch (error) {
                console.error("Failed to fetch plans data", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    // Helper to get features list from any Pro plan (assuming consistent features across cycles)
    const getProFeatures = () => {
        const pro = plans.find(p => p.name !== 'Gratuito');
        return pro?.features || [
            'Vendedor IA Ilimitado',
            'Funil de Vendas Completo',
            'Gestão de Clientes e Produtos',
            'Suporte Prioritário',
            'Dashboard Avançado'
        ];
    };

    const proFeatures = getProFeatures();

    // Configuration for the 3 display cards
    const pricingOptions = [
        {
            id: 'monthly',
            title: 'Mensal',
            priceDisplay: 'R$147',
            multiplier: null,
            description: 'Faturamento mensal',
            highlight: false
        },
        {
            id: 'semiannual',
            title: 'Semestral',
            priceDisplay: 'R$127',
            multiplier: '6x',
            description: 'Faturamento semestral',
            highlight: true
        },
        {
            id: 'annual',
            title: 'Anual',
            priceDisplay: 'R$97',
            multiplier: '12x',
            description: 'Faturamento anual',
            highlight: false
        }
    ];

    if (loading) {
        return <div className="p-10 flex justify-center"><span className="text-neutral-500">Carregando planos...</span></div>;
    }

    // Determine Active Plan
    // If subscription exists, use it.
    // If NOT, default to the Pro plan (Trial mode) instead of Free plan.
    const proPlan = plans.find(p => p.name !== 'Gratuito');
    const activePlan = subscription?.plan || proPlan;

    // Safety check just in case no plans loaded at all
    if (!activePlan && plans.length === 0) return null;

    const isTrial = !subscription;
    const activePlanName = isTrial ? 'Trial (Pro)' : activePlan?.name;

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-300 pb-10">

            {/* SEÇÃO 1: VISÃO GERAL (Preserved Layout & Dynamic Stats) */}
            <div className="box-border flex flex-col items-start p-4 gap-4 w-full bg-[#F4F4F1] border border-[#E8E8E3] shadow-small rounded-[12px]">
                <h5 className="text-h5 font-bold text-[#09090B]">Visão Geral da Assinatura</h5>

                <div className="box-border flex flex-col w-full bg-[#F8F6F6] border border-[#DDDDD5] shadow-small rounded-[16px] p-6 gap-8">

                    {/* Header da Box Interna */}
                    <div className="flex flex-row items-center justify-between w-full">
                        <h5 className="text-h5 font-bold text-[#09090B]">
                            Plano Atual: <span className="text-primary-600">{activePlanName}</span>
                        </h5>

                        <div className="flex items-center gap-4">
                            {isTrial && (
                                <span className="text-body2 font-bold text-amber-500">Período de Testes</span>
                            )}
                            {subscription && (
                                <button
                                    onClick={onCancelClick}
                                    className="text-body2 font-bold text-system-error-500 hover:text-system-error-700 transition-colors"
                                >
                                    Cancelar Assinatura
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Cartão de Pagamento */}
                    {subscription ? (
                        <div className="flex flex-row items-center p-3 gap-3 w-full bg-[#F4F4F1] border border-[#DDDDD5] shadow-small rounded-[12px] h-[68px]">
                            <div className="flex flex-row justify-center items-center w-[44px] h-[44px] bg-[#042522] rounded-[8px] flex-none">
                                <i className="ph ph-credit-card text-white text-[24px]"></i>
                            </div>
                            <div className="flex flex-col items-start gap-[3px] flex-grow">
                                <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#686864] leading-[18px]">Cartão</span>
                                <span className="text-[18px] font-bold text-[#1F1F1E] leading-[120%]">**** **** **** 4242</span>
                            </div>
                            <Button
                                variant="secondary"
                                className="!h-[32px] !bg-white !border-[#E8E8E3] !shadow-[0px_1px_2px_rgba(0,0,0,0.05)] !text-[13px] font-medium !text-[#01040E]"
                            >
                                Alterar Cartão
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-row items-center p-3 gap-3 w-full bg-[#F4F4F1] border border-[#DDDDD5] shadow-small rounded-[12px] h-[68px] opacity-75">
                            <div className="flex flex-row justify-center items-center w-[44px] h-[44px] bg-neutral-300 rounded-[8px] flex-none">
                                <i className="ph ph-credit-card text-white text-[24px]"></i>
                            </div>
                            <div className="flex flex-col items-start gap-[1px] flex-grow">
                                <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#686864] leading-[18px]">Método de Pagamento</span>
                                <span className="text-body2 text-neutral-500">Nenhum cartão vinculado</span>
                            </div>
                        </div>
                    )}

                    {/* Estatísticas / Limites (DYNAMIC VALUES PRESERVED) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Box 1: Pedidos Mensais */}
                        <div className="flex flex-row items-center p-3 gap-3 w-full bg-[#F4F4F1] border border-[#DDDDD5] shadow-small rounded-[12px] h-[68px]">
                            <div className="flex flex-row justify-center items-center w-[44px] h-[44px] bg-[#042522] rounded-[8px] flex-none">
                                <i className="ph ph-shopping-cart text-white text-[24px]"></i>
                            </div>
                            <div className="flex flex-col items-start gap-[3px] flex-grow">
                                <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#686864] leading-[18px]">Pedidos Mensais</span>
                                <span className="text-[18px] font-bold text-[#1F1F1E] leading-[120%]">
                                    151 de {activePlan?.max_orders === -1 ? 'Ilimitado' : activePlan?.max_orders}
                                </span>
                            </div>
                        </div>

                        {/* Box 2: Produtos Cadastrados */}
                        <div className="flex flex-row items-center p-3 gap-3 w-full bg-[#F4F4F1] border border-[#DDDDD5] shadow-small rounded-[12px] h-[68px]">
                            <div className="flex flex-row justify-center items-center w-[44px] h-[44px] bg-[#042522] rounded-[8px] flex-none">
                                <i className="ph ph-package text-white text-[24px]"></i>
                            </div>
                            <div className="flex flex-col items-start gap-[3px] flex-grow">
                                <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#686864] leading-[18px]">Produtos Cadastrados</span>
                                <span className="text-[18px] font-bold text-[#1F1F1E] leading-[120%]">
                                    251 de {activePlan?.max_products === -1 ? 'Ilimitado' : activePlan?.max_products}
                                </span>
                            </div>
                        </div>

                        {/* Box 3: Clientes */}
                        <div className="flex flex-row items-center p-3 gap-3 w-full bg-[#F4F4F1] border border-[#DDDDD5] shadow-small rounded-[12px] h-[68px]">
                            <div className="flex flex-row justify-center items-center w-[44px] h-[44px] bg-[#042522] rounded-[8px] flex-none">
                                <i className="ph ph-users text-white text-[24px]"></i>
                            </div>
                            <div className="flex flex-col items-start gap-[3px] flex-grow">
                                <span className="text-[11px] font-medium uppercase tracking-[0.02em] text-[#686864] leading-[18px]">Clientes</span>
                                <span className="text-[18px] font-bold text-[#1F1F1E] leading-[120%]">
                                    1 de {activePlan?.max_clients === -1 ? 'Ilimitado' : activePlan?.max_clients}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>


            {/* SEÇÃO 2: PLANOS DISPONÍVEIS */}
            <div className="box-border flex flex-col items-center p-6 gap-6 w-full bg-[#F8F6F6] border border-[#DDDDD5] rounded-[12px]">
                <h5 className="text-[18px] font-bold text-[#09090B] leading-[120%] h-[22px] flex items-center">
                    Escolha o melhor plano para você
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-[1000px]">
                    {pricingOptions.map((option) => (
                        <div key={option.id} className="box-border flex flex-col items-start p-4 gap-4 w-full bg-white border border-[#DDDDD5] shadow-small rounded-[12px] h-full min-h-[360px] relative overflow-hidden group hover:border-primary-300 transition-all">

                            {/* Pro Tag/Icon */}
                            <div className="flex flex-row items-center gap-4 w-full h-[44px]">
                                <div className="flex flex-row items-start p-[10px] gap-[10px] w-[44px] h-[44px] bg-[#046B62] rounded-[8px] flex-none">
                                    <i className="ph ph-crown text-white text-[24px]"></i>
                                </div>
                                <div className="flex flex-col justify-center items-start w-full">
                                    <span className="text-[15px] font-semibold text-[#01040E] leading-[140%]">Pro {option.title}</span>
                                    <span className="text-[13px] font-normal text-[#2C2C2A] leading-[140%]">{option.description}</span>
                                </div>
                            </div>

                            <div className="w-full h-[1px] bg-[#EEEEEC]"></div>

                            <div className="flex flex-col justify-between items-start gap-6 w-full h-full flex-1">
                                <div className="flex flex-col items-start gap-6 w-full">
                                    <div className="flex flex-row items-center gap-1 h-[29px]">
                                        {option.multiplier && (
                                            <span className="text-[24px] font-bold text-[#01040E] leading-[120%] opacity-60 mr-1">{option.multiplier}</span>
                                        )}
                                        <span className="text-[28px] font-bold text-primary-600 leading-[120%]">{option.priceDisplay}</span>
                                    </div>

                                    <div className="flex flex-col items-start gap-3 w-full">
                                        {proFeatures.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <i className="ph ph-check text-primary-500 text-sm"></i>
                                                <span className="text-[13px] font-medium text-[#01040E] leading-[140%]">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    className="!w-full !h-[36px] !bg-[#0AB86D] !border-[#059E5D] !shadow-sm !rounded-[8px] !text-[13px] font-bold text-white mt-auto"
                                >
                                    Assinar {option.title}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
