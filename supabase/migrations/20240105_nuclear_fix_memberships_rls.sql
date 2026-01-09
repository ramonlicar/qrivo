-- Add Unique Constraint if it doesn't exist (Idempotent-ish via DO block or just try/catch logic is hard in plain SQL, so we use standard command that might fail if exists, but we can't ignore errors easily in Supabase editor unless we script it smart. We will use a safe approach: CREATE UNIQUE INDEX IF NOT EXISTS)

CREATE UNIQUE INDEX IF NOT EXISTS idx_memberships_user_company ON public.memberships(user_id, company_id);

-- Depending on Postgres version, 'ON CONFLICT' uses the unique constraint/index. 
-- For explicit constraint support:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'memberships_user_id_company_id_key') THEN
        ALTER TABLE public.memberships ADD CONSTRAINT memberships_user_id_company_id_key UNIQUE USING INDEX idx_memberships_user_company;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Memberships viewable by user" ON public.memberships;
DROP POLICY IF EXISTS "Memberships viewable by company members" ON public.memberships;
DROP POLICY IF EXISTS "Memberships manageable by company owners" ON public.memberships;
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.memberships;

-- Policy 1: Users can view their own memberships
CREATE POLICY "Users can view own memberships"
ON public.memberships
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can view memberships of companies they belong to (so they can see team members)
CREATE POLICY "Users can view teammates"
ON public.memberships
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.memberships m2
    WHERE m2.company_id = memberships.company_id
    AND m2.user_id = auth.uid()
  )
);

-- Policy 3: Company Owners can manage memberships (Insert, Update, Delete)
CREATE POLICY "Owners can manage memberships"
ON public.memberships
FOR ALL
USING (
  EXISTS (
    -- Check if user is an owner in memberships table
    SELECT 1 FROM public.memberships m2
    WHERE m2.company_id = memberships.company_id
    AND m2.user_id = auth.uid()
    AND m2.role = 'owner'
  )
  OR
  EXISTS (
    -- Check if user is the company owner in companies table (Legacy/Fallback)
    SELECT 1 FROM public.companies c
    WHERE c.id = memberships.company_id
    AND c.owner_user_id = auth.uid()
  )
);

-- Policy 4: Initial Membership Creation (Self-Insert as Owner or Member)
-- This is critical for the signup flow where the user inserts themselves.
CREATE POLICY "Users can insert their own membership"
ON public.memberships
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);
