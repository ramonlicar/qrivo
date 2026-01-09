-- Migration: Consolidated Team & Membership RLS
-- This migration replaces previous partial fixes with a stable, non-recursive model.

-- 1. Reset Memberships Policies
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own membership" ON public.memberships;
DROP POLICY IF EXISTS "Company Owners can view company memberships" ON public.memberships;
DROP POLICY IF EXISTS "Company Owners can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Company Owners can delete memberships" ON public.memberships;
DROP POLICY IF EXISTS "Company Owners can insert memberships" ON public.memberships;
DROP POLICY IF EXISTS "Service Role full access" ON public.memberships;
DROP POLICY IF EXISTS "Users can view teammates" ON public.memberships;
DROP POLICY IF EXISTS "Owners can manage memberships" ON public.memberships;

-- 1.1 READ: View own + view via company ownership (Non-recursive)
CREATE POLICY "view_own_membership" ON public.memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "view_team_as_owner" ON public.memberships
    FOR SELECT USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_user_id = auth.uid())
    );

-- 1.2 MANAGE: Only Owners (via companies table) can edit memberships
CREATE POLICY "manage_team_as_owner" ON public.memberships
    FOR ALL USING (
        company_id IN (SELECT id FROM public.companies WHERE owner_user_id = auth.uid())
    );

-- 1.3 Service Role
CREATE POLICY "service_role_unrestricted" ON public.memberships
    FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 2. Reset Companies Policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Members can view their company" ON public.companies;
DROP POLICY IF EXISTS "Members can update their company" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

CREATE POLICY "select_company" ON public.companies
    FOR SELECT USING (
        owner_user_id = auth.uid() OR 
        id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid())
    );

CREATE POLICY "update_company" ON public.companies
    FOR UPDATE USING (
        owner_user_id = auth.uid() OR
        id IN (SELECT company_id FROM public.memberships WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    );

CREATE POLICY "insert_company" ON public.companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 3. Reset Users Policies (Public Profiles)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Teammates can view each other" ON public.users;
DROP POLICY IF EXISTS "Profiles are public" ON public.users;

-- 3.1 Basic: View own
CREATE POLICY "view_own_user" ON public.users
    FOR SELECT USING (id = auth.uid());

-- 3.2 Teammates: View profiles of people in the same companies
CREATE POLICY "view_teammate_users" ON public.users
    FOR SELECT USING (
        id IN (
            SELECT user_id FROM public.memberships 
            WHERE company_id IN (
                SELECT company_id FROM public.memberships WHERE user_id = auth.uid()
            )
        )
    );

-- 3.3 Management: Users can update their own profile
CREATE POLICY "update_own_user" ON public.users
    FOR UPDATE USING (id = auth.uid());
