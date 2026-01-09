-- Migration: Fix infinite recursion in memberships RLS
-- Error 42P17 occurs when a policy on table X queries table X, causing an infinite loop.

-- 1. Drop ALL existing policies on memberships to ensure clean slate
DROP POLICY IF EXISTS "Users can view their own membership" ON public.memberships;
DROP POLICY IF EXISTS "Users can view members of their company" ON public.memberships;
DROP POLICY IF EXISTS "Owners can manage team members" ON public.memberships;
DROP POLICY IF EXISTS "Service Role full access on memberships" ON public.memberships;
-- (Add any other potential names if known, or just rely on manual cleanup if names vary. 
--  Postgres doesn't support DROP POLICY ALL, so we try common names or users might need to run manually if names differ)
-- Actually, we can DROP POLICY IF EXISTS x, y, z...

-- 2. Create Non-Recursive READ Policies

-- A. Users can see their own membership entry
CREATE POLICY "Users can view own membership" ON public.memberships
FOR SELECT
USING (
  user_id = auth.uid()
);

-- B. Company Owners can see all memberships for their company
-- This avoids recursion by querying 'companies' instead of 'memberships'
CREATE POLICY "Company Owners can view company memberships" ON public.memberships
FOR SELECT
USING (
  company_id IN (
    SELECT id 
    FROM public.companies 
    WHERE owner_user_id = auth.uid()
  )
);

-- 3. Write Policies (Update/Delete) for Owners
CREATE POLICY "Company Owners can update memberships" ON public.memberships
FOR UPDATE
USING (
  company_id IN (
    SELECT id 
    FROM public.companies 
    WHERE owner_user_id = auth.uid()
  )
);

CREATE POLICY "Company Owners can delete memberships" ON public.memberships
FOR DELETE
USING (
  company_id IN (
    SELECT id 
    FROM public.companies 
    WHERE owner_user_id = auth.uid()
  )
);

CREATE POLICY "Company Owners can insert memberships" ON public.memberships
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT id 
    FROM public.companies 
    WHERE owner_user_id = auth.uid()
  )
);

-- 4. Service Role Bypass (Explicit)
CREATE POLICY "Service Role full access" ON public.memberships
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Note: Admins who are NOT owners will currently NOT be able to see the full team list with this restricted model.
-- This prevents the recursion issue for now. 
-- If Admins need access, it must be handled via a non-recursive method (e.g. auth claims or specific lookup tables), 
-- but fixing the crash is priority.
