-- Add whatsapp column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS whatsapp text;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload config';
