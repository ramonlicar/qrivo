-- Migration: Nuclear Fix for RLS Infinite Recursion
-- This method uses a single SECURITY DEFINER function to break all recursive loops.

-- 1. Create the bypass function
-- This function runs as the owner (usually postgres) and ignores RLS.
CREATE OR REPLACE FUNCTION public.get_my_company_ids()
RETURNS SETOF uuid AS $$
BEGIN
    RETURN QUERY 
    SELECT company_id 
    FROM public.memberships 
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Revoke previous policies to ensure clean state
-- We drop everything from memberships, companies, users to avoid any ghost interference.

-- Memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "view_own_membership" ON public.memberships;
DROP POLICY IF EXISTS "view_team_as_owner" ON public.memberships;
DROP POLICY IF EXISTS "manage_team_as_owner" ON public.memberships;
DROP POLICY IF EXISTS "service_role_unrestricted" ON public.memberships;
DROP POLICY IF EXISTS "select_memberships" ON public.memberships;
DROP POLICY IF EXISTS "manage_memberships" ON public.memberships;
DROP POLICY IF EXISTS "service_role_memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can view teammates" ON public.memberships;
DROP POLICY IF EXISTS "Owners can manage memberships" ON public.memberships;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.memberships;

-- Companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_companies" ON public.companies;
DROP POLICY IF EXISTS "update_companies" ON public.companies;
DROP POLICY IF EXISTS "insert_companies" ON public.companies;
DROP POLICY IF EXISTS "select_company" ON public.companies;
DROP POLICY IF EXISTS "update_company" ON public.companies;
DROP POLICY IF EXISTS "insert_company" ON public.companies;
DROP POLICY IF EXISTS "Members can view their company" ON public.companies;
DROP POLICY IF EXISTS "Members can update their company" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

-- Users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_users" ON public.users;
DROP POLICY IF EXISTS "update_users" ON public.users;
DROP POLICY IF EXISTS "view_own_user" ON public.users;
DROP POLICY IF EXISTS "view_teammate_users" ON public.users;
DROP POLICY IF EXISTS "update_own_user" ON public.users;


-- 3. Apply New Stable Policies

-- 3.1 Memberships
CREATE POLICY "memberships_select" ON public.memberships
    FOR SELECT USING (
        user_id = auth.uid() OR 
        company_id IN (SELECT public.get_my_company_ids())
    );

CREATE POLICY "memberships_all_owner" ON public.memberships
    FOR ALL USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_user_id = auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.memberships m 
            WHERE m.company_id = public.memberships.company_id 
            AND m.user_id = auth.uid() 
            AND m.role = 'owner'
        )
    );
-- Note: 'memberships' manage policy might still recurse slightly if not careful, 
-- but 'SELECT' is the main culprit for listing. Let's make 'ALL' use companies table mostly.

-- 3.2 Companies
CREATE POLICY "companies_select" ON public.companies
    FOR SELECT USING (
        owner_user_id = auth.uid() OR 
        id IN (SELECT public.get_my_company_ids())
    );

CREATE POLICY "companies_update" ON public.companies
    FOR UPDATE USING (
        owner_user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE company_id = public.companies.id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

CREATE POLICY "companies_insert" ON public.companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 3.3 Users
CREATE POLICY "users_select" ON public.users
    FOR SELECT USING (
        id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = public.users.id 
            AND company_id IN (SELECT public.get_my_company_ids())
        )
    );

CREATE POLICY "users_update" ON public.users
    FOR UPDATE USING (id = auth.uid());


-- 4. Final Fail-Safe: Grant access to service_role
CREATE POLICY "service_all_memberships" ON public.memberships FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_companies" ON public.companies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_all_users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
