-- Migration: Refine Invitation Schema & Constraints
-- Objective: Ensure one active invite per email/company, secure tokens, and correct status.

-- 1. Ensure columns exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invitations' AND column_name = 'token') THEN
        ALTER TABLE public.team_invitations ADD COLUMN token uuid DEFAULT gen_random_uuid();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invitations' AND column_name = 'expires_at') THEN
        ALTER TABLE public.team_invitations ADD COLUMN expires_at timestamp with time zone DEFAULT (now() + interval '7 days');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invitations' AND column_name = 'accepted_at') THEN
        ALTER TABLE public.team_invitations ADD COLUMN accepted_at timestamp with time zone;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'team_invitations' AND column_name = 'status') THEN
        ALTER TABLE public.team_invitations ADD COLUMN status text DEFAULT 'pending';
    END IF;
END $$;

-- 2. Add Unique Constraint (One active invite per email in a company)
-- We use a partial index to allow multiple historical/accepted invitations but only one pending.
DROP INDEX IF EXISTS idx_team_invitations_active_unique;
CREATE UNIQUE INDEX idx_team_invitations_active_unique 
ON public.team_invitations (company_id, email) 
WHERE status = 'pending';

-- 3. Update RLS policies for robustness
DROP POLICY IF EXISTS "Owners and Admins can create invitations" ON public.team_invitations;
CREATE POLICY "Owners and Admins can create invitations" ON public.team_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.company_id = team_invitations.company_id
        AND (m.role::text IN ('owner', 'admin'))
    )
  );

DROP POLICY IF EXISTS "Users can view invitations for their email" ON public.team_invitations;
CREATE POLICY "Users can view invitations for their email" ON public.team_invitations
  FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
    OR 
    invited_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.company_id = team_invitations.company_id
        AND (m.role::text IN ('owner', 'admin'))
    )
  );
