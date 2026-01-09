-- Drop the policy first to allow "editing" (re-creation)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Create the policy with the correct check
CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Ensure permissions are granted (Idempotent)
GRANT INSERT (id, full_name, email, whatsapp, avatar_url, job_title, created_at, updated_at) ON public.users TO authenticated;
GRANT INSERT (id, full_name, email, whatsapp, avatar_url, job_title, created_at, updated_at) ON public.users TO service_role;

-- Reload schema
NOTIFY pgrst, 'reload config';
