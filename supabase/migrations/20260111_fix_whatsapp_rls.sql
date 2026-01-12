-- Refine RLS for agent_whatsapp_integrations to support upsert operations
-- Generic ALL policies sometimes have issues with PostgREST upsert (Conflict check needs SELECT, and then INSERT/UPDATE)

-- Drop existing manager policy
DROP POLICY IF EXISTS "Users can manage whatsapp integrations for their company" ON public.agent_whatsapp_integrations;

-- 1. SELECT Policy
-- (Already exists as "Users can view whatsapp integrations for their company", but let's ensure it's there or just use it)

-- 2. INSERT Policy
CREATE POLICY "Users can insert whatsapp integrations for their company"
    ON public.agent_whatsapp_integrations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = agent_whatsapp_integrations.company_id
            AND (
                c.owner_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.company_id = c.id
                    AND m.user_id = auth.uid()
                    AND m.role IN ('admin')
                )
            )
        )
    );

-- 3. UPDATE Policy
CREATE POLICY "Users can update whatsapp integrations for their company"
    ON public.agent_whatsapp_integrations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = agent_whatsapp_integrations.company_id
            AND (
                c.owner_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.company_id = c.id
                    AND m.user_id = auth.uid()
                    AND m.role IN ('admin')
                )
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = agent_whatsapp_integrations.company_id
            AND (
                c.owner_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.company_id = c.id
                    AND m.user_id = auth.uid()
                    AND m.role IN ('admin')
                )
            )
        )
    );

-- 4. DELETE Policy
CREATE POLICY "Users can delete whatsapp integrations for their company"
    ON public.agent_whatsapp_integrations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = agent_whatsapp_integrations.company_id
            AND (
                c.owner_user_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.memberships m
                    WHERE m.company_id = c.id
                    AND m.user_id = auth.uid()
                    AND m.role IN ('admin')
                )
            )
        )
    );
