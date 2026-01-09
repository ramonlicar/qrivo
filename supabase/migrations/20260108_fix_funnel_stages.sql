-- Add 'position' column to funnel_stages if it doesn't exist
ALTER TABLE public.funnel_stages 
ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

-- Add 'position' column to funnel_leads if it doesn't exist (safety check)
ALTER TABLE public.funnel_leads 
ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;

-- Force PostgREST to reload the schema cache to recognize the new columns
NOTIFY pgrst, 'reload schema';
