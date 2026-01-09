-- 0. Ensure status column exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='memberships' AND column_name='status') THEN
        ALTER TABLE public.memberships ADD COLUMN status text DEFAULT 'active';
    END IF;
END $$;

-- 1. Ensure all companies have an owner membership
INSERT INTO public.memberships (company_id, user_id, role, status)
SELECT id, owner_user_id, 'owner', 'active'
FROM public.companies
ON CONFLICT (company_id, user_id) DO UPDATE SET role = 'owner';

-- 2. Force recalculate all user roles
UPDATE public.users u
SET company_roles = (
    SELECT jsonb_object_agg(company_id, role)
    FROM public.memberships
    WHERE user_id = u.id
);

-- 3. Ensure users with NO memberships have an empty object (not null)
UPDATE public.users SET company_roles = '{}'::jsonb WHERE company_roles IS NULL;

-- 4. Verify: List companies where owner is NOT in memberships (should be empty now)
SELECT id, name, owner_user_id 
FROM public.companies 
WHERE id NOT IN (SELECT company_id FROM public.memberships);
