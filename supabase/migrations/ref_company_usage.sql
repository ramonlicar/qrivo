-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.company_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  billing_cycle_start timestamp with time zone NOT NULL,
  orders_count integer DEFAULT 0,
  agents_count integer DEFAULT 0,
  products_count integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT now(),
  CONSTRAINT company_usage_pkey PRIMARY KEY (id),
  CONSTRAINT company_usage_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
