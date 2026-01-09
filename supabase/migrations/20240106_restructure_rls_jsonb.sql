-- Migration: Stable Multi-Tenancy Restructuring (JSONB Cache)
-- This migration resolves recursion by caching permissions in the users table.

-- 1. Schema Update
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS company_roles JSONB DEFAULT '{}';

-- 2. Sync Logic
CREATE OR REPLACE FUNCTION public.sync_user_membership_to_jsonb()
RETURNS TRIGGER AS $$
DECLARE
    roles_cache JSONB;
BEGIN
    -- Aggregate all company_id -> role pairs for the affected user
    SELECT jsonb_object_agg(company_id, role)
    INTO roles_cache
    FROM public.memberships
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

    -- Update the user's cache
    UPDATE public.users
    SET company_roles = COALESCE(roles_cache, '{}'::jsonb),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.user_id, OLD.user_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create Trigger on memberships
DROP TRIGGER IF EXISTS trigger_sync_user_roles ON public.memberships;
CREATE TRIGGER trigger_sync_user_roles
    AFTER INSERT OR UPDATE OR DELETE ON public.memberships
    FOR EACH ROW EXECUTE FUNCTION public.sync_user_membership_to_jsonb();

-- 4. Initial Backfill
-- Populate existing data into the new JSONB column
UPDATE public.users u
SET company_roles = (
    SELECT jsonb_object_agg(company_id, role)
    FROM public.memberships
    WHERE user_id = u.id
);
-- Ensure users with no memberships have empty object
UPDATE public.users SET company_roles = '{}'::jsonb WHERE company_roles IS NULL;


-- 5. CLEANUP: Drop ALL previous conflicting policies
-- Memberships
DROP POLICY IF EXISTS "memberships_select" ON public.memberships;
DROP POLICY IF EXISTS "memberships_all_owner" ON public.memberships;
DROP POLICY IF EXISTS "service_all_memberships" ON public.memberships;
DROP POLICY IF EXISTS "select_memberships" ON public.memberships;
DROP POLICY IF EXISTS "manage_memberships" ON public.memberships;
DROP POLICY IF EXISTS "view_own_membership" ON public.memberships;
DROP POLICY IF EXISTS "view_team_as_owner" ON public.memberships;
DROP POLICY IF EXISTS "manage_team_as_owner" ON public.memberships;
DROP POLICY IF EXISTS "Users can view own membership" ON public.memberships;
DROP POLICY IF EXISTS "Owners can manage memberships" ON public.memberships;

-- Companies
DROP POLICY IF EXISTS "companies_select" ON public.companies;
DROP POLICY IF EXISTS "companies_update" ON public.companies;
DROP POLICY IF EXISTS "companies_insert" ON public.companies;
DROP POLICY IF EXISTS "service_all_companies" ON public.companies;
DROP POLICY IF EXISTS "select_companies" ON public.companies;
DROP POLICY IF EXISTS "update_companies" ON public.companies;
DROP POLICY IF EXISTS "insert_companies" ON public.companies;

-- Users
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "service_all_users" ON public.users;
DROP POLICY IF EXISTS "select_users" ON public.users;
DROP POLICY IF EXISTS "update_users" ON public.users;


-- 6. Apply NEW Performance-First Policies (Non-Recursive)

-- 6.1 Users
CREATE POLICY "users_view_self" ON public.users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_view_teammates" ON public.users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.users self 
        WHERE self.id = auth.uid() 
        AND (self.company_roles ?| ARRAY(SELECT jsonb_object_keys(u.company_roles) FROM public.users u WHERE u.id = public.users.id))
    )
);
-- Simplified: If they share ANY company_id in their JSON keys, they can see each other.
CREATE POLICY "users_update_self" ON public.users FOR UPDATE USING (id = auth.uid());

-- 6.2 Companies
CREATE POLICY "companies_view" ON public.companies
    FOR SELECT USING (
        owner_user_id = auth.uid() OR 
        (SELECT company_roles FROM public.users WHERE id = auth.uid()) ? public.companies.id::text
    );

CREATE POLICY "companies_manage" ON public.companies
    FOR UPDATE USING (
        owner_user_id = auth.uid() OR 
        (SELECT company_roles->>public.companies.id::text FROM public.users WHERE id = auth.uid()) IN ('owner', 'admin')
    );

CREATE POLICY "companies_create" ON public.companies FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6.3 Memberships
CREATE POLICY "memberships_view" ON public.memberships
    FOR SELECT USING (
        user_id = auth.uid() OR 
        (SELECT company_roles FROM public.users WHERE id = auth.uid()) ? public.memberships.company_id::text
    );

CREATE POLICY "memberships_manage" ON public.memberships
    FOR ALL USING (
        (SELECT company_roles->>public.memberships.company_id::text FROM public.users WHERE id = auth.uid()) IN ('owner', 'admin')
    );

-- 6.4 Service Role Fail-safe
CREATE POLICY "service_memberships" ON public.memberships FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_companies" ON public.companies FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_users" ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);
