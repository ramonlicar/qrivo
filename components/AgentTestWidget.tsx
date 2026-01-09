
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Button } from './Button';
import { MOCK_PRODUCTS } from '../constants';
import { Product } from '../types';

interface Message {
  role: 'user' | 'model';
  content: string;
  productIds?: string[];
}

interface AgentTestWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  config: {
    agentName: string;
    storeName: string;
    style: string;
    stylePrompt: string;
    responseVolume: string;
    prohibitedWords: string;
    allowedEmojis: string;
    welcomeMsg: string;
    faqs: Array<{ question: string; answer: string }>;
  };
}

export const AgentTestWidget: React.FC<AgentTestWidgetProps> = ({ isOpen, onClose, config }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'model', content: config.welcomeMsg || `Olá! Eu sou a ${config.agentName}.` }]);
    }
  }, [isOpen, config]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);
    // Simulação de resposta
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'model', content: 'Entendido! Como posso ajudar mais?' }]);
      setIsLoading(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-end pointer-events-none p-4 sm:p-6">
      <div className="w-full max-w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col pointer-events-auto overflow-hidden">
        <div className="p-4 bg-secondary-900 text-white flex items-center justify-between shrink-0 h-[64px]">
          <span className="text-body2 font-bold">{config.agentName}</span>
          <button onClick={onClose} className="w-[36px] h-[36px] flex items-center justify-center hover:bg-white/10 rounded-lg"><i className="ph ph-x text-lg"></i></button>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-25 custom-scrollbar">
          {messages.map((m, i) => (
            <div key={i} className={`p-3 rounded-xl text-body2 ${m.role === 'user' ? 'bg-primary-600 text-white self-end ml-auto rounded-tr-none' : 'bg-white text-neutral-900 border border-neutral-100 rounded-tl-none self-start mr-auto shadow-small'}`}>{m.content}</div>
          ))}
        </div>
        <div className="p-4 border-t border-neutral-100 bg-white">
          <div className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Mensagem..." className="flex-1 h-[36px] px-3 bg-neutral-50 border border-neutral-200 rounded-lg text-body2 focus:outline-none" />
            <button onClick={handleSend} disabled={!input.trim()} className={`w-[36px] h-[36px] rounded-lg flex items-center justify-center transition-all ${input.trim() ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-400'}`}><i className="ph ph-paper-plane-right text-lg"></i></button>
          </div>
          <button onClick={() => setMessages([])} className="w-full text-center mt-3 text-tag font-bold text-neutral-400 uppercase tracking-widest">Limpar conversa</button>
        </div>
      </div>
    </div>
  );
};
