-- Migration: Final Fix for RLS Infinite Recursion
-- This migration uses SECURITY DEFINER functions to break the circular dependency between tables.

-- 1. Helper Functions (Bypass RLS during policy checks)
CREATE OR REPLACE FUNCTION public.check_is_company_member(c_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE company_id = c_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_is_company_owner(c_id uuid)
RETURNS boolean AS $$
BEGIN
  -- Checks Owner role in memberships OR being the creator in companies
  RETURN EXISTS (
    SELECT 1 FROM public.companies 
    WHERE id = c_id AND owner_user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.memberships
    WHERE company_id = c_id AND user_id = auth.uid() AND role = 'owner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Reset Memberships Policies
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_own_membership" ON public.memberships;
DROP POLICY IF EXISTS "view_team_as_owner" ON public.memberships;
DROP POLICY IF EXISTS "manage_team_as_owner" ON public.memberships;
DROP POLICY IF EXISTS "service_role_unrestricted" ON public.memberships;

CREATE POLICY "select_memberships" ON public.memberships
    FOR SELECT USING (user_id = auth.uid() OR public.check_is_company_member(company_id));

CREATE POLICY "manage_memberships" ON public.memberships
    FOR ALL USING (public.check_is_company_owner(company_id));

CREATE POLICY "service_role_memberships" ON public.memberships
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 3. Reset Companies Policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_company" ON public.companies;
DROP POLICY IF EXISTS "update_company" ON public.companies;
DROP POLICY IF EXISTS "insert_company" ON public.companies;

CREATE POLICY "select_companies" ON public.companies
    FOR SELECT USING (owner_user_id = auth.uid() OR public.check_is_company_member(id));

CREATE POLICY "update_companies" ON public.companies
    FOR UPDATE USING (public.check_is_company_owner(id));

CREATE POLICY "insert_companies" ON public.companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 4. Reset Users Policies (To ensure teammates can see names)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_own_user" ON public.users;
DROP POLICY IF EXISTS "view_teammate_users" ON public.users;
DROP POLICY IF EXISTS "update_own_user" ON public.users;

CREATE POLICY "select_users" ON public.users
    FOR SELECT USING (
        id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.memberships m 
            WHERE m.user_id = public.users.id 
            AND public.check_is_company_member(m.company_id)
        )
    );

CREATE POLICY "update_users" ON public.users
    FOR UPDATE USING (id = auth.uid());
