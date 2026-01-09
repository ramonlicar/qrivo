-- Ensure RLS is enabled on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing update policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create a permissive update policy for the owner
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant update permission on the whatsapp column explicitly (sometimes needed depending on setup, though usually row-level covers it)
GRANT UPDATE (full_name, whatsapp, job_title, avatar_url, updated_at) ON public.users TO authenticated;
GRANT UPDATE (full_name, whatsapp, job_title, avatar_url, updated_at) ON public.users TO service_role;

-- Force schema reload
NOTIFY pgrst, 'reload config';
