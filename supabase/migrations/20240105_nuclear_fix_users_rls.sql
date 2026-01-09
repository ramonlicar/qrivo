-- Enable RLS (just to be safe)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 1. DROP ALL EXISTING POLICIES on users to clean up conflicts
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users; -- If it existed
-- (Add any other potential policy names here if known, but these are the ones we likely created)

-- 2. CREATE A SINGLE UNIFIED POLICY FOR EVERYTHING (Select, Insert, Update, Delete)
-- This allows the user to do ANYTHING as long as the ID matches their Auth ID.
CREATE POLICY "Users can manage their own profile"
ON public.users
FOR ALL
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. GRANT PERMISSIONS
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- 4. Reload Schema
NOTIFY pgrst, 'reload config';
