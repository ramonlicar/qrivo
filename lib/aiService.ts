export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const aiService = {
    /**
     * Gera uma resposta de chat em streaming usando a API Backend (segura).
     */
    async *generateChatResponseStream(
        history: ChatMessage[],
        userMessageText: string,
        systemInstruction: string
    ): AsyncGenerator<{ text: string }> {
        try {
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
     * Gera conteúdo de texto único (não-streaming) usando a API Backend.
     */
    async generateContent(prompt: string, systemInstruction?: string) {
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, systemInstruction }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || response.statusText);
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
    }
};
