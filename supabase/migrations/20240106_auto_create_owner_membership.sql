-- Migration: Auto-create owner membership on company creation
-- This ensures that the user who creates a company is always its first member (owner).

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_company_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.memberships (company_id, user_id, role, status)
    VALUES (NEW.id, NEW.owner_user_id, 'owner', 'active')
    ON CONFLICT (company_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS after_company_insert ON public.companies;
CREATE TRIGGER after_company_insert
    AFTER INSERT ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_company_membership();

-- 3. (Optional) Backfill: Ensure existing companies have at least one owner membership
-- This is safe to run multiple times due to ON CONFLICT or careful selection
INSERT INTO public.memberships (company_id, user_id, role, status)
SELECT id, owner_user_id, 'owner', 'active'
FROM public.companies
ON CONFLICT DO NOTHING;
