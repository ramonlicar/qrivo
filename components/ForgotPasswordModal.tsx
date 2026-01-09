
import React, { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { TextInput } from './TextInput';
import { supabase } from '../lib/supabase';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleReset = async () => {
    if (!email) return;
    setIsLoading(true);
    setStatus({ type: null, message: '' });

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Redireciona para a home, onde o App.tsx trata a sessão
      });

      if (error) throw error;

      setStatus({ type: 'success', message: 'Instruções enviadas! Verifique sua caixa de entrada.' });
      setTimeout(() => {
        onClose();
        setStatus({ type: null, message: '' });
        setEmail('');
      }, 3000);
    } catch (err: any) {
      console.error("Erro ao resetar senha:", err);
      setStatus({ type: 'error', message: err.message || 'Erro ao enviar email de recuperação.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <img
          src="//0e65cb6695ddeca8cb391ef6f8f9b815.cdn.bubble.io/f1759800667234x298580053943223740/logo%20qrivo%20ia.svg"
          alt="Qrivo"
          className="h-[28px] w-auto pointer-events-none select-none"
        />
      }
      maxWidth="480px"
      className="!rounded-[24px]"
      noPadding={true}
    >
      <div className="flex flex-col p-8 pt-6 gap-6 bg-white relative">
        {/* Textos de Cabeçalho */}
        <div className="flex flex-col gap-2">
          <h4 className="text-h4 font-bold text-neutral-black leading-tight">Restaurar Senha</h4>
          <p className="text-body2 font-normal text-neutral-400 leading-relaxed max-w-[360px]">
            Informe seu email, caso exista uma conta relacionada, enviaremos as instruções de restauração.
          </p>
        </div>

        {/* Feedback Messages */}
        {status.message && (
          <div className={`p-3 rounded-lg text-[12px] font-bold animate-in fade-in duration-300 flex items-center gap-2 ${status.type === 'success'
            ? 'bg-primary-50 border border-primary-100 text-primary-700'
            : 'bg-red-50 border border-red-100 text-system-error-500'
            }`}>
            <i className={`ph ${status.type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}`}></i>
            {status.message}
          </div>
        )}

        {/* Formulário */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-body2 font-bold text-neutral-black">Email</label>
            <TextInput
              placeholder="Seu email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              rightIcon="ph-user-focus"
              containerClassName="!h-[36px] !rounded-[8px]"
              className="!text-body2 !font-normal !text-neutral-black"
            />
          </div>
        </div>

        {/* Botão de Envio */}
        <div className="mt-2">
          <Button
            variant="primary"
            isLoading={isLoading}
            className="w-full !h-[35px] !rounded-[8px] !text-body2 !font-bold !bg-primary-500 !border-primary-600 hover:!bg-primary-600 shadow-sm active:scale-[0.98] transition-all"
            onClick={handleReset}
          >
            Enviar Instruções
          </Button>
        </div>
      </div>
    </Modal>
  );
};
