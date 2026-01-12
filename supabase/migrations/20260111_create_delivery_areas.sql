-- Create delivery_areas table
DROP TABLE IF EXISTS public.delivery_areas CASCADE;
CREATE TABLE IF NOT EXISTS public.delivery_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    time TEXT NOT NULL,
    regions TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view Delivery Areas for their company's agents"
    ON public.delivery_areas
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.agents a
            JOIN public.memberships m ON m.company_id = a.company_id
            WHERE a.id = delivery_areas.agent_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert Delivery Areas for their company's agents"
    ON public.delivery_areas
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.agents a
            JOIN public.memberships m ON m.company_id = a.company_id
            WHERE a.id = delivery_areas.agent_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update Delivery Areas for their company's agents"
    ON public.delivery_areas
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.agents a
            JOIN public.memberships m ON m.company_id = a.company_id
            WHERE a.id = delivery_areas.agent_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete Delivery Areas for their company's agents"
    ON public.delivery_areas
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.agents a
            JOIN public.memberships m ON m.company_id = a.company_id
            WHERE a.id = delivery_areas.agent_id
            AND m.user_id = auth.uid()
        )
    );

-- Creating indexes for performance
CREATE INDEX idx_delivery_areas_agent_id ON public.delivery_areas(agent_id);
