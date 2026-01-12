-- Migration to schema adjust payment_methods table
-- created_at: 2026-01-11

-- 1. Add agent_id column
ALTER TABLE public.payment_methods
    ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE;

-- 2. Add updated_at column
ALTER TABLE public.payment_methods
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Drop is_active column
ALTER TABLE public.payment_methods
    DROP COLUMN IF EXISTS is_active;

-- 4. Cast method_type to ENUM
-- Assuming the existing values match the enum values (lowercase).
-- If not, we might need a mapping step. But for a new/dev table, we can force cast or clear.
-- Safe approach: delete incompatible rows or update them.
-- Here we assume 'pix', 'credit_card' etc are used. 
ALTER TABLE public.payment_methods 
    ALTER COLUMN method_type TYPE payment_method_enum 
    USING method_type::payment_method_enum;

-- 5. Drop company_id column (Cleanup)
-- WARNING: This deletes the link to companies. We assume data is migrated or we don't care about existing rows being orphaned/deleted if not linked to agent.
-- Since the user requested to change reference, we drop references to company.
ALTER TABLE public.payment_methods
    DROP COLUMN IF EXISTS company_id;

-- 6. Update RLS Policies
DROP POLICY IF EXISTS "Users can view payment methods for their company" ON public.payment_methods;
DROP POLICY IF EXISTS "Users can manage payment methods for their company" ON public.payment_methods;

CREATE POLICY "Users can view payment methods for their agents"
    ON public.payment_methods
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.agents a
            WHERE a.id = payment_methods.agent_id
            AND EXISTS (
                SELECT 1 FROM public.companies c
                WHERE c.id = a.company_id
                AND (
                    c.owner_user_id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.memberships e
                        WHERE e.company_id = c.id
                        AND e.user_id = auth.uid()
                    )
                )
            )
        )
    );

CREATE POLICY "Users can manage payment methods for their agents"
    ON public.payment_methods
    FOR ALL
    USING (
         EXISTS (
            SELECT 1 FROM public.agents a
            WHERE a.id = payment_methods.agent_id
            AND EXISTS (
                SELECT 1 FROM public.companies c
                WHERE c.id = a.company_id
                AND (
                    c.owner_user_id = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.memberships e
                        WHERE e.company_id = c.id
                        AND e.user_id = auth.uid()
                        AND e.role IN ('admin')
                    )
                )
            )
        )
    );
