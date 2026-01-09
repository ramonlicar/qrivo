-- Create a secure RPC function to add notes
-- This bypasses RLS on the table level ensuring insertion works if the user is a member
CREATE OR REPLACE FUNCTION public.add_customer_note(
  p_company_id uuid,
  p_customer_id uuid,
  p_content text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with permissions of the function creator (admin)
AS $$
DECLARE
  v_note_id uuid;
  v_created_at timestamptz;
  v_author_name text;
  v_user_id uuid;
  v_membership_exists boolean;
BEGIN
  -- Get Current User
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Validate Membership (Security Check)
  -- User must belong to the company they are trying to add a note to
  SELECT EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE user_id = v_user_id 
    AND company_id = p_company_id
  ) INTO v_membership_exists;

  IF NOT v_membership_exists THEN
    RAISE EXCEPTION 'Acesso negado: Você não é membro desta empresa.';
  END IF;

  -- 2. Insert Note
  INSERT INTO public.customer_notes (company_id, customer_id, author_id, content)
  VALUES (p_company_id, p_customer_id, v_user_id, p_content)
  RETURNING id, created_at INTO v_note_id, v_created_at;

  -- 3. Get Author Name for UI
  SELECT full_name INTO v_author_name FROM public.users WHERE id = v_user_id;

  -- 4. Return JSON formatted for frontend
  RETURN jsonb_build_object(
    'id', v_note_id,
    'text', p_content,
    'author', COALESCE(v_author_name, 'Você'),
    'createdAt', v_created_at
  );
END;
$$;
