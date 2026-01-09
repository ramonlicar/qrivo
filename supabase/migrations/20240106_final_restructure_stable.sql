-- Migration: Final Multi-Tenancy Stability Reset
-- This migration drops EVERYTHING and rebuilds a decoupled, stable RLS model.

-- 1. Helper Function (Bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_company_ids()
RETURNS TABLE (company_id uuid) AS $$
BEGIN
    RETURN QUERY 
    SELECT m.company_id 
    FROM public.memberships m 
    WHERE m.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. TOTAL CLEANUP (Drop all possible policies from previous attempts)
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('users', 'memberships', 'companies'))
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;


-- 3. BUILD STABLE POLICIES

-- 3.1 Public.Users (Break the loop by decoupling profiles)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Everyone can see profile basic info (Decouples users from memberships in RLS)
CREATE POLICY "users_public_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_self_update" ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_service_all" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 3.2 Public.Companies (Gated by owner or membership lookup)
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies_select_member" ON public.companies 
    FOR SELECT USING (
        owner_user_id = auth.uid() OR 
        id IN (SELECT company_id FROM public.get_my_company_ids())
    );

CREATE POLICY "companies_update_owner" ON public.companies 
    FOR UPDATE USING (owner_user_id = auth.uid());

CREATE POLICY "companies_insert_auth" ON public.companies 
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "companies_service_all" ON public.companies FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 3.3 Public.Memberships (Gated by self or company ownership)
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memberships_select_teammate" ON public.memberships 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        company_id IN (SELECT company_id FROM public.get_my_company_ids())
    );

CREATE POLICY "memberships_manage_owner" ON public.memberships 
    FOR ALL USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_user_id = auth.uid())
    );

CREATE POLICY "memberships_service_all" ON public.memberships FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 4. Initial Database Repair (Backfill missing owner records)
INSERT INTO public.memberships (company_id, user_id, role, status)
SELECT id, owner_user_id, 'owner', 'active'
FROM public.companies
ON CONFLICT (company_id, user_id) DO NOTHING;
