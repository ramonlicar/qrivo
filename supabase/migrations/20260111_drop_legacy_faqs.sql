-- Drop the legacy faqs table
-- This will also drop the related indexes (idx_faqs_agent, idx_faqs_company)
-- and the trigger (tr_faqs_updated_at) dependent on the table.

DROP TABLE IF EXISTS public.faqs CASCADE;
