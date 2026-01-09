-- Migration: Ensure Role Enum Consistency
-- 1. Check and Update membership_role enum
-- We add 'member' if it's missing, and ensure the basic roles are present.

DO $$ 
BEGIN
    -- Check if membership_role exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_role') THEN
        CREATE TYPE membership_role AS ENUM ('owner', 'admin', 'manager', 'agent', 'member');
    ELSE
        -- Add missing values to existing enum
        -- Note: ALTER TYPE ... ADD VALUE cannot be run inside a transaction block easily in some PG versions
        -- but Supabase migrations usually allow it or we can use separate statements.
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'membership_role' AND e.enumlabel = 'member') THEN
            ALTER TYPE membership_role ADD VALUE 'member';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'membership_role' AND e.enumlabel = 'agent') THEN
            ALTER TYPE membership_role ADD VALUE 'agent';
        END IF;
    END IF;
END $$;

-- 2. Align team_invitations table
-- Ensure role column is membership_role and handles defaults correctly
ALTER TABLE public.team_invitations 
  ALTER COLUMN role TYPE membership_role 
  USING role::text::membership_role;

ALTER TABLE public.team_invitations 
  ALTER COLUMN role SET DEFAULT 'member'::membership_role;

-- 3. Ensure token is text for maximum compatibility with UUID strings from Deno
ALTER TABLE public.team_invitations 
  ALTER COLUMN token TYPE text;

-- 4. Verify RLS for Edge Functions (Service Role)
-- The Edge Function uses service_role, so it should bypass RLS, but explicit grants help.
GRANT ALL ON public.team_invitations TO service_role;
GRANT ALL ON public.memberships TO service_role;
GRANT ALL ON public.users TO service_role;
