-- Migration: Enforce Team RBAC Constraints
-- Objective: Strict rules for memberships management (INSERT, UPDATE, DELETE).

-- 1. Helper to get user's role in a company (Bypass RLS)
CREATE OR REPLACE FUNCTION public.get_my_role(comp_id uuid)
RETURNS text AS $$
DECLARE
    user_role text;
BEGIN
    SELECT m.role::text INTO user_role
    FROM public.memberships m
    WHERE m.user_id = auth.uid() AND m.company_id = comp_id;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Drop existing management policy
DROP POLICY IF EXISTS "memberships_manage_owner" ON public.memberships;

-- 3. Granular RBAC Policies for memberships

-- 3.1 SELECT: Visible to all company members
-- (Already handled by memberships_select_teammate in stable reset, but keeping it robust)
DROP POLICY IF EXISTS "memberships_select_teammate" ON public.memberships;
CREATE POLICY "memberships_select_teammate" ON public.memberships 
    FOR SELECT USING (
        user_id = auth.uid() OR 
        company_id IN (SELECT company_id FROM public.get_my_company_ids())
    );

-- 3.2 INSERT: Only Owner and Admin can invite
CREATE POLICY "memberships_insert_rbac" ON public.memberships
    FOR INSERT WITH CHECK (
        (public.get_my_role(company_id) IN ('owner', 'admin')) AND
        (role::text != 'owner') -- Cannot invite as owner via this policy
    );

-- 3.3 UPDATE: Only Owner and Admin can edit
-- Constraints:
-- - Admins cannot edit Owners.
-- - No one can change a role to 'owner' (Reserved for logical owner).
-- - Admins cannot edit other Admins (Standard safety).
CREATE POLICY "memberships_update_rbac" ON public.memberships
    FOR UPDATE USING (
        -- Can manage if Owner
        public.get_my_role(company_id) = 'owner' 
        OR 
        -- Can manage if Admin AND target is NOT owner/admin
        (
            public.get_my_role(company_id) = 'admin' AND 
            role::text NOT IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        -- New role cannot be 'owner'
        role::text != 'owner'
    );

-- 3.4 DELETE: Only Owner and Admin can remove
-- Constraints:
-- - Cannot remove the Owner.
-- - Admins cannot remove Admins.
-- - Users can (maybe?) remove themselves? (User said "auto-remoção/edição" constraint, so let's block it for now if it's not handled).
CREATE POLICY "memberships_delete_rbac" ON public.memberships
    FOR DELETE USING (
        (
            -- Owner can delete anyone EXCEPT themselves (self-deletion of owner is blocked)
            public.get_my_role(company_id) = 'owner' AND 
            user_id != auth.uid()
        )
        OR 
        (
            -- Admin can delete non-owners/non-admins
            public.get_my_role(company_id) = 'admin' AND 
            role::text NOT IN ('owner', 'admin')
        )
    );

-- 4. Extra constraint to ensure 'owner' record matches companies.owner_user_id
-- This trigger ensures that if someone creates a membership with role='owner', 
-- it MUST be the person listed as owner_user_id in companies.
CREATE OR REPLACE FUNCTION public.check_membership_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent setting role to 'owner' if not the company owner
    IF NEW.role::text = 'owner' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.companies 
            WHERE id = NEW.company_id AND owner_user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'Only the company owner_user_id can have the "owner" role.';
        END IF;
    END IF;

    -- Prevent changing the role of the company owner
    IF OLD.role::text = 'owner' AND NEW.role::text != 'owner' THEN
        RAISE EXCEPTION 'The company owner cannot have their role changed.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_membership_integrity ON public.memberships;
CREATE TRIGGER tr_membership_integrity
BEFORE INSERT OR UPDATE ON public.memberships
FOR EACH ROW EXECUTE FUNCTION public.check_membership_integrity();
