-- Create agent_faqs table
CREATE TABLE IF NOT EXISTS public.agent_faqs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'Geral',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agent_faqs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view FAQs for their company's agents"
    ON public.agent_faqs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.agents a
            JOIN public.memberships m ON m.company_id = a.company_id
            WHERE a.id = agent_faqs.agent_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert FAQs for their company's agents"
    ON public.agent_faqs
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.agents a
            JOIN public.memberships m ON m.company_id = a.company_id
            WHERE a.id = agent_faqs.agent_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update FAQs for their company's agents"
    ON public.agent_faqs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.agents a
            JOIN public.memberships m ON m.company_id = a.company_id
            WHERE a.id = agent_faqs.agent_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete FAQs for their company's agents"
    ON public.agent_faqs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.agents a
            JOIN public.memberships m ON m.company_id = a.company_id
            WHERE a.id = agent_faqs.agent_id
            AND m.user_id = auth.uid()
        )
    );

-- Creating indexes for performance
CREATE INDEX idx_agent_faqs_agent_id ON public.agent_faqs(agent_id);
