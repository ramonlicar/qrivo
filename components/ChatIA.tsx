
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { aiService, ChatMessage } from '../lib/aiService';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export const ChatIA: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Olá! Sou seu assistente Qrivo v2.0. Estou aqui para ajudar você a turbinar suas vendas no WhatsApp. Como posso te apoiar hoje?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (textOverride?: string) => {
    const userMessageText = textOverride || input.trim();
    if (!userMessageText || isLoading) return;

    if (!textOverride) setInput('');

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Adiciona mensagem do usuário
    setMessages(prev => [...prev, { role: 'user', content: userMessageText, timestamp }]);
    setIsLoading(true);

    // Prepara mensagem de placeholder para o streaming da IA
    setMessages(prev => [...prev, {
      role: 'model',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    }]);

    try {
      // Converte o histórico para o formato do Gemini
      const history: ChatMessage[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const systemInstruction = `Você é o assistente virtual da Qrivo, uma plataforma SaaS de vendas via WhatsApp.
          
      DIRETRIZES DE ESTILO:
      - NUNCA use marcação Markdown pesada (sem asteriscos duplos para negrito, sem hashtags gigantes).
      - Use texto limpo, parágrafos curtos e emojis para tornar a leitura agradável.
      - Tom: Parceiro de negócios, sagaz, prestativo e direto ao ponto.
      
      CONTEXTO DE SUPORTE:
      - Pedidos: Podem ser vistos na aba 'Pedidos'. Status mudam para 'Entregue' via botão confirmar.
      - Produtos: Cadastro manual no menu 'Produtos'. Tem ferramenta de IA para descrições.
      - Vendedor IA: Pode ser treinado no menu 'Vendedor IA'. Configura-se tom de voz e catálogo.
      - Integração: Conecta com número de WhatsApp via menu 'Ajustes' ou 'Vendedor IA'.
      
      Se o usuário pedir para cadastrar algo, diga que ele pode fazer isso no menu 'Produtos' ou 'Vendedor IA'.
      Responda sempre em Português do Brasil.`;

      const stream = await aiService.generateChatResponseStream(
        history,
        userMessageText,
        systemInstruction
      );

      let fullText = '';
      for await (const chunk of stream) {
        const chunkText = chunk.text;
        fullText += chunkText;

        setMessages(prev => {
          const newMessages = [...prev];
          const lastIdx = newMessages.length - 1;
          if (newMessages[lastIdx].role === 'model') {
            newMessages[lastIdx] = {
              ...newMessages[lastIdx],
              content: fullText,
              isStreaming: true
            };
          }
          return newMessages;
        });
      }

      setMessages(prev => {
        const newMessages = [...prev];
        const lastIdx = newMessages.length - 1;
        newMessages[lastIdx].isStreaming = false;
        return newMessages;
      });

    } catch (error: any) {
      console.error("Erro no chat:", error);

      let errorMessage = "Tive um pequeno contratempo técnico. Pode tentar novamente?";

      if (error.message === "LIMIT_EXCEEDED") {
        errorMessage = "⚠️ O limite de uso gratuito da IA foi atingido por hoje. Por favor, tente novamente mais tarde ou verifique sua cota.";
      }

      setMessages(prev => {
        const newMessages = [...prev.slice(0, -1)];
        return [...newMessages, {
          role: 'model',
          content: errorMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: "Como vejo meus pedidos?", icon: "ph-shopping-cart" },
    { label: "Sugira uma descrição para Camiseta", icon: "ph-text-aa" },
    { label: "Cadastrar Item por R$ 100", icon: "ph-plus-circle" }
  ];

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500 overflow-hidden">
      {/* Header do Chat */}
      <div className="p-4 lg:p-6 border-b border-neutral-100 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 border border-primary-200 shadow-small">
            <i className="ph-fill ph-sparkle text-xl"></i>
          </div>
          <div>
            <h2 className="text-h5 font-bold text-neutral-black">Assistente Qrivo</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tight">IA Inteligente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-neutral-25">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] md:max-w-[75%] flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-4 rounded-[16px] shadow-small text-body2 font-normal leading-relaxed ${msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-tr-none'
                : 'bg-white text-neutral-900 border border-neutral-200 rounded-tl-none'
                }`}>
                {msg.content ? msg.content.split('\n').map((line, i) => (
                  <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                )) : (
                  <div className="flex gap-1.5 py-1">
                    <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce"></div>
                  </div>
                )}
              </div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1">
                {msg.isStreaming ? 'IA está escrevendo...' : msg.timestamp}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Sugestões e Input */}
      <div className="p-3 lg:p-4 border-t border-neutral-100 bg-white space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(action.label)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-50 hover:bg-primary-50 text-neutral-500 hover:text-primary-700 border border-neutral-200 hover:border-primary-200 rounded-full text-tag font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group shadow-small"
            >
              <i className={`ph ${action.icon} group-hover:scale-110 transition-transform`}></i>
              {action.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Digite sua dúvida ou comando aqui..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-body2 font-normal focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-neutral-400 shadow-small"
            />
          </div>
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className={`w-[48px] h-[48px] rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-lg ${input.trim() && !isLoading
              ? 'bg-primary-500 text-white shadow-sm hover:bg-primary-600'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed shadow-none'
              }`}
          >
            <i className={`ph-bold ${isLoading ? 'ph-circle-notch animate-spin' : 'ph-paper-plane-right'} text-xl`}></i>
          </button>
        </div>
      </div>
    </div>
  );
};
