-- Migration: Robust Invitation System via RPC
-- Objective: Avoid Edge Function CORS issues by using a Database Function.

CREATE OR REPLACE FUNCTION public.invite_member_secure(
    p_email text,
    p_role public.membership_role,
    p_company_id uuid
)
RETURNS json AS $$
DECLARE
    v_inviter_id uuid;
    v_inviter_role text;
    v_existing_user_id uuid;
    v_token text;
    v_expires_at timestamptz;
BEGIN
    -- 1. Get current user (Inviter)
    v_inviter_id := auth.uid();
    IF v_inviter_id IS NULL THEN
        RETURN json_build_object('error', 'Unauthorized');
    END IF;

    -- 2. Verify Inviter's Permissions
    SELECT role::text INTO v_inviter_role
    FROM public.memberships
    WHERE user_id = v_inviter_id AND company_id = p_company_id;

    IF v_inviter_role IS NULL OR v_inviter_role NOT IN ('owner', 'admin') THEN
        RETURN json_build_object('error', 'Forbidden: Insufficient permissions');
    END IF;

    -- 3. Check if user is already a member
    SELECT id INTO v_existing_user_id 
    FROM public.users 
    WHERE email = p_email;

    IF v_existing_user_id IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM public.memberships WHERE user_id = v_existing_user_id AND company_id = p_company_id) THEN
            RETURN json_build_object('error', 'User is already a member of this team');
        END IF;
    END IF;

    -- 4. Create or Refresh Invitation
    -- Standardize: Remove old pending invites for this email/company
    DELETE FROM public.team_invitations 
    WHERE company_id = p_company_id AND email = p_email AND status = 'pending';

    v_token := replace(gen_random_uuid()::text, '-', ''); -- Safe random hex-like string
    v_expires_at := now() + interval '7 days';

    INSERT INTO public.team_invitations (
        company_id,
        email,
        role,
        invited_by,
        token,
        expires_at,
        status
    ) VALUES (
        p_company_id,
        p_email,
        p_role,
        v_inviter_id,
        v_token,
        v_expires_at,
        'pending'
    );

    RETURN json_build_object(
        'success', true,
        'message', 'Invitation created successfully',
        'token', v_token
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. RPC for Accepting Invitations
CREATE OR REPLACE FUNCTION public.accept_invite_secure(
    p_invite_token text
)
RETURNS json AS $$
DECLARE
    v_user_id uuid;
    v_user_email text;
    v_invitation record;
BEGIN
    -- 1. Get current user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN json_build_object('error', 'Unauthorized: You must be logged in');
    END IF;

    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;

    -- 2. Validate Invitation
    SELECT * INTO v_invitation 
    FROM public.team_invitations 
    WHERE token = p_invite_token AND status = 'pending';

    IF v_invitation.id IS NULL THEN
        RETURN json_build_object('error', 'Invalid or expired invitation');
    END IF;

    IF v_invitation.expires_at < now() THEN
        UPDATE public.team_invitations SET status = 'expired' WHERE id = v_invitation.id;
        RETURN json_build_object('error', 'Invitation has expired');
    END IF;

    -- 3. Security Check: Email match
    IF lower(v_invitation.email) != lower(v_user_email) THEN
        RETURN json_build_object('error', format('This invitation was sent to %s, but you are logged in as %s', v_invitation.email, v_user_email));
    END IF;

    -- 4. Create Membership
    INSERT INTO public.memberships (
        company_id,
        user_id,
        role,
        status
    ) VALUES (
        v_invitation.company_id,
        v_user_id,
        v_invitation.role,
        'active'
    )
    ON CONFLICT (company_id, user_id) DO UPDATE SET status = 'active', role = EXCLUDED.role;

    -- 5. Mark accepted
    UPDATE public.team_invitations 
    SET status = 'accepted', accepted_at = now() 
    WHERE id = v_invitation.id;

    RETURN json_build_object(
        'success', true, 
        'message', 'Welcome to the team!', 
        'company_id', v_invitation.company_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.invite_member_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_member_secure TO service_role;
GRANT EXECUTE ON FUNCTION public.accept_invite_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invite_secure TO service_role;
