-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.customer_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT 'bg-neutral-400'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT customer_tags_pkey PRIMARY KEY (id),
  CONSTRAINT customer_tags_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
