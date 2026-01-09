-- Migration: Final Fix for Users Table Recursion
-- This breaks the self-referencing loop in public.users policies.

-- 1. Reset Users Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_view_self" ON public.users;
DROP POLICY IF EXISTS "users_view_teammates" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;
DROP POLICY IF EXISTS "view_own_user" ON public.users;
DROP POLICY IF EXISTS "view_teammate_users" ON public.users;
DROP POLICY IF EXISTS "update_own_user" ON public.users;
DROP POLICY IF EXISTS "select_users" ON public.users;
DROP POLICY IF EXISTS "update_users" ON public.users;

-- 2. New STABLE Policies
-- 2.1 View Own
CREATE POLICY "users_select_own" ON public.users 
    FOR SELECT USING (id = auth.uid());

-- 2.2 View Teammates (Non-Recursive)
-- We check if the target user (id) shares a company with the current user.
-- We use public.memberships which is safe because it uses the bypass function.
CREATE POLICY "users_select_teammates" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.memberships 
            WHERE user_id = public.users.id 
            AND company_id IN (SELECT public.get_my_company_ids())
        )
    );

-- 2.3 Management
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());


-- 3. Verify Memberships Policy too (Just to be sure it doesn't cross-ref users)
DROP POLICY IF EXISTS "memberships_view" ON public.memberships;
DROP POLICY IF EXISTS "memberships_view_simple" ON public.memberships;

CREATE POLICY "memberships_select_stable" ON public.memberships
    FOR SELECT USING (
        user_id = auth.uid() OR 
        company_id IN (SELECT public.get_my_company_ids())
    );

-- 4. Service Role Cache (Fail-safe)
DROP POLICY IF EXISTS "service_users" ON public.users;
CREATE POLICY "service_users_admin" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
