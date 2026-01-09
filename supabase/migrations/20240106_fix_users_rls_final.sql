-- Migration: Fix Users Table RLS
-- Objective: Ensure users can Insert and Update their own profiles correctly.

-- 1. Cleanup
DROP POLICY IF EXISTS "users_self_update" ON public.users;
DROP POLICY IF EXISTS "users_public_select" ON public.users;
DROP POLICY IF EXISTS "users_self_insert" ON public.users;
DROP POLICY IF EXISTS "users_select_all" ON public.users;
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
DROP POLICY IF EXISTS "users_update_self" ON public.users;

-- 2. Policies
-- Everyone can view profiles (needed for the team list to work)
CREATE POLICY "users_select_all" 
ON public.users FOR SELECT 
USING (true);

-- Users can create their own profile record
CREATE POLICY "users_insert_self" 
ON public.users FOR INSERT 
WITH CHECK (id = auth.uid());

-- Users can update ONLY their own profile record
CREATE POLICY "users_update_self" 
ON public.users FOR UPDATE 
USING (id = auth.uid()) 
WITH CHECK (id = auth.uid());

-- Service role has full access
DROP POLICY IF EXISTS "users_service_all" ON public.users;
CREATE POLICY "users_service_all" 
ON public.users FOR ALL TO service_role 
USING (true) WITH CHECK (true);

-- 3. Ensure RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
