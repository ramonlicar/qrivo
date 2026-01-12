-- RLS FIX V2: Ultra-permissive policies for agent_whatsapp_integrations
-- Allows ANY member of the company to manage integrations

-- Drop previous policies
DROP POLICY IF EXISTS "Users can view whatsapp integrations for their company" ON public.agent_whatsapp_integrations;
DROP POLICY IF EXISTS "Users can insert whatsapp integrations for their company" ON public.agent_whatsapp_integrations;
DROP POLICY IF EXISTS "Users can update whatsapp integrations for their company" ON public.agent_whatsapp_integrations;
DROP POLICY IF EXISTS "Users can delete whatsapp integrations for their company" ON public.agent_whatsapp_integrations;
DROP POLICY IF EXISTS "Users can manage whatsapp integrations for their company" ON public.agent_whatsapp_integrations;

-- 1. SELECT Policy: Any member can view
CREATE POLICY "Any member can view whatsapp integrations"
    ON public.agent_whatsapp_integrations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.company_id = agent_whatsapp_integrations.company_id
            AND m.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = agent_whatsapp_integrations.company_id
            AND c.owner_user_id = auth.uid()
        )
    );

-- 2. INSERT Policy: Any member can insert
CREATE POLICY "Any member can insert whatsapp integrations"
    ON public.agent_whatsapp_integrations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.company_id = agent_whatsapp_integrations.company_id
            AND m.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = agent_whatsapp_integrations.company_id
            AND c.owner_user_id = auth.uid()
        )
    );

-- 3. UPDATE Policy: Any member can update
CREATE POLICY "Any member can update whatsapp integrations"
    ON public.agent_whatsapp_integrations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.company_id = agent_whatsapp_integrations.company_id
            AND m.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = agent_whatsapp_integrations.company_id
            AND c.owner_user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.company_id = agent_whatsapp_integrations.company_id
            AND m.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = agent_whatsapp_integrations.company_id
            AND c.owner_user_id = auth.uid()
        )
    );

-- 4. DELETE Policy: Any member can delete
CREATE POLICY "Any member can delete whatsapp integrations"
    ON public.agent_whatsapp_integrations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.company_id = agent_whatsapp_integrations.company_id
            AND m.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = agent_whatsapp_integrations.company_id
            AND c.owner_user_id = auth.uid()
        )
    );
