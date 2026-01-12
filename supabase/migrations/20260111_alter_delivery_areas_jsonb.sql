-- Alter delivery_areas table to use jsonb for regions
ALTER TABLE public.delivery_areas
ALTER COLUMN regions TYPE JSONB USING to_jsonb(string_to_array(regions, ','));
