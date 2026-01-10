import OpenAI from "openai";

const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!API_KEY) {
    console.warn("VITE_OPENAI_API_KEY não encontrada no arquivo .env");
}

const openai = new OpenAI({
    apiKey: API_KEY || "",
    dangerouslyAllowBrowser: true
});

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const aiService = {
    /**
     * Gera uma resposta em stream para um chat
     */
    async *generateChatResponseStream(
        history: ChatMessage[],
        userMessageText: string,
        systemInstruction: string
    ) {
        try {
            const messages: any[] = history.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.parts[0].text
            }));

            if (systemInstruction) {
                messages.unshift({ role: 'system', content: systemInstruction });
            }

            messages.push({ role: 'user', content: userMessageText });

            const stream = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
                stream: true,
                temperature: 0.7,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || "";
                if (content) {
                    yield { text: content };
                }
            }
        } catch (error: any) {
            console.error("Erro no aiService.generateChatResponseStream:", error);

            // Tratamento de erro específico para 429 (Resource Exhausted / Rate Limit)
            if (error?.status === 429 || error?.code === 'insufficient_quota') {
                throw new Error("LIMIT_EXCEEDED");
            }

            throw error;
        }
    },

    /**
     * Gera conteúdo (não-stream) para uma solicitação simples
     */
    async generateContent(prompt: string, systemInstruction?: string) {
        try {
            const messages: any[] = [];

            if (systemInstruction) {
                messages.push({ role: 'system', content: systemInstruction });
            }

            messages.push({ role: 'user', content: prompt });

            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: messages,
                temperature: 0.7,
            });

            return response.choices[0].message.content;
        } catch (error: any) {
            console.error("Erro no aiService.generateContent:", error);

            // Tratamento de erro específico para 429
            if (error?.status === 429 || error?.code === 'insufficient_quota') {
                throw new Error("LIMIT_EXCEEDED");
            }
            throw error;
        }
    }
};
