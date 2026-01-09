-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.funnel_stages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  funnel_id uuid NOT NULL,
  company_id uuid NOT NULL,
  name text NOT NULL,
  order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT funnel_stages_pkey PRIMARY KEY (id),
  CONSTRAINT funnel_stages_funnel_id_fkey FOREIGN KEY (funnel_id) REFERENCES public.funnels(id),
  CONSTRAINT funnel_stages_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
