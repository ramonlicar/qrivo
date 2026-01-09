-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.payment_methods (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  method_type text NOT NULL,
  instructions text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_methods_pkey PRIMARY KEY (id),
  CONSTRAINT payment_methods_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
