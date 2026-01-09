
import React, { useState } from 'react';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { TextArea } from './TextArea';
import { Dropdown } from './Dropdown';
import { onboardingService } from '../lib/services';
import { supabase } from '../lib/supabase';

interface OnboardingPageProps {
  onComplete: () => void;
  userId: string;
}

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete, userId }) => {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    empresaNome: '',
    areaAtuacao: '',
    descricao: '',
    cargo: '',
    faturamento: '',
    horaInicio: '08:00',
    horaFim: '18:00',
    objetivo: '',
    origem: '',
    nivelTech: ''
  });

  const nextStep = () => {
    if (step < 6) {
      setStep((step + 1) as OnboardingStep);
    } else {
      handleFinish();
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((step - 1) as OnboardingStep);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleFinish = async () => {
    if (!userId) {
      alert("Identificação de usuário não encontrada. Por favor, recarregue a página.");
      return;
    }

    setIsLoading(true);
    try {
      await onboardingService.completeOnboarding(userId, formData);
      onComplete();
    } catch (err: any) {
      console.error('Erro ao salvar onboarding:', err);
      // Extrai a mensagem de erro de forma segura para evitar [object Object]
      const errorMsg = err?.message || err?.error_description || (typeof err === 'string' ? err : "Erro interno ao salvar dados");
      alert('Não foi possível salvar o onboarding: ' + errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-2">
              <h2 className="text-h4 font-black text-neutral-black tracking-tight">O que você vende?</h2>
              <p className="text-body2 text-neutral-500">Configure os dados iniciais do seu negócio.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-body2 font-bold text-neutral-black px-1">Área de Atuação</label>
                <Dropdown
                  label="Selecione o nicho"
                  value={formData.areaAtuacao}
                  onChange={(val) => setFormData({ ...formData, areaAtuacao: val })}
                  options={[
                    { label: 'E-commerce / Varejo', value: 'E-commerce / Varejo' },
                    { label: 'Serviços Especializados', value: 'Serviços Especializados' },
                    { label: 'Infoprodutos', value: 'Infoprodutos' },
                    { label: 'Alimentação', value: 'Alimentação' },
                    { label: 'Imobiliário', value: 'Imobiliário' }
                  ]}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-body2 font-bold text-neutral-black px-1">Descrição Curta</label>
                <TextArea
                  placeholder="Resuma o que sua empresa oferece..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  containerClassName="min-h-[80px]"
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-2">
              <h2 className="text-h4 font-black text-neutral-black tracking-tight">Porte do Negócio</h2>
              <p className="text-body2 text-neutral-500">Conte-nos sobre o faturamento aproximado.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-body2 font-bold text-neutral-black px-1">Seu Cargo</label>
                <Dropdown
                  label="Seu papel"
                  value={formData.cargo}
                  onChange={(val) => setFormData({ ...formData, cargo: val })}
                  options={[
                    { label: 'Proprietário / CEO', value: 'Proprietário / CEO' },
                    { label: 'Gerente Comercial', value: 'Gerente Comercial' },
                    { label: 'Vendedor / Operador', value: 'Vendedor / Operador' }
                  ]}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-body2 font-bold text-neutral-black px-1">Faturamento Mensal</label>
                <Dropdown
                  label="Faixa de faturamento"
                  value={formData.faturamento}
                  onChange={(val) => setFormData({ ...formData, faturamento: val })}
                  options={[
                    { label: 'Iniciante (Até R$ 10k)', value: 'Iniciante (Até R$ 10k)' },
                    { label: 'Intermediário (R$ 10k - 50k)', value: 'Intermediário (R$ 10k - 50k)' },
                    { label: 'Escala (Acima de R$ 50k)', value: 'Escala (Acima de R$ 50k)' }
                  ]}
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-2">
              <h2 className="text-h4 font-black text-neutral-black tracking-tight">Horário do Agente</h2>
              <p className="text-body2 text-neutral-500">Quando seus clientes mais entram em contato?</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-body2 font-bold text-neutral-black px-1">Início</label>
                <TextInput type="time" value={formData.horaInicio} onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-body2 font-bold text-neutral-black px-1">Fim</label>
                <TextInput type="time" value={formData.horaFim} onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })} />
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-2">
              <h2 className="text-h4 font-black text-neutral-black tracking-tight">Objetivo Principal</h2>
              <p className="text-body2 text-neutral-500">O que você mais deseja automatizar?</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'vendas', label: 'Vender no WhatsApp', desc: 'Foco em conversão direta de leads.' },
                { id: 'tempo', label: 'Liberar meu tempo', desc: 'IA responde dúvidas repetitivas.' },
                { id: 'atendimento', label: 'Atendimento 24/7', desc: 'Nunca mais deixe um cliente esperando.' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, objetivo: opt.label })}
                  className={`flex flex-col items-start gap-1 p-4 rounded-2xl border-2 transition-all text-left ${formData.objetivo === opt.label ? 'border-primary-500 bg-primary-50' : 'border-neutral-100 hover:border-neutral-200 bg-white'}`}
                >
                  <span className={`text-body2 font-bold ${formData.objetivo === opt.label ? 'text-neutral-black' : 'text-neutral-black'}`}>{opt.label}</span>
                  <span className="text-small text-neutral-400 font-medium">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-2">
              <h2 className="text-h4 font-black text-neutral-black tracking-tight">Como nos achou?</h2>
              <p className="text-body2 text-neutral-500">Queremos saber sua origem.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Instagram', 'Google Search', 'Indicação', 'YouTube', 'TikTok', 'Anúncio'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setFormData({ ...formData, origem: opt })}
                  className={`p-4 rounded-xl border-2 transition-all text-center font-bold text-body2 ${formData.origem === opt ? 'border-primary-500 bg-primary-50 text-neutral-black' : 'border-neutral-100 hover:border-neutral-200 bg-white text-neutral-black'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col gap-2">
              <h2 className="text-h4 font-black text-neutral-black tracking-tight">Nível Tecnológico</h2>
              <p className="text-body2 text-neutral-500">Sua facilidade com automações.</p>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { id: 'baixa', label: 'Iniciante', desc: 'Nunca usei ferramentas de IA antes.' },
                { id: 'media', label: 'Intermediário', desc: 'Já usei ChatGPT ou outras IAs.' },
                { id: 'alta', label: 'Avançado', desc: 'Domino ferramentas de automação.' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFormData({ ...formData, nivelTech: opt.label })}
                  className={`flex flex-col gap-1 p-4 rounded-2xl border-2 transition-all text-left ${formData.nivelTech === opt.label ? 'border-primary-500 bg-primary-50' : 'border-neutral-100 hover:border-neutral-200 bg-white'}`}
                >
                  <span className={`text-body2 font-bold ${formData.nivelTech === opt.label ? 'text-neutral-black' : 'text-neutral-black'}`}>{opt.label}</span>
                  <span className="text-small text-neutral-400 font-medium">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const isNextDisabled = () => {
    if (step === 1) return !formData.areaAtuacao;
    if (step === 2) return !formData.cargo || !formData.faturamento;
    if (step === 4) return !formData.objetivo;
    if (step === 5) return !formData.origem;
    if (step === 6) return !formData.nivelTech;
    return false;
  };

  return (
    <div className="min-h-screen w-full bg-neutral-25 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-[480px] flex flex-col gap-10">
        <div className="flex flex-col items-center gap-8 w-full">
          <div
            onClick={handleLogout}
            className="cursor-pointer hover:opacity-80 transition-opacity"
            title="Voltar para login"
          >
            <img src="//0e65cb6695ddeca8cb391ef6f8f9b815.cdn.bubble.io/f1759800667234x298580053943223740/logo%20qrivo%20ia.svg" alt="Qrivo" className="h-10 w-auto" />
          </div>
          <div className="w-full flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Configuração Inicial</span>
              <span className="text-[11px] font-bold text-primary-600">Passo {step} de 6</span>
            </div>

            {/* Barra de Progresso Contínua */}
            <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-neutral-100 shadow-[0_30px_60px_rgba(0,0,0,0.04)] p-8 sm:p-12 flex flex-col gap-10 min-h-[500px]">
          <div className="flex-1">
            {renderStepContent()}
          </div>
          <div className="flex gap-4 pt-8 border-t border-neutral-50">
            {step > 1 && (
              <Button variant="secondary" className="flex-1 !h-[36px] font-bold" onClick={prevStep}>Voltar</Button>
            )}
            <Button
              variant="primary"
              className="flex-[2] !h-[36px] font-bold shadow-sm"
              onClick={nextStep}
              disabled={isNextDisabled() || isLoading}
              isLoading={isLoading}
            >
              {step === 6 ? 'Finalizar e Entrar' : 'Próximo Passo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
