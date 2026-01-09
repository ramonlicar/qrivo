-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can view notes from their company" ON public.customer_notes;
DROP POLICY IF EXISTS "Users can insert notes for their company" ON public.customer_notes;
DROP POLICY IF EXISTS "Users can delete their own notes or admins delete any" ON public.customer_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.customer_notes;

-- Enable RLS
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Allow access if the user belongs to the company
CREATE POLICY "view_notes"
ON public.customer_notes
FOR SELECT
USING (
  exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
    and m.company_id = customer_notes.company_id
  )
);

-- 2. INSERT: Allow insert if user belongs to the company AND matches author_id
CREATE POLICY "insert_notes"
ON public.customer_notes
FOR INSERT
WITH CHECK (
  author_id = auth.uid() AND
  exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
    and m.company_id = customer_notes.company_id
  )
);

-- 3. DELETE: Allow delete if user is author OR admin/owner of company
CREATE POLICY "delete_notes"
ON public.customer_notes
FOR DELETE
USING (
  author_id = auth.uid() OR
  exists (
    select 1 from public.memberships m
    where m.user_id = auth.uid()
    and m.company_id = customer_notes.company_id
    and m.role in ('owner', 'admin')
  )
);

-- 4. UPDATE: Allow update only for own notes
CREATE POLICY "update_notes"
ON public.customer_notes
FOR UPDATE
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());
