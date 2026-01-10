import OpenAI from 'openai';

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

const getOpenAIClient = () => {
    if (process.env.OPENAI_API_KEY) {
        return new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            dangerouslyAllowBrowser: true
        });
    }
    return null;
};

export const aiService = {
    /**
     * Gera uma resposta de chat em streaming usando a API Backend (segura) ou Direta.
     */
    async *generateChatResponseStream(
        history: ChatMessage[],
        userMessageText: string,
        systemInstruction: string
    ): AsyncGenerator<{ text: string }> {
        try {
            const openai = getOpenAIClient();

            // 1. Tenta usar OpenAI direto se a chave estiver disponível (Local/Client-side fallback)
            if (openai) {
                const messages = history.map(msg => ({
                    role: msg.role === 'model' ? 'assistant' : 'user',
                    content: msg.parts[0].text
                }));
                if (systemInstruction) {
                    messages.unshift({ role: 'system', content: systemInstruction });
                }
                messages.push({ role: 'user', content: userMessageText });

                const stream = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: messages as any,
                    stream: true,
                });

                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    if (content) yield { text: content };
                }
                return;
            }

            // 2. Fallback para API Route (Serverless)
            // Converte o histórico para o formato da OpenAI
            const messages = history.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.parts[0].text
            }));

            if (systemInstruction) {
                messages.unshift({ role: 'system', content: systemInstruction });
            }

            messages.push({ role: 'user', content: userMessageText });

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages }),
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                yield { text: chunk };
            }

        } catch (error: any) {
            console.error("Erro no aiService.generateChatResponseStream:", error);
            if (error?.status === 429 || error?.message?.includes('429')) {
                throw new Error("LIMIT_EXCEEDED");
            }
            throw error;
        }
    },

    /**
     * Gera conteúdo de texto único (não-streaming) usando a API Backend ou Direta.
     */
    async generateContent(prompt: string, systemInstruction?: string) {
        try {
            const openai = getOpenAIClient();

            // 1. Tenta usar OpenAI direto se a chave estiver disponível
            if (openai) {
                const messages = [];
                if (systemInstruction) {
                    messages.push({ role: 'system', content: systemInstruction });
                }
                messages.push({ role: 'user', content: prompt });

                const response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: messages as any,
                    temperature: 0.7,
                });

                return response.choices[0].message.content;
            }

            // 2. Fallback para API Route
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, systemInstruction }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const msg = errorData.error || response.statusText;
                if (response.status === 404) {
                    throw new Error("API Backend não encontrada e Chave OpenAI não configurada.");
                }
                throw new Error(msg);
            }

            const data = await response.json();
            return data.text;

        } catch (error: any) {
            console.error("Erro no aiService.generateContent:", error);
            if (error?.status === 429 || error?.message?.includes('429')) {
                throw new Error("LIMIT_EXCEEDED");
            }
            throw error;
        }
    },

    /**
     * Gera um embedding (vetor) para o texto fornecido usando OpenAI.
     */
    async generateEmbedding(text: string): Promise<number[]> {
        try {
            const openai = getOpenAIClient();

            // 1. Tenta direto (Client-side)
            if (openai) {
                const response = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: text,
                    encoding_format: "float",
                });
                return response.data[0].embedding;
            }

            // 2. Fallback para API Route
            const response = await fetch('/api/embeddings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("[aiService] Erro na API de embeddings:", errorData);
                throw new Error(errorData.error || "Erro ao gerar embedding via backend.");
            }
            const data = await response.json();
            return data.embedding;
        } catch (error) {
            console.error("[aiService] Erro crítico em generateEmbedding:", error);
            throw error;
        }
    }
};
