import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: Request) {
    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    if (!process.env.OPENAI_API_KEY) {
        return new Response(JSON.stringify({ error: 'Missing OPENAI_API_KEY' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        const { prompt, systemInstruction } = await req.json();

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

        return new Response(JSON.stringify({ text: response.choices[0].message.content }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error in generate API:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
