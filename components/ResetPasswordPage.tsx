import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from './Button';
import { TextInput } from './TextInput';

interface ResetPasswordPageProps {
    onSuccess: () => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onSuccess }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setIsSuccess(true);
            setTimeout(() => {
                onSuccess();
            }, 2000);
        } catch (err: any) {
            console.error('Erro ao redefinir senha:', err);
            setError(err.message || 'Erro ao redefinir senha. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-neutral-25 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-[420px] flex flex-col gap-8">
                <div className="flex justify-center">
                    <img
                        src="//0e65cb6695ddeca8cb391ef6f8f9b815.cdn.bubble.io/f1759800667234x298580053943223740/logo%20qrivo%20ia.svg"
                        alt="Qrivo.ia"
                        className="h-[48px] w-auto"
                    />
                </div>

                <div className="bg-white rounded-[24px] border border-neutral-100 shadow-cards p-8 sm:p-10 flex flex-col gap-7">
                    <div className="flex flex-col gap-2 text-center">
                        <h1 className="text-h4 font-bold text-neutral-black tracking-tight leading-none">
                            Criar Nova Senha
                        </h1>
                        <p className="text-body2 text-neutral-500 font-medium">
                            Escolha uma senha forte para sua segurança.
                        </p>
                    </div>

                    <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-body2 font-bold text-neutral-black">Nova Senha</label>
                            <TextInput
                                type="password"
                                placeholder="No mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-body2 font-bold text-neutral-black">Confirmar Senha</label>
                            <TextInput
                                type="password"
                                placeholder="Repita a nova senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-system-error-500 text-small font-bold">
                                <i className="ph ph-warning-circle"></i>
                                {error}
                            </div>
                        )}

                        {isSuccess && (
                            <div className="p-3 bg-primary-50 border border-primary-100 rounded-xl flex items-center gap-2 text-primary-600 text-small font-bold">
                                <i className="ph ph-check-circle"></i>
                                Senha alterada com sucesso! Redirecionando...
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                            className="w-full mt-2"
                            disabled={isSuccess}
                        >
                            Redefinir Senha
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};
