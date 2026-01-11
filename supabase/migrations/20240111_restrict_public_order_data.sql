-- Migration: Restrict public access to sensitive columns in orders table
-- This ensures that anonymous users (anon role) can only view non-sensitive order metadata

-- 1. Remove standard SELECT privileges from anon
REVOKE SELECT ON public.orders FROM anon;

-- 2. Grant SELECT only on safe, non-sensitive columns
GRANT SELECT (
  id, 
  company_id, 
  code, 
  order_status, 
  total, 
  subtotal, 
  shipping_fee, 
  order_summary, 
  created_at, 
  updated_at
) ON public.orders TO anon;

-- 3. Ensure SELECT is still granted to authenticated users (admin/staff)
GRANT SELECT ON public.orders TO authenticated;

-- 5. Grant public access to company details for disclaimer
GRANT SELECT (name, cnpj) ON public.companies TO anon;
GRANT SELECT ON public.companies TO authenticated;

DROP POLICY IF EXISTS "allow_public_select_companies_for_disclaimer" ON public.companies;
CREATE POLICY "allow_public_select_companies_for_disclaimer" ON public.companies
FOR SELECT TO anon USING (true);
