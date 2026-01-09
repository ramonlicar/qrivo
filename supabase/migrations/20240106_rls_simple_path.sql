-- Migration: Simple Path RLS (Reliability First)
-- This migration ensures basic visibility works without complex JSONB or recursive joins.

-- 1. Memberships: Simple SELECT (See own record, always)
DROP POLICY IF EXISTS "memberships_view" ON public.memberships;
CREATE POLICY "memberships_view_simple" ON public.memberships
    FOR SELECT USING (
        user_id = auth.uid() OR 
        company_id IN (SELECT public.get_my_company_ids())
    );

-- 2. Companies: Simple SELECT (See own company, always)
DROP POLICY IF EXISTS "companies_view" ON public.companies;
CREATE POLICY "companies_view_simple" ON public.companies
    FOR SELECT USING (
        owner_user_id = auth.uid() OR 
        id IN (SELECT public.get_my_company_ids())
    );

-- 3. Users: Sync current user's role cache just in case
UPDATE public.users u
SET company_roles = (
    SELECT jsonb_object_agg(company_id, role)
    FROM public.memberships
    WHERE user_id = u.id
)
WHERE id = auth.uid();
