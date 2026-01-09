-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.delivery_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  fee numeric DEFAULT 0.00,
  estimated_time text,
  covered_regions text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT delivery_areas_pkey PRIMARY KEY (id),
  CONSTRAINT delivery_areas_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
