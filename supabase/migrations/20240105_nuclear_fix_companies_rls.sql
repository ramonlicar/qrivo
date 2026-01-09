-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON public.companies;
DROP POLICY IF EXISTS "Companies are viewable by members" ON public.companies;
DROP POLICY IF EXISTS "Companies are updatable by members" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "Owners can manage their company" ON public.companies;

-- Policy 1: Members can VIEW their company
CREATE POLICY "Members can view their company"
ON public.companies
FOR SELECT
USING (
  auth.uid() = owner_user_id
  OR
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE company_id = companies.id
    AND user_id = auth.uid()
  )
);

-- Policy 2: Members can UPDATE their company
CREATE POLICY "Members can update their company"
ON public.companies
FOR UPDATE
USING (
  auth.uid() = owner_user_id
  OR
  EXISTS (
    SELECT 1 FROM public.memberships
    WHERE company_id = companies.id
    AND user_id = auth.uid()
    -- Optionally restrict to specific roles if needed, e.g. AND role IN ('owner', 'admin')
  )
);

-- Policy 3: Allow INSERT for authenticated users (for onboarding)
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);
