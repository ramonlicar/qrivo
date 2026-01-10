
import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import ReactMarkdown from 'react-markdown';
import { aiService, ChatMessage } from '../lib/aiService';
import { CHAT_SYSTEM_INSTRUCTION } from '../lib/prompts';
import { productsService, companiesService, businessService } from '../lib/services';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { Modal } from './Modal';
import { Badge } from './Badge';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  recommendedProducts?: Product[];
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
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyOverview, setCompanyOverview] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCompany();
  }, []);

  const fetchCompany = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: company } = await companiesService.getMyCompany(user.id);
        if (company) {
          setCompanyId(company.id);
          const overview = await businessService.getCompanyOverview(company.id);
          setCompanyOverview(overview);
        }
      }
    } catch (err) {
      console.error("Erro ao buscar empresa:", err);
    }
  };

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

      // Injeta contextos dinâmicos
      let dataContext = "";
      let foundProducts: Product[] = [];

      try {
        if (companyId) {
          // 1. Contexto de Negócio (Insights)
          if (companyOverview) {
            const { customers, insights, productsCount } = companyOverview;
            dataContext = `\n\nCONTEXTO DE NEGÓCIO ATUAL:
- Total de Clientes: ${customers?.totalCustomers || 0}
- Receita Total (Pagos): R$ ${insights?.totalRevenue || 0}
- Ticket Médio: R$ ${insights?.averageTicket?.toFixed(2) || 0}
- Pedidos Totais: ${insights?.totalOrders || 0}
- Pedidos hoje (Novos): ${insights?.newOrdersToday || 0}
- Total de Produtos Cadastrados: ${productsCount || 0}
- Melhores Clientes (por gasto): ${customers?.topCustomers?.map((c: any) => `${c.name} (R$ ${c.total_spent})`).join(', ') || 'Sem dados'}
- Últimos Pedidos: ${insights?.recentOrders?.map((o: any) => `${o.code} de ${o.customer} (R$ ${o.total})`).join('; ') || 'Sem pedidos recentes'}
`.trim();
          }

          // 2. Busca de Produtos (RAG ou Lista Genérica)
          console.log("[ChatIA] Buscando recomendações para:", userMessageText);
          const lowerInput = userMessageText.toLowerCase();
          const needsProducts = lowerInput.includes('produto') || lowerInput.includes('catálogo') || lowerInput.includes('estoque') || lowerInput.includes('vende');

          if (needsProducts) {
            // Se for uma busca genérica, usa os produtos recentes do overview
            if (companyOverview?.recentProducts?.length > 0) {
              foundProducts = companyOverview.recentProducts;
            }
          } else {
            // Se for algo específico, usa busca semântica
            const queryEmbedding = await aiService.generateEmbedding(userMessageText);
            foundProducts = await productsService.recommendProducts(queryEmbedding, companyId);
          }

          if (foundProducts && foundProducts.length > 0) {
            dataContext += "\n\nPRODUTOS EM DESTAQUE (DETALHES):\n" +
              foundProducts.map((r: Product) => `- ${r.name} (R$ ${r.price}): ${r.shortDescription || r.name}`).join('\n');
            console.log("[ChatIA] Produtos para exibição:", foundProducts.length);
          }
        }
      } catch (err) {
        console.warn("Falha ao buscar recomendações:", err);
      }

      const systemInstruction = CHAT_SYSTEM_INSTRUCTION + dataContext;

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
              isStreaming: true,
              recommendedProducts: foundProducts.length > 0 ? foundProducts : undefined
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
              <div className={`p-4 rounded-[16px] shadow-small text-body2 font-normal leading-relaxed overflow-hidden ${msg.role === 'user'
                ? 'bg-primary-600 text-white rounded-tr-none'
                : 'bg-white text-neutral-900 border border-neutral-200 rounded-tl-none prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0 prose-strong:text-neutral-900'
                }`}>
                {msg.content ? (
                  msg.role === 'user' ? (
                    msg.content || ''
                  ) : (
                    <ReactMarkdown>
                      {msg.content || ''}
                    </ReactMarkdown>
                  )
                ) : (
                  msg.isStreaming && (
                    <div className="flex gap-1.5 py-1">
                      <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-neutral-300 rounded-full animate-bounce"></div>
                    </div>
                  )
                )}
              </div>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-1">
                {msg.isStreaming ? 'IA está escrevendo...' : msg.timestamp}
              </span>

              {/* Widget de Recomendações de Produtos */}
              {msg.role === 'model' && msg.recommendedProducts && msg.recommendedProducts.length > 0 && (
                <div className="w-full mt-3 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <i className="ph-fill ph-sparkle text-primary-500"></i>
                    <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest leading-none">Maya Recomenda</span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1">
                    {msg.recommendedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col w-[200px] shrink-0 bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-small hover:shadow-cards transition-all group"
                      >
                        <div className="aspect-square bg-neutral-100 overflow-hidden relative">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-300">
                              <i className="ph ph-image text-4xl"></i>
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge variant="primary" className="!bg-white/95 backdrop-blur-sm shadow-sm border-neutral-100 !text-primary-600">
                              R$ {product.price}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 flex flex-col gap-2">
                          <h4 className="text-body2 font-bold text-neutral-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                            {product.name}
                          </h4>
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="w-full py-1.5 bg-neutral-50 hover:bg-secondary-700 text-neutral-600 hover:text-white border border-neutral-200 hover:border-secondary-700 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                          >
                            Ver Detalhes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

      {/* Modal de Detalhes do Produto */}
      {selectedProduct && (
        <Modal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          title="Detalhes do Produto"
          maxWidth="600px"
        >
          <div className="flex flex-col gap-6">
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                  <i className="ph ph-image text-6xl"></i>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <Badge variant="primary" className="w-fit">{selectedProduct.category}</Badge>
                  <h3 className="text-h4 font-bold text-neutral-black">{selectedProduct.name}</h3>
                  {selectedProduct.ref && (
                    <span className="text-body2 text-neutral-400 font-medium">Ref: {selectedProduct.ref}</span>
                  )}
                </div>
                <div className="text-h5 font-bold text-primary-600">
                  R$ {selectedProduct.price}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h5 className="text-body2 font-bold text-neutral-black">Descrição</h5>
                <p className="text-body2 text-neutral-600 leading-relaxed">
                  {selectedProduct.longDescription || selectedProduct.shortDescription || 'Sem descrição disponível.'}
                </p>
              </div>

              <div className="mt-4 pt-6 border-t border-neutral-100">
                <Button
                  variant="primary"
                  className="w-full h-[48px] text-body2 font-bold"
                  leftIcon="ph ph-shopping-bag"
                  onClick={() => alert("Função de compra será integrada futuramente!")}
                >
                  Adicionar ao Carrinho
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
