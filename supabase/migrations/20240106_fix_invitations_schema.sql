-- Migration: Fix team_invitations schema and apply RLS
-- 1. Fix role column type mismatch
ALTER TABLE public.team_invitations 
  ALTER COLUMN role TYPE membership_role 
  USING role::text::membership_role;

-- 2. Enable RLS on team_invitations
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Owners and Admins can INSERT invitations for their own company
CREATE POLICY "Owners and Admins can create invitations" ON public.team_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.company_id = team_invitations.company_id
        AND (m.role = 'owner' OR m.role = 'admin')
    )
  );

-- 4. Policy: Service Role can do EVERYTHING on team_invitations (for Edge Functions)
-- Note: 'service_role' key bypasses RLS by default, but explict policies are safer if configuration changes.
CREATE POLICY "Service Role full access on invitations" ON public.team_invitations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. Policy: Invited users can view their own invitations (by email) - Optional but good for UI
CREATE POLICY "Users can view invitations for their email" ON public.team_invitations
  FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid()) 
    OR 
    invited_by = auth.uid() -- Allow inviter to see status
  );

-- 6. Ensure Service Role has access to memberships for accepting invites
-- (Usually covered by default bypass, but adding explicit policy just in case)
CREATE POLICY "Service Role full access on memberships" ON public.memberships
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
