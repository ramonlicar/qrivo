import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { teamService } from '../lib/services';
import { Button } from './Button';

interface AcceptInvitePageProps {
    token: string;
    onSuccess: () => void;
    currentUser: any;
    onLoginRedirect: () => void;
}

export const AcceptInvitePage: React.FC<AcceptInvitePageProps> = ({ token, onSuccess, currentUser, onLoginRedirect }) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'awaiting_auth'>('loading');
    const [message, setMessage] = useState('Verificando convite...');

    useEffect(() => {
        const processInvite = async () => {
            // 1. Se não tiver usuário, pede login
            if (!currentUser) {
                setStatus('awaiting_auth');
                setMessage('Você precisa estar logado para aceitar este convite.');
                return;
            }

            try {
                setStatus('loading');
                const { data, error } = await teamService.acceptInvite(token);

                if (error) throw error;

                setStatus('success');
                setMessage(data.message || 'Convite aceito com sucesso!');

                // Espera um pouco para usuário ler e redireciona
                setTimeout(() => {
                    onSuccess();
                }, 2000);

            } catch (err: any) {
                console.error(err);
                setStatus('error');
                setMessage(err.message || 'Ocorreu um erro ao processar o convite.');
            }
        };

        if (token) {
            processInvite();
        } else {
            setStatus('error');
            setMessage('Token de convite inválido.');
        }
    }, [token, onSuccess, currentUser]);

    return (
        <div className="min-h-screen w-full bg-neutral-25 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
            <div className="w-full max-w-[420px] flex flex-col gap-8">
                <div className="flex justify-center">
                    <img src="//0e65cb6695ddeca8cb391ef6f8f9b815.cdn.bubble.io/f1759800667234x298580053943223740/logo%20qrivo%20ia.svg" alt="Qrivo.ia" className="h-[48px] w-auto" />
                </div>

                <div className="bg-white rounded-[24px] border border-neutral-100 shadow-cards p-8 sm:p-10 flex flex-col gap-7 items-center text-center">

                    {status === 'loading' && (
                        <>
                            <i className="ph ph-circle-notch animate-spin text-4xl text-primary-500"></i>
                            <div className="flex flex-col gap-2">
                                <h1 className="text-h4 font-bold text-neutral-black tracking-tight leading-none">Processando Convite</h1>
                                <p className="text-body2 text-neutral-500 font-medium">{message}</p>
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mb-2">
                                <i className="ph ph-check-circle text-4xl"></i>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h1 className="text-h4 font-bold text-neutral-black tracking-tight leading-none">Tudo pronto!</h1>
                                <p className="text-body2 text-neutral-500 font-medium">{message}</p>
                            </div>
                            <p className="text-small text-neutral-400">Redirecionando...</p>
                        </>
                    )}

                    {status === 'awaiting_auth' && (
                        <>
                            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 mb-2">
                                <i className="ph ph-user-plus text-4xl"></i>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h1 className="text-h4 font-bold text-neutral-black tracking-tight leading-none">Convite Recebido!</h1>
                                <p className="text-body2 text-neutral-500 font-medium">Faça login ou crie sua conta para fazer parte da equipe.</p>
                            </div>
                            <Button onClick={onLoginRedirect} className="w-full mt-4">
                                Entrar / Cadastrar
                            </Button>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-2">
                                <i className="ph ph-warning-circle text-4xl"></i>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h1 className="text-h4 font-bold text-neutral-black tracking-tight leading-none">Erro</h1>
                                <p className="text-body2 text-red-600 font-medium">{message}</p>
                            </div>
                            <Button onClick={() => window.location.href = '/'} className="w-full mt-4">
                                Voltar para Home
                            </Button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};
