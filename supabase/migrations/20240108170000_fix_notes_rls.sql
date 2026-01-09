-- Enable RLS
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;

-- Policy for Select: Users can view notes for customers in their company
CREATE POLICY "Users can view notes from their company"
ON public.customer_notes
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

-- Policy for Insert: Users can insert notes for customers in their company
CREATE POLICY "Users can insert notes for their company"
ON public.customer_notes
FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM public.memberships 
    WHERE user_id = auth.uid()
  )
);

-- Policy for Delete: Users can delete notes they created OR admins/owners can delete any note
CREATE POLICY "Users can delete their own notes or admins delete any"
ON public.customer_notes
FOR DELETE
USING (
  (author_id = auth.uid()) OR
  (
    company_id IN (
      SELECT company_id 
      FROM public.memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  )
);

-- Policy for Update: Users can update their own notes
CREATE POLICY "Users can update their own notes"
ON public.customer_notes
FOR UPDATE
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());
