
import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = "gemini-1.5-flash";

if (!API_KEY) {
    console.warn("VITE_GEMINI_API_KEY não encontrada no arquivo .env");
}

const genAI = new GoogleGenAI({ apiKey: API_KEY || "" });

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

export const aiService = {
    /**
     * Gera uma resposta em stream para um chat
     */
    async generateChatResponseStream(
        history: ChatMessage[],
        userMessageText: string,
        systemInstruction: string
    ) {
        try {
            // @google/genai API usage
            const responseStream = await genAI.models.generateContentStream({
                model: MODEL_NAME,
                contents: [
                    ...history,
                    { role: 'user', parts: [{ text: userMessageText }] }
                ],
                config: {
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    temperature: 0.7,
                },
            });

            return responseStream;
        } catch (error: any) {
            console.error("Erro no aiService.generateChatResponseStream:", error);

            // Tratamento de erro específico para 429 (Resource Exhausted)
            if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
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
            const response = await genAI.models.generateContent({
                model: MODEL_NAME,
                contents: [
                    { role: 'user', parts: [{ text: prompt }] }
                ],
                config: {
                    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                    temperature: 0.7,
                },
            });

            return response.text;
        } catch (error: any) {
            console.error("Erro no aiService.generateContent:", error);

            // Tratamento de erro específico para 429 (Resource Exhausted)
            if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('RESOURCE_EXHAUSTED')) {
                throw new Error("LIMIT_EXCEEDED");
            }
            throw error;
        }
    }
};
