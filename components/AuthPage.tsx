
import React, { useState } from 'react';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { supabase } from '../lib/supabase';
import { formatWhatsApp, cleanWhatsApp } from '../lib/utils';

interface AuthPageProps {
  onLoginSuccess: (isNewUser: boolean, authData: any) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    whatsapp: ''
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const whatsappClean = cleanWhatsApp(formData.whatsapp);

      if (view === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
              company_name: formData.companyName,
              whatsapp: whatsappClean
            }
          }
        });

        if (error) throw error;

        if (data.user) {
          if (data.session) {
            // Conta e empresa já criadas via Database Trigger
            onLoginSuccess(true, data);
          } else {
            setSuccessMsg('Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta e poder acessar o painel.');
            setView('login');
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.toLowerCase().includes('email not confirmed')) {
            throw new Error('Seu e-mail ainda não foi confirmado. Por favor, verifique sua caixa de entrada.');
          }
          throw error;
        }

        if (data.user) {
          onLoginSuccess(false, data);
        }
      }
    } catch (err: any) {
      console.error("Erro na autenticação:", err);
      const message = err?.message || "Ocorreu um erro inesperado. Tente novamente.";
      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-neutral-25 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-[420px] flex flex-col gap-8">
        <div className="flex justify-center">
          <img src="//0e65cb6695ddeca8cb391ef6f8f9b815.cdn.bubble.io/f1759800667234x298580053943223740/logo%20qrivo%20ia.svg" alt="Qrivo.ia" className="h-[48px] w-auto" />
        </div>

        <div className="bg-white rounded-[24px] border border-neutral-100 shadow-cards p-8 sm:p-10 flex flex-col gap-7">
          <div className="flex flex-col gap-2">
            <h1 className="text-h4 font-bold text-neutral-black tracking-tight leading-none">
              {view === 'login' ? 'Bem-vindo de volta' : 'Começar Gratuitamente'}
            </h1>
            <p className="text-body2 text-neutral-500 font-medium">Acesse seu centro de operações de vendas IA.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-system-error-500 text-[12px] font-bold animate-in shake-in duration-300">
              <i className="ph ph-warning-circle mr-2"></i>
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg text-primary-700 text-[12px] font-bold animate-in fade-in duration-300">
              <i className="ph ph-check-circle mr-2"></i>
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {view === 'signup' && (
              <TextInput
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                leftIcon="ph-user"
                required
              />
            )}

            {view === 'signup' && (
              <TextInput
                placeholder="Nome da sua empresa"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                leftIcon="ph-buildings"
                required
              />
            )}
            {view === 'signup' && (
              <TextInput
                placeholder="Seu WhatsApp (DDD + Número)"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: formatWhatsApp(e.target.value) })}
                leftIcon="ph-whatsapp-logo"
                required
              />
            )}

            <TextInput
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              leftIcon="ph-envelope-simple"
              required
            />
            <TextInput
              type={showPassword ? "text" : "password"}
              placeholder="Sua senha"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              leftIcon="ph-lock"
              rightIcon={showPassword ? "ph-eye-closed" : "ph-eye"}
              onRightIconClick={() => setShowPassword(!showPassword)}
              required
            />

            {view === 'login' && (
              <div className="flex justify-end -mt-2">
                <button type="button" onClick={() => setIsForgotModalOpen(true)} className="text-[12px] font-bold text-neutral-400 hover:text-primary-600 transition-colors">Esqueceu a senha?</button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full !h-[40px] font-black mt-1"
              isLoading={isLoading}
            >
              {view === 'login' ? 'Acessar Painel' : 'Criar Minha Conta'}
            </Button>
          </form>

          <div className="flex flex-col gap-4 items-center pt-2">
            <div className="w-full h-px bg-neutral-100"></div>
            <button
              onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setErrorMsg(''); setSuccessMsg(''); }}
              className="text-body2 font-bold text-neutral-600 hover:text-primary-600 transition-colors"
            >
              {view === 'login' ? 'Ainda não tem conta? Cadastre-se' : 'Já possui uma conta? Faça login'}
            </button>
          </div>
        </div>
      </div>
      <ForgotPasswordModal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} />
    </div>
  );
};
